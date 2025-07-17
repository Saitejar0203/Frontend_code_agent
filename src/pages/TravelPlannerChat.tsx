import React from 'react';
import ChatContainer from '../components/chat/ChatContainer';
import { AuthGuard } from '../components/auth';
import { Message, ChatSession } from '../components/chat/types';

const TravelPlannerChat = () => {
  const agentInfo = {
    name: "Travel Planner",
    description: "Your AI travel planning assistant",
    avatar: "🧳",
    capabilities: [
      "Custom itinerary creation",
      "Budget planning",
      "Destination recommendations",
      "Activity suggestions",
      "Travel tips and advice"
    ]
  };

  const sampleQuestions = [
    "Plan a 7-day trip to Kerala backwaters with a budget of ₹50,000",
    "Suggest weekend getaways from Mumbai under ₹15,000",
    "Create an itinerary for Rajasthan covering Jaipur, Udaipur, and Jodhpur"
  ];

  const initialMessage: Message = {
    id: "1",
    content: "Hello! I'm Travel Planner, your AI travel planning assistant. I can help you create customized itineraries for your trips. Tell me about your destination, budget, interests, and travel dates, and I'll create the perfect plan for you!",
    sender: "agent",
    timestamp: new Date(Date.now() - 3600000)
  };

  const initialSession: ChatSession = {
    id: "1",
    title: "Travel Planning Session",
    messages: [initialMessage],
    lastActivity: new Date(Date.now() - 3600000)
  };

  const handleSendMessage = async (message: string, sessionId: string) => {
    // Dummy API call - replace with actual travel planning API
    const response = await fetch('/api/travel-planner/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId,
        context: 'travel_planning'
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  };

  return (
    <AuthGuard>
      <ChatContainer
        agentInfo={agentInfo}
        sampleQuestions={sampleQuestions}
        initialSession={initialSession}
        onSendMessage={handleSendMessage}
        pageTitle="Travel Planner Chat"
      />
    </AuthGuard>
  );
};

export default TravelPlannerChat;