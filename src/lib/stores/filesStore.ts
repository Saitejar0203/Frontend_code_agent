import { map } from 'nanostores';

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  path: string;
  isExpanded?: boolean;
}

export interface FilesState {
  fileTree: FileNode[];
  selectedFile: string | null;
  modifiedFiles: Set<string>;
  unsavedChanges: boolean;
}

export const filesStore = map<FilesState>({
  fileTree: [],
  selectedFile: null,
  modifiedFiles: new Set(),
  unsavedChanges: false,
});

// Actions
export function setFileTree(newFileTree: FileNode[]) {
  filesStore.setKey('fileTree', newFileTree);
}

export function addFile(file: FileNode) {
  const currentFiles = filesStore.get().fileTree;
  filesStore.setKey('fileTree', [...currentFiles, file]);
}

export function updateFileContent(path: string, content: string) {
  const currentFiles = filesStore.get().fileTree;
  const updatedFiles = updateFileInTree(currentFiles, path, content);
  filesStore.setKey('fileTree', updatedFiles);
  
  // Mark as modified
  const modifiedFiles = new Set(filesStore.get().modifiedFiles);
  modifiedFiles.add(path);
  filesStore.setKey('modifiedFiles', modifiedFiles);
  filesStore.setKey('unsavedChanges', true);
}

export function setSelectedFile(path: string | null) {
  filesStore.setKey('selectedFile', path);
}

export function toggleFolder(path: string) {
  const currentFiles = filesStore.get().fileTree;
  const updatedFiles = toggleFolderInTree(currentFiles, path);
  filesStore.setKey('fileTree', updatedFiles);
}

export function markFileSaved(path: string) {
  const modifiedFiles = new Set(filesStore.get().modifiedFiles);
  modifiedFiles.delete(path);
  filesStore.setKey('modifiedFiles', modifiedFiles);
  filesStore.setKey('unsavedChanges', modifiedFiles.size > 0);
}

// Helper functions
function updateFileInTree(files: FileNode[], targetPath: string, content: string): FileNode[] {
  return files.map(file => {
    if (file.path === targetPath && file.type === 'file') {
      return { ...file, content };
    }
    if (file.type === 'folder' && file.children) {
      return {
        ...file,
        children: updateFileInTree(file.children, targetPath, content)
      };
    }
    return file;
  });
}

function toggleFolderInTree(files: FileNode[], targetPath: string): FileNode[] {
  return files.map(file => {
    if (file.path === targetPath && file.type === 'folder') {
      return { ...file, isExpanded: !file.isExpanded };
    }
    if (file.type === 'folder' && file.children) {
      return {
        ...file,
        children: toggleFolderInTree(file.children, targetPath)
      };
    }
    return file;
  });
}