import React, { memo } from 'react';
import { Markdown } from './Markdown';

interface AssistantMessageProps {
  content: string;
  isStreaming?: boolean;
}

export const AssistantMessage = memo(({ content, isStreaming = false }: AssistantMessageProps) => {
  return (
    <div className="w-full">
      <div className="text-gray-800 dark:text-gray-200">
        <Markdown>{content}</Markdown>
      </div>
      {isStreaming && (
        <div className="flex items-center space-x-1 mt-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      )}
    </div>
  );
});

AssistantMessage.displayName = 'AssistantMessage';