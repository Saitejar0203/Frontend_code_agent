import { map } from 'nanostores';

export interface Message {
  id: string;
  content: string; // Processed content for display
  rawContent?: string; // Original raw content with XML tags (for agent messages)
  sender: 'user' | 'agent';
  timestamp: Date;
  type?: 'text' | 'artifact';
  isStreaming?: boolean;
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

export interface ChatState {
  messages: Message[];
  isGenerating: boolean;
  isThinking: boolean;
  currentSessionId: string | null;
  error: string | null;
  conversationHistory: ConversationEntry[];
  fileModifications: FileModificationSummary[];
}

export const chatStore = map<ChatState>({
  messages: [],
  isGenerating: false,
  isThinking: false,
  currentSessionId: null,
  error: null,
  conversationHistory: [],
  fileModifications: [],
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
export function clearUIMessages() {
  chatStore.setKey('messages', []);
  chatStore.setKey('error', null);
  chatStore.setKey('isGenerating', false);
  chatStore.setKey('isThinking', false);
}