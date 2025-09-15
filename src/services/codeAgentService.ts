// frontend/src/services/codeAgentService.ts
import { StreamingMessageParser, ParserCallbacks } from '@/lib/runtime/StreamingMessageParser';
import { ActionRunner } from '@/lib/runtime/ActionRunner';
import { addMessage, addMessageWithImages, updateMessage, setGenerating, setThinking, addToConversationHistory, buildConversationHistory, setAssistantStatus, setStatusMessage, clearAssistantStatus, completeAssistantStatus, type Message, type ImageAttachment } from '@/lib/stores/chatStore';
import { chatStore } from '@/lib/stores/chatStore';
import { addArtifact, addArtifactAndPrepareExecution, addActionToArtifact, addOrUpdateFileFromAction, resetWorkbenchForNewConversation, workbenchStore } from '@/lib/stores/workbenchStore';
import { WebContainer } from '@webcontainer/api';
import { MAX_RESPONSE_SEGMENTS, CONTINUE_PROMPT, isTruncationFinishReason, isNullResponse, MAX_VALIDATION_ITERATIONS, VALIDATION_PROMPT, isValidationApproved, VALIDATION_COMPLETE_TAGS } from '@/lib/constants/continuation';
import { imageGenerationService } from './imageGenerationService';

// Message queue for handling requests when WebContainer is not ready
interface QueuedMessage {
  id: string;
  userInput: string;
  timestamp: Date;
  messageId: string; // ID of the "model is thinking" message
}

class MessageQueue {
  private queue: QueuedMessage[] = [];
  private isProcessing = false;
  private webcontainerReadyCallbacks: (() => void)[] = [];
  private isValidationInProgress = false;

  enqueue(userInput: string): string {
    const queuedMessage: QueuedMessage = {
      id: `queued_${Date.now()}_${Math.random()}`,
      userInput,
      timestamp: new Date(),
      messageId: '' // No longer used since we're not creating thinking messages
    };

    // Add user message to chat
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      content: userInput,
      sender: 'user',
      timestamp: new Date()
    };
    addMessage(userMessage);
    addToConversationHistory('user', userInput);

    // Set UI state to show "model is thinking" (relies on ThinkingAnimation component)
    setGenerating(true);
    setThinking(true);

    this.queue.push(queuedMessage);
    console.log('📥 Message queued:', queuedMessage.id, 'Queue size:', this.queue.length);
    
    return queuedMessage.id;
  }

  dequeue(messageId: string): boolean {
    const index = this.queue.findIndex(msg => msg.id === messageId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      
      // Reset UI state if queue is empty and validation is not in progress
      if (this.queue.length === 0) {
        setGenerating(false);
        setThinking(false);
        // Only complete assistant status if validation is not in progress
        if (!this.isValidationInProgress) {
          completeAssistantStatus();
        }
      }
      
      console.log('🗑️ Message dequeued:', messageId, 'Queue size:', this.queue.length);
      return true;
    }
    return false;
  }

  async processQueue(webcontainer: WebContainer, actionRunner: ActionRunner): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log('🔄 Processing message queue, size:', this.queue.length);

    // Process messages in FIFO order
    while (this.queue.length > 0) {
      const queuedMessage = this.queue.shift()!;
      console.log('⚡ Processing queued message:', queuedMessage.id);

      try {
        // Process the actual message
        await sendChatMessageInternal(queuedMessage.userInput, webcontainer, actionRunner, true);
      } catch (error) {
        console.error('❌ Error processing queued message:', queuedMessage.id, error);
        
        // Add error message
        const errorMessage: Message = {
          id: `${Date.now()}-error`,
          content: 'Sorry, I encountered an error while processing your message. Please try again.',
          sender: 'agent',
          timestamp: new Date(),
          type: 'error'
        };
        addMessage(errorMessage);
      }
    }

    this.isProcessing = false;
    console.log('✅ Message queue processing completed');
  }

  onWebContainerReady(callback: () => void): void {
    this.webcontainerReadyCallbacks.push(callback);
  }

  notifyWebContainerReady(webcontainer: WebContainer, actionRunner: ActionRunner): void {
    console.log('🚀 WebContainer ready, processing queue...');
    this.processQueue(webcontainer, actionRunner);
    
    // Notify all callbacks
    this.webcontainerReadyCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in WebContainer ready callback:', error);
      }
    });
    this.webcontainerReadyCallbacks = [];
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
    this.isProcessing = false;
    this.isValidationInProgress = false;
    setGenerating(false);
    setThinking(false);
    console.log('🧹 Message queue cleared');
  }

  setValidationInProgress(inProgress: boolean): void {
    this.isValidationInProgress = inProgress;
    console.log('🔍 Validation status changed:', inProgress ? 'IN PROGRESS' : 'COMPLETED');
  }

  isValidationActive(): boolean {
    return this.isValidationInProgress;
  }
}

