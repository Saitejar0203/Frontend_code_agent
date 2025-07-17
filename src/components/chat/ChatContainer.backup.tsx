import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { ChatSession, Message, DebugLog, AgentInfo } from './types';
import ChatBackground from './ChatBackground';
import ChatHeader from './ChatHeader';
import MessageRenderer from './MessageRenderer';
import ExecutionFlow from './ExecutionFlow';
import SampleQuestions from './SampleQuestions';
import ChatInput from './ChatInput';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/contexts/SessionContext';
import { v4 as uuidv4 } from 'uuid';

interface ChatContainerProps {
  agentInfo: AgentInfo;
  sampleQuestions: string[];
  apiEndpoint: string;
  graphType?: string;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  agentInfo,
  sampleQuestions,
  apiEndpoint,
  graphType = "basic_perplexity"
}) => {
  const { user, session } = useAuth();
  const { sessionId } = useSession();
  
  // Create a unique storage key that includes both sessionId and graphType
  const storageKey = `chat_history_${sessionId}_${graphType}`;
  
  // Get API base URL from environment variable
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  
  // Generate a unique user ID for this browser session
  const [userId] = useState(() => {
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
  });

  // Removed automatic thread clearing on page refresh/mount to enable persistent conversations
  // Conversations will now persist across page refreshes and only clear when user clicks "New Chat"
  
  const [currentMessage, setCurrentMessage] = useState("");
  
  // Initialize chatSessions with sessionStorage persistence
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    if (!sessionId) {
      // If there's no session ID yet, start with a default session.
      return [{
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
      }];
    }

    try {
       // Try to load the saved chat history from localStorage using the unique storage key.
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
         
         return hydratedSessions;
       }
     } catch (error) {
       console.error("Failed to load or parse chat history from localStorage", error);
       // If parsing fails, fall back to the default state.
     }
    
    // If no saved data is found, initialize with a default new chat session.
    return [{
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
    }];
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Initialize currentSessionId with localStorage persistence
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    if (!sessionId) return "1";
    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        return JSON.parse(savedData).currentSessionId || "1";
      }
    } catch (error) {
      return "1";
    }
    return "1";
  });
  const [checkpointId, setCheckpointId] = useState<string | null>(null);
  const [executionFlowStates, setExecutionFlowStates] = useState<{[key: string]: {isExpanded: boolean, isAnimating: boolean}}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const executionFlowRef = useRef<HTMLDivElement>(null);

  const currentSession = chatSessions.find(session => session.id === currentSessionId);

  // Save chat sessions to localStorage whenever they change
  useEffect(() => {
    if (!sessionId) return;
    
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
  }, [chatSessions, currentSessionId, sessionId, storageKey]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const messagesContainer = messagesEndRef.current.closest('.overflow-y-auto');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  };

  const scrollToLatestExecutionFlow = () => {
    console.log('🔄 scrollToLatestExecutionFlow called');
    
    // Find the messages container
    const messagesContainer = document.querySelector('.overflow-y-auto.min-h-0');
    if (!messagesContainer) {
      console.log('❌ messagesContainer not found');
      return;
    }
    
    // Get header height - use more reliable selectors that match the actual header structure
    const header = document.querySelector('.content-layer > div:first-child') || // Direct child approach
                 document.querySelector('div[class*="min-h-[70px]"]') ||        // Min height approach
                 document.querySelector('div[class*="min-h-[80px]"]') ||
                 document.querySelector('.flex.items-center.justify-between[class*="border-b"]');
    
    let headerHeight = 80; // Default fallback
    if (header) {
      headerHeight = header.getBoundingClientRect().height;
      console.log('✅ Found header element, actual height:', headerHeight);
    } else {
      const isMobile = window.innerWidth < 768;
      headerHeight = isMobile ? 70 : 80;
      console.log('⚠️ Header element not found, using fallback height:', headerHeight);
    }
    
    console.log('📏 headerHeight:', headerHeight);
    
    // Find the latest execution flow element
    let executionFlowElement = null;
    
    // Try using the ref first
    if (executionFlowRef.current) {
      executionFlowElement = executionFlowRef.current;
      console.log('✅ Found execution flow via ref');
    } else {
      // Fallback: find the last execution flow in the DOM
      const allExecutionFlows = messagesContainer.querySelectorAll('.bg-gradient-to-r');
      if (allExecutionFlows.length > 0) {
        executionFlowElement = allExecutionFlows[allExecutionFlows.length - 1];
        console.log('✅ Found execution flow via DOM query');
      }
    }
    
    if (!executionFlowElement) {
      console.log('❌ No execution flow element found');
      return;
    }
    
    // Calculate scroll position to place execution flow just below header
    const elementRect = executionFlowElement.getBoundingClientRect();
    const containerRect = messagesContainer.getBoundingClientRect();
    
    // Calculate the element's current position within the scrollable container
    const elementOffsetInContainer = messagesContainer.scrollTop + elementRect.top - containerRect.top;
    
    // Target scroll position: element position minus header height minus small offset
    const targetScrollTop = elementOffsetInContainer - headerHeight - 20;
    
    console.log('📐 elementRect:', elementRect);
    console.log('📐 containerRect:', containerRect);
    console.log('📜 current scrollTop:', messagesContainer.scrollTop);
    console.log('🎯 elementOffsetInContainer:', elementOffsetInContainer);
    console.log('🎯 targetScrollTop:', targetScrollTop);
    
    // Scroll to position the execution flow below the header
    messagesContainer.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth'
    });
    
    console.log('✅ Scrolled to execution flow, final position:', Math.max(0, targetScrollTop));
  };

  // Add useLayoutEffect for execution flow scrolling
  useLayoutEffect(() => {
    // Only scroll when there's a new execution flow appearing
    if (currentSession?.messages.length > 0) {
      const lastMessage = currentSession.messages[currentSession.messages.length - 1];
      if (lastMessage.sender === 'agent' && lastMessage.debugLogs && lastMessage.debugLogs.length > 0) {
        // Use multiple timeouts to ensure reliable scrolling
        const timer1 = setTimeout(() => {
          scrollToLatestExecutionFlow();
        }, 100);
        const timer2 = setTimeout(() => {
          scrollToLatestExecutionFlow();
        }, 300);
        const timer3 = setTimeout(() => {
          scrollToLatestExecutionFlow();
        }, 500);
        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
          clearTimeout(timer3);
        };
      }
    }
  }, [currentSession?.messages]);

  // Additional effect to handle execution flow updates during generation
  useLayoutEffect(() => {
    if (currentSession?.messages.length > 0 && isGenerating) {
      const lastMessage = currentSession.messages[currentSession.messages.length - 1];
      if (lastMessage.sender === 'agent' && lastMessage.debugLogs && lastMessage.debugLogs.length > 0) {
        // Scroll when new debug logs appear during generation
        const timer = setTimeout(() => {
          scrollToLatestExecutionFlow();
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [currentSession?.messages.map(m => m.debugLogs?.length).join(','), isGenerating]);

  const handleSendMessage = () => {
    if (!currentMessage.trim() || !currentSession) return;

    setIsGenerating(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentMessage,
      sender: "user",
      timestamp: new Date()
    };

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "",
      sender: "agent",
      timestamp: new Date(),
      isLoading: true,
      debugLogs: []
    };

    // Add both messages to the current session
    setChatSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? {
            ...session,
            messages: [...session.messages, userMessage, aiMessage],
            lastActivity: new Date()
          }
        : session
    ));

    const messageToSend = currentMessage;
    setCurrentMessage("");

    // Helper functions for message updates
    const patchMessage = (id: string, patch: Partial<Message>) => {
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? {
                ...session,
                messages: session.messages.map((m) =>
                  m.id === id ? { ...m, ...patch } : m
                ),
              }
            : session
        )
      );
    };

    const pushDebug = (id: string, log: DebugLog) => {
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? {
                ...session,
                messages: session.messages.map((m) =>
                  m.id === id
                    ? { ...m, debugLogs: [...(m.debugLogs || []), log] }
                    : m
                ),
              }
            : session
        )
      );
    };

    // Start streaming response
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
    if (session?.access_token) {
      params.append('token', session.access_token);
    }
    
    const url = `${apiBaseUrl}/chat_stream/${encodeURIComponent(messageToSend)}?${params.toString()}`;
    const es = new EventSource(url);

    let modelBuffer = "";

    es.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data);

        // Handle LangGraph events first
        if (d.event === "on_chain_start" && d.name === "LangGraph") {
          setIsGenerating(false);
          pushDebug(aiMessage.id, {
            phase: "chain_start",
            name: d.name,
            input: d.data?.input,
          });
          setTimeout(() => scrollToLatestExecutionFlow(), 150);
          setTimeout(() => scrollToLatestExecutionFlow(), 300);
          return;
        }

        if (d.event === "on_chain_start") {
          pushDebug(aiMessage.id, {
            phase: "chain_start",
            name: d.name,
            input: d.data?.input,
          });
          // Scroll to execution flow when it first appears (for the first chain start)
          const currentMessage = currentSession?.messages.find(msg => msg.id === aiMessage.id);
          if (!currentMessage?.debugLogs?.length) {
            setTimeout(() => scrollToLatestExecutionFlow(), 150);
            setTimeout(() => scrollToLatestExecutionFlow(), 300);
          }
          return;
        }
        
        if (d.event === "on_chain_stream") {
          pushDebug(aiMessage.id, {
            phase: "chain_stream",
            name: d.name,
            input: d.data,
          });
          return;
        }
        
        if (d.event === "on_chain_end") {
          pushDebug(aiMessage.id, {
            phase: "chain_end",
            name: d.name,
            output: d.data?.output,
          });
          
          if (d.name === "LangGraph") {
            patchMessage(aiMessage.id, { isLoading: false });
            es.close();
          }
          return;
        }

        // Handle legacy event types
        switch (d.type) {
          case "checkpoint":
            setCheckpointId(d.checkpoint_id);
            // Update chat session title if chat_name is provided
            if (d.chat_name && currentSessionId) {
              setChatSessions((prev) =>
                prev.map((session) =>
                  session.id === currentSessionId
                    ? { ...session, title: d.chat_name }
                    : session
                )
              );
            }
            break;

          case "model_start":
            pushDebug(aiMessage.id, {
              phase: "model_start",
              name: d.model,
              input: d.input,
            });
            // Scroll to execution flow when it first appears (legacy events)
            const currentMessage = currentSession?.messages.find(msg => msg.id === aiMessage.id);
            if (!currentMessage?.debugLogs?.length) {
              setTimeout(() => scrollToLatestExecutionFlow(), 150);
              setTimeout(() => scrollToLatestExecutionFlow(), 300);
            }
            break;

          case "model_end":
            pushDebug(aiMessage.id, {
              phase: "model_end",
              name: d.model,
              output: d.output,
            });
            break;

          case "content":
            modelBuffer += d.content;
            patchMessage(aiMessage.id, { content: modelBuffer, isLoading: false });
            break;

          case "model_content":
            // Add intermediate model output to execution flow, not chat
            pushDebug(aiMessage.id, {
              phase: "model_end_final",
              name: "Model Output",
              output: d.content,
            });
            break;

          case "model_stream":
            // Add streaming model content to execution flow
            pushDebug(aiMessage.id, {
              phase: "model_stream",
              name: "Model Stream",
              output: d.content,
            });
            break;

          case "tool_start":
            pushDebug(aiMessage.id, {
              phase: "tool_start",
              name: d.tool,
              input: d.input,
            });
            break;

          case "tool_end":
            pushDebug(aiMessage.id, {
              phase: "tool_end",
              name: d.tool,
              output: d.output,
            });
            break;

          case "agent":
            pushDebug(aiMessage.id, {
              phase: "agent_action",
              name: d.agent_name,
              input: d.agent_message,
              toolCalls: d.agent_tool_calls
            });
            break;

          case "tool":
            pushDebug(aiMessage.id, {
              phase: "tool_execution",
              name: d.tool_name,
              output: d.tool_output
            });
            break;

          case "final_message":
            patchMessage(aiMessage.id, { content: d.content, isLoading: false });
            setIsGenerating(false);
            break;

          case "end":
            patchMessage(aiMessage.id, { isLoading: false });
            setIsGenerating(false);
            es.close();
            break;

          case "error":
            patchMessage(aiMessage.id, { content: "Server error.", isLoading: false });
            setIsGenerating(false);
            es.close();
            break;
        }
      } catch (err) {
        console.error("Parse error", err, ev.data);
      }
    };

    es.onerror = () => {
      patchMessage(aiMessage.id, { content: "Connection error.", isLoading: false });
      setIsGenerating(false);
      es.close();
    };
  };

  const startNewChat = async () => {
    try {
      // Clear the thread for this session and graph type
      const clearParams = new URLSearchParams();
      // Prefer session-based clearing, fallback to user-based
      if (sessionId) {
        clearParams.append('session_id', sessionId);
      } else {
        clearParams.append('user_id', userId);
      }
      clearParams.append('graph_type', graphType);
      
      await fetch(`${apiBaseUrl}/threads/clear?${clearParams.toString()}`, {
        method: 'POST'
      });
    } catch (error) {
      console.warn('Failed to clear thread:', error);
    }

    const newSession: ChatSession = {
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

    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setCheckpointId(null); // Reset checkpoint ID for fresh conversation
    setIsMobileHistoryOpen(false); // Close mobile history when starting new chat
  };

  const handleSampleQuestion = (question: string) => {
    setCurrentMessage(question);
  };



  return (
    <div className="h-screen dynamic-bg flex flex-col relative overflow-hidden">
      <ChatBackground />
      
      <div className="content-layer flex-1 flex flex-col relative z-10 h-full overflow-hidden">
        <ChatHeader 
          agent={agentInfo}
          onNewChat={startNewChat}
        />

        <div className="flex flex-1 min-h-0 relative overflow-hidden">
          {/* Main Chat Content Area - Full Width */}
          <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden w-full">
            {/* Messages Area - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="px-2 py-2 md:p-4">
                <div className="space-y-4 md:space-y-6 pb-4">
                  {currentSession?.messages.map((message) => (
                    <div 
                      key={message.id} 
                      className="flex flex-col"
                      data-message-id={message.id}
                      data-sender={message.sender}
                    >
                      {/* Execution Flow - Above message content */}
                      {message.sender === 'agent' && message.debugLogs && message.debugLogs.length > 0 && (
                        <ExecutionFlow 
                          ref={executionFlowRef}
                          messageId={message.id}
                          logs={message.debugLogs}
                          isGenerating={isGenerating && message.id === currentSession?.messages[currentSession.messages.length - 1]?.id}
                          executionFlowStates={executionFlowStates}
                          setExecutionFlowStates={setExecutionFlowStates}
                        />
                      )}
                      
                      <div
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <MessageRenderer message={message} />
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Sample Questions - Fixed position above input */}
            {currentSession && currentSession.messages.length <= 1 && (
              <SampleQuestions 
                questions={sampleQuestions}
                onQuestionSelect={handleSampleQuestion}
              />
            )}

            {/* Input Bar - Fixed at bottom */}
            <ChatInput
              value={currentMessage}
              onChange={setCurrentMessage}
              onSend={handleSendMessage}
              placeholder={`Message ${agentInfo.name}...`}
              disabled={isGenerating}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;