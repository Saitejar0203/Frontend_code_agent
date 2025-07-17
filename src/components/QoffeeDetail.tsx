import React from 'react';
import { Zap, Brain, Search, FileText, CheckCircle, Database, Clock } from 'lucide-react';

interface QoffeeDetailProps {
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

const QoffeeDetail: React.FC<QoffeeDetailProps> = ({ agent }) => {
  const workflowIcons = [FileText, Search, Clock, Brain, Zap, CheckCircle, Database, CheckCircle];

  return (
    <div className="space-y-8">
      {/* Hero Section with Main Architecture */}
      <section className="bg-gray-50 rounded-xl p-8 border border-gray-200">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">Architecture Overview</h3>
            <p className="text-gray-700 leading-relaxed text-lg mb-6">
              {agent.architecture}
            </p>
            <div className="flex items-center space-x-4">
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
          <div className="flex justify-center">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 max-w-md">
              <img 
                src="/qoffee-maingraph.png" 
                alt="Qoffee Main Graph Architecture"
                className="w-full h-auto rounded-lg"
              />
              <p className="text-sm text-gray-600 mt-4 text-center font-medium">
                Multi-Agent Collaboration Pipeline
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Process with Visual Diagrams */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Intelligent Workflow Process</h3>
          <p className="text-gray-600">
            Multi-agent system with self-correction loops and quality assurance
          </p>
        </div>
        
        {/* Workflow Diagrams */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex justify-center mb-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <img 
                    src="/qoffee-subgraph.png" 
                    alt="Section Builder Subgraph"
                    className="w-full h-auto rounded-lg max-w-xs"
                  />
                </div>
              </div>
              <h4 className="text-lg font-bold text-gray-800 mb-2 text-center">AI Critic Loop</h4>
              <p className="text-sm text-gray-600 text-center">
                Writer and Grader agents collaborate in iterative refinement cycles
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex justify-center mb-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <img 
                    src="/qoffee-topicpicker.png" 
                    alt="Topic Picker Graph"
                    className="w-full h-auto rounded-lg max-w-xs"
                  />
                </div>
              </div>
              <h4 className="text-lg font-bold text-gray-800 mb-2 text-center">Smart Topic Selection</h4>
              <p className="text-sm text-gray-600 text-center">
                Intelligent relevance identification and topic prioritization
              </p>
            </div>
          </div>

          {/* Workflow Process Description */}
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
            <div className="space-y-6">
              <p className="text-gray-700 leading-relaxed text-lg mb-6">
                The system leverages a dynamic orchestration framework to manage specialized AI agents through a multi-phase process.
              </p>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">1. Intelligent Planning</h4>
                  <p className="text-gray-700 leading-relaxed">
                    First, a Planner agent performs a preliminary analysis of the topic to construct a detailed, structured blueprint for the report. This ensures the entire project is grounded in current information and follows a coherent narrative structure from the start.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">2. Parallel Research</h4>
                  <p className="text-gray-700 leading-relaxed">
                    With the blueprint set, the system dispatches multiple Researcher agents to work concurrently, each tackling a specific section. These agents independently gather web data, synthesize text, and select relevant images, dramatically accelerating the research phase.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">3. The Self-Correction Loop</h4>
                  <p className="text-gray-700 leading-relaxed">
                    Each draft is immediately sent to a Critique agent for rigorous, automated review. If a draft is found lacking, the critique agent provides actionable feedback and new research tasks, returning it for another iteration. This cycle of writing and refinement repeats until quality standards are met.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">4. Final Assembly and Transformation</h4>
                  <p className="text-gray-700 leading-relaxed">
                    Once all sections are approved, an Assembler agent gathers the content, writes the introduction and conclusion, and compiles the final, polished report. The process culminates when the report's storage in the database triggers a secondary workflow. This final step generates an audio script from the report's content and produces a podcast version using a Text-to-Speech (TTS) model, transforming the written report into a new format.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools & Technologies */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Technology Stack</h3>
          <p className="text-gray-600">
            Cutting-edge tools and APIs powering intelligent content generation
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agent.tools.map((tool, index) => (
              <div 
                key={index}
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
              >

                <span className="text-gray-700 font-medium text-sm leading-relaxed">{tool}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      {agent.keyFeatures && (
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Key Features & Capabilities</h3>
            <p className="text-gray-600">
              AI technologies delivering exceptional performance and reliability
            </p>
          </div>
          <div className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              {agent.keyFeatures.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-gray-700 leading-relaxed flex-1">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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

export default QoffeeDetail;