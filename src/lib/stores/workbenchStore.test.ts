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
  clearRunningCommands
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
});