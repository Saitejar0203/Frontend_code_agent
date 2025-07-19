import { WebContainer, FileSystemTree } from '@webcontainer/api';
import { Terminal } from '@xterm/xterm';

export interface StreamedFile {
  file_path: string;
  content: string;
}

export interface WebContainerService {
  instance: WebContainer | null;
  terminal: Terminal | null;
  isBooted: boolean;
  previewUrl: string | null;
}

class WebContainerManager {
  private webcontainer: WebContainer | null = null;
  private terminal: Terminal | null = null;
  private isBooted = false;
  private isBooting = false;
  private bootPromise: Promise<WebContainer> | null = null;
  private previewUrl: string | null = null;
  private onPreviewUrlChange: ((url: string | null) => void) | null = null;
  private onTerminalOutput: ((data: string) => void) | null = null;
  private refCount = 0;

  async boot(): Promise<WebContainer> {
    this.refCount++;
    
    // If already booted, return existing instance
    if (this.webcontainer && this.isBooted) {
      return this.webcontainer;
    }

    // If currently booting, wait for the existing boot process
    if (this.isBooting && this.bootPromise) {
      return this.bootPromise;
    }

    // Check for cross-origin isolation
    if (!this.isCrossOriginIsolated()) {
      const error = new Error('Cross-origin isolation is required for WebContainer. Please ensure COOP and COEP headers are set correctly.');
      console.error('WebContainer boot failed:', error.message);
      this.refCount--;
      throw error;
    }

    // Start the boot process
    this.isBooting = true;
    this.bootPromise = this.performBoot();
    
    try {
      const result = await this.bootPromise;
      return result;
    } catch (error) {
      this.refCount--;
      throw error;
    } finally {
      this.isBooting = false;
      this.bootPromise = null;
    }
  }

  private async performBoot(): Promise<WebContainer> {
    try {
      // Clean up any existing instance
      await this.forceDispose();
      
      this.webcontainer = await WebContainer.boot({
        coep: 'require-corp'
      });
      this.isBooted = true;
      
      // Listen for server-ready events
      this.webcontainer.on('server-ready', (port, url) => {
        this.previewUrl = url;
        if (this.onPreviewUrlChange) {
          this.onPreviewUrlChange(url);
        }
      });

      return this.webcontainer;
    } catch (error) {
      console.error('Failed to boot WebContainer:', error);
      this.isBooted = false;
      this.webcontainer = null;
      throw error;
    }
  }

  async mountFiles(files: StreamedFile[] | Record<string, string>): Promise<void> {
    if (!this.webcontainer) {
      throw new Error('WebContainer not booted');
    }

    // Convert to uniform format
    let fileEntries: Array<{ path: string; content: string }>;
    
    if (Array.isArray(files)) {
      fileEntries = files.map(f => ({ path: f.file_path, content: f.content }));
    } else {
      fileEntries = Object.entries(files).map(([path, content]) => ({ path, content }));
    }

    // Convert to FileSystemTree format
    const fileSystemTree: FileSystemTree = {};
    
    for (const { path, content } of fileEntries) {
      const pathParts = path.split('/').filter(part => part !== '');
      let current = fileSystemTree;
      
      // Create nested directory structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!current[part]) {
          current[part] = { directory: {} };
        }
        current = current[part].directory!;
      }
      
