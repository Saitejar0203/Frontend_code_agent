import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Send, User, Bot, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface CodeChatInterfaceProps {
  onSendMessage?: (message: string) => void;
  className?: string;
}

const CodeChatInterface: React.FC<CodeChatInterfaceProps> = ({
  onSendMessage,
  className
}) => {
  const { messages, isGenerating, error } = useStore(chatStore);
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
    if (!input.trim() || isGenerating) {
      console.log('❌ Input validation failed or already generating');
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
    setGenerating(false);
    // TODO: Implement actual stop functionality
  };

  const handleClear = () => {
    clearMessages();
    setError(null);
  };

  return (
    <div className={`h-full flex flex-col bg-white dark:bg-gray-900 ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
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
                className={`flex gap-4 p-6 w-full rounded-lg ${
                  isUserMessage || !isGenerating || (isGenerating && !isLast)
                    ? 'bg-gray-50 dark:bg-gray-800/50'
                    : 'bg-gradient-to-b from-gray-50 dark:from-gray-800/50 from-30% to-transparent'
                } ${!isFirst ? 'mt-4' : ''}`}
              >
                {isUserMessage ? (
                  <div className="flex items-center justify-center w-8 h-8 overflow-hidden bg-blue-600 text-white rounded-full shrink-0 self-start">
                    <User className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-8 h-8 overflow-hidden bg-gray-600 text-white rounded-full shrink-0 self-start">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div className="grid grid-cols-1 w-full min-w-0">
                  {isUserMessage ? (
                    <UserMessage content={message.content} />
                  ) : (
                    <AssistantMessage 
                      content={message.content} 
                      isStreaming={message.isStreaming || false}
                    />
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to create a project, fix code, or help with development..."
            disabled={isGenerating}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:opacity-50"
          />
          {isGenerating ? (
            <button
              type="button"
              onClick={handleStop}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <StopCircle className="w-4 h-4" />
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CodeChatInterface;