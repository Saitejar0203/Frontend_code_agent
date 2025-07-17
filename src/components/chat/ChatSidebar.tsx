import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatSession } from './types';

interface ChatSidebarProps {
  chatSessions: ChatSession[];
  currentSessionId: string;
  onSessionSelect: (sessionId: string) => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chatSessions,
  currentSessionId,
  onSessionSelect,
  isMobile = false,
  isOpen = false,
  onClose
}) => {
  const handleSessionClick = (sessionId: string) => {
    onSessionSelect(sessionId);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-gray-200/50 flex-shrink-0">
        <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors mb-3">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Agents</span>
        </Link>
        {isMobile && onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        <h2 className="font-semibold text-gray-800">Chat History</h2>
      </div>
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className={`${isMobile ? 'p-3' : 'p-2'} space-y-2`}>
          {chatSessions.map((session) => (
            <Card 
              key={session.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                session.id === currentSessionId 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-white/70 hover:bg-white/90'
              }`}
              onClick={() => handleSessionClick(session.id)}
            >
              <CardContent className="p-3">
                <p className="font-medium text-sm text-gray-700 truncate">{session.title}</p>
                <p className="text-xs text-gray-500">
                  {session.messages.length > 0 
                    ? session.messages[session.messages.length - 1].content.substring(0, 30) + '...' 
                    : 'No messages yet'}
                </p>
                <p className="text-xs text-gray-400 mt-1">{session.lastActivity.toLocaleTimeString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </>
  );

  if (isMobile) {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 z-50 md:hidden">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white/95 backdrop-blur-sm border-r border-gray-200/50 flex flex-col">
          {sidebarContent}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-gray-200/50 bg-white/50 backdrop-blur-sm hidden md:flex flex-col flex-shrink-0">
      {sidebarContent}
    </div>
  );
};

export default ChatSidebar;