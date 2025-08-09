import { atom, map } from 'nanostores';
import type { BoltAction } from '../runtime/types';

// File system interfaces
export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  path: string;
  isExpanded?: boolean;
}

// Artifact interfaces
export interface ArtifactState {
  id: string;
  title: string;
  actions: BoltAction[];
  isVisible: boolean;
  isRunning: boolean;
  error?: string;
}

// Preview interfaces
export interface PreviewInfo {
  port: number;
  url: string;
  ready: boolean;
  baseUrl: string;
}

// Unified workbench state
export interface WorkbenchState {
  // Terminal and preview
  terminalOutput: string;
  previewUrl: string | null;
  isTerminalVisible: boolean;
  activeTab: 'files' | 'preview' | 'terminal';
  isWebContainerReady: boolean;
  runningCommands: string[];
  
  // Preview system
  previews: PreviewInfo[];
  activePreviewIndex: number;
  hasActivePreview: boolean;
  
  // File system
  fileTree: FileNode[];
  selectedFile: string | null;
  modifiedFiles: Set<string>;
  unsavedChanges: boolean;
  
  // Artifacts
  artifacts: Record<string, ArtifactState>;
  selectedArtifactId: string | null;
  artifactPanelVisible: boolean;
}

export const workbenchStore = map<WorkbenchState>({
  // Terminal and preview
  terminalOutput: '',
  previewUrl: null,
  isTerminalVisible: false,
  activeTab: 'files',
  isWebContainerReady: false,
  runningCommands: [],
  
  // Preview system
  previews: [],
  activePreviewIndex: 0,
  hasActivePreview: false,
  
  // File system
  fileTree: [],
  selectedFile: null,
  modifiedFiles: new Set(),
  unsavedChanges: false,
  
  // Artifacts
  artifacts: {},
  selectedArtifactId: null,
  artifactPanelVisible: false,
});

// =============================================================================
// TERMINAL AND PREVIEW ACTIONS
// =============================================================================

export function appendTerminalOutput(data: string) {
  const currentOutput = workbenchStore.get().terminalOutput;
  workbenchStore.setKey('terminalOutput', currentOutput + data);
}

export function clearTerminalOutput() {
  workbenchStore.setKey('terminalOutput', '');
}

export function setPreviewUrl(url: string | null) {
  workbenchStore.setKey('previewUrl', url);
}

export function toggleTerminal() {
  const isVisible = workbenchStore.get().isTerminalVisible;
  workbenchStore.setKey('isTerminalVisible', !isVisible);
}

export function setActiveTab(tab: 'files' | 'preview' | 'terminal') {
  workbenchStore.setKey('activeTab', tab);
}

export function setWebContainerReady(ready: boolean) {
  workbenchStore.setKey('isWebContainerReady', ready);
}

export function addRunningCommand(command: string) {
  const currentCommands = workbenchStore.get().runningCommands;
  workbenchStore.setKey('runningCommands', [...currentCommands, command]);
}

export function removeRunningCommand(command: string) {
  const currentCommands = workbenchStore.get().runningCommands;
  workbenchStore.setKey('runningCommands', currentCommands.filter(cmd => cmd !== command));
}

export function clearRunningCommands() {
  workbenchStore.setKey('runningCommands', []);
}

// =============================================================================
// PREVIEW ACTIONS
// =============================================================================

export function addPreview(preview: PreviewInfo) {
  const currentPreviews = workbenchStore.get().previews;
  const existingIndex = currentPreviews.findIndex(p => p.port === preview.port);
  
  if (existingIndex >= 0) {
    // Update existing preview
    const updatedPreviews = [...currentPreviews];
    updatedPreviews[existingIndex] = preview;
    workbenchStore.setKey('previews', updatedPreviews);
  } else {
    // Add new preview
    workbenchStore.setKey('previews', [...currentPreviews, preview]);
  }
  
  workbenchStore.setKey('hasActivePreview', true);
  
  // Auto-switch to preview tab when first preview becomes ready
  if (preview.ready && currentPreviews.length === 0) {
    workbenchStore.setKey('activeTab', 'preview');
  }
}

export function removePreview(port: number) {
  const currentPreviews = workbenchStore.get().previews;
  const updatedPreviews = currentPreviews.filter(p => p.port !== port);
  workbenchStore.setKey('previews', updatedPreviews);
  workbenchStore.setKey('hasActivePreview', updatedPreviews.length > 0);
  
  // Reset active preview index if needed
  const activeIndex = workbenchStore.get().activePreviewIndex;
  if (activeIndex >= updatedPreviews.length) {
    workbenchStore.setKey('activePreviewIndex', Math.max(0, updatedPreviews.length - 1));
  }
}

export function setActivePreviewIndex(index: number) {
  workbenchStore.setKey('activePreviewIndex', index);
}