// Global message queue instance
const messageQueue = new MessageQueue();

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
export async function sendChatMessage(
  userInput: string,
  webcontainer?: WebContainer,
  actionRunner?: ActionRunner,
  images?: ImageAttachment[],
  webSearchEnabled?: boolean
): Promise<void> {
  console.log('🚀 sendChatMessage called with input:', userInput, 'images:', images?.length || 0);
  
  // If WebContainer or ActionRunner is not available, queue the message
  if (!webcontainer || !actionRunner) {
    console.log('⏳ WebContainer or ActionRunner not ready, queuing message...');
    const queuedId = messageQueue.enqueue(userInput);
    console.log('📥 Message queued with ID:', queuedId);
    return;
  }
  
  // If both are available, process immediately
  await sendChatMessageInternal(userInput, webcontainer, actionRunner, false, images, webSearchEnabled);
}

/**
 * Internal function for actual message processing
 */
async function sendChatMessageInternal(userInput: string, webcontainer: WebContainer, actionRunner: ActionRunner, fromQueue: boolean = false, images?: ImageAttachment[], webSearchEnabled?: boolean): Promise<void> {
  console.log('🚀 sendChatMessageInternal called with input:', userInput, 'fromQueue:', fromQueue);
  
  // Only add user message if not coming from queue (to avoid duplication)
  if (!fromQueue) {
    // Add user message to chat store with images if present
    const userMessage: Message = {
      id: Date.now().toString(),
      content: userInput,
      sender: 'user',
      timestamp: new Date(),
      images: images && images.length > 0 ? images : undefined
    };
    
    console.log('📝 Adding user message to store:', userMessage);
    if (images && images.length > 0) {
      addMessageWithImages(userInput, images);
    } else {
      addMessage(userMessage);
    }
    
    // Add user message to conversation history
    addToConversationHistory('user', userInput);
  } else {
    console.log('📝 Skipping user message addition (already added during enqueue)');
  }
  
  setGenerating(true);
  setThinking(true);
  setAssistantStatus('thinking');
  setStatusMessage('Processing your request...');
  console.log('⏳ Set generating to true and thinking to true');
  
  // ----------------- START OF CORRECTED FIX -----------------
  if (actionRunner) {
    console.log('🔄 Processing follow-up request, clearing pending actions...');
    actionRunner.abortFollowUp(); // Use the new selective abort
  }
  // ------------------ END OF CORRECTED FIX ------------------
  
  try {
    console.log('🚀 Starting project generation with input:', userInput);
    setGenerating(true);
    
    let accumulatedText = '';
    let currentMessageId: string | null = null;
    let rawResponse = ''; // Store the complete raw response with XML tags
    
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
      },
      onImageGenerationRequest: async (requests) => {
        console.log(`🖼️ Image generation request received: ${requests.length} images`);
        try {
          if (!webcontainer) {
            throw new Error('WebContainer not available for image generation');
          }
          await imageGenerationService.generateAndMountImages(requests, webcontainer, actionRunner);
          console.log(`✅ Successfully processed ${requests.length} image generation requests`);
        } catch (error) {
          console.error('❌ Error processing image generation requests:', error);
          // Add error message to chat
          const errorMessage: Message = {
            id: `${Date.now()}-img-error`,
            content: `❌ Failed to generate images: ${error instanceof Error ? error.message : 'Unknown error'}`,
            sender: 'agent',
            timestamp: new Date(),
            type: 'error'
          };
          addMessage(errorMessage);
        }
      }
    };
    
    const callbacks: GeminiParserCallbacks = {
      ...parserCallbacks,
      onText: (text: string) => {
        console.log('📝 Received text chunk:', text);
        // Stop thinking animation when first text arrives
        setThinking(false);
        setAssistantStatus('generating');
        setStatusMessage('Generating response...');
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
        
        // Finalize the UI message state
        const lastMessage = chatStore.get().messages.slice(-1)[0];
        if (lastMessage && lastMessage.sender === 'agent' && lastMessage.isStreaming) {
          updateMessage(lastMessage.id, { isStreaming: false });
        }
        
        setGenerating(false);
        setThinking(false);
      }
    };
    
    // Build conversation history for context
    let conversationHistory = buildConversationHistory();
    console.log('📚 Built conversation history with', conversationHistory.length, 'entries');
    
    // Linear orchestration loop for multi-segment responses and validation
    let currentPrompt = userInput;
    let segmentCount = 0;
    let fullCombinedResponse = '';
    let willPerformValidation = false;
    
    while (true) {
      console.log('🌐 Calling streamAgentResponse with prompt:', currentPrompt, 'segment:', segmentCount);
      
      // Determine if validation will be needed after this response
       const isValidationCall = currentPrompt === VALIDATION_PROMPT;
       const mightNeedValidation = !isValidationCall && segmentCount === 0; // Only first segment of non-validation calls might need validation
       
       // Create custom callbacks that suppress onComplete if validation might be needed
        const customCallbacks = {
          ...callbacks,
          onComplete: mightNeedValidation ? undefined : callbacks.onComplete
        };
        
        // Only pass images on the first segment of non-validation calls
        const imagesToSend = (!isValidationCall && segmentCount === 0) ? images : undefined;
        // Only pass web search parameters on the first segment of non-validation calls
        const webSearchToSend = (!isValidationCall && segmentCount === 0) ? webSearchEnabled : undefined;
        const result = await streamAgentResponse(currentPrompt, customCallbacks, conversationHistory, segmentCount, imagesToSend, webSearchToSend);
      console.log('✅ streamAgentResponse completed with response length:', result.fullResponse.length, 'finishReason:', result.finishReason);
      
      // Accumulate the response
      fullCombinedResponse += result.fullResponse;
      rawResponse = fullCombinedResponse;
      
      // Check if we need to continue due to truncation
      if (isTruncationFinishReason(result.finishReason) || isNullResponse(result.fullResponse)) {
        if (segmentCount < MAX_RESPONSE_SEGMENTS - 1) {
          console.log('🔄 Response truncated, continuing...', { finishReason: result.finishReason, segmentCount });
          setAssistantStatus('max_tokens');
          setStatusMessage('Continuing due to length limit...');
          
          // Update conversation history with current response
          if (result.fullResponse.trim()) {
            conversationHistory.push({ role: 'assistant', content: result.fullResponse });
          }
          conversationHistory.push({ role: 'user', content: CONTINUE_PROMPT });
          
          // Set up for next iteration
          currentPrompt = CONTINUE_PROMPT;
          segmentCount++;
          continue;
        } else {
          console.warn('⚠️ Maximum continuation segments reached, stopping');
          break;
        }
      }
      
      // Check if we need to perform validation
      if (result.finishReason === 'STOP' && !isValidationCall && result.fullResponse.trim()) {
        console.log('🔍 Finish reason is STOP, will perform validation after completing UI state...');
        willPerformValidation = true;
        
        // Update conversation history with current response
        conversationHistory.push({ role: 'assistant', content: result.fullResponse });
        
        // onComplete will be called after validation completes
        break;
      }
      
      // If we reach here, we're done
      break;
    }
    
    // Handle validation after UI state is properly managed
    if (willPerformValidation) {
      console.log('🔍 Starting validation loop for completed response...');
      
      // Perform validation loop
      const validationResponse = await performValidationLoop(conversationHistory, callbacks, segmentCount);
      
      // Add validation response to combined response
      fullCombinedResponse += validationResponse;
      rawResponse = fullCombinedResponse;
      
      // Now that validation is complete, reset UI states
      callbacks.onComplete?.();
    }
    
    // Update conversation history with the complete raw response
    const lastMessage = chatStore.get().messages.slice(-1)[0];
    if (lastMessage && lastMessage.sender === 'agent' && rawResponse.trim()) {
      // Process content for clean UI display by removing validation tags
      const displayContent = processResponseForDisplay(lastMessage.content);
      
      // Update message with processed content for display, preserve raw content for history
      updateMessage(lastMessage.id, { 
        content: displayContent,
        rawContent: rawResponse 
      });
      addToConversationHistory('assistant', displayContent, rawResponse);
      console.log('📚 Added agent response to conversation history with processed display content and raw content');
    }
    
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
    
    // Clear validation flag in case of error
    messageQueue.setValidationInProgress(false);
    clearAssistantStatus();
  } finally {
    // setGenerating(false) is now handled in onComplete callback
  }
}

