import React from 'react';
import { ChatContainer } from '../components/chat';
import { AuthGuard } from '../components/auth';
import type { AgentInfo } from '../components/chat/types';

const MultiAgentChat: React.FC = () => {
  // MultiAgent-specific agent information
  const agentInfo: AgentInfo = {
    name: "MultiAgent System",
    description: "Collaborative AI agents working together - research, math, and synthesis.",
    icon: "🤖"
  };

  // MultiAgent-specific sample questions
  const sampleQuestions = [
    "Find the latest GDP data for India and calculate Karnataka's contribution",
    "Research solar energy trends and calculate growth percentages",
    "What is the population of Mumbai and how does it compare to other megacities?"
  ];

  // MultiAgent-specific API endpoint
  const apiEndpoint = "/api/multiagent/chat";

  return (
    <AuthGuard>
      <ChatContainer
        agentInfo={agentInfo}
        sampleQuestions={sampleQuestions}
        apiEndpoint={apiEndpoint}
        graphType="multiagent"
      />
    </AuthGuard>
  );
};

export default MultiAgentChat;