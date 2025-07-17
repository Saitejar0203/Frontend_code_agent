import React, { useState, useEffect, forwardRef } from 'react';
import { DebugLog } from './types';

interface ExecutionFlowProps {
  messageId: string;
  logs: DebugLog[];
  isGenerating: boolean;
  executionFlowStates: {[key: string]: {isExpanded: boolean, isAnimating: boolean}};
  setExecutionFlowStates: React.Dispatch<React.SetStateAction<{[key: string]: {isExpanded: boolean, isAnimating: boolean}}>>;
}

const truncate = (v: any, n = 120) => {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > n ? `${s.slice(0, n)}…` : s;
};

const getLastHumanPrompt = (msgs: any[] = []) => {
  const lastHuman = [...msgs].reverse().find((m) => m.role === "HumanMessage");
  return lastHuman?.content ?? "";
};

const buildFlow = (logs: DebugLog[]) => {
  const lines: string[] = ["Initiating agent"];
  let firstInputShown = false;

  logs.forEach((log) => {
    switch (log.phase) {
      case "chain_start": {
        if (log.name === "LangGraph") {
          lines.push(`🔗 LangGraph Chain Started`);
        } else {
          const prompt = getLastHumanPrompt(log.input);
          lines.push(
            prompt
              ? `🔗 Chain Start: ${log.name}  →  input: ${truncate(prompt)}`
              : `🔗 Chain Start: ${log.name}`,
          );
        }
        break;
      }
      case "chain_stream": {
        lines.push(`📡 Chain Stream: ${log.name}  →  ${truncate(log.input)}`);
        break;
      }
      case "chain_end": {
        if (log.name === "LangGraph") {
          lines.push(`✅ LangGraph Chain Completed`);
        } else {
          lines.push(`🏁 Chain End: ${log.name}  →  ${truncate(log.output)}`);
        }
        break;
      }
      case "model_start": {
        if (!firstInputShown && log.input) {
          const prompt = getLastHumanPrompt(log.input);
          lines.push(`🤖 Calling Model: ${log.name}  →  input: ${prompt}`);
          firstInputShown = true;
        } else {
          const prompt = getLastHumanPrompt(log.input);
          lines.push(
            prompt
              ? `🤖 Calling Model: ${log.name}  →  input: ${prompt}`
              : `🤖 Calling Model: ${log.name}`,
          );
        }
        break;
      }
      case "model_end": {
        const msgs = Array.isArray(log.output) ? log.output : [];
        const aiMsg = msgs.find((m: any) => m.role === "AIMessage");
        const content = aiMsg?.content?.trim() || "";
        if (content) lines.push(`↳ Model output: ${truncate(content)}`);
        break;
      }
      case "model_stream": {
        lines.push(`📡 Model Stream: ${log.name}  →  ${truncate(log.output)}`);
        break;
      }
      case "tool_start":
        lines.push(
          `🔧 Calling Tool: ${log.name}  →  input: ${truncate(log.input)}`,
        );
        break;
      case "tool_end":
        lines.push(`↳ Tool output: ${truncate(log.output)}`);
        break;
      case "agent_action": {
        lines.push(`🤖 Agent: ${log.name}  →  ${truncate(log.input)}`);
        if (log.toolCalls && log.toolCalls.length > 0) {
          log.toolCalls.forEach(toolCall => {
            lines.push(`  🔧 Tool Call: ${toolCall.tool_name}  →  ${truncate(toolCall.tool_args)}`);
          });
        }
        break;
      }
      case "tool_execution":
        lines.push(`↳ Tool Result: ${log.name}  →  ${truncate(log.output)}`);
        break;
    }
  });

  return lines;
};

const ExecutionFlow = forwardRef<HTMLDivElement, ExecutionFlowProps>(({ 
  messageId, 
  logs, 
  isGenerating, 
  executionFlowStates, 
  setExecutionFlowStates 
}, ref) => {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  
  // Initialize flowState if it doesn't exist
  useEffect(() => {
    if (!executionFlowStates[messageId]) {
      setExecutionFlowStates(prev => ({
        ...prev,
        [messageId]: { isExpanded: true, isAnimating: false }
      }));
    }
  }, [messageId, executionFlowStates, setExecutionFlowStates]);
  
  const flowState = executionFlowStates[messageId] || { isExpanded: true, isAnimating: false };
  const allLines = buildFlow(logs);
  
  useEffect(() => {
    if (logs.length > 0) {
      const newLines = buildFlow(logs);
      setVisibleLines(newLines);
      
      if (isGenerating) {
        setExecutionFlowStates(prev => ({
          ...prev,
          [messageId]: { isExpanded: true, isAnimating: true }
        }));
      } else {
        setExecutionFlowStates(prev => ({
          ...prev,
          [messageId]: { ...prev[messageId], isAnimating: false }
        }));
      }
    }
  }, [logs, isGenerating, messageId, setExecutionFlowStates]);
  
  const toggleExpansion = () => {
    setExecutionFlowStates(prev => {
      const currentState = prev[messageId] || { isExpanded: true, isAnimating: false };
      return {
        ...prev,
        [messageId]: { ...currentState, isExpanded: !currentState.isExpanded }
      };
    });
  };
  
  if (!logs || logs.length === 0) return null;
  
  return (
    <div ref={ref} className="mb-3 ml-2 max-w-[85%] md:max-w-[70%] min-w-0">
      <div 
        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg overflow-hidden transition-all duration-300 ease-in-out min-w-0"
      >
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-800/30 transition-colors"
          onClick={toggleExpansion}
        >
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isGenerating 
                ? 'bg-green-400 animate-pulse' 
                : 'bg-blue-400'
            }`} />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Execution Flow
            </span>
            {isGenerating && (
              <span className="text-xs text-blue-600 dark:text-blue-300 animate-pulse">
                Processing...
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {!flowState.isExpanded && (
              <span className="text-xs text-blue-600 dark:text-blue-400">
                Click to expand
              </span>
            )}
          </div>
        </div>
        
        {flowState.isExpanded && (
          <div className="px-3 pb-3">
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-md p-3 border border-blue-100 dark:border-blue-800 min-w-0 overflow-hidden">
              <ul className="space-y-2 text-xs font-mono min-w-0">
                {(isGenerating ? visibleLines : allLines).map((line, i) => (
                  <li 
                    key={i} 
                    className={`flex items-start space-x-2 transition-all duration-300 min-w-0 ${
                      isGenerating && i === visibleLines.length - 1 
                        ? 'animate-pulse' 
                        : ''
                    }`}
                    style={{
                      animationDelay: `${i * 100}ms`
                    }}
                  >
                    <span className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-700 dark:text-gray-300 break-words overflow-wrap-anywhere flex-1 min-w-0">
                      {line}
                    </span>
                  </li>
                ))}
                {isGenerating && (
                  <li className="flex items-start space-x-2 animate-pulse min-w-0">
                    <span className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-500 dark:text-gray-400 italic min-w-0">
                      Processing...
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ExecutionFlow.displayName = 'ExecutionFlow';

export default ExecutionFlow;