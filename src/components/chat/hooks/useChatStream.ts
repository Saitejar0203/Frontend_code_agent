import React, { useState } from 'react';
import { ChatSession, Message, DebugLog } from '../types';
import { createUserMessage, createAiMessage, buildStreamUrl } from '../utils/chatUtils';

interface UseChatStreamProps {
  currentSession: ChatSession | undefined;
  currentSessionId: string;
  updateChatSessions: (updater: (prev: ChatSession[]) => ChatSession[]) => void;
  checkpointId: string | null;
  setCheckpointId: (id: string | null) => void;
  apiBaseUrl: string;
  graphType: string;
  sessionId: string | null;
  userId: string;
  accessToken?: string;
  scrollToLatestExecutionFlow: () => void;
}

export const useChatStream = ({
  currentSession,
  currentSessionId,
  updateChatSessions,
  checkpointId,
  setCheckpointId,
  apiBaseUrl,
  graphType,
  sessionId,
  userId,
  accessToken,
  scrollToLatestExecutionFlow
}: UseChatStreamProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper functions for message updates
  const patchMessage = (id: string, patch: Partial<Message>) => {
    updateChatSessions((prev) =>
      prev.map((session) =>
        session.id === currentSessionId
          ? {
              ...session,
              messages: session.messages.map((m) =>
                m.id === id ? { ...m, ...patch } : m
              ),
            }
          : session
      )
    );
  };

  const pushDebug = (id: string, log: DebugLog) => {
    updateChatSessions((prev) =>
      prev.map((session) =>
        session.id === currentSessionId
          ? {
              ...session,
              messages: session.messages.map((m) =>
                m.id === id
                  ? { ...m, debugLogs: [...(m.debugLogs || []), log] }
                  : m
              ),
            }
          : session
      )
    );
  };

  const handleSendMessage = (messageContent: string) => {
    if (!messageContent.trim() || !currentSession) return;

    setIsGenerating(true);

    const userMessage = createUserMessage(messageContent);
    const aiMessage = createAiMessage();

    // Add both messages to the current session
    updateChatSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? {
            ...session,
            messages: [...session.messages, userMessage, aiMessage],
            lastActivity: new Date()
          }
        : session
    ));

    // Start streaming response
    const url = buildStreamUrl(
      apiBaseUrl,
      messageContent,
      checkpointId,
      graphType,
      sessionId,
      userId,
      accessToken
    );
    
    const es = new EventSource(url);
    let modelBuffer = "";

    es.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data);

        // Handle LangGraph events first
        if (d.event === "on_chain_start" && d.name === "LangGraph") {
          setIsGenerating(false);
          pushDebug(aiMessage.id, {
            phase: "chain_start",
            name: d.name,
            input: d.data?.input,
          });
          setTimeout(() => scrollToLatestExecutionFlow(), 150);
          setTimeout(() => scrollToLatestExecutionFlow(), 300);
          return;
        }

        if (d.event === "on_chain_start") {
          pushDebug(aiMessage.id, {
            phase: "chain_start",
            name: d.name,
            input: d.data?.input,
          });
          // Scroll to execution flow when it first appears (for the first chain start)
          const currentMessage = currentSession?.messages.find(msg => msg.id === aiMessage.id);
          if (!currentMessage?.debugLogs?.length) {
            setTimeout(() => scrollToLatestExecutionFlow(), 150);
            setTimeout(() => scrollToLatestExecutionFlow(), 300);
          }
          return;
        }
        
        if (d.event === "on_chain_stream") {
          pushDebug(aiMessage.id, {
            phase: "chain_stream",
            name: d.name,
            input: d.data,
          });
          return;
        }
        
        if (d.event === "on_chain_end") {
          pushDebug(aiMessage.id, {
            phase: "chain_end",
            name: d.name,
            output: d.data?.output,
          });
          
          if (d.name === "LangGraph") {
            patchMessage(aiMessage.id, { isLoading: false });
            es.close();
          }
          return;
        }

        // Handle legacy event types
        switch (d.type) {
          case "checkpoint":
            setCheckpointId(d.checkpoint_id);
            // Update chat session title if chat_name is provided
            if (d.chat_name && currentSessionId) {
              updateChatSessions((prev) =>
                prev.map((session) =>
                  session.id === currentSessionId
                    ? { ...session, title: d.chat_name }
                    : session
                )
              );
            }
            break;

          case "model_start":
            pushDebug(aiMessage.id, {
              phase: "model_start",
              name: d.model,
              input: d.input,
            });
            // Scroll to execution flow when it first appears (legacy events)
            const currentMessage = currentSession?.messages.find(msg => msg.id === aiMessage.id);
            if (!currentMessage?.debugLogs?.length) {
              setTimeout(() => scrollToLatestExecutionFlow(), 150);
              setTimeout(() => scrollToLatestExecutionFlow(), 300);
            }
            break;

          case "model_end":
            pushDebug(aiMessage.id, {
              phase: "model_end",
              name: d.model,
              output: d.output,
            });
            break;

          case "content":
            modelBuffer += d.content;
            patchMessage(aiMessage.id, { content: modelBuffer, isLoading: false });
            break;

          case "model_content":
            // Add intermediate model output to execution flow, not chat
            pushDebug(aiMessage.id, {
              phase: "model_end_final",
              name: "Model Output",
              output: d.content,
            });
            break;

          case "model_stream":
            // Add streaming model content to execution flow
            pushDebug(aiMessage.id, {
              phase: "model_stream",
              name: "Model Stream",
              output: d.content,
            });
            break;

          case "tool_start":
            pushDebug(aiMessage.id, {
              phase: "tool_start",
              name: d.tool,
              input: d.input,
            });
            break;

          case "tool_end":
            pushDebug(aiMessage.id, {
              phase: "tool_end",
              name: d.tool,
              output: d.output,
            });
            break;

          case "agent":
            pushDebug(aiMessage.id, {
              phase: "agent_action",
              name: d.agent_name,
              input: d.agent_message,
              toolCalls: d.agent_tool_calls
            });
            break;

          case "tool":
            pushDebug(aiMessage.id, {
              phase: "tool_execution",
              name: d.tool_name,
              output: d.tool_output
            });
            break;

          case "final_message":
            patchMessage(aiMessage.id, { content: d.content, isLoading: false });
            setIsGenerating(false);
            break;

          case "end":
            patchMessage(aiMessage.id, { isLoading: false });
            setIsGenerating(false);
            es.close();
            break;

          case "error":
            patchMessage(aiMessage.id, { content: "Server error.", isLoading: false });
            setIsGenerating(false);
            es.close();
            break;
        }
      } catch (err) {
        console.error("Parse error", err, ev.data);
      }
    };

    es.onerror = () => {
      patchMessage(aiMessage.id, { content: "Connection error.", isLoading: false });
      setIsGenerating(false);
      es.close();
    };
  };

  return {
    isGenerating,
    handleSendMessage
  };
};

export default useChatStream;