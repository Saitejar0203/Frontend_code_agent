import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface SessionContextType {
  sessionId: string;
  generateNewSession: () => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'chat_session_id';

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize session ID on mount
  useEffect(() => {
    const initializeSession = () => {
      // Try to get existing session from localStorage
      const existingSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      
      if (existingSessionId) {
        setSessionId(existingSessionId);
      } else {
        // Generate new session ID if none exists
        const newSessionId = uuidv4();
        localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
        setSessionId(newSessionId);
      }
    };

    initializeSession();

    // Listen for storage changes (cross-tab synchronization)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_STORAGE_KEY && e.newValue) {
        setSessionId(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // BroadcastChannel for same-tab communication
    const broadcastChannel = new BroadcastChannel('session_sync');
    
    broadcastChannel.onmessage = (event) => {
      if (event.data.type === 'SESSION_UPDATED') {
        setSessionId(event.data.sessionId);
      } else if (event.data.type === 'SESSION_CLEARED') {
        // Generate new session when user logs out
        const newSessionId = uuidv4();
        localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
        setSessionId(newSessionId);
      }
    };

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      broadcastChannel.close();
    };
  }, []);

  const generateNewSession = () => {
    // Clear chat history for both agent types before generating new session
    const currentSessionId = sessionId;
    if (currentSessionId) {
      localStorage.removeItem(`chat_history_${currentSessionId}_basic_perplexity`);
      localStorage.removeItem(`chat_history_${currentSessionId}_multiagent`);
    }
    
    const newSessionId = uuidv4();
    localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
    setSessionId(newSessionId);
    
    // Broadcast to other tabs
    const broadcastChannel = new BroadcastChannel('session_sync');
    broadcastChannel.postMessage({
      type: 'SESSION_UPDATED',
      sessionId: newSessionId
    });
    broadcastChannel.close();
  };

  const clearSession = () => {
    // Clear chat history for both agent types before clearing session
    const currentSessionId = sessionId;
    if (currentSessionId) {
      localStorage.removeItem(`chat_history_${currentSessionId}_basic_perplexity`);
      localStorage.removeItem(`chat_history_${currentSessionId}_multiagent`);
    }
    
    localStorage.removeItem(SESSION_STORAGE_KEY);
    const newSessionId = uuidv4();
    localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
    setSessionId(newSessionId);
    
    // Broadcast to other tabs
    const broadcastChannel = new BroadcastChannel('session_sync');
    broadcastChannel.postMessage({
      type: 'SESSION_UPDATED',
      sessionId: newSessionId
    });
    broadcastChannel.close();
  };

  return (
    <SessionContext.Provider value={{
      sessionId,
      generateNewSession,
      clearSession
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};