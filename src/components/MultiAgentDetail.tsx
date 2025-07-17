import React from 'react';
import { Zap, Brain, Search, FileText, CheckCircle, Database, Clock, Users } from 'lucide-react';

interface MultiAgentDetailProps {
  agent: {
    id: string;
    name: string;
    description: string;
    model: string;
    architecture: string;
    tools: string[];
    workflow: string[];
    keyFeatures: string[];
    dataFlow: string;
    chatPath: string;
  };
}

const MultiAgentDetail: React.FC<MultiAgentDetailProps> = ({ agent }) => {
  const workflowIcons = [Search, FileText, Users, Brain, Zap, CheckCircle, Database, CheckCircle];

  return (
    <div className="space-y-8">
      {/* Hero Section with Main Architecture */}
      <section className="bg-gray-50 rounded-xl p-8 border border-gray-200">
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">Architecture Overview</h3>
            <p className="text-gray-700 leading-relaxed text-lg mb-6 max-w-4xl mx-auto">
              {agent.architecture}
            </p>
            <div className="flex justify-center space-x-4">
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
                <span className="text-sm font-medium text-gray-600">Powered by</span>
                <div className="text-lg font-bold text-gray-800">{agent.model}</div>
              </div>
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
                <span className="text-sm font-medium text-gray-600">Framework</span>
                <div className="text-lg font-bold text-gray-800">LangGraph</div>
              </div>
            </div>
          </div>
          
          {/* Horizontal Graph Image */}
          <div className="flex justify-center">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 w-full max-w-4xl">
              <img 
                src="/Multiagent_graph.png" 
                alt="MultiAgent System Architecture"
                className="w-full h-auto rounded-lg"
              />
              <p className="text-sm text-gray-600 mt-4 text-center font-medium">
                Supervisor-Agent Coordination Architecture
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Process */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Intelligent Workflow Process</h3>
          <p className="text-gray-600">
            Supervisor-coordinated multi-agent system with specialized task delegation
          </p>
        </div>
        
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <p className="text-gray-700 leading-relaxed text-base mb-4">
              The multi-agent workflow operates through a sophisticated supervisor-agent coordination model that maximizes efficiency through intelligent task delegation and parallel processing. This architecture enables complex problem-solving by distributing specialized tasks across multiple AI agents, each optimized for specific domains and capabilities.
            </p>
            <p className="text-gray-700 leading-relaxed text-base mb-4">
              The process begins when the supervisor agent receives a user query and performs an initial analysis to understand the complexity and requirements. Based on this assessment, the supervisor strategically delegates specific subtasks to specialized agents - such as research agents for information gathering, analysis agents for data processing, and synthesis agents for content generation. Each agent operates independently while maintaining communication with the supervisor for coordination.
            </p>
            <p className="text-gray-700 leading-relaxed text-base mb-4">
              Throughout execution, agents work in parallel where possible, significantly reducing overall processing time. The supervisor continuously monitors progress, manages dependencies between tasks, and ensures quality control. Agents can request additional resources or clarification from the supervisor when needed, creating a dynamic and adaptive workflow that responds to changing requirements.
            </p>
            <p className="text-gray-700 leading-relaxed text-base">
              Finally, the supervisor collects outputs from all agents, performs quality validation, and synthesizes the results into a comprehensive response. This collaborative approach leverages the strengths of specialized agents while maintaining coherent oversight, resulting in more accurate, thorough, and efficient problem-solving than traditional single-agent systems.
            </p>
          </div>
        </div>
      </section>



      {/* Data Flow */}
      <section className="bg-gray-50 rounded-xl p-8 border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Data Flow Architecture</h3>
        <p className="text-gray-600 mb-6 text-center max-w-3xl mx-auto">
          Complete information processing pipeline from input to intelligent output
        </p>
        <div className="bg-white rounded-xl p-6 border-l-4 border-gray-800 shadow-sm">
          <div className="font-mono text-sm leading-relaxed text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
            {agent.dataFlow.split(' → ').map((step, index, array) => (
              <span key={index}>
                <span className="font-semibold text-gray-800">{step.trim()}</span>
                {index < array.length - 1 && (
                  <span className="text-gray-600 mx-2">→</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MultiAgentDetail;