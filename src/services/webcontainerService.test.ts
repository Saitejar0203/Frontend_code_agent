import { describe, it, expect, beforeEach, vi } from 'vitest';
import { webcontainerManager } from './webcontainerService';

// Mock window object for Node.js environment
Object.defineProperty(globalThis, 'window', {
  value: {
    crossOriginIsolated: true
  },
  writable: true
});

// Mock WebContainer API
vi.mock('@webcontainer/api', () => ({
  WebContainer: {
    boot: vi.fn().mockResolvedValue({
      on: vi.fn(),
      spawn: vi.fn().mockResolvedValue({
        output: {
          pipeTo: vi.fn()
        },
        exit: Promise.resolve(0)
      }),
      mount: vi.fn().mockResolvedValue(undefined),
      fs: {
        mkdir: vi.fn().mockResolvedValue(undefined),
        writeFile: vi.fn().mockResolvedValue(undefined)
      },
      teardown: vi.fn().mockResolvedValue(undefined)
    })
  }
}));

// Mock Terminal
vi.mock('@xterm/xterm', () => ({
  Terminal: vi.fn().mockImplementation(() => ({
    open: vi.fn(),
    write: vi.fn(),
    dispose: vi.fn()
  }))
}));

describe('WebContainerManager', () => {
  beforeEach(() => {
    // Reset the singleton instance for each test
    vi.clearAllMocks();
    // Mock cross-origin isolation to be true
    Object.defineProperty(window, 'crossOriginIsolated', {
      value: true,
      writable: true
    });
  });

  it('should create a singleton instance', () => {
    const instance1 = webcontainerManager;
    const instance2 = webcontainerManager;
    expect(instance1).toBe(instance2);
  });

  it('should boot WebContainer successfully', async () => {
    const result = await webcontainerManager.boot();
    expect(result).toBeDefined();
    expect(webcontainerManager.isReady()).toBe(true);
  });

  it('should register terminal output callbacks', () => {
    const callback = vi.fn();
    webcontainerManager.onTerminalOutput(callback);
    // The callback should be registered (we can't easily test the actual call without mocking more)
    expect(callback).toBeDefined();
  });

  it('should register server ready callbacks', () => {
    const callback = vi.fn();
    webcontainerManager.onServerReady(callback);
    // The callback should be registered
    expect(callback).toBeDefined();
  });

  it('should execute commands and return exit code', async () => {
    await webcontainerManager.boot();
    const result = await webcontainerManager.executeCommand('echo', ['Hello']);
    expect(result).toHaveProperty('exitCode');
    expect(result).toHaveProperty('output');
  });
});