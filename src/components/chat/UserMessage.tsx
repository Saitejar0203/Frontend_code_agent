import React, { memo } from 'react';
import { ImageAttachment } from '@/lib/stores/chatStore';

interface UserMessageProps {
  content: string;
  images?: ImageAttachment[];
}

export const UserMessage = memo(({ content, images }: UserMessageProps) => {
  return (
    <div className="flex flex-col items-end space-y-3">
      {/* Display images above the chat bubble */}
      {images && images.length > 0 && (
        <div className="flex flex-col space-y-3 max-w-xs">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className="relative overflow-hidden rounded-xl shadow-lg border-2 border-white/10 bg-gradient-to-br from-blue-50 to-blue-100 p-2">
                <img
                  src={image.preview}
                  alt={image.name}
                  className="w-full max-h-48 rounded-lg object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg pointer-events-none" />
              </div>
              <div className="text-xs text-gray-600 mt-2 px-1 font-medium truncate">
                {image.name}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Chat bubble with text content */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl rounded-br-md px-4 py-3 max-w-fit shadow-lg border border-blue-500/20">
        <p className="whitespace-pre-wrap leading-relaxed text-sm">
          {content}
        </p>
      </div>
    </div>
  );
});

UserMessage.displayName = 'UserMessage';