      // Add the file
      const fileName = pathParts[pathParts.length - 1];
      current[fileName] = {
        file: {
          contents: content
        }
      };
    }

    await this.webcontainer.mount(fileSystemTree);
  }

  async mountSingleFile(filePath: string, content: string): Promise<void> {
    if (!this.webcontainer) {
      throw new Error('WebContainer not booted');
    }

    // Create directory structure if needed
    const pathParts = filePath.split('/');
    if (pathParts.length > 1) {
      const dirPath = pathParts.slice(0, -1).join('/');
      try {
        await this.webcontainer.fs.mkdir(dirPath, { recursive: true });
      } catch (error) {
        // Directory might already exist, ignore error
      }
    }

    // Write the file
    await this.webcontainer.fs.writeFile(filePath, content);
  }

  async executeCommand(
    command: string, 
    args: string[] = [], 
    options: { cwd?: string; onOutput?: (data: string) => void } = {}
  ): Promise<{ exitCode: number; output: string }> {
    if (!this.webcontainer) {
      throw new Error('WebContainer not booted');
    }

    let output = '';
    
    // Write command to terminal first
    const commandLine = `$ ${command} ${args.join(' ')}\n`;
    if (this.terminal) {
      this.terminal.write(`\r\n\x1b[32m${commandLine}\x1b[0m`);
    }
    if (this.onTerminalOutput) {
      this.onTerminalOutput(commandLine);
    }
    if (options.onOutput) {
      options.onOutput(commandLine);
    }
    
    const process = await this.webcontainer.spawn(command, args, {
      cwd: options.cwd || '/'
    });

    // Capture output with real-time streaming
    process.output.pipeTo(
      new WritableStream({
        write: (data) => {
          output += data;
          
          // Write to terminal with proper formatting
          if (this.terminal) {
            this.terminal.write(data);
          }
          
          // Call callbacks for real-time updates
          if (this.onTerminalOutput) {
            this.onTerminalOutput(data);
          }
          
          if (options.onOutput) {
            options.onOutput(data);
          }
        }
      })
    );

    const exitCode = await process.exit;
    
    // Write completion status to terminal
    const statusLine = exitCode === 0 
      ? `\r\n\x1b[32m✅ Command completed successfully (exit code: ${exitCode})\x1b[0m\r\n` 
      : `\r\n\x1b[31m❌ Command failed (exit code: ${exitCode})\x1b[0m\r\n`;
    
    if (this.terminal) {
      this.terminal.write(statusLine);
    }
    if (this.onTerminalOutput) {
      this.onTerminalOutput(statusLine);
    }
    if (options.onOutput) {
      options.onOutput(statusLine);
    }
    
    return { exitCode, output };
  }

  async installDependencies(): Promise<{ exitCode: number; output: string }> {
    return this.executeCommand('npm', ['install']);
  }

  async startDevServer(): Promise<{ exitCode: number; output: string }> {
    return this.executeCommand('npm', ['start']);
  }

  initializeTerminal(terminalElement: HTMLElement): Terminal {
    this.terminal = new Terminal({
      convertEol: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1a1a1a',
        foreground: '#ffffff'
      }
    });

    this.terminal.open(terminalElement);
    return this.terminal;
  }

  onPreviewUrlChanged(callback: (url: string | null) => void): void {
    this.onPreviewUrlChange = callback;
  }

  onTerminalData(callback: (data: string) => void): void {
    this.onTerminalOutput = callback;
  }

  getPreviewUrl(): string | null {
    return this.previewUrl;
  }

  getTerminal(): Terminal | null {
    return this.terminal;
  }

  isWebContainerBooted(): boolean {
    return this.isBooted;
  }

  isCrossOriginIsolated(): boolean {
    return typeof window !== 'undefined' && window.crossOriginIsolated === true;
  }

  async dispose(): Promise<void> {
    this.refCount = Math.max(0, this.refCount - 1);
    
    // Only dispose if no more references
    if (this.refCount === 0) {
      await this.forceDispose();
    }
  }

  private async forceDispose(): Promise<void> {
    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = null;
    }
    
    if (this.webcontainer) {
      try {
        // Try to teardown the WebContainer instance
        if (typeof this.webcontainer.teardown === 'function') {
          await this.webcontainer.teardown();
        }
      } catch (error) {
        console.warn('Error during WebContainer teardown:', error);
      }
      this.webcontainer = null;
    }
    
    this.isBooted = false;
    this.isBooting = false;
    this.bootPromise = null;
    this.previewUrl = null;
    this.onPreviewUrlChange = null;
    this.onTerminalOutput = null;
    this.refCount = 0;
  }
}

// Global singleton instance
let globalWebContainerManager: WebContainerManager | null = null;

// Export singleton instance
export const webcontainerManager = (() => {
  if (!globalWebContainerManager) {
    globalWebContainerManager = new WebContainerManager();
  }
  return globalWebContainerManager;
})();
export default webcontainerManager;