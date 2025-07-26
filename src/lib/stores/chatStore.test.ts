import { describe, it, expect, beforeEach } from 'vitest';
import {
  chatStore,
  addMessage,
  updateLastMessage,
  setGenerating,
  setCurrentSession,
  setMessages,
  clearMessages,
  setError,
  type Message
} from './chatStore';

describe('chatStore', () => {
  beforeEach(() => {
    // Reset store before each test
    chatStore.set({
      messages: [],
      isGenerating: false,
      currentSessionId: null,
      error: null,
    });
  });

  it('should add a message to the store', () => {
    const testMessage: Message = {
      id: '1',
      content: 'Hello, world!',
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    addMessage(testMessage);
    
    const state = chatStore.get();
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]).toEqual(testMessage);
  });

  it('should toggle isGenerating state', () => {
    expect(chatStore.get().isGenerating).toBe(false);
    
    setGenerating(true);
    expect(chatStore.get().isGenerating).toBe(true);
    
    setGenerating(false);
    expect(chatStore.get().isGenerating).toBe(false);
  });

  it('should update last message content when sender is agent', () => {
    const agentMessage: Message = {
      id: '1',
      content: 'Initial content',
      sender: 'agent',
      timestamp: new Date(),
    };

    addMessage(agentMessage);
    updateLastMessage(' - Updated');
    
    const state = chatStore.get();
    expect(state.messages[0].content).toBe('Initial content - Updated');
  });

  it('should not update last message when sender is user', () => {
    const userMessage: Message = {
      id: '1',
      content: 'User message',
      sender: 'user',
      timestamp: new Date(),
    };

    addMessage(userMessage);
    updateLastMessage(' - Should not update');
    
    const state = chatStore.get();
    expect(state.messages[0].content).toBe('User message');
  });

  it('should set current session ID', () => {
    const sessionId = 'session-123';
    setCurrentSession(sessionId);
    
    expect(chatStore.get().currentSessionId).toBe(sessionId);
  });

  it('should set messages array', () => {
    const messages: Message[] = [
      {
        id: '1',
        content: 'Message 1',
        sender: 'user',
        timestamp: new Date(),
      },
      {
        id: '2',
        content: 'Message 2',
        sender: 'agent',
        timestamp: new Date(),
      }
    ];

    setMessages(messages);
    
    const state = chatStore.get();
    expect(state.messages).toEqual(messages);
    expect(state.messages).toHaveLength(2);
  });

  it('should clear all messages', () => {
    const testMessage: Message = {
      id: '1',
      content: 'Test message',
      sender: 'user',
      timestamp: new Date(),
    };

    addMessage(testMessage);
    expect(chatStore.get().messages).toHaveLength(1);
    
    clearMessages();
    expect(chatStore.get().messages).toHaveLength(0);
  });

  it('should set and clear error', () => {
    const errorMessage = 'Something went wrong';
    
    setError(errorMessage);
    expect(chatStore.get().error).toBe(errorMessage);
    
    setError(null);
    expect(chatStore.get().error).toBe(null);
  });
});