// Export the message queue for external access
export { messageQueue };

/**
 * Stop all queued messages and clear the queue
 */
export function stopQueuedMessages(): void {
  console.log('🛑 Stopping all queued messages');
  messageQueue.clear();
}

/**
 * Get the current queue size
 */
export function getQueueSize(): number {
  return messageQueue.getQueueSize();
}

/**
 * Check if there are any queued messages
 */
export function hasQueuedMessages(): boolean {
  return messageQueue.getQueueSize() > 0;
}

/**
 * Performs validation loop to check code quality and completeness
 */
async function performValidationLoop(
  conversationHistory: Array<{role: string, content: string}>,
  callbacks: GeminiParserCallbacks,
  segmentCount: number = 0
): Promise<string> {
  console.log('🔍 Starting validation loop...');
  
  // Set validation flag to prevent premature status completion
  messageQueue.setValidationInProgress(true);
  
  setAssistantStatus('validation');
  setStatusMessage('Starting validation...');
  let validationResponse = '';
  
  for (let i = 0; i < MAX_VALIDATION_ITERATIONS; i++) {
    console.log(`🔍 Validation iteration ${i + 1}/${MAX_VALIDATION_ITERATIONS}`);
    
    // Get current terminal output for validation context
    const terminalOutput = workbenchStore.get().terminalOutput;
    
    // Build validation history with entire conversation + validation prompt + terminal context
    const validationPromptWithTerminal = terminalOutput.trim() 
      ? `${VALIDATION_PROMPT}\n\n**IMPORTANT TERMINAL CONTEXT:**\nBelow is the terminal output captured so far. Note that some commands from the conversation history might still be processing or pending execution:\n\n\`\`\`terminal\n${terminalOutput}\n\`\`\`\n\nIf you identify any issues in the terminal output (errors, missing dependencies, compilation failures), provide complete file modifications followed by terminal commands that should be executed AFTER all pending commands complete.`
      : VALIDATION_PROMPT;
    
    const validationHistory = [
      ...conversationHistory,
      { role: 'user', content: validationPromptWithTerminal }
    ];
    
    // Stream validation response
    const result = await streamAgentResponse(
      VALIDATION_PROMPT,
      callbacks,
      validationHistory,
      segmentCount + 1
    );
    
    // Handle empty responses
    if (!result.fullResponse || result.fullResponse.trim() === '') {
      console.log(`⚠️ Empty response in validation iteration ${i + 1}, adding placeholder`);
      const placeholderResponse = `[Empty response in validation iteration ${i + 1}]`;
      validationResponse += placeholderResponse;
      
      // Add placeholder to conversation history
      conversationHistory.push({
        role: 'assistant',
        content: placeholderResponse
      });
      
      continue;
    }
    
    validationResponse += result.fullResponse;
    
    // Check if validation is approved
    if (isValidationApproved(result.fullResponse)) {
      console.log('✅ Validation approved, stopping validation loop');
      break;
    }
    
    // Add validation response to history for next iteration
    conversationHistory.push({
      role: 'assistant',
      content: result.fullResponse
    });
    
    console.log(`🔄 Validation iteration ${i + 1} completed, continuing...`);
  }
  
  console.log('🏁 Validation loop completed');
  
  // Clear validation flag and complete status
  messageQueue.setValidationInProgress(false);
  completeAssistantStatus('Validation completed');
  
  return validationResponse;
}

