// frontend/src/services/codeAgentService.ts
import { StreamingMessageParser, ParserCallbacks } from '@/lib/runtime/StreamingMessageParser';
import { ActionRunner } from '@/lib/runtime/ActionRunner';
import { addMessage, updateMessage, setGenerating, setThinking, addToConversationHistory, buildConversationHistory, type Message } from '@/lib/stores/chatStore';
import { chatStore } from '@/lib/stores/chatStore';
import { addArtifact, addArtifactAndPrepareExecution, addActionToArtifact, addOrUpdateFileFromAction, resetWorkbenchForNewConversation } from '@/lib/stores/workbenchStore';
import { WebContainer } from '@webcontainer/api';

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
export async function sendChatMessage(userInput: string, webcontainer?: WebContainer, actionRunner?: ActionRunner): Promise<void> {
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
  
  // Add user message to conversation history
  addToConversationHistory('user', userInput);
  
  setGenerating(true);
  setThinking(true);
  console.log('⏳ Set generating to true and thinking to true');
  
  // Abort any previous actions and clear queues before starting new processing
  if (actionRunner) {
    console.log('🛑 Aborting previous actions before starting new message processing');
    actionRunner.abort();
  }
  
  // Reset workbench state for new conversation
  console.log('🔄 Resetting workbench state for new conversation');
  resetWorkbenchForNewConversation();
  
  // Validate WebContainer and ActionRunner are provided
  if (!webcontainer) {
    console.error('WebContainer not provided to sendChatMessage');
    const errorMessage: Message = {
      id: `${Date.now()}-init-error`,
      content: `❌ WebContainer not available. Please wait for initialization.`,
      sender: 'agent',
      timestamp: new Date(),
      type: 'error'
    };
    addMessage(errorMessage);
    setGenerating(false);
    setThinking(false);
    return;
  }
  
  if (!actionRunner) {
    console.error('ActionRunner not provided to sendChatMessage');
    const errorMessage: Message = {
      id: `${Date.now()}-init-error`,
      content: `❌ ActionRunner not available. Please wait for initialization.`,
      sender: 'agent',
      timestamp: new Date(),
      type: 'error'
    };
    addMessage(errorMessage);
    setGenerating(false);
    setThinking(false);
    return;
  }
  
  try {
    console.log('🚀 Starting project generation with input:', userInput);
    setGenerating(true);
    
    let accumulatedText = '';
    let currentMessageId: string | null = null;
    
    // Set up parser callbacks for artifact and action handling
    const parserCallbacks: ParserCallbacks = {
      onArtifactOpen: ({ messageId, id, title }) => {
        console.log(`📦 Artifact opened: ${id} - ${title}`);
        // Create the artifact in the workbench store to make it visible
        addArtifactAndPrepareExecution(id, title);
      },
      onArtifactClose: ({ messageId, id, title }) => {
        console.log(`📦 Artifact closed: ${id} - ${title}`);
      },
      onActionOpen: ({ artifactId, messageId, action }) => {
        console.log(`⚡ Action opened: ${action.type}${artifactId ? ` in artifact ${artifactId}` : ''}`);
      },
      onActionClose: ({ artifactId, messageId, action }) => {
        console.log(`⚡ Action closed: ${action.type}. Forwarding to ActionRunner.`);
        
        if (artifactId) {
          addActionToArtifact(artifactId, action);
        }
        
        // Let the ActionRunner handle queuing and execution order
        actionRunner.runAction(action, artifactId);

        // Update file tree immediately for UI responsiveness
        if (action.type === 'file' && action.filePath) {
          addOrUpdateFileFromAction(action);
        }
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
        // Stop thinking animation when first text arrives
        setThinking(false);
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
        setThinking(false);
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
        console.log('✅ Stream completed. ActionRunner will continue processing any remaining actions.');
        
        // Finalize the UI message state and add to conversation history
        const lastMessage = chatStore.get().messages.slice(-1)[0];
        if (lastMessage && lastMessage.sender === 'agent' && lastMessage.isStreaming) {
          updateMessage(lastMessage.id, { isStreaming: false });
          
          // Add agent response to conversation history
          if (lastMessage.content.trim()) {
            addToConversationHistory('assistant', lastMessage.content);
            console.log('📚 Added agent response to conversation history');
          }
        }
        
        setGenerating(false);
        setThinking(false);
      }
    };
    
    // Build conversation history for context
    const conversationHistory = buildConversationHistory();
    console.log('📚 Built conversation history with', conversationHistory.length, 'entries');
    
    // Use the existing streamAgentResponse function
    console.log('🌐 Calling streamAgentResponse with input:', userInput);
    await streamAgentResponse(userInput, callbacks, conversationHistory);
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
    setGenerating(false);
    setThinking(false);
  } finally {
    // setGenerating(false) is now handled in onComplete callback
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