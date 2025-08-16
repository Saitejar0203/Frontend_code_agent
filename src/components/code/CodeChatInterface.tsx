import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Send, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EnhancedChatInput from '../chat/EnhancedChatInput';
import { 
  chatStore, 
  addMessage, 
  updateLastMessage, 
  setGenerating, 
  setError,
  clearMessages,
  type Message 
} from '@/lib/stores/chatStore';
import { AssistantMessage } from '../chat/AssistantMessage';
import { UserMessage } from '../chat/UserMessage';
import { ThinkingAnimation } from '../chat/ThinkingAnimation';
import { AssistantStatusIndicator } from '../chat/AssistantStatusIndicator';
import { ImageGenerationStatusIndicator } from '../chat/ImageGenerationStatusIndicator';
import { stopQueuedMessages, hasQueuedMessages } from '@/services/codeAgentService';

interface CodeChatInterfaceProps {
  onSendMessage?: (message: string) => void;
  className?: string;
}

const CodeChatInterface: React.FC<CodeChatInterfaceProps> = ({
  onSendMessage,
  className
}) => {
  const { messages, isGenerating, isThinking, error } = useStore(chatStore);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🎯 CodeChatInterface handleSubmit called with input:', input);
    if (!input.trim() || isGenerating || hasQueuedMessages()) {
      console.log('❌ Input validation failed, already generating, or has queued messages');
      return;
    }
    
    console.log('📞 Calling onSendMessage with:', input);
    onSendMessage?.(input);
    setInput('');
    console.log('✅ Input cleared');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleStop = () => {
    console.log('🛑 Stop button clicked');
    
    // Stop any queued messages
    if (hasQueuedMessages()) {
      console.log('🛑 Stopping queued messages');
      stopQueuedMessages();
    }
    
    // Stop current generation
    setGenerating(false);
    console.log('✅ Stop action completed');
  };

  const handleClear = () => {
    clearMessages();
    setError(null);
  };

  return (
    <div className={`h-full flex flex-col bg-white dark:bg-gray-900 min-h-0 ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <p>Start a conversation to begin coding!</p>
            <p className="text-sm mt-2">Describe what you want to build and I'll help you create it.</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isUserMessage = message.sender === 'user';
            const isFirst = index === 0;
            const isLast = index === messages.length - 1;
            
            return (
              <div
                key={message.id}
                className={`w-full ${!isFirst ? 'mt-4' : ''}`}
              >
                {isUserMessage ? (
                  // User message - right aligned with bubble
                  <div className="flex justify-end px-4 py-2">
                    <div className="flex flex-col items-end max-w-[80%]">
                      <UserMessage content={message.content} />
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 mr-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Assistant message - left aligned without background
                  <div className="px-4 py-2">
                    <div className="flex flex-col w-full min-w-0">
                      {/* Show status indicators above first assistant message or when streaming */}
                      {(index === 0 || message.isStreaming) && (
                        <>
                          <AssistantStatusIndicator className="mb-2" />
                          <ImageGenerationStatusIndicator />
                        </>
                      )}
                      <AssistantMessage 
                        content={message.content} 
                        isStreaming={message.isStreaming || false}
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        {/* Status indicator when no messages or thinking */}
        {(messages.length === 0 || isThinking) && (
          <div className="w-full mt-4">
            <div className="px-4 py-2">
              <div className="flex flex-col w-full min-w-0">
                <AssistantStatusIndicator />
                <ImageGenerationStatusIndicator />
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      {(isGenerating || hasQueuedMessages()) ? (
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white p-4">
          <div className="flex items-center justify-center gap-3">
            <div className="text-gray-600 dark:text-gray-400">AI is thinking...</div>
            <button
              type="button"
              onClick={handleStop}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <StopCircle className="w-4 h-4" />
              Stop
            </button>
          </div>
        </div>
      ) : (
        <EnhancedChatInput
          value={input}
          onChange={setInput}
          onSend={() => handleSubmit(new Event('submit') as any)}
          disabled={isGenerating || hasQueuedMessages()}
        />
      )}
    </div>
  );
};

export default CodeChatInterface;