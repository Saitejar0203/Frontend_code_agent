import JSZip from 'jszip';
import { FileNode } from '@/lib/stores/workbenchStore';
import { ActionRunner } from '@/lib/runtime/ActionRunner';
import { WebContainer } from '@webcontainer/api';

export class DownloadService {
  private actionRunner: ActionRunner;
  private webcontainer: Promise<WebContainer>;

  constructor(actionRunner: ActionRunner, webcontainer: Promise<WebContainer>) {
    this.actionRunner = actionRunner;
    this.webcontainer = webcontainer;
  }

  /**
   * Download a single file
   */
  public async downloadFile(fileNode: FileNode): Promise<void> {
    if (fileNode.type !== 'file' || !fileNode.content) {
      throw new Error('Invalid file node or missing content');
    }

    try {
      const blob = new Blob([fileNode.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileNode.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download all project files as a ZIP
   */
  public async downloadProject(): Promise<void> {
    try {
      // Get the current file tree from WebContainer
      await this.actionRunner.refreshFileTree();
      
      // Read the complete file system from WebContainer
      const container = await this.webcontainer;
      const fileSystemTree = await this.readFileSystemTree(container, '.');
      
      if (Object.keys(fileSystemTree).length === 0) {
        throw new Error('No files found in the project');
      }

      // Create ZIP file
      const zip = new JSZip();
      await this.addFilesToZip(fileSystemTree, zip, '');

      // Generate and download ZIP
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download project:', error);
      throw new Error(`Failed to download project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Read the complete file system tree from WebContainer
   */
  private async readFileSystemTree(container: WebContainer, path: string): Promise<Record<string, any>> {
    const tree: Record<string, any> = {};
    
    try {
      const entries = await container.fs.readdir(path, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path === '.' ? entry.name : `${path}/${entry.name}`;
        
        // Skip common build/cache directories and hidden files
        if (this.shouldSkipPath(entry.name)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          const subTree = await this.readFileSystemTree(container, fullPath);
          if (Object.keys(subTree).length > 0) {
            tree[entry.name] = {
              directory: subTree
            };
          }
        } else if (entry.isFile()) {
          try {
            const content = await container.fs.readFile(fullPath, 'utf-8');
            tree[entry.name] = {
              file: {
                contents: content
              }
            };
          } catch (error) {
            console.warn(`Failed to read file ${fullPath}:`, error);
            // Continue with other files
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to read directory ${path}:`, error);
    }
    
    return tree;
  }

  /**
   * Add files from file system tree to ZIP
   */
  private async addFilesToZip(tree: Record<string, any>, zip: JSZip, currentPath: string): Promise<void> {
    for (const [name, node] of Object.entries(tree)) {
      const fullPath = currentPath ? `${currentPath}/${name}` : name;
      
      if (node.file && node.file.contents) {
        // Add file to ZIP
        zip.file(fullPath, node.file.contents);
      } else if (node.directory) {
        // Create folder and recursively add its contents
        const folder = zip.folder(fullPath);
        if (folder) {
          await this.addFilesToZip(node.directory, folder, '');
        }
      }
    }
  }

  /**
   * Check if a path should be skipped during download
   */
  private shouldSkipPath(name: string): boolean {
    const skipPatterns = [
      'node_modules',
      '.git',
      '.next',
      '.nuxt',
      'dist',
      'build',
      '.cache',
      '.temp',
      '.tmp',
      '__pycache__',
      '.pytest_cache',
      '.coverage',
      '.nyc_output',
      'coverage',
      '.DS_Store',
      'Thumbs.db'
    ];
    
    return skipPatterns.includes(name) || 
           (name.startsWith('.') && !['.','.env','.gitignore','.env.example'].includes(name));
  }
}

// Singleton instance
let downloadServiceInstance: DownloadService | null = null;

export function getDownloadService(actionRunner: ActionRunner, webcontainer: Promise<WebContainer>): DownloadService {
  if (!downloadServiceInstance) {
    downloadServiceInstance = new DownloadService(actionRunner, webcontainer);
  }
  return downloadServiceInstance;
}

export function resetDownloadService(): void {
  downloadServiceInstance = null;
}