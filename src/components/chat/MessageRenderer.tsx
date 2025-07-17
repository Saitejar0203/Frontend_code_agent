import React from 'react';
import { Bot, User } from 'lucide-react';
import { MarkdownRenderer } from '../markdown';
import { Message } from './types';

interface MessageRendererProps {
  message: Message;
}

const MessageRenderer: React.FC<MessageRendererProps> = ({ message }) => {



  return (
    <div
      className={`max-w-[85%] md:max-w-[70%] p-3 rounded-xl shadow-md overflow-hidden ${
        message.sender === 'user'
          ? 'bg-emerald-400 text-gray-800 rounded-br-none'
          : 'bg-white text-gray-800 rounded-bl-none'
      }`}
    >
      <div className="flex items-start space-x-2 mb-1">
        {message.sender === 'agent' && <Bot className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 flex-shrink-0 mt-0.5" />}
        <div className="text-[15px] break-words leading-relaxed min-w-0 flex-1">
          {message.isLoading ? (
            "…"
          ) : message.sender === "agent" ? (
            <div className="markdown-content overflow-hidden">
              <MarkdownRenderer
                content={message.content}
                theme="chat"
                enableCopy={true}
                enableGfm={true}
                enableHighlight={true}
                enableRaw={true}
                enableMath={true}
              />
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          )}
        </div>
        {message.sender === 'user' && <User className="w-4 h-4 md:w-5 md:h-5 text-gray-700 flex-shrink-0 mt-0.5" />}
      </div>
      <p className={`text-xs text-right mt-1 ${
        message.sender === 'user' ? 'text-gray-600' : 'text-gray-500'
      }`}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
};

export default MessageRenderer;