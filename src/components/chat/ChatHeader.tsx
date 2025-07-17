import React from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { AgentInfo } from './types';

interface ChatHeaderProps {
  agent: AgentInfo;
  onNewChat: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  agent,
  onNewChat
}) => {
  return (
    <div className="flex items-center justify-between p-3 md:p-4 border-b border-white/30 bg-white/60 backdrop-blur-xl flex-shrink-0 min-h-[70px] md:min-h-[80px] relative">
      {/* Subtle inner glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 pointer-events-none" />
      
      <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0 relative z-10">
        {/* Home button */}
        <Link to="/" className="flex items-center space-x-1 md:space-x-2 text-gray-600 hover:text-gray-800 transition-all duration-200 flex-shrink-0 hover:bg-white/30 rounded-lg p-1.5 backdrop-blur-sm">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm hidden sm:inline">Home</span>
          <span className="text-xs sm:hidden">Home</span>
        </Link>
        
        <div className="min-w-0 flex-1 text-center md:text-center">
          <h1 className="text-base md:text-lg font-semibold text-gray-800 truncate">{agent.name}</h1>
          <p className="text-xs md:text-sm text-gray-600 truncate hidden sm:block">{agent.description}</p>
        </div>
      </div>
      <Button 
        onClick={onNewChat}
        className="bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium flex-shrink-0 ml-2 md:ml-4 h-8 md:h-10 px-2 md:px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm border border-emerald-500/30 hover:border-emerald-400/50 relative z-10"
      >
        <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
        <span className="hidden sm:inline text-sm md:text-base">New Chat</span>
        <span className="sm:hidden text-xs">New</span>
      </Button>
    </div>
  );
};

export default ChatHeader;