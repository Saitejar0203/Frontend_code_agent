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

// Unified workbench state
export interface WorkbenchState {
  // Terminal and preview
  terminalOutput: string;
  previewUrl: string | null;
  isTerminalVisible: boolean;
  activeTab: 'files' | 'preview' | 'terminal';
  isWebContainerReady: boolean;
  runningCommands: string[];
  
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

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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