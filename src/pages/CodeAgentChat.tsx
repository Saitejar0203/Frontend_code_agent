import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '../components/auth';
import useMobileDetection from '../components/chat/mobile/useMobileDetection';
import { WorkbenchLayout } from '../components/workbench/WorkbenchLayout';
import { WebContainerProvider, useWebContainer } from '@/components/WebContainer/WebContainerProvider';
import EnhancedChatInput from '../components/chat/EnhancedChatInput';

import { useStore } from '@nanostores/react';
import { chatStore, startNewChat, setGenerating, type Message, type ImageAttachment } from '@/lib/stores/chatStore';
import { workbenchStore, setFileTree, clearArtifacts, resetWorkbenchForNewConversation } from '@/lib/stores/workbenchStore';
import { sendChatMessage } from '@/services/codeAgentService';

// Interfaces moved to service layer - keeping component clean

// Inner component that has access to WebContainer context
const CodeAgentChatInner: React.FC = () => {
  const { webcontainer, actionRunner } = useWebContainer();
  const [inputValue, setInputValue] = useState('');
  const [isInChatMode, setIsInChatMode] = useState(false);
  const { isMobile } = useMobileDetection();
  
  // Use stores for state management
  const { messages, isGenerating } = useStore(chatStore);
  const { fileTree, previewUrl, artifactPanelVisible: isArtifactPanelVisible } = useStore(workbenchStore);

  // Testing code removed - cleanup complete

  // Add no-scroll class to body for mobile chat behavior
  useEffect(() => {
    document.body.classList.add('no-scroll');
    
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, []);

  const agentInfo = {
    name: "Code Agent",
    description: "Your personal AI web developer",
    icon: "💻"
  };

  const handleNewChat = async () => {
    try {
      // Use the new startNewChat function that clears conversation history too
      startNewChat();
      
      // Reset workbench UI state (artifacts, running commands, active tab)
      resetWorkbenchForNewConversation();
      
      // Reset local component state
      setIsInChatMode(false);
      setInputValue('');
      
      // Reboot the WebContainer to clear filesystem for a truly fresh start
      if (actionRunner) {
        await actionRunner.reboot();
      }
      
      console.log('🔄 Started new chat - cleared conversation history, UI state, and WebContainer filesystem');
    } catch (error) {
      console.error('❌ Error during new chat initialization:', error);
      // Still reset UI state even if WebContainer reboot fails
      resetWorkbenchForNewConversation();
      setIsInChatMode(false);
      setInputValue('');
    }
  };

  const handleSubmit = async (images?: ImageAttachment[], webSearchEnabled?: boolean, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;
    
    const userInput = inputValue;
    setInputValue('');
    setIsInChatMode(true);
    
    console.log('🚀 CodeAgentChat handleSubmit with', images?.length || 0, 'images, webSearch:', webSearchEnabled);
    // Use the service function to handle all streaming logic
    await sendChatMessage(userInput, webcontainer, actionRunner, images, webSearchEnabled);
  };
  
  // All streaming and parsing logic moved to codeAgentService.ts
  


  // Mobile view - show "use laptop" message
  if (isMobile) {
    return (
      <AuthGuard>
        <div className="h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          
          {/* Header */}
          <div className="content-layer flex items-center p-3 md:p-4 border-b border-white/30 bg-white/60 backdrop-blur-xl flex-shrink-0 min-h-[70px] md:min-h-[80px] relative">
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 pointer-events-none" />
            
            {/* Home button - positioned absolutely on the left */}
            <Link to="/" className="flex items-center space-x-1 md:space-x-2 text-gray-600 hover:text-gray-800 transition-all duration-200 flex-shrink-0 hover:bg-white/30 rounded-lg p-1.5 backdrop-blur-sm absolute left-3 md:left-4 z-10">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">Home</span>
              <span className="text-xs sm:hidden">Home</span>
            </Link>
            
            {/* Center content - truly centered */}
            <div className="flex-1 text-center relative z-10">
              <h1 className="text-base md:text-lg font-semibold text-gray-800">{agentInfo.name}</h1>
              <p className="text-xs md:text-sm text-gray-600 hidden sm:block">{agentInfo.description}</p>
            </div>
            
            {/* New Chat button - positioned absolutely on the right */}
            <Button 
              onClick={handleNewChat}
              className="bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium flex-shrink-0 h-8 md:h-10 px-2 md:px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm border border-emerald-500/30 hover:border-emerald-400/50 absolute right-3 md:right-4 z-10"
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline text-sm md:text-base">New Chat</span>
              <span className="sm:hidden text-xs">New</span>
            </Button>
          </div>

          {/* Mobile message */}
          <div className="content-layer flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md mx-auto">
              <Code className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Desktop Experience Required</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                The Code Agent works best on desktop devices for optimal code editing and development experience. Please use a laptop or desktop computer to access this feature.
              </p>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Desktop view - show chatbox
  return (
    <AuthGuard>
      <div className="h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="content-layer flex items-center p-3 md:p-4 border-b border-gray-200 bg-white/80 backdrop-blur-xl flex-shrink-0 min-h-[70px] md:min-h-[80px] relative shadow-sm">
          {/* Home button - positioned absolutely on the left */}
          <Link to="/" className="flex items-center space-x-1 md:space-x-2 text-gray-600 hover:text-gray-800 transition-all duration-200 flex-shrink-0 hover:bg-gray-100 rounded-lg p-1.5 absolute left-3 md:left-4 z-10">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Home</span>
            <span className="text-xs sm:hidden">Home</span>
          </Link>
          
          {/* Center content - truly centered */}
          <div className="flex-1 text-center relative z-10">
            <h1 className="text-base md:text-lg font-semibold text-gray-800">{agentInfo.name}</h1>
            <p className="text-xs md:text-sm text-gray-600 hidden sm:block">{agentInfo.description}</p>
          </div>
          
          {/* New Chat button - positioned absolutely on the right, only shown in chat mode */}
          {isInChatMode && (
            <Button 
              onClick={handleNewChat}
              className="bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium flex-shrink-0 h-8 md:h-10 px-2 md:px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-emerald-500/30 hover:border-emerald-400/50 absolute right-3 md:right-4 z-10"
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline text-sm md:text-base">New Chat</span>
              <span className="sm:hidden text-xs">New</span>
            </Button>
          )}
        </div>

        {/* Main content */}
        {!isInChatMode ? (
          /* Initial centered chatbox */
          <div className="content-layer flex-1 flex items-center justify-center p-6 dynamic-bg relative">
            {/* Dynamic background elements */}
            <div className="ambient-glow"></div>
            <div className="atmospheric-layer"></div>
            <div className="depth-layer-1"></div>
            <div className="depth-layer-2"></div>
            <div className="bg-blob-1"></div>
            <div className="bg-blob-2"></div>
            <div className="bg-blob-3"></div>
            <div className="bg-blob-4"></div>
            <div className="bg-blob-5"></div>
            <div className="bg-particle-1"></div>
            <div className="bg-particle-2"></div>
            <div className="bg-particle-3"></div>
            <div className="shimmer-overlay"></div>
            <div className="w-full max-w-2xl mx-auto relative z-20">
              <div className="text-center mb-8 relative z-20">
                <Code className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Code without Code</h2>
                <p className="text-gray-600">Powered by Gemini 2.5 Pro</p>
              </div>
              
              <div className="space-y-4 relative z-20">
                <EnhancedChatInput
                  value={inputValue}
                  onChange={setInputValue}
                  onSend={(images, webSearchEnabled) => handleSubmit(images, webSearchEnabled)}
                  disabled={false}
                  className="bg-white rounded-2xl shadow-xl border-0 relative z-20"
                  showPlaceholder={true}
                  showSuggestIdea={true}
                />
              </div>
              

            </div>
          </div>
        ) : (
          /* Advanced Workbench Layout with resizable panels */
          <div className="flex-1 overflow-hidden">
            <WorkbenchLayout className="h-full" />
          </div>
        )}
      </div>
    </AuthGuard>
  );
};

// Main component that provides WebContainer context
const CodeAgentChat: React.FC = () => {
  return (
    <WebContainerProvider>
      <CodeAgentChatInner />
    </WebContainerProvider>
  );
};

export default CodeAgentChat;