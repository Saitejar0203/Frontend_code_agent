export interface DebugLog {
  phase:
    | "chain_start"
    | "chain_stream"
    | "chain_end"
    | "model_start"
    | "model_end"
    | "model_stream"
    | "tool_start"
    | "tool_end"
    | "model_end_final"
    | "agent_action"
    | "tool_execution";
  name: string;
  input?: any;
  output?: any;
  toolCalls?: Array<{
    tool_name: string;
    tool_args: any;
  }>;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  isLoading?: boolean;
  debugLogs?: DebugLog[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastActivity: Date;
}

export interface AgentInfo {
  name: string;
  description: string;
  model: string;
}