/**
 * Process response content for clean UI display by removing validation tags
 */
function processResponseForDisplay(content: string): string {
  let processedContent = content;
  
  // Strip validation tags for clean UI display
  VALIDATION_COMPLETE_TAGS.forEach(tag => {
    processedContent = processedContent.replace(new RegExp(tag.replace(/[<>]/g, '\\$&'), 'gi'), '').trim();
  });
  
  return processedContent;
}

/**
 * Converts ImageAttachment objects to API-compatible format
 * Extracts base64 data and MIME type from DataURL preview
 */
function toImageData(images: ImageAttachment[]): Array<{data: string, mime_type: string, name: string}> {
  return images.map((image, index) => {
    try {
      // Validate image preview format
      if (!image.preview || !image.preview.startsWith('data:')) {
        throw new Error(`Invalid image preview format for image ${index + 1}`);
      }
      
      // Extract base64 data and MIME type from DataURL (data:image/jpeg;base64,/9j/4AAQ...)
      const [header, base64Data] = image.preview.split(',');
      
      if (!header || !base64Data) {
        throw new Error(`Invalid DataURL structure for image ${index + 1}`);
      }
      
      const mimeType = header.match(/data:([^;]+)/)?.[1];
      if (!mimeType || !mimeType.startsWith('image/')) {
        throw new Error(`Invalid or missing MIME type for image ${index + 1}`);
      }
      
      return {
        data: base64Data,
        mime_type: mimeType,
        name: image.file.name || `image_${index + 1}`
      };
    } catch (error) {
      console.error(`❌ Error processing image ${index + 1}:`, error);
      throw error;
    }
  });
}

