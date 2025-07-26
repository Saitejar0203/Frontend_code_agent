// frontend/src/lib/runtime/StreamingMessageParser.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StreamingMessageParser, ParserCallbacks } from './StreamingMessageParser';

describe('StreamingMessageParser', () => {
  let parser: StreamingMessageParser;
  let callbacks: ParserCallbacks;

  beforeEach(() => {
    callbacks = {
      onArtifactOpen: vi.fn(),
      onArtifactClose: vi.fn(),
      onActionOpen: vi.fn(),
      onActionClose: vi.fn(),
      onText: vi.fn(),
      onFile: vi.fn(),
      onCommand: vi.fn(),
      onError: vi.fn(),
      onComplete: vi.fn(),
    };
    parser = new StreamingMessageParser(callbacks);
  });

  it('should parse simple text without tags', () => {
    const content = 'Hello world! This is plain text.';
    parser.parse('test_1', content);
    
    expect(callbacks.onText).toHaveBeenCalledWith('Hello world! This is plain text.');
    expect(callbacks.onFile).not.toHaveBeenCalled();
    expect(callbacks.onCommand).not.toHaveBeenCalled();
  });

  it('should parse file action correctly', () => {
    const content = 'Some text <boltAction type="file" filePath="a.js">console.log("Hello");</boltAction> more text';
    parser.parse('test_1', content);
    
    expect(callbacks.onText).toHaveBeenCalledWith('Some text');
    expect(callbacks.onActionOpen).toHaveBeenCalledWith(expect.objectContaining({
      type: 'file',
      filePath: 'a.js'
    }));
    expect(callbacks.onActionClose).toHaveBeenCalledWith(expect.objectContaining({
      type: 'file',
      content: 'console.log("Hello");'
    }));
    expect(callbacks.onText).toHaveBeenCalledWith('more text');
  });

  it('should parse shell command correctly', () => {
    const content = 'Installing dependencies <boltAction type="shell">npm install</boltAction> Done!';
    parser.parse('test_1', content);
    
    expect(callbacks.onText).toHaveBeenCalledWith('Installing dependencies');
    expect(callbacks.onActionOpen).toHaveBeenCalledWith(expect.objectContaining({
      type: 'shell'
    }));
    expect(callbacks.onActionClose).toHaveBeenCalledWith(expect.objectContaining({
      type: 'shell',
      content: 'npm install'
    }));
    expect(callbacks.onText).toHaveBeenCalledWith('Done!');
  });

  it('should parse multiple actions in sequence', () => {
    const content = 'Some text <boltAction type="file" filePath="a.js">content</boltAction> <boltAction type="shell">npm i</boltAction>';
    parser.parse('test_1', content);
    
    expect(callbacks.onText).toHaveBeenCalledWith('Some text');
    expect(callbacks.onActionClose).toHaveBeenCalledWith(expect.objectContaining({
      type: 'file',
      filePath: 'a.js',
      content: 'content'
    }));
    expect(callbacks.onActionClose).toHaveBeenCalledWith(expect.objectContaining({
      type: 'shell',
      content: 'npm i'
    }));
  });

  it('should parse artifact with nested actions', () => {
    const content = `<boltArtifact id="test-app" title="Test Application">
Creating files:
<boltAction type="file" filePath="package.json">{"name": "test"}</boltAction>
<boltAction type="shell">npm install</boltAction>
</boltArtifact>`;
    
    parser.parse('test_1', content);
    
    expect(callbacks.onArtifactOpen).toHaveBeenCalledWith(expect.objectContaining({
      id: 'test-app',
      title: 'Test Application'
    }));
    expect(callbacks.onText).toHaveBeenCalledWith('Creating files:');
    expect(callbacks.onActionOpen).toHaveBeenCalledWith(expect.objectContaining({
      type: 'file',
      filePath: 'package.json'
    }));
    expect(callbacks.onActionClose).toHaveBeenCalledWith(expect.objectContaining({
      type: 'file',
      content: '{"name": "test"}'
    }));
    expect(callbacks.onActionOpen).toHaveBeenCalledWith(expect.objectContaining({
      type: 'shell'
    }));
    expect(callbacks.onActionClose).toHaveBeenCalledWith(expect.objectContaining({
      type: 'shell',
      content: 'npm install'
    }));
    expect(callbacks.onArtifactClose).toHaveBeenCalledWith(expect.objectContaining({
      id: 'test-app'
    }));
  });

  it('should handle complex content with mixed text and actions', () => {
    const content = `I'll create a React app for you.

<boltArtifact id="react-app" title="React Application">
First, let me create the package.json:
<boltAction type="file" filePath="package.json">{
  "name": "my-app",
  "version": "1.0.0"
}</boltAction>

Now installing dependencies:
<boltAction type="shell">npm install</boltAction>

Creating the main component:
<boltAction type="file" filePath="src/App.jsx">import React from 'react';

function App() {
  return <div>Hello World</div>;
}

export default App;</boltAction>
</boltArtifact>

Your React app is ready!`;
    
    parser.parse('test_1', content);
    
    expect(callbacks.onText).toHaveBeenCalledWith('I\'ll create a React app for you.');
    expect(callbacks.onArtifactOpen).toHaveBeenCalledWith(expect.objectContaining({
      id: 'react-app',
      title: 'React Application'
    }));
    expect(callbacks.onText).toHaveBeenCalledWith('First, let me create the package.json:');
    expect(callbacks.onActionClose).toHaveBeenCalledWith(expect.objectContaining({
      type: 'file',
      filePath: 'package.json',
      content: '{\n  "name": "my-app",\n  "version": "1.0.0"\n}'
    }));
    expect(callbacks.onText).toHaveBeenCalledWith('Now installing dependencies:');
    expect(callbacks.onActionClose).toHaveBeenCalledWith(expect.objectContaining({
      type: 'shell',
      content: 'npm install'
    }));
    expect(callbacks.onText).toHaveBeenCalledWith('Creating the main component:');
    expect(callbacks.onActionClose).toHaveBeenCalledWith(expect.objectContaining({
      type: 'file',
      filePath: 'src/App.jsx',
      content: expect.stringContaining('import React from \'react\';')
    }));
    expect(callbacks.onArtifactClose).toHaveBeenCalledWith(expect.objectContaining({
      id: 'react-app'
    }));
    expect(callbacks.onText).toHaveBeenCalledWith('Your React app is ready!');
  });

  it('should handle incomplete tags gracefully', () => {
    const content = 'Some text <boltAction type="file" filePath="test.js">incomplete';
    parser.parse('test_1', content);
    
    // Should only process the text before the incomplete tag
    expect(callbacks.onText).toHaveBeenCalledWith('Some text');
    expect(callbacks.onActionClose).not.toHaveBeenCalled();
  });

  it('should extract artifact attributes correctly', () => {
    const content = '<boltArtifact id="my-project" title="My Awesome Project">content</boltArtifact>';
    parser.parse('test_1', content);
    
    expect(callbacks.onArtifactOpen).toHaveBeenCalledWith(expect.objectContaining({
      id: 'my-project',
      title: 'My Awesome Project'
    }));
    expect(callbacks.onArtifactClose).toHaveBeenCalledWith(expect.objectContaining({
      id: 'my-project'
    }));
  });

  it('should handle missing attributes with defaults', () => {
    const content = '<boltArtifact>content</boltArtifact>';
    parser.parse('test_1', content);
    
    expect(callbacks.onArtifactOpen).toHaveBeenCalledWith(expect.objectContaining({
      id: expect.any(String),
      title: 'Untitled'
    }));
    expect(callbacks.onArtifactClose).toHaveBeenCalledWith(expect.objectContaining({
      id: expect.any(String)
    }));
  });

  it('should handle single quotes in attributes', () => {
    const content = "<boltAction type='file' filePath='test.js'>content</boltAction>";
    parser.parse('test_1', content);
    
    expect(callbacks.onActionClose).toHaveBeenCalledWith(expect.objectContaining({
      type: 'file',
      filePath: 'test.js',
      content: 'content'
    }));
  });
});