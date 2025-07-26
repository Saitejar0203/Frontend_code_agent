import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '../components/auth';
import useMobileDetection from '../components/chat/mobile/useMobileDetection';
import CodeChatInterface from '../components/code/CodeChatInterface';
import CodeTabs from '../components/code/CodeTabs';

import { actionRunner } from '@/lib/runtime/ActionRunner';
import { useStore } from '@nanostores/react';
import { chatStore, addMessage, clearMessages, setGenerating, updateMessage, type Message } from '@/lib/stores/chatStore';
import { filesStore, setFileTree } from '@/lib/stores/filesStore';
import { workbenchStore } from '@/lib/stores/workbenchStore';
import { artifactPanelVisible, clearArtifacts } from '@/lib/stores/artifactStore';
import { StreamingMessageParser } from '@/lib/runtime/StreamingMessageParser';
import type { ParserCallbacks } from '@/lib/runtime/StreamingMessageParser';
import Artifact from '@/components/Artifact';

// Remove local Message interface - use the one from chatStore

interface ProjectFile {
  path: string;
  content: string;
  type: string;
  description: string;
}

interface ProjectCommand {
  cmd: string;
  args: string[];
  cwd: string;
  priority: number;
  description: string;
  type: string;
}

interface StructuredProjectData {
  files: ProjectFile[];
  commands: ProjectCommand[];
  instructions: string;
}

interface StreamResponse {
  type: 'instruction' | 'file' | 'command' | 'complete' | 'error' | 'structured_data';
  step?: number;
  title?: string;
  content: string;
  file_path?: string;
  command?: string;
  args?: string[];
  cwd?: string;
  timestamp?: string;
  structured_data?: StructuredProjectData;
}

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  path?: string;
  isExpanded?: boolean;
}

