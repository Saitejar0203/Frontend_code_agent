import { describe, it, expect, beforeEach } from 'vitest';
import {
  workbenchStore,
  appendTerminalOutput,
  clearTerminalOutput,
  setPreviewUrl,
  toggleTerminal,
  setActiveTab,
  setWebContainerReady,
  addRunningCommand,
  removeRunningCommand,
  clearRunningCommands,
  setFileTree,
  addFile,
  updateFileContent,
  setSelectedFile,
  toggleFolder,
  markFileSaved,
  addArtifact,
  addActionToArtifact,
  setArtifactRunning,
  setArtifactError,
  removeArtifact,
  selectArtifact,
  toggleArtifactPanel,
  clearArtifacts,
  type FileNode,
  type ArtifactState
} from './workbenchStore';

describe('workbenchStore', () => {
  beforeEach(() => {
    // Reset store before each test
    workbenchStore.set({
      terminalOutput: '',
      previewUrl: null,
      isTerminalVisible: false,
      activeTab: 'files',
      isWebContainerReady: false,
      runningCommands: [],
      fileTree: [],
      selectedFile: null,
      modifiedFiles: new Set(),
      unsavedChanges: false,
      artifacts: {},
      selectedArtifactId: null,
      artifactPanelVisible: false,
    });
  });

  it('should append terminal output correctly', () => {
    appendTerminalOutput('Hello ');
    expect(workbenchStore.get().terminalOutput).toBe('Hello ');
    
    appendTerminalOutput('World!');
    expect(workbenchStore.get().terminalOutput).toBe('Hello World!');
    
    appendTerminalOutput('\n$ npm install');
    expect(workbenchStore.get().terminalOutput).toBe('Hello World!\n$ npm install');
  });

  it('should clear terminal output', () => {
    appendTerminalOutput('Some output');
    expect(workbenchStore.get().terminalOutput).toBe('Some output');
    
    clearTerminalOutput();
    expect(workbenchStore.get().terminalOutput).toBe('');
  });

  it('should set and clear preview URL', () => {
    const testUrl = 'http://localhost:3000';
    
    setPreviewUrl(testUrl);
    expect(workbenchStore.get().previewUrl).toBe(testUrl);
    
    setPreviewUrl(null);
    expect(workbenchStore.get().previewUrl).toBe(null);
  });

  it('should toggle terminal visibility', () => {
    expect(workbenchStore.get().isTerminalVisible).toBe(false);
    
    toggleTerminal();
    expect(workbenchStore.get().isTerminalVisible).toBe(true);
    
    toggleTerminal();
    expect(workbenchStore.get().isTerminalVisible).toBe(false);
  });

  it('should set active tab', () => {
    expect(workbenchStore.get().activeTab).toBe('files');
    
    setActiveTab('preview');
    expect(workbenchStore.get().activeTab).toBe('preview');
    
    setActiveTab('terminal');
    expect(workbenchStore.get().activeTab).toBe('terminal');
    
    setActiveTab('files');
    expect(workbenchStore.get().activeTab).toBe('files');
  });

  it('should set WebContainer ready status', () => {
    expect(workbenchStore.get().isWebContainerReady).toBe(false);
    
    setWebContainerReady(true);
    expect(workbenchStore.get().isWebContainerReady).toBe(true);
    
    setWebContainerReady(false);
    expect(workbenchStore.get().isWebContainerReady).toBe(false);
  });

  it('should add running commands', () => {
    expect(workbenchStore.get().runningCommands).toHaveLength(0);
    
    addRunningCommand('npm install');
    expect(workbenchStore.get().runningCommands).toEqual(['npm install']);
    
    addRunningCommand('npm start');
    expect(workbenchStore.get().runningCommands).toEqual(['npm install', 'npm start']);
  });

  it('should remove specific running command', () => {
    addRunningCommand('npm install');
    addRunningCommand('npm start');
    addRunningCommand('npm test');
    
    expect(workbenchStore.get().runningCommands).toHaveLength(3);
    
    removeRunningCommand('npm start');
    expect(workbenchStore.get().runningCommands).toEqual(['npm install', 'npm test']);
    
    removeRunningCommand('npm install');
    expect(workbenchStore.get().runningCommands).toEqual(['npm test']);
  });

  it('should clear all running commands', () => {
    addRunningCommand('npm install');
    addRunningCommand('npm start');
    addRunningCommand('npm test');
    
    expect(workbenchStore.get().runningCommands).toHaveLength(3);
    
    clearRunningCommands();
    expect(workbenchStore.get().runningCommands).toHaveLength(0);
  });

  it('should handle multiple terminal output appends efficiently', () => {
    const outputs = ['Line 1\n', 'Line 2\n', 'Line 3\n', 'Line 4\n'];
    
    outputs.forEach(output => appendTerminalOutput(output));
    
    expect(workbenchStore.get().terminalOutput).toBe('Line 1\nLine 2\nLine 3\nLine 4\n');
  });

  it('should not affect other state when updating specific properties', () => {
    // Set initial state
    setPreviewUrl('http://localhost:3000');
    setActiveTab('preview');
    addRunningCommand('npm start');
    
    const initialState = workbenchStore.get();
    
    // Update terminal output
    appendTerminalOutput('New output');
    
    const updatedState = workbenchStore.get();
    
    // Check that other properties remain unchanged
    expect(updatedState.previewUrl).toBe(initialState.previewUrl);
    expect(updatedState.activeTab).toBe(initialState.activeTab);
    expect(updatedState.runningCommands).toEqual(initialState.runningCommands);
    expect(updatedState.terminalOutput).toBe('New output');
  });

  // File System Tests
  describe('File System Management', () => {
    it('should set file tree structure', () => {
      const fileTree: FileNode[] = [
        {
          name: 'src',
          type: 'folder',
          path: '/src',
          isExpanded: false,
          children: [
            {
              name: 'index.ts',
              type: 'file',
              path: '/src/index.ts',
              content: 'console.log("Hello");'
            }
          ]
        }
      ];

      setFileTree(fileTree);
      expect(workbenchStore.get().fileTree).toEqual(fileTree);
    });

    it('should add a new file', () => {
      const newFile: FileNode = {
        name: 'test.js',
        type: 'file',
        path: '/test.js',
        content: 'test content'
      };

      addFile(newFile);
      expect(workbenchStore.get().fileTree).toContain(newFile);
    });

    it('should update file content and mark as modified', () => {
      const fileTree: FileNode[] = [
        {
          name: 'index.ts',
          type: 'file',
          path: '/index.ts',
          content: 'original content'
        }
      ];

      setFileTree(fileTree);
      updateFileContent('/index.ts', 'updated content');

      const state = workbenchStore.get();
      expect(state.fileTree[0].content).toBe('updated content');
      expect(state.modifiedFiles.has('/index.ts')).toBe(true);
      expect(state.unsavedChanges).toBe(true);
    });

    it('should set selected file', () => {
      const filePath = '/src/index.ts';
      setSelectedFile(filePath);
      expect(workbenchStore.get().selectedFile).toBe(filePath);

      setSelectedFile(null);
      expect(workbenchStore.get().selectedFile).toBe(null);
    });

    it('should toggle folder expansion', () => {
      const fileTree: FileNode[] = [
        {
          name: 'src',
          type: 'folder',
          path: '/src',
          isExpanded: false,
          children: []
        }
      ];

      setFileTree(fileTree);
      expect(workbenchStore.get().fileTree[0].isExpanded).toBe(false);

      toggleFolder('/src');
      expect(workbenchStore.get().fileTree[0].isExpanded).toBe(true);

      toggleFolder('/src');
      expect(workbenchStore.get().fileTree[0].isExpanded).toBe(false);
    });

    it('should mark file as saved', () => {
      const fileTree: FileNode[] = [
        {
          name: 'index.ts',
          type: 'file',
          path: '/index.ts',
          content: 'content'
        }
      ];

      setFileTree(fileTree);
      updateFileContent('/index.ts', 'new content');

      let state = workbenchStore.get();
      expect(state.modifiedFiles.has('/index.ts')).toBe(true);
      expect(state.unsavedChanges).toBe(true);

      markFileSaved('/index.ts');
      state = workbenchStore.get();
      expect(state.modifiedFiles.has('/index.ts')).toBe(false);
      expect(state.unsavedChanges).toBe(false);
    });
  });

  // Artifact Management Tests
  describe('Artifact Management', () => {
    it('should add a new artifact', () => {
       addArtifact('test-artifact', 'Test Artifact');
       const state = workbenchStore.get();
       expect(state.artifacts['test-artifact']).toBeDefined();
       expect(state.artifacts['test-artifact'].id).toBe('test-artifact');
       expect(state.artifacts['test-artifact'].title).toBe('Test Artifact');
       expect(state.artifacts['test-artifact'].actions).toEqual([]);
       expect(state.artifacts['test-artifact'].isRunning).toBe(false);
       expect(state.selectedArtifactId).toBe('test-artifact');
       expect(state.artifactPanelVisible).toBe(true);
     });

    it('should add action to artifact', () => {
       addArtifact('test-artifact', 'Test Artifact');
       addActionToArtifact('test-artifact', { type: 'file', filePath: '/test.js' });

       const state = workbenchStore.get();
       expect(state.artifacts['test-artifact'].actions).toHaveLength(1);
       expect(state.artifacts['test-artifact'].actions[0]).toEqual({ type: 'file', filePath: '/test.js' });
       expect(state.artifacts['test-artifact'].isRunning).toBe(true);
     });

    it('should set artifact running status', () => {
       addArtifact('test-artifact', 'Test Artifact');
       setArtifactRunning('test-artifact', false); // Set to false since addArtifact sets it to false initially

       let state = workbenchStore.get();
       expect(state.artifacts['test-artifact'].isRunning).toBe(false);

       setArtifactRunning('test-artifact', true);
       state = workbenchStore.get();
       expect(state.artifacts['test-artifact'].isRunning).toBe(true);
     });

    it('should set artifact error', () => {
       addArtifact('test-artifact', 'Test Artifact');
       setArtifactError('test-artifact', 'Test error');

       const state = workbenchStore.get();
       expect(state.artifacts['test-artifact'].error).toBe('Test error');
       expect(state.artifacts['test-artifact'].isRunning).toBe(false);
     });

    it('should remove artifact', () => {
       addArtifact('test-artifact', 'Test Artifact');

       let state = workbenchStore.get();
       expect(state.artifacts['test-artifact']).toBeDefined();
       expect(state.selectedArtifactId).toBe('test-artifact');

       removeArtifact('test-artifact');
       state = workbenchStore.get();
       expect(state.artifacts['test-artifact']).toBeUndefined();
       expect(state.selectedArtifactId).toBe(null);
       expect(state.artifactPanelVisible).toBe(false);
     });

    it('should select artifact', () => {
       addArtifact('test-artifact', 'Test Artifact');
       // addArtifact already selects the artifact, so let's test selecting null and then back
       selectArtifact(null);
       
       let state = workbenchStore.get();
       expect(state.selectedArtifactId).toBe(null);
       
       selectArtifact('test-artifact');
       state = workbenchStore.get();
       expect(state.selectedArtifactId).toBe('test-artifact');
       expect(state.artifactPanelVisible).toBe(true);
     });

    it('should toggle artifact panel visibility', () => {
      expect(workbenchStore.get().artifactPanelVisible).toBe(false);

      toggleArtifactPanel();
      expect(workbenchStore.get().artifactPanelVisible).toBe(true);

      toggleArtifactPanel();
      expect(workbenchStore.get().artifactPanelVisible).toBe(false);
    });

    it('should clear all artifacts', () => {
       addArtifact('test-artifact', 'Test Artifact');
       // addArtifact already sets panel visible and selects artifact

       let state = workbenchStore.get();
       expect(Object.keys(state.artifacts)).toHaveLength(1);
       expect(state.selectedArtifactId).toBe('test-artifact');
       expect(state.artifactPanelVisible).toBe(true);

       clearArtifacts();
       state = workbenchStore.get();
       expect(Object.keys(state.artifacts)).toHaveLength(0);
       expect(state.selectedArtifactId).toBe(null);
       expect(state.artifactPanelVisible).toBe(false);
     });
  });
});