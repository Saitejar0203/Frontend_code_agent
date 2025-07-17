import React from 'react';
import { ChatContainer } from '../components/chat';
import { AuthGuard } from '../components/auth';
import type { AgentInfo } from '../components/chat/types';

const BasicPerplexityChat: React.FC = () => {
  // Perplexity-specific agent information
  const agentInfo: AgentInfo = {
    name: "Basic Perplexity",
    description: "A basic AI assistant powered by Perplexity that can help answer questions and provide information on a wide range of topics.",
    icon: "🔍"
  };

  // Perplexity-specific sample questions
  const sampleQuestions = [
    "What are the latest developments in AI and machine learning in India?",
    "Recommend some must-read Indian authors and their best books",
    "What are the top Indian web series and movies released this year?"
  ];

  // Perplexity-specific API endpoint
  const apiEndpoint = "/api/perplexity/chat";

  return (
    <AuthGuard>
      <ChatContainer
        agentInfo={agentInfo}
        sampleQuestions={sampleQuestions}
        apiEndpoint={apiEndpoint}
      />
    </AuthGuard>
  );
};

export default BasicPerplexityChat;