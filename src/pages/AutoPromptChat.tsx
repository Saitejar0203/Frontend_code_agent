import React from 'react';
import ChatContainer from '../components/chat/ChatContainer';

const AutoPromptChat: React.FC = () => {
  const agentInfo = {
    name: 'Auto Prompt Engineering',
    description: 'Intelligent system that automatically refines and optimizes LLM prompts for enhanced performance and reliability.',
    icon: '🔧'
  };

  const sampleQuestions = [
    "How can I optimize my prompt for better accuracy?",
    "What are the best practices for prompt engineering?",
    "Can you help me refine this prompt for my specific use case?",
    "How do I measure prompt performance effectively?"
  ];

  return (
    <ChatContainer 
      agentInfo={agentInfo}
      sampleQuestions={sampleQuestions}
      apiEndpoint="/api/auto-prompt"
      graphType="auto-prompt"
    />
  );
};

export default AutoPromptChat;