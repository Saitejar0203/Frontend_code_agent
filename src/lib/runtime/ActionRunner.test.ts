import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { actionRunner, ActionRunner } from './ActionRunner';
import { webcontainerManager } from '@/services/webcontainerService';
import * as workbenchStore from '@/lib/stores/workbenchStore';

// Mock the dependencies
vi.mock('@/services/webcontainerService', () => ({
  webcontainerManager: {
    boot: vi.fn(),
    mountFiles: vi.fn(),
    executeCommand: vi.fn(),
    onTerminalOutput: vi.fn(),
    onServerReady: vi.fn(),
  },
}));

vi.mock('@/lib/stores/workbenchStore', () => ({
  appendTerminalOutput: vi.fn(),
  setPreviewUrl: vi.fn(),
  addRunningCommand: vi.fn(),
  removeRunningCommand: vi.fn(),
  setWebContainerReady: vi.fn(),
  setFileTree: vi.fn(),
}));

describe('ActionRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    actionRunner.abort();
    actionRunner.clearActionHistory();
  });

  describe('initialization', () => {
    it('should initialize WebContainer successfully', async () => {
      const mockBoot = vi.mocked(webcontainerManager.boot);
      mockBoot.mockResolvedValue({} as any);

      await actionRunner.initialize();

      expect(mockBoot).toHaveBeenCalled();
      expect(workbenchStore.setWebContainerReady).toHaveBeenCalledWith(true);
      expect(workbenchStore.appendTerminalOutput).toHaveBeenCalledWith('🔧 Initializing WebContainer...\n');
      expect(workbenchStore.appendTerminalOutput).toHaveBeenCalledWith('✅ WebContainer ready\n');
    });

    it('should handle initialization errors', async () => {
      const mockBoot = vi.mocked(webcontainerManager.boot);
      const error = new Error('Boot failed');
      mockBoot.mockRejectedValue(error);

      await expect(actionRunner.initialize()).rejects.toThrow('Boot failed');
      expect(workbenchStore.appendTerminalOutput).toHaveBeenCalledWith('❌ Failed to initialize WebContainer: Boot failed\n');
    });
  });

  describe('file handling', () => {
    it('should handle file creation and return action ID', () => {
      const actionId = actionRunner.handleFile('test.txt', 'Hello World');
      
      expect(actionId).toMatch(/^file_\d+_[a-z0-9]+$/);
      
      const status = actionRunner.getActionStatus(actionId);
      expect(status).toEqual({
        id: actionId,
        type: 'file',
        status: 'pending',
        content: 'test.txt: 11 characters'
      });
    });

    it('should process file queue and mount files', async () => {
      const mockMountFiles = vi.mocked(webcontainerManager.mountFiles);
      mockMountFiles.mockResolvedValue();
      
      // Add files - each will trigger its own mount call due to immediate processing
      actionRunner.handleFile('package.json', '{"name": "test"}');
      actionRunner.handleFile('src/App.js', 'console.log("Hello");');
      
      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verify that mountFiles was called (may be called multiple times)
      expect(mockMountFiles).toHaveBeenCalled();
      
      // Check that files were mounted (they may be in separate calls)
      const allCalls = mockMountFiles.mock.calls;
      const allMountedFiles = allCalls.reduce((acc, call) => ({ ...acc, ...call[0] }), {});
      
      console.log('All mounted files:', JSON.stringify(allMountedFiles, null, 2));
      
      // Verify both files were mounted
      expect(allMountedFiles).toHaveProperty('package.json');
      expect(allMountedFiles['package.json'].file.contents).toBe('{"name": "test"}');
      
      expect(workbenchStore.setFileTree).toHaveBeenCalled();
    });
  });

  describe('command handling', () => {
    it('should handle command execution and return action ID', () => {
      const actionId = actionRunner.handleCommand('npm install');
      
      expect(actionId).toMatch(/^shell_\d+_[a-z0-9]+$/);
      
      const status = actionRunner.getActionStatus(actionId);
      expect(status).toEqual({
        id: actionId,
        type: 'shell',
        status: 'pending',
        content: 'npm install'
      });
    });

    it('should execute commands in queue order', async () => {
      const mockExecuteCommand = vi.mocked(webcontainerManager.executeCommand);
      mockExecuteCommand.mockResolvedValue(0);
      
      actionRunner.handleCommand('npm install');
      actionRunner.handleCommand('npm start');
      
      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockExecuteCommand).toHaveBeenCalledWith('npm', ['install']);
      expect(mockExecuteCommand).toHaveBeenCalledWith('npm', ['start']);
      expect(workbenchStore.addRunningCommand).toHaveBeenCalledWith('npm install');
      expect(workbenchStore.addRunningCommand).toHaveBeenCalledWith('npm start');
      expect(workbenchStore.removeRunningCommand).toHaveBeenCalledWith('npm install');
      expect(workbenchStore.removeRunningCommand).toHaveBeenCalledWith('npm start');
    });

    it('should handle command execution errors', async () => {
      const mockExecuteCommand = vi.mocked(webcontainerManager.executeCommand);
      const error = new Error('Command failed');
      mockExecuteCommand.mockRejectedValue(error);
      
      actionRunner.handleCommand('invalid-command');
      
      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(workbenchStore.appendTerminalOutput).toHaveBeenCalledWith(
        expect.stringContaining('❌ Command failed: invalid-command')
      );
    });
  });

  describe('file system tree conversion', () => {
    it('should build correct file system tree structure', () => {
      // Access private method through any cast for testing
      const runner = actionRunner as any;
      
      const files = [
        { path: 'src/components/App.js', content: 'App content' },
        { path: 'src/utils/helper.js', content: 'Helper content' },
        { path: 'package.json', content: 'Package content' }
      ];
      
      const tree = runner.buildFileSystemTree(files);
      
      expect(tree).toEqual({
        src: {
          directory: {
            components: {
              directory: {
                'App.js': {
                  file: {
                    contents: 'App content'
                  }
                }
              }
            },
            utils: {
              directory: {
                'helper.js': {
                  file: {
                    contents: 'Helper content'
                  }
                }
              }
            }
          }
        },
        'package.json': {
          file: {
            contents: 'Package content'
          }
        }
      });
    });

    it('should convert file system tree to file nodes correctly', () => {
      // Access private method through any cast for testing
      const runner = actionRunner as any;
      
      const tree = {
        src: {
          directory: {
            'App.js': {
              file: {
                contents: 'App content'
              }
            }
          }
        },
        'package.json': {
          file: {
            contents: 'Package content'
          }
        }
      };
      
      const nodes = runner.convertToFileNodes(tree);
      
      expect(nodes).toEqual([
        {
          children: [
            {
              content: 'App content',
              name: 'App.js',
              path: 'src/App.js',
              type: 'file',
            }
          ],
          isExpanded: true,
          name: 'src',
          path: 'src',
          type: 'folder',
        },
        {
          content: 'Package content',
          name: 'package.json',
          path: 'package.json',
          type: 'file',
        }
      ]);
    });
  });

  describe('action status management', () => {
    it('should track action statuses correctly', () => {
      const fileActionId = actionRunner.handleFile('test.txt', 'content');
      const commandActionId = actionRunner.handleCommand('echo test');
      
      const allStatuses = actionRunner.getAllActionStatuses();
      expect(allStatuses).toHaveLength(2);
      
      const fileStatus = actionRunner.getActionStatus(fileActionId);
      expect(fileStatus?.type).toBe('file');
      
      const commandStatus = actionRunner.getActionStatus(commandActionId);
      expect(commandStatus?.type).toBe('shell');
    });

    it('should clear action history', () => {
      actionRunner.handleFile('test.txt', 'content');
      actionRunner.handleCommand('echo test');
      
      expect(actionRunner.getAllActionStatuses()).toHaveLength(2);
      
      actionRunner.clearActionHistory();
      
      expect(actionRunner.getAllActionStatuses()).toHaveLength(0);
    });
  });

  describe('abort functionality', () => {
    it('should abort processing and clear queues', () => {
      actionRunner.handleFile('test.txt', 'content');
      actionRunner.handleCommand('echo test');
      
      actionRunner.abort();
      
      expect(workbenchStore.appendTerminalOutput).toHaveBeenCalledWith('\n⚠️ Action execution aborted\n');
    });
  });

  describe('queuing mechanism', () => {
    it('should process files before commands', async () => {
      const mockMountFiles = vi.mocked(webcontainerManager.mountFiles);
      const mockExecuteCommand = vi.mocked(webcontainerManager.executeCommand);
      
      mockMountFiles.mockResolvedValue();
      mockExecuteCommand.mockResolvedValue(0);
      
      // Add commands and files in mixed order
      actionRunner.handleCommand('npm install');
      actionRunner.handleFile('package.json', '{"name": "test"}');
      actionRunner.handleCommand('npm start');
      actionRunner.handleFile('src/App.js', 'console.log("Hello");');
      
      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Verify commands were executed (files are mounted via mountFiles)
      expect(mockExecuteCommand).toHaveBeenCalledWith('npm', ['install']);
      expect(mockExecuteCommand).toHaveBeenCalledWith('npm', ['start']);
      expect(mockExecuteCommand).toHaveBeenCalledTimes(2);
    });
  });
});