const CodeAgentChat: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [isInChatMode, setIsInChatMode] = useState(false);
  const { isMobile } = useMobileDetection();
  
  // Use stores for state management
  const { messages, isGenerating } = useStore(chatStore);
  const { fileTree } = useStore(filesStore);
  const { previewUrl } = useStore(workbenchStore);
  const isArtifactPanelVisible = useStore(artifactPanelVisible);

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
    description: "Advanced code analysis, generation, and refactoring assistant powered by cutting-edge AI.",
    icon: "💻"
  };

  const handleNewChat = () => {
    clearMessages();
    clearArtifacts();
    setGenerating(false);
    setIsInChatMode(false);
    setInputValue('');
    setFileTree([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    addMessage(userMessage);
    const userInput = inputValue;
    setInputValue('');
    setIsInChatMode(true);
    setGenerating(true);
    
    // Initialize ActionRunner when user sends first message
    try {
      await actionRunner.initialize();
      console.log('ActionRunner initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ActionRunner:', error);
      const errorMessage: Message = {
        id: `${Date.now()}-init-error`,
        content: `❌ Failed to initialize ActionRunner: ${error}`,
        sender: 'agent',
        timestamp: new Date(),
        type: 'error'
      };
      addMessage(errorMessage);
    }
    
    try {
      // Call the Gemini API streaming chat endpoint
      const codeAgentUrl = import.meta.env.VITE_CODE_AGENT_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002';
      const response = await fetch(`${codeAgentUrl}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/plain',
        },
        body: JSON.stringify({
          message: userInput,
          conversation_history: [],
          stream: true
        })
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // Set up parser callbacks for artifact and action handling
      const parserCallbacks: ParserCallbacks = {
        onArtifactOpen: ({ messageId, id, title }) => {
          console.log(`Artifact opened: ${id} - ${title}`);
          // Artifact store will handle this automatically
        },
        onArtifactClose: ({ messageId, id, title }) => {
          console.log(`Artifact closed: ${id} - ${title}`);
        },
        onActionOpen: ({ artifactId, messageId, actionId, action }) => {
          console.log(`Action opened: ${action.type} in artifact ${artifactId}`);
          // Execute the action
          if (action.type === 'file' && action.filePath) {
            actionRunner.handleFile(action.filePath, action.content || '', artifactId);
          } else if (action.type === 'shell') {
            actionRunner.handleCommand(action.content || '', artifactId);
          }
        },
        onActionClose: ({ artifactId, messageId, actionId, action }) => {
          console.log(`Action closed: ${action.type} in artifact ${artifactId}`);
        }
      };
      
      const messageParser = new StreamingMessageParser({ callbacks: parserCallbacks });
      let accumulatedText = '';
      let buffer = '';
      const messageId = `msg-${Date.now()}`;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        buffer += chunk;
        
        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.slice(6)); // Remove 'data: ' prefix
              
              // Handle completion signal
              if (jsonData.done) {
                break;
              }
              
              if (jsonData.chunk) {
                // Parse the Bolt-style content within the SSE message
                const parsedContent = messageParser.parse(messageId, jsonData.chunk);
                
                if (parsedContent && parsedContent.trim()) {
                  // Accumulate only the filtered text content (without artifacts/actions)
                  accumulatedText += parsedContent;
                  
                  // Create or update the current agent message
                  const currentMessages = chatStore.get().messages;
                  const lastMessage = currentMessages[currentMessages.length - 1];
                  
                  if (lastMessage && lastMessage.sender === 'agent' && lastMessage.isStreaming) {
                    // Update existing streaming message
                    updateMessage(lastMessage.id, {
                      ...lastMessage,
                      content: accumulatedText
                    });
                  } else {
                    // Create new streaming message
                    const agentMessage: Message = {
                      id: `${Date.now()}-${Math.random()}`,
                      content: accumulatedText,
                      sender: 'agent',
                      timestamp: new Date(),
                      type: 'instruction',
                      isStreaming: true
                    };
                    addMessage(agentMessage);
                  }
                }
              }
              
              // Handle errors
              if (jsonData.error) {
                console.error('Gemini API error:', jsonData.error);
                throw new Error(jsonData.error);
              }
            } catch (error) {
              console.error('Failed to parse SSE data:', error, 'Line:', line);
            }
          }
        }
      }
      
      // Process any remaining buffer content
      if (buffer.trim()) {
        const parsedContent = messageParser.parse(messageId, buffer);
        if (parsedContent) {
          accumulatedText += parsedContent;
        }
      }
      
      // Mark the final message as complete
      const currentMessages = chatStore.get().messages;
      const lastMessage = currentMessages[currentMessages.length - 1];
      if (lastMessage && lastMessage.sender === 'agent' && lastMessage.isStreaming) {
        updateMessage(lastMessage.id, {
          ...lastMessage,
          content: accumulatedText,
          isStreaming: false
        });
      }
      
    } catch (error) {
      console.error('Failed to generate project:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Sorry, I encountered an error while generating your project. Please try again.',
        sender: 'agent',
        timestamp: new Date(),
        type: 'text'
      };
      addMessage(errorMessage);
    } finally {
      setGenerating(false);
    }
  };
  
  const extractProjectName = (input: string): string => {
    // Simple extraction logic - can be enhanced
    const words = input.toLowerCase().split(' ');
    const projectWords = words.filter(word => 
      !['create', 'build', 'make', 'develop', 'a', 'an', 'the', 'app', 'application'].includes(word)
    );
    return projectWords.length > 0 ? projectWords.join('-') : 'my-react-app';
  };
  
  // File operations are now handled directly by ActionRunner
  


  // Mobile view - show "use laptop" message
  if (isMobile) {
    return (
      <AuthGuard>
        <div className="h-screen dynamic-bg flex flex-col relative overflow-hidden">
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
          
          {/* Header */}
          <div className="content-layer flex items-center justify-between p-3 md:p-4 border-b border-white/30 bg-white/60 backdrop-blur-xl flex-shrink-0 min-h-[70px] md:min-h-[80px] relative">
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 pointer-events-none" />
            
            <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0 relative z-10">
              {/* Home button */}
              <Link to="/" className="flex items-center space-x-1 md:space-x-2 text-gray-600 hover:text-gray-800 transition-all duration-200 flex-shrink-0 hover:bg-white/30 rounded-lg p-1.5 backdrop-blur-sm">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Home</span>
                <span className="text-xs sm:hidden">Home</span>
              </Link>
              
              <div className="min-w-0 flex-1 text-center md:text-center">
                <h1 className="text-base md:text-lg font-semibold text-gray-800 truncate">{agentInfo.name}</h1>
                <p className="text-xs md:text-sm text-gray-600 truncate hidden sm:block">{agentInfo.description}</p>
              </div>
            </div>
            <Button 
              onClick={handleNewChat}
              className="bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium flex-shrink-0 ml-2 md:ml-4 h-8 md:h-10 px-2 md:px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm border border-emerald-500/30 hover:border-emerald-400/50 relative z-10"
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
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200 bg-white/80 backdrop-blur-xl flex-shrink-0 min-h-[70px] md:min-h-[80px] relative shadow-sm">
          <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0 relative z-10">
            {/* Home button */}
            <Link to="/" className="flex items-center space-x-1 md:space-x-2 text-gray-600 hover:text-gray-800 transition-all duration-200 flex-shrink-0 hover:bg-gray-100 rounded-lg p-1.5">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">Home</span>
              <span className="text-xs sm:hidden">Home</span>
            </Link>
            
            <div className="min-w-0 flex-1 text-center md:text-center">
              <h1 className="text-base md:text-lg font-semibold text-gray-800 truncate">{agentInfo.name}</h1>
              <p className="text-xs md:text-sm text-gray-600 truncate hidden sm:block">{agentInfo.description}</p>
            </div>
          </div>
          <Button 
            onClick={handleNewChat}
            className="bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium flex-shrink-0 ml-2 md:ml-4 h-8 md:h-10 px-2 md:px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-emerald-500/30 hover:border-emerald-400/50 relative z-10"
          >
            <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline text-sm md:text-base">New Chat</span>
            <span className="sm:hidden text-xs">New</span>
          </Button>
        </div>

        {/* Main content */}
        {!isInChatMode ? (
          /* Initial centered chatbox */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <Code className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready to Code</h2>
                <p className="text-gray-600">Powered by Gemini 2.5 Flash</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type something you want to develop..."
                    className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 bg-white shadow-sm"
                  />
                  <Button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </Button>
                </div>
              </form>
              
              <div className="mt-6 text-center text-sm text-gray-500">
                Start by describing what you'd like to build or code you need help with
              </div>
            </div>
          </div>
        ) : (
          /* Split layout with dynamic widths based on artifact panel visibility */
          <div className="flex-1 flex overflow-hidden">
            {/* Chat Interface */}
            <div className={`${isArtifactPanelVisible ? 'w-1/4' : 'w-1/3'} flex-shrink-0`}>
              <CodeChatInterface />
            </div>
            
            {/* Artifact Panel (when visible) */}
            {isArtifactPanelVisible && (
              <div className="w-1/4 border-r border-gray-200">
                <Artifact />
              </div>
            )}
            
            {/* Code Tabs */}
            <div className="flex-1">
              <CodeTabs />
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
};

export default CodeAgentChat;