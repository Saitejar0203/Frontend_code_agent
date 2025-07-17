import React, { useRef, useEffect } from 'react';
import { ChatSession, AgentInfo } from '../types';
import ChatBackground from '../ChatBackground';
import ChatHeader from '../ChatHeader';
import MessageRenderer from '../MessageRenderer';
import ExecutionFlow from '../ExecutionFlow';
import SampleQuestions from '../SampleQuestions';
import ChatInput from '../ChatInput';
import RateLimitBanner from '../RateLimitBanner';
import MobileScrollManager from './MobileScrollManager';
import useMobileDetection from './useMobileDetection';
import useChatScroll from '../hooks/useChatScroll';
import { createNewSession, buildClearThreadUrl } from '../utils/chatUtils';

interface MobileChatLayoutProps {
  agentInfo: AgentInfo;
  sampleQuestions: string[];
  apiEndpoint: string;
  graphType?: string;
  chatSessions: ChatSession[];
  updateChatSessions: (sessions: ChatSession[]) => void;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  currentSession: ChatSession | undefined;
  checkpointId: string | null;
  setCheckpointId: (id: string | null) => void;
  userId: string;
  sessionId: string;
  session: any;
  addNewSession: (session: ChatSession) => void;
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  executionFlowStates: {[key: string]: {isExpanded: boolean, isAnimating: boolean}};
  setExecutionFlowStates: React.Dispatch<React.SetStateAction<{[key: string]: {isExpanded: boolean, isAnimating: boolean}}>>;
  isGenerating: boolean;
  handleSendMessage: (message: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  executionFlowRef: React.RefObject<HTMLDivElement>;
  isMobileHistoryOpen: boolean;
  setIsMobileHistoryOpen: (open: boolean) => void;
  apiBaseUrl: string;
}

const MobileChatLayout: React.FC<MobileChatLayoutProps> = ({
  agentInfo,
  sampleQuestions,
  apiEndpoint,
  graphType = "basic_perplexity",
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
  addNewSession,
  currentMessage,
  setCurrentMessage,
  executionFlowStates,
  setExecutionFlowStates,
  isGenerating,
  handleSendMessage,
  messagesEndRef,
  executionFlowRef,
  isMobileHistoryOpen,
  setIsMobileHistoryOpen,
  apiBaseUrl
}) => {
  const layoutRef = useRef<HTMLDivElement>(null);

  // This effect dynamically sets the container height to the browser's visible viewport height.
  // This is the fix for the mobile browser address bar issue that makes `100vh` unreliable.
  useEffect(() => {
    const setHeight = () => {
      if (layoutRef.current) {
        // Use Visual Viewport API if available (better for keyboard handling)
        if ('visualViewport' in window) {
          const visualViewport = window.visualViewport!;
          layoutRef.current.style.height = `${visualViewport.height}px`;
        } else {
          // Fallback to window.innerHeight
          layoutRef.current.style.height = `${window.innerHeight}px`;
        }
      }
    };

    setHeight();
    
    // Listen to both resize and visual viewport changes
    if ('visualViewport' in window) {
      const visualViewport = window.visualViewport!;
      visualViewport.addEventListener('resize', setHeight);
      visualViewport.addEventListener('scroll', setHeight);
      
      return () => {
        visualViewport.removeEventListener('resize', setHeight);
        visualViewport.removeEventListener('scroll', setHeight);
      };
    } else {
      window.addEventListener('resize', setHeight);
      return () => window.removeEventListener('resize', setHeight);
    }
  }, []);

  const { isMobile } = useMobileDetection();
  useChatScroll(currentSession, false);

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
      const clearUrl = buildClearThreadUrl(apiBaseUrl, sessionId, userId, graphType);
      await fetch(clearUrl, { method: 'POST' });
    } catch (error) {
      console.warn('Failed to clear thread:', error);
    }
    const newSession = createNewSession(agentInfo);
    addNewSession(newSession);
    setIsMobileHistoryOpen(false);
  };

  return (
    <div 
      ref={layoutRef} 
      className="mobile-chat-container dynamic-bg flex flex-col relative"
      style={{
        minHeight: '100vh',
        minHeight: '100dvh' // Modern dynamic viewport height
      }}
    >
      <ChatBackground />
      
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-b from-white/95 via-white/90 to-white/85 backdrop-blur-xl border-b border-white/30 flex-shrink-0 relative overflow-hidden">
        {/* Header glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/5 pointer-events-none" />
        <div className="relative">
          <ChatHeader 
            agent={agentInfo}
            onNewChat={startNewChat}
          />
        </div>
      </header>
      
      {/* Rate Limit Banner */}
      <RateLimitBanner />

      <MobileScrollManager 
        isMobile={isMobile}
        isGenerating={isGenerating}
        messagesEndRef={messagesEndRef}
      />
      
      {/* Main Content Area - Flexible */}
      <main className="flex-1 overflow-y-auto overscroll-contain relative z-10 min-w-0" style={{ touchAction: 'pan-y' }}>
        <div className="px-2 py-2 md:p-4 min-w-0">
          <div className="space-y-4 md:space-y-6 pb-4 min-w-0">
            {currentSession?.messages.map((message) => (
              <div 
                key={message.id} 
                className="flex flex-col min-w-0 overflow-hidden"
                data-message-id={message.id}
                data-sender={message.sender}
              >
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
                <div className={`flex min-w-0 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <MessageRenderer message={message} />
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Fixed Footer */}
       <footer className="sticky bottom-0 z-50 bg-white border-t border-gray-200 flex-shrink-0">
         <div>
           {currentSession && currentSession.messages.length <= 1 && (
             <div className="px-2 md:px-4 pt-2">
               <SampleQuestions 
                 questions={sampleQuestions}
                 onQuestionSelect={handleSampleQuestion}
               />
             </div>
           )}
           <div className="px-2 md:px-4 py-2">
             <ChatInput
               value={currentMessage}
               onChange={setCurrentMessage}
               onSend={handleSendMessageWrapper}
               placeholder={`Message ${agentInfo.name}...`}
               disabled={isGenerating}
             />
           </div>
         </div>
       </footer>
    </div>
  );
};

export default MobileChatLayout;