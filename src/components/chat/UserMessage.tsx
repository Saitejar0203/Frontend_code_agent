import React, { memo } from 'react';

interface UserMessageProps {
  content: string;
}

export const UserMessage = memo(({ content }: UserMessageProps) => {
  return (
    <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3 max-w-fit shadow-sm">
      <p className="whitespace-pre-wrap leading-relaxed text-sm">
        {content}
      </p>
    </div>
  );
});

UserMessage.displayName = 'UserMessage';