export function updatePreviewReady(port: number, ready: boolean) {
  const currentPreviews = workbenchStore.get().previews;
  const updatedPreviews = currentPreviews.map(p => 
    p.port === port ? { ...p, ready } : p
  );
  workbenchStore.setKey('previews', updatedPreviews);
}

export function clearPreviews() {
  workbenchStore.setKey('previews', []);
  workbenchStore.setKey('hasActivePreview', false);
  workbenchStore.setKey('activePreviewIndex', 0);
}

// =============================================================================
// FILE SYSTEM ACTIONS
// =============================================================================

export function setFileTree(newFileTree: FileNode[]) {
  workbenchStore.setKey('fileTree', newFileTree);
}

export function addFile(file: FileNode) {
  const currentFiles = workbenchStore.get().fileTree;
  workbenchStore.setKey('fileTree', [...currentFiles, file]);
}

export function updateFileContent(path: string, content: string) {
  const currentFiles = workbenchStore.get().fileTree;
  const updatedFiles = updateFileInTree(currentFiles, path, content);
  workbenchStore.setKey('fileTree', updatedFiles);
  
  // Mark as modified
  const modifiedFiles = new Set(workbenchStore.get().modifiedFiles);
  modifiedFiles.add(path);
  workbenchStore.setKey('modifiedFiles', modifiedFiles);
  workbenchStore.setKey('unsavedChanges', true);
}

export function setSelectedFile(path: string | null) {
  workbenchStore.setKey('selectedFile', path);
}

export function toggleFolder(path: string) {
  const currentFiles = workbenchStore.get().fileTree;
  const updatedFiles = toggleFolderInTree(currentFiles, path);
  workbenchStore.setKey('fileTree', updatedFiles);
}

export function markFileSaved(path: string) {
  const modifiedFiles = new Set(workbenchStore.get().modifiedFiles);
  modifiedFiles.delete(path);
  workbenchStore.setKey('modifiedFiles', modifiedFiles);
  workbenchStore.setKey('unsavedChanges', modifiedFiles.size > 0);
}

// =============================================================================
// ARTIFACT ACTIONS
// =============================================================================

export function addArtifact(id: string, title: string) {
  const currentArtifacts = workbenchStore.get().artifacts;
  
  workbenchStore.setKey('artifacts', {
    ...currentArtifacts,
    [id]: {
      id,
      title,
      actions: [],
      isVisible: true,
      isRunning: false,
    },
  });
  
  // Auto-select the new artifact
  workbenchStore.setKey('selectedArtifactId', id);
  workbenchStore.setKey('artifactPanelVisible', true);
}

/**
 * Add artifact and prepare for new execution context
 * This clears previous running commands to ensure clean state
 */
export function addArtifactAndPrepareExecution(id: string, title: string) {
  // Clear any running commands from previous artifacts
  clearRunningCommands();
  
  // Add the new artifact
  addArtifact(id, title);
}

export function addActionToArtifact(artifactId: string, action: BoltAction) {
  const currentArtifacts = workbenchStore.get().artifacts;
  const artifact = currentArtifacts[artifactId];
  
  if (artifact) {
    // Filter out mkdir actions from being displayed in the artifact
    const shouldAddToArtifact = !(
      action.type === 'shell' && 
      action.content && 
      action.content.trim().match(/^mkdir\s+/)
    );
    
    if (shouldAddToArtifact) {
      workbenchStore.setKey('artifacts', {
        ...currentArtifacts,
        [artifactId]: {
          ...artifact,
          actions: [...artifact.actions, action],
          isRunning: true,
        },
      });
      
      // If this is a file action, automatically add it to the file tree
      if (action.type === 'file' && action.filePath && action.content) {
        addOrUpdateFileFromAction(action);
      }
    }
  }
}

export function setArtifactRunning(artifactId: string, isRunning: boolean) {
  const currentArtifacts = workbenchStore.get().artifacts;
  const artifact = currentArtifacts[artifactId];
  
  if (artifact) {
    workbenchStore.setKey('artifacts', {
      ...currentArtifacts,
      [artifactId]: {
        ...artifact,
        isRunning,
      },
    });
  }
}

export function setArtifactError(artifactId: string, error: string) {
  const currentArtifacts = workbenchStore.get().artifacts;
  const artifact = currentArtifacts[artifactId];
  
  if (artifact) {
    workbenchStore.setKey('artifacts', {
      ...currentArtifacts,
      [artifactId]: {
        ...artifact,
        error,
        isRunning: false,
      },
    });
  }
}

export function removeArtifact(artifactId: string) {
  const currentArtifacts = workbenchStore.get().artifacts;
  const { [artifactId]: removed, ...remaining } = currentArtifacts;
  
  workbenchStore.setKey('artifacts', remaining);
  
  // If this was the selected artifact, clear selection
  if (workbenchStore.get().selectedArtifactId === artifactId) {
    workbenchStore.setKey('selectedArtifactId', null);
  }
  
  // Hide panel if no artifacts remain
  if (Object.keys(remaining).length === 0) {
    workbenchStore.setKey('artifactPanelVisible', false);
  }
}

