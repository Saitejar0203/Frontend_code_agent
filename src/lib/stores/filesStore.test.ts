import { describe, it, expect, beforeEach } from 'vitest';
import {
  filesStore,
  setFileTree,
  addFile,
  updateFileContent,
  setSelectedFile,
  toggleFolder,
  markFileSaved,
  type FileNode
} from './filesStore';

describe('filesStore', () => {
  beforeEach(() => {
    // Reset store before each test
    filesStore.set({
      fileTree: [],
      selectedFile: null,
      modifiedFiles: new Set(),
      unsavedChanges: false,
    });
  });

  it('should set file tree structure', () => {
    const mockFileTree: FileNode[] = [
      {
        name: 'src',
        type: 'folder',
        path: '/src',
        isExpanded: true,
        children: [
          {
            name: 'index.ts',
            type: 'file',
            path: '/src/index.ts',
            content: 'console.log("Hello");'
          }
        ]
      },
      {
        name: 'package.json',
        type: 'file',
        path: '/package.json',
        content: '{}'
      }
    ];

    setFileTree(mockFileTree);
    
    const state = filesStore.get();
    expect(state.fileTree).toEqual(mockFileTree);
    expect(state.fileTree).toHaveLength(2);
  });

  it('should add a new file to the tree', () => {
    const newFile: FileNode = {
      name: 'test.js',
      type: 'file',
      path: '/test.js',
      content: 'test content'
    };

    addFile(newFile);
    
    const state = filesStore.get();
    expect(state.fileTree).toHaveLength(1);
    expect(state.fileTree[0]).toEqual(newFile);
  });

  it('should update file content and mark as modified', () => {
    const initialTree: FileNode[] = [
      {
        name: 'test.js',
        type: 'file',
        path: '/test.js',
        content: 'initial content'
      }
    ];

    setFileTree(initialTree);
    updateFileContent('/test.js', 'updated content');
    
    const state = filesStore.get();
    expect(state.fileTree[0].content).toBe('updated content');
    expect(state.modifiedFiles.has('/test.js')).toBe(true);
    expect(state.unsavedChanges).toBe(true);
  });

  it('should set selected file', () => {
    const filePath = '/src/index.ts';
    
    setSelectedFile(filePath);
    expect(filesStore.get().selectedFile).toBe(filePath);
    
    setSelectedFile(null);
    expect(filesStore.get().selectedFile).toBe(null);
  });

  it('should toggle folder expansion', () => {
    const initialTree: FileNode[] = [
      {
        name: 'src',
        type: 'folder',
        path: '/src',
        isExpanded: false,
        children: [
          {
            name: 'index.ts',
            type: 'file',
            path: '/src/index.ts'
          }
        ]
      }
    ];

    setFileTree(initialTree);
    expect(filesStore.get().fileTree[0].isExpanded).toBe(false);

    toggleFolder('/src');
    expect(filesStore.get().fileTree[0].isExpanded).toBe(true);

    toggleFolder('/src');
    expect(filesStore.get().fileTree[0].isExpanded).toBe(false);
  });

  it('should mark file as saved and update unsaved changes', () => {
    // First, create a modified file
    const initialTree: FileNode[] = [
      {
        name: 'test1.js',
        type: 'file',
        path: '/test1.js',
        content: 'content1'
      },
      {
        name: 'test2.js',
        type: 'file',
        path: '/test2.js',
        content: 'content2'
      }
    ];

    setFileTree(initialTree);
    updateFileContent('/test1.js', 'modified content1');
    updateFileContent('/test2.js', 'modified content2');
    
    let state = filesStore.get();
    expect(state.modifiedFiles.size).toBe(2);
    expect(state.unsavedChanges).toBe(true);
    
    // Mark one file as saved
    markFileSaved('/test1.js');
    
    state = filesStore.get();
    expect(state.modifiedFiles.has('/test1.js')).toBe(false);
    expect(state.modifiedFiles.has('/test2.js')).toBe(true);
    expect(state.unsavedChanges).toBe(true); // Still has unsaved changes
    
    // Mark the last file as saved
    markFileSaved('/test2.js');
    
    state = filesStore.get();
    expect(state.modifiedFiles.size).toBe(0);
    expect(state.unsavedChanges).toBe(false); // No more unsaved changes
  });

  it('should update nested file content correctly', () => {
    const nestedTree: FileNode[] = [
      {
        name: 'src',
        type: 'folder',
        path: '/src',
        children: [
          {
            name: 'components',
            type: 'folder',
            path: '/src/components',
            children: [
              {
                name: 'Button.tsx',
                type: 'file',
                path: '/src/components/Button.tsx',
                content: 'initial button content'
              }
            ]
          }
        ]
      }
    ];

    setFileTree(nestedTree);
    updateFileContent('/src/components/Button.tsx', 'updated button content');
    
    const state = filesStore.get();
    const buttonFile = state.fileTree[0].children![0].children![0];
    expect(buttonFile.content).toBe('updated button content');
    expect(state.modifiedFiles.has('/src/components/Button.tsx')).toBe(true);
  });
});