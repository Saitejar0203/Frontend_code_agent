// frontend/src/services/codeAgentService.ts
import { StreamingMessageParser, ParserCallbacks } from '@/lib/runtime/StreamingMessageParser';

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

export async function streamAgentResponse(prompt: string, callbacks: GeminiParserCallbacks, conversationHistory: Array<{role: string, content: string}> = []) {
  const parser = new StreamingMessageParser({ callbacks });
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
          // Handle Server-Sent Events format from Gemini API
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim() === '{"done": true}') {
              callbacks.onComplete?.();
              return fullResponse;
            }
            try {
              const parsed = JSON.parse(data);
              // Handle Gemini API response format
              if (parsed.chunk) {
                const chunk = parsed.chunk;
                fullResponse += chunk;
                // Parse the chunk content for bolt-style XML tags
                const processedText = parser.parse(messageId, chunk);
                if (processedText.trim()) {
                  callbacks.onText?.(processedText);
                }
              } else if (parsed.error) {
                callbacks.onError?.(parsed.error);
                return fullResponse;
              }
            } catch (e) {
              // If not JSON, treat as raw text and parse for bolt tags
              if (data.trim() && data !== '[DONE]') {
                fullResponse += data;
                const processedText = parser.parse(messageId, data);
                if (processedText.trim()) {
                  callbacks.onText?.(processedText);
                }
              }
            }
          }
        }
      }
    }
    
    // Process any remaining buffer
    if (buffer.trim()) {
      fullResponse += buffer;
      const processedText = parser.parse(messageId, buffer);
      if (processedText.trim()) {
        callbacks.onText?.(processedText);
      }
    }
    
    callbacks.onComplete?.();
    return fullResponse;
  } catch (error) {
    console.error('Error in streamAgentResponse:', error);
    callbacks.onError?.(error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

export async function generateStructuredProject(prompt: string, callbacks: GeminiParserCallbacks) {
  const parser = new StreamingMessageParser({ callbacks });
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
              const processedText = parser.parse(messageId, parsed.chunk);
              if (processedText.trim()) {
                callbacks.onText?.(processedText);
              }
            }
          } catch (e) {
            // If not JSON, treat as raw text and parse for bolt tags
            const processedText = parser.parse(messageId, data);
            if (processedText.trim()) {
              callbacks.onText?.(processedText);
            }
          }
        }
      }
    }
    
    // Process any remaining buffer
    if (buffer.trim()) {
      const processedText = parser.parse(messageId, buffer);
      if (processedText.trim()) {
        callbacks.onText?.(processedText);
      }
    }
    
    callbacks.onComplete?.();
  } catch (error) {
    console.error('Error in generateStructuredProject:', error);
    callbacks.onError?.(error instanceof Error ? error.message : 'Unknown error');
  }
}

// Removed handleStructuredResponse function - now using bolt-style XML parsing