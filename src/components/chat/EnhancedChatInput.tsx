import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Search, Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface EnhancedChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  className?: string;
  showPlaceholder?: boolean;
  showSuggestIdea?: boolean;
}

const PLACEHOLDER_SUGGESTIONS = [
  "Ask me to create a comics with Indian super hero",
  "Ask me to create a slide deck", 
  "Ask me to create a portfolio site"
];

const EnhancedChatInput: React.FC<EnhancedChatInputProps> = ({
  value,
  onChange,
  onSend,
  disabled = false,
  className = "",
  showPlaceholder = false,
  showSuggestIdea = false
}) => {
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Animated placeholder rotation
  useEffect(() => {
    if (!showPlaceholder || value || isHovered) {
      setIsPlaceholderVisible(false);
      return;
    }

    setIsPlaceholderVisible(true);
    const interval = setInterval(() => {
      setIsPlaceholderVisible(false);
      setTimeout(() => {
        setCurrentPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_SUGGESTIONS.length);
        setIsPlaceholderVisible(true);
      }, 300); // Fade out duration
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [value, isHovered, showPlaceholder]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 8 * 24; // 8 lines * 24px line height
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: Allow new line (default behavior)
        return;
      } else {
        // Enter: Send message
        e.preventDefault();
        if (value.trim() && !disabled) {
          onSend();
        }
      }
    }
  };

  const handleAttachImage = () => {
    // TODO: Implement image attachment
    console.log('Attach image clicked');
  };

  const handleSearchWeb = () => {
    // TODO: Implement web search
    console.log('Search web clicked');
  };

  const handleSuggestIdea = () => {
    // TODO: Implement idea suggestion
    console.log('Suggest idea clicked');
  };

  return (
    <div className={`flex-shrink-0 border-t border-gray-200/50 bg-gradient-to-b from-white to-gray-50/30 p-4 md:p-6 ${className}`}>
      {/* Main input container with Lovable-inspired design */}
      <div className="relative">
        {/* Enhanced container with gradient border and glow effects */}
        <div className="relative bg-white rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 focus-within:border-emerald-400/60 focus-within:shadow-emerald-100/50 focus-within:shadow-2xl group">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/20 via-transparent to-blue-50/20 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          {/* Textarea container */}
          <div className="relative p-4 pb-2">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              disabled={disabled}
              placeholder="" // We'll handle placeholder manually
              className="w-full min-h-[48px] max-h-[192px] resize-none border-0 bg-transparent focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base leading-6 placeholder:text-transparent scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 focus:outline-none"
              style={{ lineHeight: '24px' }}
            />
            
            {/* Custom animated placeholder */}
            {showPlaceholder && !value && !isHovered && (
              <div className="absolute top-4 left-4 pointer-events-none">
                <span 
                  className={`text-gray-500 text-base transition-opacity duration-300 ${
                    isPlaceholderVisible ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {PLACEHOLDER_SUGGESTIONS[currentPlaceholderIndex]}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons row */}
          <div className="flex items-center justify-between px-4 pb-4">
            {/* Left side - Action buttons */}
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAttachImage}
                disabled={disabled}
                className="h-8 w-8 p-0 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                title="Attach Image"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSearchWeb}
                disabled={disabled}
                className="h-8 px-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 text-xs font-medium"
                title="Search Web"
              >
                <Search className="w-3 h-3 mr-1" />
                Search web
              </Button>
              
              {showSuggestIdea && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSuggestIdea}
                  disabled={disabled}
                  className="h-8 px-3 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 text-xs font-medium"
                  title="Suggest me an idea"
                >
                  <Lightbulb className="w-3 h-3 mr-1" />
                  Suggest me an idea
                </Button>
              )}
            </div>

            {/* Right side - Send/Loader button */}
            <Button
              onClick={disabled ? undefined : onSend}
              disabled={disabled || !value.trim()}
              className="h-10 w-10 p-0 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl shadow-lg hover:shadow-xl disabled:shadow-sm transition-all duration-200 disabled:cursor-not-allowed group"
            >
              {disabled ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 transform group-hover:translate-x-0.5 transition-transform duration-200" />
              )}
            </Button>
          </div>
        </div>


      </div>
    </div>
  );
};

export default EnhancedChatInput;