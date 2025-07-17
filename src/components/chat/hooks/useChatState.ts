import React, { useState, useEffect } from 'react';
import { ChatSession, AgentInfo } from '../types';
import { saveChatSessions, loadChatSessions, generateStorageKey } from '../utils/chatStorage';
import { createDefaultSession, generateUserId } from '../utils/chatUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/contexts/SessionContext';

interface UseChatStateProps {
  agentInfo: AgentInfo;
  graphType: string;
}

export const useChatState = ({ agentInfo, graphType }: UseChatStateProps) => {
  const { user, session } = useAuth();
  const { sessionId } = useSession();
  
  // Create a unique storage key that includes both sessionId and graphType
  const storageKey = generateStorageKey(sessionId || 'default', graphType);
  
  // Generate a unique user ID for this browser session
  const [userId] = useState(() => generateUserId(user));

  // Initialize chatSessions with sessionStorage persistence
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    if (!sessionId) {
      // If there's no session ID yet, start with a default session.
      return [createDefaultSession(agentInfo)];
    }

    const loadedData = loadChatSessions(storageKey);
    if (loadedData) {
      return loadedData.sessions;
    }
    
    // If no saved data is found, initialize with a default new chat session.
    return [createDefaultSession(agentInfo)];
  });
  
  // Initialize currentSessionId with localStorage persistence
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    if (!sessionId) return "1";
    
    const loadedData = loadChatSessions(storageKey);
    if (loadedData) {
      return loadedData.currentSessionId;
    }
    
    return "1";
  });

  const [checkpointId, setCheckpointId] = useState<string | null>(null);

  const currentSession = chatSessions.find(session => session.id === currentSessionId);

  // Save chat sessions to localStorage whenever they change
  useEffect(() => {
    if (!sessionId) return;
    
    saveChatSessions(storageKey, chatSessions, currentSessionId);
  }, [chatSessions, currentSessionId, sessionId, storageKey]);

  const updateChatSessions = (updater: (prev: ChatSession[]) => ChatSession[]) => {
    setChatSessions(updater);
  };

  const addNewSession = (newSession: ChatSession) => {
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setCheckpointId(null); // Reset checkpoint ID for fresh conversation
  };

  return {
    chatSessions,
    setChatSessions,
    updateChatSessions,
    currentSessionId,
    setCurrentSessionId,
    currentSession,
    checkpointId,
    setCheckpointId,
    userId,
    sessionId,
    session,
    addNewSession
  };
};

export default useChatState;