export function selectArtifact(artifactId: string | null) {
  workbenchStore.setKey('selectedArtifactId', artifactId);
  if (artifactId) {
    workbenchStore.setKey('artifactPanelVisible', true);
  }
}

export function toggleArtifactPanel() {
  const isVisible = workbenchStore.get().artifactPanelVisible;
  workbenchStore.setKey('artifactPanelVisible', !isVisible);
}

export function clearArtifacts() {
  workbenchStore.setKey('artifacts', {});
  workbenchStore.setKey('selectedArtifactId', null);
  workbenchStore.setKey('artifactPanelVisible', false);
}

/**
 * Reset workbench state for new conversation
 * Clears artifacts, running commands, previews, terminal output, and resets UI state
 */
export function resetWorkbenchForNewConversation() {
  // Clear artifacts
  clearArtifacts();
  
  // Clear running commands
  clearRunningCommands();
  
  // Clear previews from previous conversation
  clearPreviews();
  
  // Clear terminal output
  clearTerminalOutput();
  
  // Reset active tab to files
  setActiveTab('files');
  
  // Clear any error states
  // Note: We keep the file tree for continuity
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Convert artifact action to file tree node and add/update in file tree
export function addOrUpdateFileFromAction(action: BoltAction) {
  if (action.type !== 'file' || !action.filePath || !action.content) {
    return;
  }

  const currentFiles = workbenchStore.get().fileTree;
  const updatedFiles = addOrUpdateFileInTree(currentFiles, action.filePath, action.content);
  workbenchStore.setKey('fileTree', updatedFiles);
}

// Add or update a file in the file tree, creating necessary folder structure
function addOrUpdateFileInTree(files: FileNode[], filePath: string, content: string): FileNode[] {
  // Normalize the file path - remove leading/trailing slashes and handle backslashes
  const normalizedPath = filePath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  
  if (!normalizedPath) {
    return files;
  }
  
  const pathParts = normalizedPath.split('/').filter(part => part.length > 0);
  
  if (pathParts.length === 0) {
    return files;
  }

  const [currentPart, ...remainingParts] = pathParts;
  const isFile = remainingParts.length === 0;
  
  // Find existing node with the current part name
  const existingIndex = files.findIndex(file => file.name === currentPart);
  
  if (existingIndex !== -1) {
    // Node exists, update it
    const existingNode = files[existingIndex];
    
    if (isFile) {
      // Update file content
      const updatedFiles = [...files];
      updatedFiles[existingIndex] = {
        ...existingNode,
        content,
        type: 'file',
        path: normalizedPath
      };
      return updatedFiles;
    } else {
      // Continue traversing into folder
      const updatedFiles = [...files];
      const folderPath = pathParts.slice(0, pathParts.length - remainingParts.length).join('/');
      updatedFiles[existingIndex] = {
        ...existingNode,
        type: 'folder',
        path: folderPath,
        children: addOrUpdateFileInTree(
          existingNode.children || [],
          remainingParts.join('/'),
          content
        )
      };
      return updatedFiles;
    }
  } else {
    // Node doesn't exist, create it
    if (isFile) {
      // Create new file
      const newFile: FileNode = {
        name: currentPart,
        type: 'file',
        path: normalizedPath,
        content
      };
      return [...files, newFile];
    } else {
      // Create new folder and continue
      const folderPath = pathParts.slice(0, pathParts.length - remainingParts.length).join('/');
      const newFolder: FileNode = {
        name: currentPart,
        type: 'folder',
        path: folderPath || currentPart,
        children: addOrUpdateFileInTree([], remainingParts.join('/'), content),
        isExpanded: true // Auto-expand new folders
      };
      return [...files, newFolder];
    }
  }
}

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

// =============================================================================
// LEGACY EXPORTS FOR BACKWARD COMPATIBILITY
// =============================================================================

// Export individual atoms for components that need them
export const filesStore = {
  get: () => ({
    fileTree: workbenchStore.get().fileTree,
    selectedFile: workbenchStore.get().selectedFile,
    modifiedFiles: workbenchStore.get().modifiedFiles,
    unsavedChanges: workbenchStore.get().unsavedChanges,
  })
};

export const artifactsStore = {
  get: () => workbenchStore.get().artifacts
};

export const selectedArtifactId = {
  get: () => workbenchStore.get().selectedArtifactId,
  set: (value: string | null) => workbenchStore.setKey('selectedArtifactId', value)
};

export const artifactPanelVisible = {
  get: () => workbenchStore.get().artifactPanelVisible,
  set: (value: boolean) => workbenchStore.setKey('artifactPanelVisible', value)
};