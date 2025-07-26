import React, { memo } from 'react';

interface UserMessageProps {
  content: string;
}

export const UserMessage = memo(({ content }: UserMessageProps) => {
  return (
    <div className="overflow-hidden w-full">
      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
        {content}
      </p>
    </div>
  );
});

UserMessage.displayName = 'UserMessage';