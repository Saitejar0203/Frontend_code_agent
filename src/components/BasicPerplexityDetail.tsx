import React from 'react';
import { Zap, Brain, Search, FileText, CheckCircle, Database, Clock, Code } from 'lucide-react';

interface BasicPerplexityDetailProps {
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

const BasicPerplexityDetail: React.FC<BasicPerplexityDetailProps> = ({ agent }) => {
  const workflowIcons = [Brain, Search, FileText, Code, Zap, CheckCircle, Database, CheckCircle];

  return (
    <div className="space-y-8">
      {/* Hero Section with Main Architecture */}
      <section className="bg-gray-50 rounded-xl p-8 border border-gray-200">
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">Architecture Overview</h3>
            <p className="text-gray-700 leading-relaxed text-lg mb-6 max-w-4xl mx-auto">
              {agent.architecture} Built on LangGraph state machine framework for robust workflow orchestration and tool management.
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
                src="/basic_perplexity_graph.png" 
                alt="Basic Perplexity System Architecture"
                className="w-full h-auto rounded-lg"
              />
              <p className="text-sm text-gray-600 mt-4 text-center font-medium">
                Plan-Execute-Verify Architecture
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
            Single-agent system with comprehensive tool orchestration and dynamic response formatting
          </p>
        </div>
        
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <p className="text-gray-700 leading-relaxed text-base mb-4">
              The Basic Perplexity workflow operates through a streamlined Plan-Execute-Verify methodology that ensures comprehensive and accurate responses to user queries. This single-agent system leverages advanced tool orchestration to deliver research-grade answers through systematic information gathering and analysis.
            </p>
            <p className="text-gray-700 leading-relaxed text-base mb-4">
              The process begins with intelligent query analysis where the agent deconstructs the user's request and formulates a strategic plan of action. It identifies the required information sources, determines the optimal tools for each task, and establishes a logical sequence for execution. This planning phase ensures efficient resource utilization and comprehensive coverage of the query requirements.
            </p>
            <p className="text-gray-700 leading-relaxed text-base mb-4">
              During execution, the agent aggressively leverages its tool suite including web search for current information, web scraping for detailed content extraction from authoritative sources, and Python REPL for computational analysis and data processing. The system is designed with robust error handling and graceful failure recovery, ensuring reliable operation even when individual tools encounter issues.
            </p>
            <p className="text-gray-700 leading-relaxed text-base">
              Finally, the verification and synthesis phase consolidates all gathered information into a coherent, comprehensive response. The agent reviews the collected data for completeness and accuracy, performs cross-validation where possible, and synthesizes the findings into a well-structured answer that directly addresses the user's original query with supporting evidence and clear explanations.
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

export default BasicPerplexityDetail;