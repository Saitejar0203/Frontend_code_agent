// frontend/src/lib/runtime/StreamingMessageParser.integration.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StreamingMessageParser, ParserCallbacks } from './StreamingMessageParser';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock ReadableStream for simulating backend responses
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

// Helper function to simulate backend streaming response
async function simulateBackendResponse(chunks: string[], callbacks: ParserCallbacks) {
  const parser = new StreamingMessageParser(callbacks);
  const messageId = 'test-message-' + Date.now();
  
  let accumulatedContent = '';
  
  // Simulate streaming chunks
  for (const chunk of chunks) {
    // Simulate async streaming with small delay
    await new Promise(resolve => setTimeout(resolve, 1));
    accumulatedContent += chunk;
    parser.parse(messageId, accumulatedContent);
  }
  
  return messageId;
}

// Helper function to simulate SSE format backend response
async function simulateSSEBackendResponse(sseChunks: string[], callbacks: ParserCallbacks) {
  const parser = new StreamingMessageParser(callbacks);
  const messageId = 'test-sse-message-' + Date.now();
  
  let accumulatedContent = '';
  
  for (const sseChunk of sseChunks) {
    // Parse SSE format: "data: {content}\n"
    const lines = sseChunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6); // Remove "data: " prefix
        if (data === '[DONE]') {
          break;
        }
        
        try {
          // Try to parse as JSON first
          const parsed = JSON.parse(data);
          if (parsed.chunk) {
            accumulatedContent += parsed.chunk;
          } else if (parsed.content) {
            accumulatedContent += parsed.content;
          }
        } catch {
          // If not JSON, treat as raw text
          accumulatedContent += data;
        }
      }
    }
    
    // Parse accumulated content
    parser.parse(messageId, accumulatedContent);
  }
  
  return messageId;
}

