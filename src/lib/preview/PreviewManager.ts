import type { WebContainer } from '@webcontainer/api';
import { addPreview, removePreview, updatePreviewReady, setActiveTab, type PreviewInfo } from '../stores/workbenchStore';

// Auto-switch triggers for development servers
const AUTO_PREVIEW_PATTERNS = [
  /npm (run )?dev/,
  /yarn dev/,
  /npm start/,
  /vite/,
  /next dev/,
  /serve/,
  /webpack-dev-server/,
  /parcel/,
  /rollup.*--watch/
];

// Common development server ports
const DEV_SERVER_PORTS = [3000, 3001, 5173, 8080, 8000, 4000, 5000, 9000];

export class PreviewManager {
  private webcontainerPromise: Promise<WebContainer>;
  private webcontainer: WebContainer | null = null;
  private availablePreviews = new Map<number, PreviewInfo>();
  private commandHistory: string[] = [];
  private hasAutoSwitched = false;

  constructor(webcontainerPromise: Promise<WebContainer>) {
    this.webcontainerPromise = webcontainerPromise;
    this.initializeWebContainer();
  }

  private async initializeWebContainer() {
    try {
      this.webcontainer = await this.webcontainerPromise;
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize WebContainer in PreviewManager:', error);
    }
  }

  private setupEventListeners() {
    if (!this.webcontainer) return;
    
    // Listen for port events from WebContainer
    this.webcontainer.on('port', (port, type, url) => {
      this.handlePortEvent(port, type, url);
    });
    
    // Listen for server-ready events
    this.webcontainer.on('server-ready', (port, url) => {
      this.handleServerReady(port, url);
    });
    
    console.log('PreviewManager initialized successfully');
  }

  private handlePortEvent(port: number, type: 'open' | 'close', url: string) {
    console.log(`Port event: ${type} on port ${port}, URL: ${url}`);
    
    if (type === 'close') {
      this.availablePreviews.delete(port);
      removePreview(port);
      return;
    }

    // Handle port open event
    let previewInfo = this.availablePreviews.get(port);
    
    if (!previewInfo) {
      previewInfo = {
        port,
        url,
        baseUrl: url,
        ready: type === 'open'
      };
      this.availablePreviews.set(port, previewInfo);
      
      // Auto-switch to preview tab for development servers
      if (this.isDevServerPort(port) && !this.hasAutoSwitched) {
        console.log(`Auto-switching to preview for dev server on port ${port}`);
        setActiveTab('preview');
        this.hasAutoSwitched = true;
      }
    } else {
      previewInfo.ready = type === 'open';
      previewInfo.url = url;
      previewInfo.baseUrl = url;
    }

    addPreview(previewInfo);
  }

  private handleServerReady(port: number, url: string) {
    console.log(`Server ready on port ${port}: ${url}`);
    
    const previewInfo: PreviewInfo = {
      port,
      url,
      baseUrl: url,
      ready: true
    };
    
    this.availablePreviews.set(port, previewInfo);
    addPreview(previewInfo);
    
    // Auto-switch to preview tab for development servers
    if (this.isDevServerPort(port) && !this.hasAutoSwitched) {
      console.log(`Auto-switching to preview for ready server on port ${port}`);
      setActiveTab('preview');
      this.hasAutoSwitched = true;
    }
  }

  // Track command execution to detect development server starts
  public trackCommand(command: string) {
    this.commandHistory.push(command);
    
    // Keep only last 10 commands
    if (this.commandHistory.length > 10) {
      this.commandHistory.shift();
    }
    
    // Check if this command might start a development server
    if (this.isDevServerCommand(command)) {
      console.log('Development server command detected:', command);
      // We'll let the port events handle the actual preview creation
    }
  }

  private isDevServerCommand(command: string): boolean {
    return AUTO_PREVIEW_PATTERNS.some(pattern => pattern.test(command.toLowerCase()));
  }

  // Handle port ready event (called from terminal integration)
  public handlePortReady(port: number, url?: string) {
    const baseUrl = url || `http://localhost:${port}`;
    console.log(`Handling port ready: ${port}, URL: ${baseUrl}`);
    
    const previewInfo: PreviewInfo = {
      port,
      url: baseUrl,
      baseUrl,
      ready: true
    };
    
    this.availablePreviews.set(port, previewInfo);
    addPreview(previewInfo);
    
    // Auto-switch to preview tab for development servers
    if (this.isDevServerPort(port) && !this.hasAutoSwitched) {
      console.log(`Auto-switching to preview for port ${port}`);
      setActiveTab('preview');
      this.hasAutoSwitched = true;
    }
  }

  // Detect development server from command (called from terminal integration)
  public detectDevServerFromCommand(command: string): boolean {
    return this.isDevServerCommand(command);
  }

