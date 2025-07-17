import { ChatSession } from '../types';

export const saveChatSessions = (
  storageKey: string,
  chatSessions: ChatSession[],
  currentSessionId: string
) => {
  try {
    // Create a clean copy of sessions for persistence
    const sessionsToSave = chatSessions.map(session => ({
      ...session,
      messages: session.messages.map(msg => ({
        ...msg,
        // Reset isLoading state for persistence
        isLoading: false
      }))
    }));
    
    const dataToSave = {
      sessions: sessionsToSave,
      currentSessionId: currentSessionId
    };
    
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  } catch (error) {
    console.error("Failed to save chat history to localStorage", error);
  }
};

export const loadChatSessions = (storageKey: string): { sessions: ChatSession[], currentSessionId: string } | null => {
  try {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      
      // Important: Convert string timestamps back to Date objects
      const hydratedSessions = parsedData.sessions.map(session => ({
        ...session,
        lastActivity: new Date(session.lastActivity),
        messages: session.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      
      return {
        sessions: hydratedSessions,
        currentSessionId: parsedData.currentSessionId || "1"
      };
    }
  } catch (error) {
    console.error("Failed to load or parse chat history from localStorage", error);
  }
  
  return null;
};

export const generateStorageKey = (sessionId: string, graphType: string): string => {
  return `chat_history_${sessionId}_${graphType}`;
};