describe('StreamingMessageParser Integration Tests', () => {
  let callbacks: ParserCallbacks;

  beforeEach(() => {
    callbacks = {
      onText: vi.fn(),
      onArtifactOpen: vi.fn(),
      onArtifactClose: vi.fn(),
      onActionOpen: vi.fn(),
      onActionClose: vi.fn(),
      onImageGenerationRequest: vi.fn(),
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Phase 2: Integration Test Suite', () => {
    describe('Simple Text Responses', () => {
      it('should handle "Hello world" response', async () => {
        const chunks = ['Hello world'];
        
        await simulateBackendResponse(chunks, callbacks);
        
        expect(callbacks.onText).toHaveBeenCalledWith('Hello world');
        expect(callbacks.onArtifactOpen).not.toHaveBeenCalled();
        expect(callbacks.onActionOpen).not.toHaveBeenCalled();
      });

      it('should handle streaming text chunks', async () => {
        const chunks = ['Hello ', 'world', '! How are you?'];
        
        await simulateBackendResponse(chunks, callbacks);
        
        // Parser calls onText for each meaningful text segment
        expect(callbacks.onText).toHaveBeenCalledWith('Hello');
        expect(callbacks.onText).toHaveBeenCalledWith('world');
        expect(callbacks.onText).toHaveBeenCalledWith('! How are you?');
      });
    });

    describe('File Creation Responses', () => {
      it('should handle React component creation', async () => {
        const chunks = [
          'I\'ll create a React component for you.\n\n',
          '<boltArtifact id="react-component" title="React Component">\n',
          '<boltAction type="file" filePath="components/Button.tsx">',
          'import React from \'react\';\n\n',
          'const Button = ({ children, onClick }) => {\n',
          '  return (\n',
          '    <button onClick={onClick} className="btn">\n',
          '      {children}\n',
          '    </button>\n',
          '  );\n',
          '};\n\n',
          'export default Button;',
          '</boltAction>\n',
          '</boltArtifact>\n\n',
          'Component created successfully!'
        ];
        
        await simulateBackendResponse(chunks, callbacks);
        
        // Verify text before artifact
        expect(callbacks.onText).toHaveBeenCalledWith('I\'ll create a React component for you.');
        
        // Verify artifact lifecycle
        expect(callbacks.onArtifactOpen).toHaveBeenCalledWith(expect.objectContaining({
          messageId: expect.any(String),
          id: 'react-component',
          title: 'React Component'
        }));
        
        // Verify action lifecycle
        expect(callbacks.onActionOpen).toHaveBeenCalledWith(expect.objectContaining({
          messageId: expect.any(String),
          type: 'file',
          filePath: 'components/Button.tsx'
        }));
        
        expect(callbacks.onActionClose).toHaveBeenCalledWith(expect.objectContaining({
          messageId: expect.any(String),
          type: 'file',
          filePath: 'components/Button.tsx',
          content: expect.stringContaining('const Button')
        }));
        
        expect(callbacks.onArtifactClose).toHaveBeenCalledWith(expect.objectContaining({
          messageId: expect.any(String),
          id: 'react-component'
        }));
        
        // Verify text after artifact
        expect(callbacks.onText).toHaveBeenCalledWith('Component created successfully!');
      });
    });

    describe('Shell Command Responses', () => {
      it('should handle dependency installation', async () => {
        const chunks = [
          'Installing dependencies...\n\n',
          '<boltAction type="shell" filePath="">npm install react react-dom</boltAction>\n\n',
          'Dependencies installed successfully!'
        ];
        
        await simulateBackendResponse(chunks, callbacks);
        
        expect(callbacks.onText).toHaveBeenCalledWith('Installing dependencies...');
        
        expect(callbacks.onActionOpen).toHaveBeenCalledWith(expect.objectContaining({
          messageId: expect.any(String),
          type: 'shell'
        }));
        
        expect(callbacks.onActionClose).toHaveBeenCalledWith(expect.objectContaining({
          messageId: expect.any(String),
          type: 'shell',
          content: 'npm install react react-dom'
        }));
        
        expect(callbacks.onText).toHaveBeenCalledWith('Dependencies installed successfully!');
      });
    });

    describe('Mixed Content Responses', () => {
      it('should handle complex responses with multiple artifacts and actions', async () => {
        const chunks = [
          'I\'ll create a complete React project for you.\n\n',
          '<boltArtifact id="react-project" title="React Project Setup">\n',
          'First, let me create the package.json:\n\n',
          '<boltAction type="file" filePath="package.json">',
          '{\n  "name": "my-react-app",\n  "version": "1.0.0"\n}',
          '</boltAction>\n\n',
          'Now installing dependencies:\n\n',
          '<boltAction type="shell" filePath="">npm install</boltAction>\n\n',
          'Creating the main component:\n\n',
          '<boltAction type="file" filePath="src/App.tsx">',
          'import React from \'react\';\n\nfunction App() {\n  return <h1>Hello World!</h1>;\n}\n\nexport default App;',
          '</boltAction>\n',
          '</boltArtifact>\n\n',
          'Project setup complete!'
        ];
        
        await simulateBackendResponse(chunks, callbacks);
        
        // Verify initial text
        expect(callbacks.onText).toHaveBeenCalledWith('I\'ll create a complete React project for you.');
        
        // Verify artifact opened
        expect(callbacks.onArtifactOpen).toHaveBeenCalledWith(expect.objectContaining({
          messageId: expect.any(String),
          id: 'react-project',
          title: 'React Project Setup'
        }));
        
        // Verify text within artifact
        expect(callbacks.onText).toHaveBeenCalledWith('First, let me create the package.json:');
        expect(callbacks.onText).toHaveBeenCalledWith('Now installing dependencies:');
        expect(callbacks.onText).toHaveBeenCalledWith('Creating the main component:');
        
        // Verify multiple actions
        expect(callbacks.onActionOpen).toHaveBeenCalledTimes(3);
        expect(callbacks.onActionClose).toHaveBeenCalledTimes(3);
        
        // Verify specific actions
        expect(callbacks.onActionOpen).toHaveBeenCalledWith(expect.objectContaining({
          messageId: expect.any(String),
          type: 'file',
          filePath: 'package.json'
        }));
        
        expect(callbacks.onActionOpen).toHaveBeenCalledWith(expect.objectContaining({
          messageId: expect.any(String),
          type: 'shell'
        }));
        
        expect(callbacks.onActionOpen).toHaveBeenCalledWith(expect.objectContaining({
          messageId: expect.any(String),
          type: 'file',
          filePath: 'src/App.tsx'
        }));
        
        // Verify artifact closed
        expect(callbacks.onArtifactClose).toHaveBeenCalledWith(expect.objectContaining({
          messageId: expect.any(String),
          id: 'react-project'
        }));
        
        // Verify final text
        expect(callbacks.onText).toHaveBeenCalledWith('Project setup complete!');
      });
    });

    describe('SSE Format Backend Responses', () => {
      it('should handle Server-Sent Events format', async () => {
        const sseChunks = [
          'data: {"chunk": "Hello from SSE "}\n',
          'data: {"chunk": "<boltAction type=\"file\" filePath=\"test.js\">console.log(\'test\');</boltAction>"}\n',
          'data: {"chunk": " Done!"}\n',
          'data: [DONE]\n'
        ];
        
        await simulateSSEBackendResponse(sseChunks, callbacks);
        
        expect(callbacks.onText).toHaveBeenCalledWith('Hello from SSE');
        expect(callbacks.onActionOpen).toHaveBeenCalledWith(expect.objectContaining({
          messageId: expect.any(String),
          type: 'file',
          filePath: 'test.js'
        }));
        expect(callbacks.onActionClose).toHaveBeenCalledWith(expect.objectContaining({
          messageId: expect.any(String),
          type: 'file',
          filePath: 'test.js',
          content: 'console.log(\'test\');'
        }));
        expect(callbacks.onText).toHaveBeenCalledWith('Done!');
      });

      it('should handle raw text in SSE format', async () => {
        const sseChunks = [
          'data: Raw text content\n',
          'data: [DONE]\n'
        ];
        
        await simulateSSEBackendResponse(sseChunks, callbacks);
        
        expect(callbacks.onText).toHaveBeenCalledWith('Raw text content');
      });
    });

    describe('Error Handling and Edge Cases', () => {
      it('should handle incomplete tags gracefully', async () => {
        const chunks = [
          'Starting response ',
          '<boltAction type="file" filePath="test.js">incomplete content'
          // Note: no closing tag
        ];
        
        await simulateBackendResponse(chunks, callbacks);
        
        expect(callbacks.onText).toHaveBeenCalledWith('Starting response');
        // Parser should not call onActionOpen for incomplete tags (missing closing >)
        expect(callbacks.onActionOpen).not.toHaveBeenCalled();
        // onActionClose should not be called for incomplete tags
        expect(callbacks.onActionClose).not.toHaveBeenCalled();
      });

      it('should handle malformed attributes', async () => {
        const chunks = [
          '<boltAction type="file">content without filePath</boltAction>'
        ];
        
        await simulateBackendResponse(chunks, callbacks);
        
        expect(callbacks.onActionOpen).toHaveBeenCalledWith(expect.objectContaining({
          messageId: expect.any(String),
          type: 'file'
        }));
      });

      it('should handle nested quotes in attributes', async () => {
        const chunks = [
          '<boltAction type="file" filePath=\'src/components/"MyComponent".tsx\'>content</boltAction>'
        ];
        
        await simulateBackendResponse(chunks, callbacks);
        
        expect(callbacks.onActionOpen).toHaveBeenCalledWith(expect.objectContaining({
          messageId: expect.any(String),
          type: 'file',
          filePath: 'src/components/"MyComponent".tsx'
        }));
      });
    });

    describe('Image Generation Responses', () => {
      it('should handle JSON-based image generation requests', async () => {
        const chunks = [
          'I\'ll create some images for your project.\n\n',
          '<boltImageTask>\n',
          '{\n',
          '  "images": [\n',
          '    {\n',
          '      "path": "/public/logo.png",\n',
          '      "description": "A modern, minimalist logo with blue and white colors"\n',
          '    },\n',
          '    {\n',
          '      "path": "/public/hero-bg.jpg",\n',
          '      "description": "A stunning landscape photograph at sunset"\n',
          '    }\n',
          '  ]\n',
          '}\n',
          '</boltImageTask>\n\n',
          'Images will be generated shortly!'
        ];
        
        await simulateBackendResponse(chunks, callbacks);
        
        expect(callbacks.onText).toHaveBeenCalledWith('I\'ll create some images for your project.');
        
        expect(callbacks.onImageGenerationRequest).toHaveBeenCalledWith([
          {
            localPath: '/public/logo.png',
            description: 'A modern, minimalist logo with blue and white colors'
          },
          {
            localPath: '/public/hero-bg.jpg',
            description: 'A stunning landscape photograph at sunset'
          }
        ]);
        
        expect(callbacks.onText).toHaveBeenCalledWith('Images will be generated shortly!');
      });

      it('should handle image generation with quotes in descriptions', async () => {
        const chunks = [
          '<boltImageTask>\n',
          '{\n',
          '  "images": [\n',
          '    {\n',
          '      "path": "/public/quote-test.jpg",\n',
          '      "description": "A photo with \\"quotes\\" and \'apostrophes\' in the description"\n',
          '    }\n',
          '  ]\n',
          '}\n',
          '</boltImageTask>'
        ];
        
        await simulateBackendResponse(chunks, callbacks);
        
        expect(callbacks.onImageGenerationRequest).toHaveBeenCalledWith([
          {
            localPath: '/public/quote-test.jpg',
            description: 'A photo with "quotes" and \'apostrophes\' in the description'
          }
        ]);
      });

      it('should handle malformed JSON gracefully', async () => {
        const chunks = [
          '<boltImageTask>\n',
          '{\n',
          '  "images": [\n',
          '    {\n',
          '      "path": "/public/test.jpg"\n',
          '      // missing comma and description\n',
          '    }\n',
          '  ]\n',
          '}\n',
          '</boltImageTask>'
        ];
        
        await simulateBackendResponse(chunks, callbacks);
        
        // Should not call onImageGenerationRequest for malformed JSON
        expect(callbacks.onImageGenerationRequest).not.toHaveBeenCalled();
      });
    });
  });
});