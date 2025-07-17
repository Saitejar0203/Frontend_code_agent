import { v4 as uuidv4 } from 'uuid';
import { ChatSession, Message, AgentInfo } from '../types';

export const generateUserId = (user?: { id: string } | null): string => {
  // If user is authenticated, use their UUID
  if (user?.id) {
    return user.id;
  }
  
  // For unauthenticated users, generate or retrieve a UUID
  let storedUserId = localStorage.getItem('chat_user_id');
  if (!storedUserId) {
    storedUserId = uuidv4(); // Generate a proper UUID
    localStorage.setItem('chat_user_id', storedUserId);
  }
  return storedUserId;
};

export const createDefaultSession = (agentInfo: AgentInfo): ChatSession => {
  return {
    id: "1",
    title: "New Chat",
    messages: [
      {
        id: "1",
        content: `Hello! I'm ${agentInfo.name}. ${agentInfo.description}. How can I assist you today?`,
        sender: "agent",
        timestamp: new Date(Date.now() - 3600000)
      }
    ],
    lastActivity: new Date(Date.now() - 3600000)
  };
};

export const createNewSession = (agentInfo: AgentInfo): ChatSession => {
  return {
    id: Date.now().toString(),
    title: "New Chat",
    messages: [
      {
        id: Date.now().toString(),
        content: `Hello! I'm ${agentInfo.name}. ${agentInfo.description}. How can I assist you today?`,
        sender: "agent",
        timestamp: new Date()
      }
    ],
    lastActivity: new Date()
  };
};

export const createUserMessage = (content: string): Message => {
  return {
    id: Date.now().toString(),
    content,
    sender: "user",
    timestamp: new Date()
  };
};

export const createAiMessage = (): Message => {
  return {
    id: (Date.now() + 1).toString(),
    content: "",
    sender: "agent",
    timestamp: new Date(),
    isLoading: true,
    debugLogs: []
  };
};

export const buildStreamUrl = (
  apiBaseUrl: string,
  message: string,
  checkpointId: string | null,
  graphType: string,
  sessionId: string | null,
  userId: string,
  accessToken?: string
): string => {
  const params = new URLSearchParams();
  if (checkpointId) params.append('checkpoint_id', checkpointId);
  params.append('graph_type', graphType);
  
  // Prefer session-based approach, fallback to user-based
  if (sessionId) {
    params.append('session_id', sessionId);
  } else {
    params.append('user_id', userId);
  }
  
  // Add authentication token if user is authenticated
  if (accessToken) {
    params.append('token', accessToken);
  }
  
  return `${apiBaseUrl}/chat_stream/${encodeURIComponent(message)}?${params.toString()}`;
};

export const buildClearThreadUrl = (
  apiBaseUrl: string,
  sessionId: string | null,
  userId: string,
  graphType: string
): string => {
  const clearParams = new URLSearchParams();
  // Prefer session-based clearing, fallback to user-based
  if (sessionId) {
    clearParams.append('session_id', sessionId);
  } else {
    clearParams.append('user_id', userId);
  }
  clearParams.append('graph_type', graphType);
  
  return `${apiBaseUrl}/threads/clear?${clearParams.toString()}`;
};