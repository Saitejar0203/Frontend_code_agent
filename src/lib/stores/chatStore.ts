import { map } from 'nanostores';

export interface ImageAttachment {
  id: string;
  file: File;
  preview: string;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'error';
  uploadProgress?: number;
  error?: string;
  url?: string; // URL after successful upload
}

export interface Message {
  id: string;
  content: string; // Processed content for display
  rawContent?: string; // Original raw content with XML tags (for agent messages)
  sender: 'user' | 'agent';
  timestamp: Date;
  type?: 'text' | 'artifact';
  isStreaming?: boolean;
  images?: ImageAttachment[]; // Image attachments
}

export interface ConversationEntry {
  role: 'user' | 'assistant';
  content: string; // Raw content for API requests
  timestamp: Date;
}

export interface FileModificationSummary {
  filesCreated: string[];
  filesModified: string[];
  commandsExecuted: string[];
  timestamp: Date;
}

export type AssistantStatus = 
  | 'idle'          // Doing nothing
  | 'thinking'      // Initial API call, waiting for the first byte
  | 'generating'    // Streaming code or text
  | 'continuing'    // Preparing for a continuation call (due to token limit)
  | 'validating'    // Starting the validation loop
  | 'validating_thinking' // Making the validation API call
  | 'validating_generating' // Streaming corrective code from validation
  | 'completed';    // Process finished, status bar will hide

export interface ChatState {
  messages: Message[];
  isGenerating: boolean;
  isThinking: boolean;
  currentSessionId: string | null;
  error: string | null;
  conversationHistory: ConversationEntry[];
  fileModifications: FileModificationSummary[];
  assistantStatus: AssistantStatus;
  statusMessage: string;
  statusStartTime: Date | null;
}

export const chatStore = map<ChatState>({
  messages: [],
  isGenerating: false,
  isThinking: false,
  currentSessionId: null,
  error: null,
  conversationHistory: [],
  fileModifications: [],
  assistantStatus: 'idle',
  statusMessage: '',
  statusStartTime: null,
});

// Actions
export function addMessage(message: Message) {
  const currentMessages = chatStore.get().messages;
  chatStore.setKey('messages', [...currentMessages, message]);
}

export function updateLastMessage(content: string) {
  const currentMessages = chatStore.get().messages;
  if (currentMessages.length > 0) {
    const lastMessage = currentMessages[currentMessages.length - 1];
    if (lastMessage.sender === 'agent') {
      const updatedMessages = [...currentMessages];
      updatedMessages[updatedMessages.length - 1] = {
        ...lastMessage,
        content: lastMessage.content + content,
      };
      chatStore.setKey('messages', updatedMessages);
    }
  }
}

export function setGenerating(isGenerating: boolean) {
  chatStore.setKey('isGenerating', isGenerating);
}

export function setThinking(isThinking: boolean) {
  chatStore.setKey('isThinking', isThinking);
}

export function setCurrentSession(sessionId: string) {
  chatStore.setKey('currentSessionId', sessionId);
}

export function setMessages(messages: Message[]) {
  chatStore.setKey('messages', messages);
}

export function clearMessages() {
  chatStore.setKey('messages', []);
}

export function setError(error: string | null) {
  chatStore.setKey('error', error);
}

export function updateMessage(messageId: string, updates: Partial<Message>) {
  const currentMessages = chatStore.get().messages;
  const updatedMessages = currentMessages.map(message => 
    message.id === messageId ? { ...message, ...updates } : message
  );
  chatStore.setKey('messages', updatedMessages);
}

// Conversation history management
export function addToConversationHistory(role: 'user' | 'assistant', content: string, rawContent?: string) {
  const currentHistory = chatStore.get().conversationHistory;
  const newEntry: ConversationEntry = {
    role,
    content: rawContent || content, // Use rawContent for agent messages to preserve XML tags
    timestamp: new Date()
  };
  chatStore.setKey('conversationHistory', [...currentHistory, newEntry]);
}

export function buildConversationHistory(): Array<{role: string, content: string}> {
  const history = chatStore.get().conversationHistory;
  return history.map(entry => ({
    role: entry.role,
    content: entry.content
  }));
}

