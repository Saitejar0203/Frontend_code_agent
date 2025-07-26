import { map } from 'nanostores';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  type?: 'text' | 'artifact';
  isStreaming?: boolean;
}

export interface ChatState {
  messages: Message[];
  isGenerating: boolean;
  currentSessionId: string | null;
  error: string | null;
}

export const chatStore = map<ChatState>({
  messages: [],
  isGenerating: false,
  currentSessionId: null,
  error: null,
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