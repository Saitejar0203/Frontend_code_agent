import React from 'react';
import { ChatContainer } from '../components/chat';
import { AuthGuard } from '../components/auth';
import type { AgentInfo } from '../components/chat/types';

const CodeRefactorChat: React.FC = () => {
  // Code Refactor-specific agent information
  const agentInfo: AgentInfo = {
    name: "Code Refactor",
    description: "An AI assistant specialized in code refactoring that helps improve code quality, readability, and maintainability while preserving functionality.",
    icon: "🔧"
  };

  // Code Refactor-specific sample questions
  const sampleQuestions = [
    "Refactor this React component to use TypeScript and modern hooks",
    "How can I optimize this Python function for better performance?",
    "Convert this jQuery code to vanilla JavaScript with ES6+ features"
  ];

  // Code Refactor-specific API endpoint (dummy for now)
  const apiEndpoint = "/api/code-refactor/chat";

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

export default CodeRefactorChat;