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