export async function streamAgentResponse(
  prompt: string, 
  callbacks: GeminiParserCallbacks, 
  conversationHistory: Array<{role: string, content: string}> = [], 
  segmentCount: number = 0,
  images?: ImageAttachment[],
  webSearchEnabled?: boolean
): Promise<{ fullResponse: string; finishReason: string | null }> {
  console.log('🔄 streamAgentResponse started with prompt:', prompt, 'segment:', segmentCount);
  const parser = new StreamingMessageParser(callbacks);
  // Use the new Gemini API endpoint
  // Prefer environment variable so production deployment can target Railway backend
  const apiBaseUrl = import.meta.env.VITE_CODE_AGENT_URL || 'http://localhost:8002';
  console.log('🌐 Making API call to:', `${apiBaseUrl}/api/v1/chat`);
  console.log('🔧 Parser callbacks configured:', Object.keys(callbacks));
  
  // Store parser reference for callbacks to access
  (callbacks as any)._parser = parser;

  try {
    const isValidationCall = prompt === VALIDATION_PROMPT;
    const requestBody: any = {
      message: prompt,
      conversation_history: conversationHistory,
      stream: true,
    };

    // Add images to request if provided (only for non-validation calls)
    if (images && images.length > 0 && !isValidationCall) {
      try {
        requestBody.images = toImageData(images);
        console.log('📸 Including', images.length, 'images in request');
      } catch (error) {
        console.error('❌ Error processing images:', error);
        callbacks.onError?.('Failed to process image attachments. Please try again.');
        return { fullResponse: '', finishReason: 'error' };
      }
    }

    // Add web search parameters if provided (only for non-validation calls)
    if (webSearchEnabled && !isValidationCall) {
      requestBody.web_search_enabled = true;
      console.log('🔍 Web search enabled for this request');
    }

    // Use Gemini 2.5 Pro for validation calls without thinking budget limitation
    if (isValidationCall) {
      requestBody.model_override = "gemini-2.5-pro"; // Ensure we're using Pro
    }

    const response = await fetch(`${apiBaseUrl}/api/v1/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(requestBody),
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
    let lastFinishReason: string | null = null;
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
            try {
              const parsed = JSON.parse(data);
              console.log('✅ Parsed JSON data:', parsed);
              
              // Handle completion signal
              if (parsed.done) {
                console.log('🏁 Received completion signal with finish_reason:', parsed.finish_reason);
                lastFinishReason = parsed.finish_reason;
                // Just store the finish reason, don't make recursive calls
              }
              
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
          try {
            const parsed = JSON.parse(data);
            if (parsed.done) {
              lastFinishReason = parsed.finish_reason;
              // Check for continuation after processing final buffer
              if (isTruncationFinishReason(lastFinishReason) || isNullResponse(fullResponse)) {
                if (segmentCount < MAX_RESPONSE_SEGMENTS - 1) {
                  console.log('🔄 Response truncated in final buffer, continuing...', { finishReason: lastFinishReason, segmentCount });
                  
                  const updatedHistory = [...conversationHistory];
                  if (fullResponse.trim()) {
                    updatedHistory.push({ role: 'assistant', content: fullResponse });
                  }
                  updatedHistory.push({ role: 'user', content: CONTINUE_PROMPT });
                  
                  const continuationResponse = await streamAgentResponse(CONTINUE_PROMPT, callbacks, updatedHistory, segmentCount + 1);
                  return fullResponse + continuationResponse;
                } else {
                  console.warn('⚠️ Maximum continuation segments reached in final buffer, stopping');
                }
              }
              
              // Check if we need to perform validation
              const isValidationCall = prompt === VALIDATION_PROMPT;
              
              if (lastFinishReason === 'STOP' && !isValidationCall && fullResponse.trim()) {
                console.log('🔍 Finish reason is STOP in final buffer, starting validation loop for completed multi-segment response...');
                
                // Update conversation history with current response
                const updatedHistory = [...conversationHistory];
                updatedHistory.push({ role: 'assistant', content: fullResponse });
                
                // Perform validation loop
                const validationResponse = await performValidationLoop(updatedHistory, callbacks, segmentCount);
                
                // Return combined response
                return fullResponse + validationResponse;
              }
              continue;
            }
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
    
    console.log('📊 Returning full response with length:', fullResponse.length);
    return { fullResponse, finishReason: lastFinishReason };
  } catch (error) {
    console.error('Error in streamAgentResponse:', error);
    
    // Clear validation flag in case of error
    messageQueue.setValidationInProgress(false);
    
    callbacks.onError?.(error instanceof Error ? error.message : 'Unknown error');
    return { fullResponse: '', finishReason: null };
  }
}

export async function generateStructuredProject(prompt: string, callbacks: GeminiParserCallbacks) {
  // Use the streamAgentResponse function which now returns a result object
  try {
    const result = await streamAgentResponse(prompt, callbacks, []);
    console.log('✅ generateStructuredProject completed with response length:', result.fullResponse.length, 'finishReason:', result.finishReason);
  } catch (error) {
    console.error('Error in generateStructuredProject:', error);
    callbacks.onError?.(error instanceof Error ? error.message : 'Unknown error');
  }
}

// Removed handleStructuredResponse function - now using bolt-style XML parsing

/**
 * Get a coding project suggestion from the AI using gemini-2.5-flash
 * @returns Promise<string> - The suggestion text
 */
export async function getSuggestion(): Promise<string> {
  const apiBaseUrl = 'http://localhost:8002';
  const suggestionPrompt = "You are an expert in conceptualizing innovative web applications, acting as a creative director for a cutting-edge digital studio. Your specialty is blending art, utility, and interactive design. Your task is to devise a single, creative project idea for a code agent to build, similar in style to concepts like 'a Pomodoro app with a Ghibli-inspired background' or 'a developer portfolio with a Matrix-style effect.' Follow these steps in your thought process: Select a Core Utility: First, choose a common and useful web application category. Examples: a habit tracker, a personal finance dashboard, an interactive resume/portfolio, a note-taking app, an educational explainer. Define a Striking Aesthetic: Second, select a unique and specific visual or thematic style, often from a completely different domain. Draw inspiration from any culture, historical period, or artistic movement. Examples: the moody, neon-lit aesthetic of cyberpunk films, the clean lines and tranquility of Scandinavian design, the bold geometric patterns of Art Deco architecture, the organic, flowing forms of Art Nouveau illustration. Synthesize the Concept: Third, combine the utility from Step 1 with the aesthetic from Step 2. Focus on creating a unique user experience. For example, instead of just a 'finance app,' think about what a 'finance dashboard designed with the bold aesthetic of Art Deco architecture' would look and feel like, visualizing expenses as elements on a grand, geometric display. Formulate the Command: Based on the steps above, formulate the final project idea. The idea must be for an interactive, useful, and aesthetically beautiful web application that uses pre-generated images. The final web app itself cannot generate new images or access third-party APIs. After completing your thought process, provide only the single, final project idea as your answer. The output must be a single sentence, phrased as a command for a code agent. What to Avoid: Do not suggest generic e-commerce sites or basic informational websites. The goal is a functional tool wrapped in a highly creative and specific visual theme. #it is important to never generate code";
  
  try {
    const requestBody = {
      message: suggestionPrompt,
      conversation_history: [],
      stream: false, // We want a complete response, not streaming
      model_override: "gemini-2.5-flash" // Use the fast model for suggestions
    };

    const response = await fetch(`${apiBaseUrl}/api/v1/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the suggestion text from the response
    if (data && data.response) {
      return data.response;
    } else if (data && data.message) {
      return data.message;
    } else if (data && data.content) {
      return data.content;
    } else {
      throw new Error('Invalid response format from suggestion API');
    }
  } catch (error) {
    console.error('Error getting suggestion:', error);
    throw new Error('Failed to get suggestion. Please try again.');
  }
}