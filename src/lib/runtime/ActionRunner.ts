import { 
  appendTerminalOutput, 
  setPreviewUrl, 
  addRunningCommand, 
  removeRunningCommand,
  setWebContainerReady,
  setFileTree,
  setArtifactRunning,
  setArtifactError,
  type FileNode
} from '@/lib/stores/workbenchStore';
import { FileSystemTree, WebContainer } from '@webcontainer/api';

import { createScopedLogger } from './logger';

// Helper function to decode HTML entities
function decodeHtmlEntities(text: string): string {
  if (typeof document === 'undefined') {
    // Basic fallback for non-browser environments if needed
    return text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  }
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export type ActionStatus = 'pending' | 'running' | 'complete' | 'aborted' | 'failed';

export interface BoltAction {
  type: 'file' | 'shell';
  filePath?: string;
  content: string;
}

export interface BaseActionState extends BoltAction {
  status: Exclude<ActionStatus, 'failed'>;
  abort: () => void;
  executed: boolean;
  abortSignal: AbortSignal;
}

export interface FailedActionState extends BoltAction, Omit<BaseActionState, 'status'> {
  status: Extract<ActionStatus, 'failed'>;
  error: string;
}

export type ActionState = BaseActionState | FailedActionState;

type BaseActionUpdate = Partial<Pick<BaseActionState, 'status' | 'abort' | 'executed'>>;

export type ActionStateUpdate =
  | BaseActionUpdate
  | (Omit<BaseActionUpdate, 'status'> & { status: 'failed'; error: string });

class ActionRunner {
  #webcontainer: Promise<WebContainer>;
  #isInitialized = false;
  private actions: Map<string, ActionState> = new Map();
  private logger = createScopedLogger('ActionRunner');
  
  // New internal queuing system
  private fileActionQueue: BoltAction[] = [];
  private shellActionQueue: BoltAction[] = [];
  private isProcessing = false;
  private actionIdMap: Map<BoltAction, string> = new Map(); // Track action IDs
  private artifactIdMap: Map<BoltAction, string> = new Map(); // Track artifact IDs

  constructor(webcontainerPromise: Promise<WebContainer>) {
    this.#webcontainer = webcontainerPromise;
    this.setupWebContainerCallbacks();
  }

  private async setupWebContainerCallbacks() {
    try {
      // Wait for WebContainer to be ready and set up server ready callback
      const container = await this.#webcontainer;
      
      container.on('server-ready', (port, url) => {
        this.logger.info(`Server ready at ${url}`);
        setPreviewUrl(url);
        appendTerminalOutput(`\n🚀 Server ready at ${url}\n`);
      });
      
    } catch (error) {
      this.logger.error('Failed to setup WebContainer callbacks:', error);
      appendTerminalOutput(`\n❌ Failed to setup WebContainer: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  }

  public async initialize(): Promise<void> {
    if (this.#isInitialized) {
      return;
    }
    try {
      this.logger.info('Initializing WebContainer...');
      appendTerminalOutput('🔧 Initializing WebContainer...\n');
      
      const container = await this.#webcontainer;
      
      // Test WebContainer functionality
      await container.fs.mkdir('/tmp', { recursive: true });
      
      setWebContainerReady(true);
      this.#isInitialized = true; // Set flag to true after success
      this.logger.info('WebContainer initialized successfully');
      appendTerminalOutput('✅ WebContainer ready\n');
      
      // Initialize file tree
      await this.updateFileTree();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to initialize WebContainer:', error);
      appendTerminalOutput(`❌ Failed to initialize WebContainer: ${errorMessage}\n`);
      setWebContainerReady(false);
      this.#isInitialized = false; // Reset on failure
      throw error;
    }
  }

  /**
   * Execute a clean BoltAction object
   * This is the main entry point for action execution
   */
  public runAction(action: BoltAction, artifactId?: string): string {
    const actionId = `${action.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store action and artifact IDs for tracking
    this.actionIdMap.set(action, actionId);
    if (artifactId) {
      this.artifactIdMap.set(action, artifactId);
    }

    if (action.type === 'file' && action.filePath) {
      this.logger.info(`Queuing file: ${action.filePath} (${action.content.length} chars)`);
      appendTerminalOutput(`📄 Queuing file: ${action.filePath} (${action.content.length} chars)\n`);
      this.fileActionQueue.push(action);
    } else if (action.type === 'shell') {
      this.logger.info(`Queuing command: ${action.content}`);
      appendTerminalOutput(`⚡ Queuing command: ${action.content}\n`);
      this.shellActionQueue.push(action);
    }

    // Add action to the actions map for tracking
    const abortController = new AbortController();
    this.actions.set(actionId, {
      ...action,
      status: 'pending',
      executed: false,
      abort: () => {
        abortController.abort();
        this.updateAction(actionId, { status: 'aborted' });
        if (artifactId) {
          setArtifactRunning(artifactId, false);
        }
      },
      abortSignal: abortController.signal,
    });

    // Trigger the processing loop, but don't wait for it
    this.processQueues();
    
    return actionId;
  }

  /**
   * @deprecated Use runAction(action: BoltAction, artifactId?: string) instead
   */
  public handleFile(filePath: string, content: string, artifactId?: string): string {
    return this.runAction({
      type: 'file',
      filePath,
      content
    }, artifactId);
  }

  /**
   * @deprecated Use runAction(action: BoltAction, artifactId?: string) instead
   */
  public handleCommand(command: string, artifactId?: string): string {
    return this.runAction({
      type: 'shell',
      content: command
    }, artifactId);
  }

  /**
   * Core queue processor - ensures only one batch of operations runs at a time
   * and that files are always written before shell commands
   */
  private async processQueues(): Promise<void> {
    if (this.isProcessing) {
      return; // Already processing, new actions will be picked up
    }
    this.isProcessing = true;

    try {
      // As long as there are actions, keep processing
      while (this.fileActionQueue.length > 0 || this.shellActionQueue.length > 0) {
        
        // 1. Process all pending file actions in parallel
        if (this.fileActionQueue.length > 0) {
          const filesToProcess = [...this.fileActionQueue];
          this.fileActionQueue = []; // Clear the queue immediately
          
          console.log(`📦 Executing batch of ${filesToProcess.length} file actions.`);
          await this.executeFileBatch(filesToProcess);
        }

        // 2. Process one shell command (sequentially)
        if (this.shellActionQueue.length > 0) {
          const commandToProcess = this.shellActionQueue.shift()!; // Get the next command
          
          console.log(`⚡ Executing shell command: ${commandToProcess.content}`);
          await this.runShellActionFromQueue(commandToProcess);
        }
      }
    } catch (error) {
      console.error('❌ Error during queue processing:', error);
    } finally {
      this.isProcessing = false; // Release the lock
    }
  }

  private async executeFileBatch(actions: BoltAction[]): Promise<void> {
    const filePromises = actions.map(action => this.runFileActionFromQueue(action));
    await Promise.all(filePromises);
    console.log(`✅ Completed file action batch.`);
  }

  private async runFileActionFromQueue(action: BoltAction): Promise<void> {
    const actionId = this.actionIdMap.get(action);
    const artifactId = this.artifactIdMap.get(action);
    
    if (!actionId) {
      this.logger.error('Action ID not found for file action');
      return;
    }

    try {
      await this.initialize();
      
      const actionState = this.actions.get(actionId);
      if (!actionState || actionState.executed || actionState.abortSignal.aborted) {
        return;
      }

      this.updateAction(actionId, { status: 'running' });
      if (artifactId) {
        setArtifactRunning(artifactId, true);
      }

      this.logger.info(`Executing file action: ${action.filePath}`);
      await this.runFileAction(actionState);
      
      this.updateAction(actionId, { status: 'complete', executed: true });
      if (artifactId) {
        setArtifactRunning(artifactId, false);
      }
      
      this.logger.info(`File action completed: ${action.filePath}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'File action failed';
      this.logger.error(`File action failed:`, error);
      this.updateAction(actionId, { status: 'failed', error: errorMessage });
      if (artifactId) {
        setArtifactError(artifactId, errorMessage);
      }
    }
  }

  private async runShellActionFromQueue(action: BoltAction): Promise<void> {
    const actionId = this.actionIdMap.get(action);
    const artifactId = this.artifactIdMap.get(action);
    
    if (!actionId) {
      this.logger.error('Action ID not found for shell action');
      return;
    }

    try {
      await this.initialize();
      
      const actionState = this.actions.get(actionId);
      if (!actionState || actionState.executed || actionState.abortSignal.aborted) {
        return;
      }

      this.updateAction(actionId, { status: 'running' });
      if (artifactId) {
        setArtifactRunning(artifactId, true);
      }

      this.logger.info(`Executing shell command: ${action.content}`);
      await this.runShellAction(actionState);
      
      this.updateAction(actionId, { status: 'complete', executed: true });
      if (artifactId) {
        setArtifactRunning(artifactId, false);
      }
      
      this.logger.info(`Shell command completed: ${action.content}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Shell action failed';
      this.logger.error(`Shell action failed:`, error);
      this.updateAction(actionId, { status: 'failed', error: errorMessage });
      if (artifactId) {
        setArtifactError(artifactId, errorMessage);
      }
    }
  }

  public abort(): void {
    // Abort all running actions
    this.actions.forEach((action) => {
      if (action.status === 'running' || action.status === 'pending') {
        action.abort();
      }
    });
    
    // Clear the queues
    this.fileActionQueue = [];
    this.shellActionQueue = [];
    this.isProcessing = false;
    
    appendTerminalOutput('\n⚠️ Action execution aborted\n');
  }

  private isDevServerCommand(commandString: string): boolean {
    const devServerPatterns = [
      /^npm\s+(start|run\s+dev|run\s+serve)$/,
      /^yarn\s+(start|dev|serve)$/,
      /^pnpm\s+(start|dev|serve)$/,
      /^bun\s+(start|dev|serve)$/,
      /^npx\s+vite$/,
      /^npx\s+webpack-dev-server$/,
      /^npx\s+next\s+dev$/,
      /^python\s+-m\s+http\.server$/,
      /^python3\s+-m\s+http\.server$/
    ];
    
    return devServerPatterns.some(pattern => pattern.test(commandString.trim()));
  }

  private isServerReadyOutput(output: string): boolean {
    const serverReadyPatterns = [
      /Server ready at/i,
      /Local:\s+https?:\/\//i,
      /Network:\s+https?:\/\//i,
      /ready on/i,
      /running at/i,
      /listening on/i,
      /started server on/i,
      /dev server running at/i,
      /vite.*ready in/i,
      /webpack.*compiled successfully/i
    ];
    
    return serverReadyPatterns.some(pattern => pattern.test(output));
  }

  private async runShellAction(action: ActionState) {
    if (action.type !== 'shell') {
      this.logger.error('Expected shell action');
      return;
    }

    const container = await this.#webcontainer;
    const commandString = action.content.trim();
    
    // --- START OF FIX ---
    // Split the command string into the command and its arguments
    const [command, ...args] = commandString.split(' ');
    // --- END OF FIX ---
    
    this.logger.info(`Executing shell command: ${command}`, args);
    appendTerminalOutput(`$ ${commandString}\n`);
    addRunningCommand(commandString);

    const isDevServer = this.isDevServerCommand(commandString);
    let serverReady = false;

    try {
      // --- START OF FIX ---
      // Spawn the process with the parsed command and arguments
      const process = await container.spawn(command, args, {
      // --- END OF FIX ---
        env: { 
          npm_config_yes: 'true',
          NODE_ENV: 'development',
          PATH: 'node_modules/.bin:/usr/local/bin:/usr/bin:/bin'
        },
      });

      action.abortSignal.addEventListener('abort', () => {
        this.logger.info(`Aborting command: ${commandString}`);
        process.kill();
      });

      let output = '';
      let actionCompleted = false;
      
      process.output.pipeTo(
        new WritableStream({
          write: (data) => {
            output += data;
            appendTerminalOutput(data);
            
            // For dev servers, check if server is ready
            if (isDevServer && !serverReady && !actionCompleted && this.isServerReadyOutput(data)) {
              serverReady = true;
              actionCompleted = true;
              this.logger.info(`Development server ready: ${commandString}`);
              appendTerminalOutput(`\n✅ Development server ready\n`);
              
              // Don't wait for process exit for dev servers
              setTimeout(() => {
                if (!action.abortSignal.aborted) {
                  // Mark action as complete without waiting for process exit
                  removeRunningCommand(commandString);
                }
              }, 100);
            }
          },
        }),
      );

      if (isDevServer) {
        // For dev servers, wait a bit for startup, then return if server is ready
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (serverReady && !action.abortSignal.aborted) {
          this.logger.info(`Development server started successfully: ${commandString}`);
          return; // Don't wait for exit
        }
        
        // If server didn't start in 3 seconds, continue with normal flow
      }

      const exitCode = await process.exit;
      
      if (action.abortSignal.aborted) {
        this.logger.info(`Command aborted: ${commandString}`);
        appendTerminalOutput(`\n⚠️ Command aborted\n`);
        return;
      }
      
      if (exitCode === 0) {
        this.logger.info(`Command completed successfully: ${commandString}`);
        appendTerminalOutput(`\n✅ Command completed successfully\n`);
      } else {
        this.logger.warn(`Command failed with exit code ${exitCode}: ${commandString}`);
        appendTerminalOutput(`\n❌ Command failed with exit code ${exitCode}\n`);
        throw new Error(`Command failed with exit code ${exitCode}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Command execution failed: ${commandString}`, error);
      appendTerminalOutput(`\n❌ Command failed: ${errorMessage}\n`);
      throw error;
    } finally {
      if (!isDevServer || !serverReady) {
        removeRunningCommand(commandString);
      }
    }
  }

  private async runFileAction(action: ActionState) {
    if (action.type !== 'file') {
      this.logger.error('Expected file action');
      return;
    }

    if (!action.filePath) {
      this.logger.error('File action missing filePath');
      throw new Error('File action missing filePath');
    }

    const container = await this.#webcontainer;
    const filePath = action.filePath;
    
    // Decode the content before writing it to the file
    const content = decodeHtmlEntities(action.content);

    this.logger.info(`Writing file: ${filePath} (${content.length} chars)`);

    try {
      // Optimized file writing with batch directory creation
      await this.ensureDirectoryExists(container, filePath);
      
      // Use optimized file writing
      await this.writeFileOptimized(container, filePath, content);
      
      appendTerminalOutput(`  ✅ ${filePath}\n`);
      this.logger.info(`File written successfully: ${filePath}`);
      
      // Batch file tree updates to reduce overhead
      this.scheduleFileTreeUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to write file ${filePath}:`, error);
      appendTerminalOutput(`  ❌ Failed to write ${filePath}: ${errorMessage}\n`);
      throw error;
    }
  }

  private directoryCache = new Set<string>();
  private fileTreeUpdateTimeout: NodeJS.Timeout | null = null;

  /**
   * Optimized directory creation with caching
   */
  private async ensureDirectoryExists(container: WebContainer, filePath: string): Promise<void> {
    const dir = filePath.includes('/') ? filePath.substring(0, filePath.lastIndexOf('/')) : '.';
    
    if (dir === '.' || this.directoryCache.has(dir)) {
      return;
    }

    try {
      await container.fs.mkdir(dir, { recursive: true });
      this.directoryCache.add(dir);
      
      // Also cache parent directories
      let parentDir = dir;
      while (parentDir.includes('/')) {
        parentDir = parentDir.substring(0, parentDir.lastIndexOf('/'));
        this.directoryCache.add(parentDir);
      }
    } catch (error) {
      // Directory might already exist, which is fine
      this.logger.debug(`Directory creation note for ${dir}:`, error);
    }
  }

  /**
   * Optimized file writing with better error handling
   */
  private async writeFileOptimized(container: WebContainer, filePath: string, content: string): Promise<void> {
    try {
      // For large files, write in chunks to prevent memory issues
      if (content.length > 100000) { // 100KB threshold
        await this.writeFileInChunks(container, filePath, content);
      } else {
        await container.fs.writeFile(filePath, content);
      }
    } catch (error) {
      // Retry once if write fails
      this.logger.warn(`Retrying file write for ${filePath}`);
      await new Promise(resolve => setTimeout(resolve, 100));
      await container.fs.writeFile(filePath, content);
    }
  }

  /**
   * Write large files in chunks to prevent memory issues
   */
  private async writeFileInChunks(container: WebContainer, filePath: string, content: string): Promise<void> {
    const chunkSize = 50000; // 50KB chunks
    let offset = 0;
    
    // Clear the file first
    await container.fs.writeFile(filePath, '');
    
    while (offset < content.length) {
      const chunk = content.slice(offset, offset + chunkSize);
      
      if (offset === 0) {
        await container.fs.writeFile(filePath, chunk);
      } else {
        // Append to existing file
        const existingContent = await container.fs.readFile(filePath, 'utf-8');
        await container.fs.writeFile(filePath, existingContent + chunk);
      }
      
      offset += chunkSize;
    }
  }

  /**
   * Batch file tree updates to reduce overhead
   */
  private scheduleFileTreeUpdate(): void {
    if (this.fileTreeUpdateTimeout) {
      clearTimeout(this.fileTreeUpdateTimeout);
    }
    
    this.fileTreeUpdateTimeout = setTimeout(() => {
      this.updateFileTree();
      this.fileTreeUpdateTimeout = null;
    }, 500); // Batch updates every 500ms
  }

  private updateAction(id: string, newState: ActionStateUpdate) {
    const action = this.actions.get(id);
    if (action) {
      this.actions.set(id, { ...action, ...newState });
    }
  }

  private async updateFileTree() {
    try {
      const container = await this.#webcontainer;
      const fileSystemTree = await this.readFileSystemTree(container, '.');
      const fileNodes = this.convertToFileNodes(fileSystemTree);
      setFileTree(fileNodes);
    } catch (error) {
      console.error('Failed to update file tree:', error);
    }
  }

  private async readFileSystemTree(container: WebContainer, path: string): Promise<FileSystemTree> {
    const tree: FileSystemTree = {};
    
    try {
      const entries = await container.fs.readdir(path, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path === '.' ? entry.name : `${path}/${entry.name}`;
        
        if (entry.isDirectory()) {
          tree[entry.name] = {
            directory: await this.readFileSystemTree(container, fullPath)
          };
        } else if (entry.isFile()) {
          try {
            const content = await container.fs.readFile(fullPath, 'utf-8');
            tree[entry.name] = {
              file: {
                contents: content
              }
            };
          } catch (error) {
            console.error(`Failed to read file ${fullPath}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to read directory ${path}:`, error);
    }
    
    return tree;
  }

  public getActionStatus(actionId: string): ActionState | undefined {
    return this.actions.get(actionId);
  }

  public getAllActionStatuses(): ActionState[] {
    return Array.from(this.actions.values());
  }

  public clearActionHistory(): void {
    this.actions.clear();
  }

  private convertToFileNodes(tree: FileSystemTree, basePath = ''): FileNode[] {
    const nodes: FileNode[] = [];
    
    Object.entries(tree).forEach(([name, node]) => {
      const path = basePath ? `${basePath}/${name}` : name;
      
      if (node.file) {
        nodes.push({
          name,
          type: 'file',
          path,
          content: node.file.contents as string
        });
      } else if (node.directory) {
        nodes.push({
          name,
          type: 'folder',
          path,
          children: this.convertToFileNodes(node.directory, path),
          isExpanded: true
        });
      }
    });
    
    return nodes.sort((a, b) => {
      // Folders first, then files
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }
}

// ActionRunner instances should be created with a WebContainer promise
// Use the WebContainerProvider to get the shared instance

export { ActionRunner };