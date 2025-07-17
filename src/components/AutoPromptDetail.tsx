import React from 'react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

interface AutoPromptDetailProps {
  agent: {
    id: string;
    name: string;
    description: string;
    model: string;
    architecture: string;
    workflow: string[];
    keyFeatures: string[];
    dataFlow: string;
    chatPath: string;
  };
}

const AutoPromptDetail: React.FC<AutoPromptDetailProps> = ({ agent }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Architecture Overview */}
      <section className="p-6 sm:p-8 border-b border-gray-200">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6">Architecture Overview</h3>
        <div className="grid lg:grid-cols-1 gap-8 items-start">
          <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-gray-400">
            <p className="text-gray-700 leading-relaxed text-base">
              This architecture is a structured prompt optimization pipeline designed to enhance the performance of cost-effective LLMs, specifically Gemini Flash Lite. While these models offer significant cost advantages, they are less adept at complex instruction following, making meticulously crafted prompts essential for reliable outputs. This system addresses that challenge by systematically refining prompts for use in my multi-agent and basic perplexity agent systems, ensuring high-quality performance without context overload.
            </p>
            <p className="text-gray-700 leading-relaxed text-base mt-4">
              The pipeline is built on a dual-dataset methodology, utilizing distinct holdout and golden datasets for training and unbiased evaluation. It features a continuous, AI-driven improvement loop where Gemini 2.5 Pro serves as an intelligent judge to score and refine prompts. The entire process, from model comparisons to performance visualization, is monitored and managed using LangSmith, providing crucial observability and analytics at every stage.
            </p>
          </div>
        </div>
      </section>

      {/* Technical Stack */}
      <section className="p-6 sm:p-8 border-b border-gray-200">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6">Technical Stack</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3 text-lg">
              LLM Model
            </h4>
            <span className="inline-block bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium">
              {agent.model}
            </span>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3 text-lg">
              Workflow Orchestration
            </h4>
            <span className="inline-block bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium">
              Langgraph
            </span>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3 text-lg">
              Observability
            </h4>
            <span className="inline-block bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium">
              Langsmith Platform
            </span>
          </div>
        </div>
      </section>

      {/* Workflow Process */}
      <section className="p-6 sm:p-8 border-b border-gray-200">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6">Workflow Process</h3>
        <p className="text-gray-600 mb-6 text-base leading-relaxed">
          Automated prompt optimization pipeline with iterative refinement and performance evaluation.
        </p>
        
        {/* Workflow Diagrams */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="flex justify-center">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 max-w-sm">
              <img 
                src="/AutoPrompt_Highlevel.png" 
                alt="Auto Prompt Engineering High-Level Overview - Complete workflow from setup to final validation"
                className="w-full h-auto rounded-lg"
              />
              <p className="text-sm text-gray-600 mt-3 text-center font-medium">
                High-Level Overview
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 max-w-sm">
              <img 
                src="/AutoPrompt_refiner.png" 
                alt="Auto Prompt Improvement Cycle - Iterative refinement loop with feedback and optimization"
                className="w-full h-auto rounded-lg"
              />
              <p className="text-sm text-gray-600 mt-3 text-center font-medium">
                Improvement Cycle
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 max-w-sm">
              <img 
                src="/AutoPrompt_Validation.png" 
                alt="Auto Prompt Final Validation - Performance testing and report generation on holdout dataset"
                className="w-full h-auto rounded-lg"
              />
              <p className="text-sm text-gray-600 mt-3 text-center font-medium">
                Final Validation
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <p className="text-gray-700 leading-relaxed text-base mb-4">
            The prompt optimization workflow is a sequential process that moves from initial setup to a rigorous, iterative refinement cycle, and concludes with a final, unbiased validation.
          </p>
          <p className="text-gray-700 leading-relaxed text-base mb-4">
            First, the Setup and Preparation stage involves initializing the system by establishing baseline performance metrics. This requires preparing two critical datasets: a golden dataset for the iterative refinement process and a completely separate holdout dataset. The holdout set is reserved exclusively for the final, unbiased performance assessment, ensuring the evaluation is based on entirely unseen data.
          </p>
          <p className="text-gray-700 leading-relaxed text-base mb-4">
            Next, the process enters the Iterative Improvement Loop. This continuous cycle begins by using an initial prompt to generate outputs against the golden dataset. These outputs are then systematically judged and scored by Gemini 2.5 Pro, which provides detailed feedback on their accuracy, relevance, and effectiveness. This feedback is aggregated to identify recurring patterns and areas for improvement. Based on these aggregated insights and its own powerful reasoning capabilities, Gemini 2.5 Pro then recommends specific optimizations, creating an enhanced version of the prompt. This loop continues until the prompt's performance meets the predefined optimization goals.
          </p>
          <p className="text-gray-700 leading-relaxed text-base">
            Finally, the Final Validation stage provides an objective measure of the prompt's real-world effectiveness. The best-performing prompt from the improvement loop is tested against the holdout dataset. This crucial step assesses its performance on unseen data, providing an unbiased evaluation. The process concludes with the generation of a comprehensive performance report, which includes detailed before-and-after comparisons, performance metrics, and final optimization recommendations.
          </p>
        </div>
      </section>

      {/* Data Flow */}
      <section className="p-6 sm:p-8 border-b border-gray-200">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6">Data Flow Architecture</h3>
        <p className="text-gray-600 mb-6 text-base leading-relaxed">
          Complete prompt optimization pipeline showing the flow from initial prompt to refined output.
        </p>
        <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-gray-400">
          <p className="text-gray-700 text-sm leading-relaxed font-mono bg-white p-4 rounded border">
            {agent.dataFlow}
          </p>
        </div>
      </section>


    </div>
  );
};

export default AutoPromptDetail;