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
import * as nodePath from 'node:path';
import { createScopedLogger } from './logger';
import { webcontainer } from '@/lib/webcontainer';

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
  private currentExecutionPromise: Promise<void> = Promise.resolve();
  private actions: Map<string, ActionState> = new Map();
  private logger = createScopedLogger('ActionRunner');

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
    try {
      this.logger.info('Initializing WebContainer...');
      appendTerminalOutput('🔧 Initializing WebContainer...\n');
      
      const container = await this.#webcontainer;
      
      // Test WebContainer functionality
      await container.fs.mkdir('/tmp', { recursive: true });
      await container.fs.writeFile('/tmp/test.txt', 'WebContainer test');
      await container.fs.readFile('/tmp/test.txt', 'utf-8');
      await container.fs.rm('/tmp/test.txt');
      
      setWebContainerReady(true);
      this.logger.info('WebContainer initialized successfully');
      appendTerminalOutput('✅ WebContainer ready\n');
      
      // Initialize file tree
      await this.updateFileTree();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to initialize WebContainer:', error);
      appendTerminalOutput(`❌ Failed to initialize WebContainer: ${errorMessage}\n`);
      setWebContainerReady(false);
      throw error;
    }
  }

  /**
   * Execute a clean BoltAction object
   * This is the main entry point for action execution
   */
  public runAction(action: BoltAction, artifactId?: string): string {
    const actionId = `${action.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const actionData = {
      actionId,
      action,
      artifactId
    };

    if (action.type === 'file' && action.filePath) {
      this.logger.info(`Creating file: ${action.filePath} (${action.content.length} chars)`);
      appendTerminalOutput(`📄 Creating file: ${action.filePath} (${action.content.length} chars)\n`);
    } else if (action.type === 'shell') {
      this.logger.info(`Executing command: ${action.content}`);
      appendTerminalOutput(`⚡ Executing command: ${action.content}\n`);
    }

    this.addAction(actionData);
    this.executeActionInternal(actionData);
    
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

  public addAction(data: { actionId: string; action: BoltAction; artifactId?: string }) {
    const { actionId, artifactId } = data;

    const action = this.actions.get(actionId);

    if (action) {
      // action already added
      return;
    }

    const abortController = new AbortController();

    this.actions.set(actionId, {
      ...data.action,
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

    this.currentExecutionPromise.then(() => {
      this.updateAction(actionId, { status: 'running' });
      if (artifactId) {
        setArtifactRunning(artifactId, true);
      }
    });
  }

  private async executeActionInternal(data: { actionId: string; action: BoltAction; artifactId?: string }) {
    const { actionId, artifactId } = data;
    const action = this.actions.get(actionId);

    if (!action) {
      this.logger.error(`Action ${actionId} not found`);
      return;
    }

    if (action.executed) {
      return;
    }

    // Ensure WebContainer is initialized before running actions
    await this.initialize();

    this.updateAction(actionId, { ...action, ...data.action, executed: true });

    this.currentExecutionPromise = this.currentExecutionPromise
      .then(() => {
        return this.executeAction(actionId, artifactId);
      })
      .catch((error) => {
        this.logger.error('Action failed:', error);
        if (artifactId) {
          setArtifactError(artifactId, error instanceof Error ? error.message : 'Action failed');
        }
      });
  }

  public abort(): void {
    // Abort all running actions
    this.actions.forEach((action) => {
      if (action.status === 'running' || action.status === 'pending') {
        action.abort();
      }
    });
    appendTerminalOutput('\n⚠️ Action execution aborted\n');
  }

  private async executeAction(actionId: string, artifactId?: string) {
    const action = this.actions.get(actionId);

    if (!action) {
      this.logger.error(`Action ${actionId} not found`);
      return;
    }

    this.updateAction(actionId, { status: 'running' });

    try {
      switch (action.type) {
        case 'shell': {
          await this.runShellAction(action);
          break;
        }
        case 'file': {
          await this.runFileAction(action);
          break;
        }
      }

      const finalStatus = action.abortSignal.aborted ? 'aborted' : 'complete';
      this.updateAction(actionId, { status: finalStatus });
      
      if (artifactId && finalStatus === 'complete') {
        setArtifactRunning(artifactId, false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Action failed';
      this.logger.error(`Action ${actionId} failed:`, error);
      this.updateAction(actionId, { status: 'failed', error: errorMessage });
      
      if (artifactId) {
        setArtifactError(artifactId, errorMessage);
      }
      
      // re-throw the error to be caught in the promise chain
      throw error;
    }
  }

  private async runShellAction(action: ActionState) {
    if (action.type !== 'shell') {
      this.logger.error('Expected shell action');
      return;
    }

    const container = await this.#webcontainer;
    const command = action.content.trim();
    
    this.logger.info(`Executing shell command: ${command}`);
    appendTerminalOutput(`$ ${command}\n`);
    addRunningCommand(command);

    try {
      // Use sh instead of jsh for better compatibility
      const process = await container.spawn('sh', ['-c', command], {
        env: { 
          npm_config_yes: 'true',
          NODE_ENV: 'development',
          PATH: '/usr/local/bin:/usr/bin:/bin'
        },
      });

      action.abortSignal.addEventListener('abort', () => {
        this.logger.info(`Aborting command: ${command}`);
        process.kill();
      });

      let output = '';
      process.output.pipeTo(
        new WritableStream({
          write(data) {
            output += data;
            appendTerminalOutput(data);
          },
        }),
      );

      const exitCode = await process.exit;
      
      if (action.abortSignal.aborted) {
        this.logger.info(`Command aborted: ${command}`);
        appendTerminalOutput(`\n⚠️ Command aborted\n`);
        return;
      }
      
      if (exitCode === 0) {
        this.logger.info(`Command completed successfully: ${command}`);
        appendTerminalOutput(`\n✅ Command completed successfully\n`);
      } else {
        this.logger.warn(`Command failed with exit code ${exitCode}: ${command}`);
        appendTerminalOutput(`\n❌ Command failed with exit code ${exitCode}\n`);
        throw new Error(`Command failed with exit code ${exitCode}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Command execution failed: ${command}`, error);
      appendTerminalOutput(`\n❌ Command failed: ${errorMessage}\n`);
      throw error;
    } finally {
      removeRunningCommand(command);
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
    const content = action.content;

    this.logger.info(`Writing file: ${filePath} (${content.length} chars)`);

    try {
      await container.fs.writeFile(filePath, content);
      appendTerminalOutput(`  ✅ ${filePath}\n`);
      this.logger.info(`File written successfully: ${filePath}`);
      
      // Update file tree after writing file
      await this.updateFileTree();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to write file ${filePath}:`, error);
      appendTerminalOutput(`  ❌ Failed to write ${filePath}: ${errorMessage}\n`);
      throw error;
    }
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

export const actionRunner = new ActionRunner(webcontainer);