// File modification tracking
export function addFileModification(summary: FileModificationSummary) {
  const currentModifications = chatStore.get().fileModifications;
  chatStore.setKey('fileModifications', [...currentModifications, summary]);
}

export function getLatestFileModifications(): FileModificationSummary | null {
  const modifications = chatStore.get().fileModifications;
  return modifications.length > 0 ? modifications[modifications.length - 1] : null;
}

// New chat functionality
export function startNewChat() {
  chatStore.setKey('messages', []);
  chatStore.setKey('conversationHistory', []);
  chatStore.setKey('fileModifications', []);
  chatStore.setKey('error', null);
  chatStore.setKey('isGenerating', false);
  chatStore.setKey('isThinking', false);
  chatStore.setKey('currentSessionId', null);
}

// Clear only UI messages while preserving conversation history

// Assistant status management
export function setAssistantStatus(
  status: AssistantStatus,
  message?: string
) {
  let statusMessage = message || '';
  
  // Set default messages for each status
  if (!message) {
    switch (status) {
      case 'thinking':
        statusMessage = 'Thinking...';
        break;
      case 'generating':
        statusMessage = 'Generating code...';
        break;
      case 'continuing':
        statusMessage = 'Model hit token limit, continuing response...';
        break;
      case 'validating':
        statusMessage = 'Let us validate the code for bugs...';
        break;
      case 'validating_thinking':
        statusMessage = 'Validating...';
        break;
      case 'validating_generating':
        statusMessage = 'Generating corrections...';
        break;
      case 'completed':
        statusMessage = 'Validation complete.';
        break;
      default:
        statusMessage = '';
    }
  }

  chatStore.setKey('assistantStatus', status);
  chatStore.setKey('statusMessage', statusMessage);

  // Set start time for active states, preserve for completed state
  if (status !== 'idle' && status !== 'completed') {
    chatStore.setKey('statusStartTime', new Date());
  } else if (status === 'idle') {
    chatStore.setKey('statusStartTime', null);
  }
}

export function setStatusMessage(message: string) {
  chatStore.setKey('statusMessage', message);
}

export function clearAssistantStatus() {
  chatStore.setKey('assistantStatus', 'idle');
  chatStore.setKey('statusMessage', '');
  chatStore.setKey('statusStartTime', null);
}

export function completeAssistantStatus(message?: string) {
  const startTime = chatStore.get().statusStartTime;
  const elapsedTime = startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : 0;
  
  chatStore.setKey('assistantStatus', 'completed');
  chatStore.setKey('statusMessage', message || `Completed in ${elapsedTime}s`);
  // Keep statusStartTime for elapsed time calculation
}

// Action to hide the status bar after a delay
export function completeAndHideStatus(message?: string) {
  setAssistantStatus('completed', message);
  setTimeout(() => {
    chatStore.setKey('assistantStatus', 'idle');
  }, 2000); // Hide after 2 seconds
}
export function clearUIMessages() {
  chatStore.setKey('messages', []);
  chatStore.setKey('error', null);
  chatStore.setKey('isGenerating', false);
  chatStore.setKey('isThinking', false);
}

// Image attachment management
export function addMessageWithImages(content: string, images?: ImageAttachment[]) {
  const message: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content,
    sender: 'user',
    timestamp: new Date(),
    type: 'text',
    images: images || []
  };
  addMessage(message);
  return message;
}

export function updateMessageImages(messageId: string, images: ImageAttachment[]) {
  const currentMessages = chatStore.get().messages;
  const updatedMessages = currentMessages.map(message => 
    message.id === messageId ? { ...message, images } : message
  );
  chatStore.setKey('messages', updatedMessages);
}

export function updateImageInMessage(messageId: string, imageId: string, updates: Partial<ImageAttachment>) {
  const currentMessages = chatStore.get().messages;
  const updatedMessages = currentMessages.map(message => {
    if (message.id === messageId && message.images) {
      const updatedImages = message.images.map(img => 
        img.id === imageId ? { ...img, ...updates } : img
      );
      return { ...message, images: updatedImages };
    }
    return message;
  });
  chatStore.setKey('messages', updatedMessages);
}