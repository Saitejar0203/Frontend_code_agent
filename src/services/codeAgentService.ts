// frontend/src/services/codeAgentService.ts
import { StreamingMessageParser, ParserCallbacks } from '@/lib/runtime/StreamingMessageParser';
import { actionRunner } from '@/lib/runtime/ActionRunner';
import { addMessage, updateMessage, setGenerating, type Message } from '@/lib/stores/chatStore';
import { chatStore } from '@/lib/stores/chatStore';
import { addArtifact, addActionToArtifact, addOrUpdateFileFromAction } from '@/lib/stores/workbenchStore';

export interface GenerateProjectRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  template?: string;
  projectContext?: {
    name?: string;
    description?: string;
    framework?: string;
  };
}

// Extended callbacks for Gemini API integration
export interface GeminiParserCallbacks extends ParserCallbacks {
  onText?: (text: string) => void;
  onFile?: (filePath: string, content: string) => void;
  onCommand?: (command: string) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

/**
 * Main function to handle chat with the AI agent
 * This replaces the streaming logic that was previously in CodeAgentChat.tsx
 */
export async function sendChatMessage(userInput: string): Promise<void> {
  console.log('🚀 sendChatMessage called with input:', userInput);
  
  // Add user message to chat store
  const userMessage: Message = {
    id: Date.now().toString(),
    content: userInput,
    sender: 'user',
    timestamp: new Date()
  };
  
  console.log('📝 Adding user message to store:', userMessage);
  addMessage(userMessage);
  setGenerating(true);
  console.log('⏳ Set generating to true');
  
  // Initialize ActionRunner
  try {
    await actionRunner.initialize();
    console.log('ActionRunner initialized successfully');
  } catch (error) {
    console.error('Failed to initialize ActionRunner:', error);
    const errorMessage: Message = {
      id: `${Date.now()}-init-error`,
      content: `❌ Failed to initialize ActionRunner: ${error}`,
      sender: 'agent',
      timestamp: new Date(),
      type: 'error'
    };
    addMessage(errorMessage);
    setGenerating(false);
    return;
  }
  
  try {
    let accumulatedText = '';
    let currentMessageId: string | null = null;
    
    // --- COMMAND-DRIVEN BATCHING SYSTEM ---
    // Queue to hold file actions until a shell command is encountered or stream ends
    const fileActionQueue: Array<{ action: import('@/lib/runtime').BoltAction; artifactId?: string }> = [];
    const shellActionQueue: Array<{ action: import('@/lib/runtime').BoltAction; artifactId?: string }> = [];
    let batchExecutionPromise = Promise.resolve();
    
    // Helper function to execute all queued file actions in parallel
    const executeFileActionBatch = async () => {
      if (fileActionQueue.length === 0) return;
      
      console.log(`📦 Executing batch of ${fileActionQueue.length} file actions in parallel`);
      const filePromises = fileActionQueue.map(({ action, artifactId }) => {
        console.log(`📄 Batching file: ${action.filePath} (${action.content.length} chars)`);
        return actionRunner.runAction(action, artifactId);
      });
      
      // Execute all file actions in parallel
      await Promise.all(filePromises);
      console.log(`✅ Completed batch of ${fileActionQueue.length} file actions`);
      
      // Clear the file queue
      fileActionQueue.length = 0;
    };
    
    // Helper function to execute shell actions sequentially
    const executeShellActionBatch = async () => {
      if (shellActionQueue.length === 0) return;
      
      console.log(`⚡ Executing batch of ${shellActionQueue.length} shell actions sequentially`);
      for (const { action, artifactId } of shellActionQueue) {
        console.log(`🔧 Executing shell command: ${action.content}`);
        await actionRunner.runAction(action, artifactId);
      }
      console.log(`✅ Completed batch of ${shellActionQueue.length} shell actions`);
      
      // Clear the shell queue
      shellActionQueue.length = 0;
    };
    // -----------------------------------------
    
    // Set up parser callbacks for artifact and action handling
    const parserCallbacks: ParserCallbacks = {
      onArtifactOpen: ({ messageId, id, title }) => {
        console.log(`📦 Artifact opened: ${id} - ${title}`);
        // Create the artifact in the workbench store to make it visible
        addArtifact(id, title);
      },
      onArtifactClose: ({ messageId, id, title }) => {
        console.log(`📦 Artifact closed: ${id} - ${title}`);
      },
      onActionOpen: ({ artifactId, messageId, action }) => {
        console.log(`⚡ Action opened: ${action.type}${artifactId ? ` in artifact ${artifactId}` : ''}`);
      },
      onActionClose: ({ artifactId, messageId, action }) => {
        console.log(`⚡ Action closed: ${action.type}${artifactId ? ` in artifact ${artifactId}` : ''}`);
        
        // Add action to artifact in the store if artifactId exists
        if (artifactId) {
          addActionToArtifact(artifactId, action);
        }
        
        // Immediately add file actions to the file explorer
        if (action.type === 'file' && action.filePath && action.content) {
          addOrUpdateFileFromAction(action);
          console.log(`📁 Added file to explorer: ${action.filePath}`);
        }
        
        // --- COMMAND-DRIVEN BATCHING LOGIC ---
        if (action.type === 'file') {
          // Queue file actions for batch execution
          fileActionQueue.push({ action, artifactId });
          console.log(`📄 Queued file action: ${action.filePath} (queue size: ${fileActionQueue.length})`);
        } else if (action.type === 'shell') {
          // When we encounter a shell command, execute all queued file actions first
          batchExecutionPromise = batchExecutionPromise.then(async () => {
            // Execute all pending file actions in parallel before this shell command
            await executeFileActionBatch();
            
            // Then queue and execute this shell command
            shellActionQueue.push({ action, artifactId });
            console.log(`⚡ Queued shell action: ${action.content} (queue size: ${shellActionQueue.length})`);
            await executeShellActionBatch();
          }).catch(error => {
            console.error('❌ Error in batch execution:', error);
          });
        }
        // ----------------------------------------
      },
      onActionContentUpdate: ({ artifactId, messageId, action }) => {
        console.log(`📝 Action content update: ${action.type}${artifactId ? ` in artifact ${artifactId}` : ''} (${action.content.length} chars)`);
        // Skip immediate execution to avoid multiple writes to the same file
        // Actions will be executed only when complete via onActionClose
      }
    };
    
    const callbacks: GeminiParserCallbacks = {
      ...parserCallbacks,
      onText: (text: string) => {
        console.log('📝 Received text chunk:', text);
        if (text && text.trim()) {
          // Only accumulate text that is not inside XML tags
          const parser = (callbacks as any)._parser;
          const messageId = currentMessageId || `msg_${Date.now()}`;
          
          // Check if we're inside XML tags - if so, don't accumulate this text
          if (parser && parser.isInsideXmlTag(messageId)) {
            console.log('🏷️ Skipping text inside XML tags:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
            return;
          }
          
          accumulatedText += text;
          console.log('📊 Accumulated text length:', accumulatedText.length);
          
          // Create or update the current agent message
          const currentMessages = chatStore.get().messages;
          console.log('🔄 Current messages before update:', currentMessages.length);
          const lastMessage = currentMessages[currentMessages.length - 1];
          
          if (lastMessage && lastMessage.sender === 'agent' && lastMessage.isStreaming) {
            console.log('✏️ Updating existing streaming message:', lastMessage.id);
            // Update existing streaming message
            updateMessage(lastMessage.id, {
              ...lastMessage,
              content: accumulatedText
            });
          } else {
            console.log('➕ Creating new streaming message');
            // Create new streaming message
            const agentMessage: Message = {
              id: `${Date.now()}-${Math.random()}`,
              content: accumulatedText,
              sender: 'agent',
              timestamp: new Date(),
              type: 'text',
              isStreaming: true
            };
            addMessage(agentMessage);
            currentMessageId = agentMessage.id;
            console.log('✅ Created message with ID:', currentMessageId);
          }
          console.log('📋 Messages after update:', chatStore.get().messages.length);
        }
      },
      onError: (error: string) => {
        console.error('❌ Streaming error:', error);
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: `❌ Error: ${error}`,
          sender: 'agent',
          timestamp: new Date(),
          type: 'error'
        };
        addMessage(errorMessage);
      },
      onComplete: async () => {
        console.log('✅ Stream completed, finalizing message and executing remaining actions.');
        console.log('🏁 Final accumulated text length:', accumulatedText.length);
        
        // Finalize the UI message
        const currentMessages = chatStore.get().messages;
        const lastMessage = currentMessages[currentMessages.length - 1];
        if (lastMessage && lastMessage.sender === 'agent' && lastMessage.isStreaming) {
          console.log('🔒 Marking message as complete:', lastMessage.id);
          updateMessage(lastMessage.id, {
            ...lastMessage,
            content: accumulatedText,
            isStreaming: false
          });
        }
        
        // --- FINAL BATCH EXECUTION ---
        // Wait for any ongoing batch execution to complete
        await batchExecutionPromise;
        
        // Execute any remaining file actions that weren't triggered by shell commands
        if (fileActionQueue.length > 0) {
          console.log(`📦 Executing final batch of ${fileActionQueue.length} remaining file actions`);
          await executeFileActionBatch();
        }
        
        // Execute any remaining shell actions
        if (shellActionQueue.length > 0) {
          console.log(`⚡ Executing final batch of ${shellActionQueue.length} remaining shell actions`);
          await executeShellActionBatch();
        }
        
        console.log('🎉 All actions completed successfully!');
        console.log('🏁 Final messages count:', chatStore.get().messages.length);
      }
    };
    
    // Use the existing streamAgentResponse function
    console.log('🌐 Calling streamAgentResponse with input:', userInput);
    await streamAgentResponse(userInput, callbacks);
    console.log('✅ streamAgentResponse completed');
    
  } catch (error) {
    console.error('Failed to generate project:', error);
    const errorMessage: Message = {
      id: Date.now().toString(),
      content: 'Sorry, I encountered an error while generating your project. Please try again.',
      sender: 'agent',
      timestamp: new Date(),
      type: 'text'
    };
    addMessage(errorMessage);
  } finally {
    setGenerating(false);
  }
}

export async function streamAgentResponse(prompt: string, callbacks: GeminiParserCallbacks, conversationHistory: Array<{role: string, content: string}> = []) {
  console.log('🔄 streamAgentResponse started with prompt:', prompt);
  const parser = new StreamingMessageParser(callbacks);
  // Use the new Gemini API endpoint
  const apiBaseUrl = 'http://localhost:8002';
  console.log('🌐 Making API call to:', `${apiBaseUrl}/api/v1/chat`);
  console.log('🔧 Parser callbacks configured:', Object.keys(callbacks));
  
  // Store parser reference for callbacks to access
  (callbacks as any)._parser = parser;

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        message: prompt,
        conversation_history: conversationHistory,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';
    const messageId = `msg_${Date.now()}`;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.trim()) {
          console.log('📨 Processing line:', line);
          // Handle Server-Sent Events format from Gemini API
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            console.log('📦 Extracted data:', data);
            if (data.trim() === '{"done": true}') {
              console.log('🏁 Received completion signal');
              callbacks.onComplete?.();
              return fullResponse;
            }
            try {
              const parsed = JSON.parse(data);
              console.log('✅ Parsed JSON data:', parsed);
              // Handle Gemini API response format
              if (parsed.chunk) {
                const chunk = parsed.chunk;
                console.log('🧩 Processing chunk:', chunk);
                fullResponse += chunk;
                // Parse the chunk content for bolt-style XML tags
                parser.parse(messageId, chunk);
                console.log('🔍 Processed chunk with parser');
                // Store parser reference for callbacks to access
                (callbacks as any)._parser = parser;
              } else if (parsed.error) {
                console.error('❌ API error received:', parsed.error);
                callbacks.onError?.(parsed.error);
                return fullResponse;
              }
            } catch (e) {
              console.log('📝 Not JSON, treating as raw text:', data);
              // If not JSON, treat as raw text and parse for bolt tags
              if (data.trim() && data !== '[DONE]') {
                fullResponse += data;
                parser.parse(messageId, data);
                console.log('🔍 Processed raw text with parser');
                // Store parser reference for callbacks to access
                (callbacks as any)._parser = parser;
              }
            }
          }
        }
      }
    }
    
    // --- START OF THE FIX ---
    // After the loop, the stream is done, but the decoder might have remaining bytes.
    // Flush the decoder's internal buffer by calling it without arguments.
    buffer += decoder.decode();

    // Process any final data that was flushed from the buffer. This ensures
    // the parser sees the very end of the message, including the final closing tags.
    if (buffer.trim()) {
      const lines = buffer.split('\n');
      for (const line of lines) {
        if (line.trim() && line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data.trim() === '{"done": true}') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.chunk) {
              fullResponse += parsed.chunk;
              parser.parse(messageId, parsed.chunk);
              (callbacks as any)._parser = parser;
            }
          } catch (e) {
            if (data.trim() && data !== '[DONE]') {
              fullResponse += data;
              parser.parse(messageId, data);
              (callbacks as any)._parser = parser;
            }
          }
        }
      }
    }

    // Now that all data has been fully parsed, we can safely call onComplete.
    callbacks.onComplete?.();
    // --- END OF THE FIX ---
    
    return fullResponse;
  } catch (error) {
    console.error('Error in streamAgentResponse:', error);
    callbacks.onError?.(error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

export async function generateStructuredProject(prompt: string, callbacks: GeminiParserCallbacks) {
  const parser = new StreamingMessageParser(callbacks);
  // Use the new Gemini API endpoint
  const apiBaseUrl = 'http://localhost:8002';
  
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        message: prompt,
        conversation_history: [],
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const messageId = `msg_${Date.now()}`;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim() && line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data.trim() === '{"done": true}') {
            callbacks.onComplete?.();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.chunk) {
              // Parse the chunk content for bolt-style XML tags
              parser.parse(messageId, parsed.chunk);
            }
          } catch (e) {
            // If not JSON, treat as raw text and parse for bolt tags
            parser.parse(messageId, data);
          }
        }
      }
    }
    
    // --- START OF THE FIX ---
    // After the loop, the stream is done, but the decoder might have remaining bytes.
    // Flush the decoder's internal buffer by calling it without arguments.
    buffer += decoder.decode();

    // Process any final data that was flushed from the buffer. This ensures
    // the parser sees the very end of the message, including the final closing tags.
    if (buffer.trim()) {
      const lines = buffer.split('\n');
      for (const line of lines) {
        if (line.trim() && line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data.trim() === '{"done": true}') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.chunk) {
              parser.parse(messageId, parsed.chunk);
            }
          } catch (e) {
            if (data.trim() && data !== '[DONE]') {
              parser.parse(messageId, data);
            }
          }
        }
      }
    }

    // Now that all data has been fully parsed, we can safely call onComplete.
    callbacks.onComplete?.();
    // --- END OF THE FIX ---
  } catch (error) {
    console.error('Error in generateStructuredProject:', error);
    callbacks.onError?.(error instanceof Error ? error.message : 'Unknown error');
  }
}

// Removed handleStructuredResponse function - now using bolt-style XML parsing