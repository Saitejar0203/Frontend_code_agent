// frontend/src/services/codeAgentService.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { streamAgentResponse, generateStructuredProject, GeminiParserCallbacks } from './codeAgentService';
import { ParserCallbacks } from '@/lib/runtime/StreamingMessageParser';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock ReadableStream
class MockReadableStream {
  private chunks: Uint8Array[];
  private currentIndex = 0;

  constructor(chunks: string[]) {
    this.chunks = chunks.map(chunk => new TextEncoder().encode(chunk));
  }

  getReader() {
    return {
      read: async () => {
        if (this.currentIndex >= this.chunks.length) {
          return { done: true, value: undefined };
        }
        const value = this.chunks[this.currentIndex];
        this.currentIndex++;
        return { done: false, value };
      }
    };
  }
}

describe('codeAgentService', () => {
  let callbacks: GeminiParserCallbacks;

  beforeEach(() => {
    callbacks = {
      onText: vi.fn(),
      onFile: vi.fn(),
      onCommand: vi.fn(),
      onArtifactStart: vi.fn(),
      onArtifactEnd: vi.fn(),
      onError: vi.fn(),
      onComplete: vi.fn(),
    };
    vi.clearAllMocks();
    // Ensure environment variable is set for tests
    if (!import.meta.env.VITE_API_BASE_URL) {
      import.meta.env.VITE_API_BASE_URL = 'http://localhost:8002';
    }
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('streamAgentResponse', () => {
    it('should handle successful streaming response', async () => {
      const mockChunks = [
        'Hello world! ',
        '<boltAction type="file" filePath="test.js">console.log("test");</boltAction>',
        ' Done!'
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: new MockReadableStream(mockChunks),
      });

      await streamAgentResponse('Create a test file', callbacks);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8002/api/v1/chat',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify({
            message: 'Create a test file',
            conversation_history: [],
            stream: true,
          }),
        })
      );

      expect(callbacks.onText).toHaveBeenCalledWith('Hello world!');
      expect(callbacks.onFile).toHaveBeenCalledWith('test.js', 'console.log("test");');
      expect(callbacks.onText).toHaveBeenCalledWith('Done!');
    });

    it('should handle Server-Sent Events format', async () => {
      const mockChunks = [
        'data: {"content": "Hello from SSE"}\n',
        'data: [DONE]\n'
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: new MockReadableStream(mockChunks),
      });

      await streamAgentResponse('Test SSE', callbacks);

      expect(callbacks.onText).toHaveBeenCalledWith('Hello from SSE');
    });

    it('should handle raw text in SSE format', async () => {
      const mockChunks = [
        'data: Raw text content\n',
        'data: [DONE]\n'
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: new MockReadableStream(mockChunks),
      });

      await streamAgentResponse('Test raw SSE', callbacks);

      expect(callbacks.onText).toHaveBeenCalledWith('Raw text content');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await streamAgentResponse('Test error', callbacks);

      expect(callbacks.onError).toHaveBeenCalledWith('HTTP error! status: 500');
    });

    it('should handle null response body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: null,
      });

      await streamAgentResponse('Test null body', callbacks);

      expect(callbacks.onError).toHaveBeenCalledWith('Response body is null');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await streamAgentResponse('Test network error', callbacks);

      expect(callbacks.onError).toHaveBeenCalledWith('Network error');
    });

    it('should use custom API base URL from environment', async () => {
      const originalEnv = import.meta.env.VITE_API_BASE_URL;
      import.meta.env.VITE_API_BASE_URL = 'http://custom-api:3000';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: new MockReadableStream(['test']),
      });

      await streamAgentResponse('Test custom URL', callbacks);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8002/api/v1/chat',
        expect.any(Object)
      );

      // Restore original env
      import.meta.env.VITE_API_BASE_URL = originalEnv;
    });
  });

  describe('generateStructuredProject', () => {
    it('should handle structured response with files', async () => {
      // Mock environment variable
      const originalEnv = import.meta.env.VITE_API_BASE_URL;
      import.meta.env.VITE_API_BASE_URL = 'http://localhost:8002';
      
      const mockChunks = [
        'data: {"type": "status", "message": "Starting project generation"}\n',
        'data: {"type": "files", "files": [{"path": "package.json", "content": "{\\"name\\": \\"test\\"}"}]}\n',
        'data: {"type": "commands", "commands": ["npm install"]}\n',
        'data: [DONE]\n'
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: new MockReadableStream(mockChunks),
      });

      await generateStructuredProject('Create a project', callbacks);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8002/api/v1/chat',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify({
            message: 'Create a project',
            conversation_history: [],
            stream: true,
          }),
        })
      );

      expect(callbacks.onText).toHaveBeenCalledWith('Starting project generation');
      expect(callbacks.onFile).toHaveBeenCalledWith('package.json', '{"name": "test"}');
      expect(callbacks.onCommand).toHaveBeenCalledWith('npm install');
      
      // Restore original env
      import.meta.env.VITE_API_BASE_URL = originalEnv;
    });

    it('should handle text type responses', async () => {
      const mockChunks = [
        'data: {"type": "text", "content": "Processing request"}\n',
        'data: {"type": "text", "message": "Alternative message format"}\n',
        'data: [DONE]\n'
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: new MockReadableStream(mockChunks),
      });

      await generateStructuredProject('Test text responses', callbacks);

      expect(callbacks.onText).toHaveBeenCalledWith('Processing request');
      expect(callbacks.onText).toHaveBeenCalledWith('Alternative message format');
    });

    it('should handle malformed JSON gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const mockChunks = [
        'data: {invalid json}\n',
        'data: {"type": "text", "content": "Valid content"}\n',
        'data: [DONE]\n'
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: new MockReadableStream(mockChunks),
      });

      await generateStructuredProject('Test malformed JSON', callbacks);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse structured response:', '{invalid json}');
      expect(callbacks.onText).toHaveBeenCalledWith('Valid content');
      
      consoleSpy.mockRestore();
    });

    it('should handle unknown response types', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const mockChunks = [
        'data: {"type": "unknown", "data": "some data"}\n',
        'data: [DONE]\n'
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: new MockReadableStream(mockChunks),
      });

      await generateStructuredProject('Test unknown type', callbacks);

      expect(consoleSpy).toHaveBeenCalledWith('Unknown structured response type:', 'unknown');
      
      consoleSpy.mockRestore();
    });
  });
});