  // Handle WebContainer URL format and extract port
  public handleWebContainerUrl(webcontainerUrl: string) {
    console.log(`Handling WebContainer URL: ${webcontainerUrl}`);
    
    // Extract port from WebContainer URL pattern
    // Example: https://4zihkuti8394jli3mo92rc6b7yizuj-ghqn--3000--96435430.local-corp.webcontainer-api.io
    const portMatch = webcontainerUrl.match(/--(\d+)--/);
    if (portMatch) {
      const port = parseInt(portMatch[1]);
      console.log(`Extracted port ${port} from WebContainer URL`);
      
      const previewInfo: PreviewInfo = {
        port,
        url: webcontainerUrl,
        baseUrl: webcontainerUrl,
        ready: true
      };
      
      this.availablePreviews.set(port, previewInfo);
      addPreview(previewInfo);
      
      // Auto-switch to preview tab for development servers
      if (this.isDevServerPort(port) && !this.hasAutoSwitched) {
        console.log(`Auto-switching to preview for WebContainer server on port ${port}`);
        setActiveTab('preview');
        this.hasAutoSwitched = true;
      }
      
      return true;
    }
    
    return false;
  }

  // Manually add a preview (for testing or external integrations)
  public addManualPreview(port: number, url: string) {
    const previewInfo: PreviewInfo = {
      port,
      url,
      baseUrl: url,
      ready: true
    };
    
    this.availablePreviews.set(port, previewInfo);
    addPreview(previewInfo);
  }

  // Check if a port is likely a development server
  private isDevServerPort(port: number): boolean {
    return DEV_SERVER_PORTS.includes(port) || (port >= 3000 && port <= 9999);
  }

  // Wait for a specific port to become ready
  public waitForPort(port: number, options: { timeout?: number } = {}): Promise<string> {
    const timeout = options.timeout || 15000; // Default 15 seconds
    
    return new Promise((resolve, reject) => {
      // Check if port is already ready
      const existingPreview = this.availablePreviews.get(port);
      if (existingPreview && existingPreview.ready) {
        resolve(existingPreview.url);
        return;
      }
      
      let timeoutId: NodeJS.Timeout;
      let portListener: (portNum: number, type: 'open' | 'close', url: string) => void;
      let serverReadyListener: (portNum: number, url: string) => void;
      
      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (this.webcontainer && portListener) {
          this.webcontainer.off('port', portListener);
        }
        if (this.webcontainer && serverReadyListener) {
          this.webcontainer.off('server-ready', serverReadyListener);
        }
      };
      
      // Set up timeout
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout waiting for port ${port} to be ready after ${timeout}ms`));
      }, timeout);
      
      // Listen for port events
      portListener = (portNum: number, type: 'open' | 'close', url: string) => {
        if (portNum === port && type === 'open') {
          cleanup();
          resolve(url);
        }
      };
      
      // Listen for server-ready events
      serverReadyListener = (portNum: number, url: string) => {
        if (portNum === port) {
          cleanup();
          resolve(url);
        }
      };
      
      // Add listeners if webcontainer is ready
      if (this.webcontainer) {
        this.webcontainer.on('port', portListener);
        this.webcontainer.on('server-ready', serverReadyListener);
      } else {
        // Wait for webcontainer to be ready, then add listeners
        this.webcontainerPromise.then((container) => {
          if (timeoutId) { // Only add listeners if not timed out
            container.on('port', portListener);
            container.on('server-ready', serverReadyListener);
          }
        }).catch((error) => {
          cleanup();
          reject(new Error(`Failed to initialize WebContainer: ${error.message}`));
        });
      }
    });
  }

  // Get current previews
  public getPreviews(): PreviewInfo[] {
    return Array.from(this.availablePreviews.values());
  }

  // Clear all previews
  public clearAll() {
    this.availablePreviews.clear();
    this.commandHistory = [];
    this.hasAutoSwitched = false;
  }

  // Destroy the preview manager
  public destroy() {
    this.clearAll();
  }
}

// Singleton instance
let previewManagerInstance: PreviewManager | null = null;

export function createPreviewManager(webcontainerPromise: Promise<WebContainer>): PreviewManager {
  if (!previewManagerInstance) {
    previewManagerInstance = new PreviewManager(webcontainerPromise);
  }
  return previewManagerInstance;
}

// Get the current preview manager instance (for debugging/testing)
export function getPreviewManager(): PreviewManager | null {
  return previewManagerInstance;
}

// Helper function to manually add a WebContainer URL (for testing)
export function addWebContainerPreview(url: string) {
  if (previewManagerInstance) {
    previewManagerInstance.handleWebContainerUrl(url);
  } else {
    console.warn('PreviewManager not initialized yet');
  }
}