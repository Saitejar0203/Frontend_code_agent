import React, { useState, useEffect } from 'react';
import { AgentInfo } from './types';
import ChatBackground from './ChatBackground';
import ChatHeader from './ChatHeader';
import MessageRenderer from './MessageRenderer';
import ExecutionFlow from './ExecutionFlow';
import SampleQuestions from './SampleQuestions';
import ChatInput from './ChatInput';
import RateLimitBanner from './RateLimitBanner';
import MobileChatLayout from './mobile/MobileChatLayout';
import useMobileDetection from './mobile/useMobileDetection';
import useChatState from './hooks/useChatState';
import useChatStream from './hooks/useChatStream';
import useChatScroll from './hooks/useChatScroll';
import { createNewSession, buildClearThreadUrl } from './utils/chatUtils';

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
  // Get API base URL from environment variable
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  
  // Mobile detection
  const { isMobile, isMobileHistoryOpen, setIsMobileHistoryOpen } = useMobileDetection();
  
  // Chat state management
  const {
    chatSessions,
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
  } = useChatState({ agentInfo, graphType });
  
  // Current message state
  const [currentMessage, setCurrentMessage] = useState("");
  
  // Execution flow states
  const [executionFlowStates, setExecutionFlowStates] = useState<{[key: string]: {isExpanded: boolean, isAnimating: boolean}}>({});
  
  // Add no-scroll class to body for mobile chat behavior
  useEffect(() => {
    document.body.classList.add('no-scroll');
    
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, []);
  
  // Scroll management
  const {
    messagesEndRef,
    executionFlowRef,
    scrollToBottom,
    scrollToLatestExecutionFlow
  } = useChatScroll(currentSession, false); // Initial value, will be updated
  
  // Chat streaming
  const { isGenerating, handleSendMessage } = useChatStream({
    currentSession,
    currentSessionId,
    updateChatSessions,
    checkpointId,
    setCheckpointId,
    apiBaseUrl,
    graphType,
    sessionId,
    userId,
    accessToken: session?.access_token,
    scrollToLatestExecutionFlow
  });

  const handleSendMessageWrapper = () => {
    if (!currentMessage.trim()) return;
    handleSendMessage(currentMessage);
    setCurrentMessage("");
  };

  const handleSampleQuestion = (question: string) => {
    setCurrentMessage(question);
  };

  const startNewChat = async () => {
    try {
      // Clear the thread for this session and graph type
      const clearUrl = buildClearThreadUrl(apiBaseUrl, sessionId, userId, graphType);
      
      await fetch(clearUrl, {
        method: 'POST'
      });
    } catch (error) {
      console.warn('Failed to clear thread:', error);
    }

    const newSession = createNewSession(agentInfo);
    addNewSession(newSession);
    setIsMobileHistoryOpen(false); // Close mobile history when starting new chat
  };

  // Render mobile layout if on mobile
  if (isMobile) {
    return (
      <MobileChatLayout
        agentInfo={agentInfo}
        sampleQuestions={sampleQuestions}
        apiEndpoint={apiEndpoint}
        graphType={graphType}
        chatSessions={chatSessions}
        updateChatSessions={updateChatSessions}
        currentSessionId={currentSessionId}
        setCurrentSessionId={setCurrentSessionId}
        currentSession={currentSession}
        checkpointId={checkpointId}
        setCheckpointId={setCheckpointId}
        userId={userId}
        sessionId={sessionId}
        session={session}
        addNewSession={addNewSession}
        currentMessage={currentMessage}
        setCurrentMessage={setCurrentMessage}
        executionFlowStates={executionFlowStates}
        setExecutionFlowStates={setExecutionFlowStates}
        isGenerating={isGenerating}
        handleSendMessage={handleSendMessage}
        messagesEndRef={messagesEndRef}
        executionFlowRef={executionFlowRef}
        isMobileHistoryOpen={isMobileHistoryOpen}
        setIsMobileHistoryOpen={setIsMobileHistoryOpen}
        apiBaseUrl={apiBaseUrl}
      />
    );
  }

  // Desktop layout
  return (
    <div className="h-screen dynamic-bg flex flex-col relative overflow-hidden">
      <ChatBackground />
      
      <div className="content-layer flex-1 flex flex-col relative z-10 h-full overflow-hidden">
        <ChatHeader 
          agent={agentInfo}
          onNewChat={startNewChat}
        />
        
        {/* Rate Limit Banner */}
        <RateLimitBanner />

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
              onSend={handleSendMessageWrapper}
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