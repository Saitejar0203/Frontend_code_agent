import React from 'react';
import { ChatContainer } from '../components/chat';
import { AuthGuard } from '../components/auth';
import type { AgentInfo } from '../components/chat/types';

const DataAnalysisChat: React.FC = () => {
  // Data Analysis-specific agent information
  const agentInfo: AgentInfo = {
    name: "Data Analyst",
    description: "An AI assistant specialized in data analysis that helps analyze datasets, create visualizations, perform statistical analysis, and extract insights from data.",
    icon: "📊"
  };

  // Data Analysis-specific sample questions
  const sampleQuestions = [
    "Analyze this sales dataset and identify key trends and patterns",
    "Create visualizations for customer behavior data from our e-commerce platform",
    "Help me build a predictive model for stock price forecasting"
  ];

  // Data Analysis-specific API endpoint (dummy for now)
  const apiEndpoint = "/api/data-analysis/chat";

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

export default DataAnalysisChat;