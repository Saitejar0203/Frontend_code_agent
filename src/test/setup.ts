import { vi } from 'vitest';

// Mock window object for testing environment
Object.defineProperty(globalThis, 'window', {
  value: {
    crossOriginIsolated: true,
    location: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000'
    }
  },
  writable: true
});

// Mock WebContainer API for tests
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