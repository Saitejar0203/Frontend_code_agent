import React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  placeholder = "Type your message...",
  disabled = false
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3 md:p-4">
      {/* Clean, simple container */}
      <div className="flex items-center gap-3 bg-gray-50 rounded-xl border border-gray-200 p-3 transition-all duration-200 hover:border-gray-300 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
        
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          className="flex-1 border-0 bg-transparent focus:ring-0 focus:border-0 text-sm h-10 md:h-11 min-w-0 placeholder:text-gray-500 focus:outline-none"
        />
        <Button 
          onClick={onSend} 
          disabled={!value.trim() || disabled}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white h-10 w-10 md:h-11 md:w-11 p-0 flex-shrink-0 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4 md:w-5 md:h-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;