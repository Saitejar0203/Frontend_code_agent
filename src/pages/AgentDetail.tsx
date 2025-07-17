import React, { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QoffeeDetail from '@/components/QoffeeDetail';
import MultiAgentDetail from '@/components/MultiAgentDetail';
import BasicPerplexityDetail from '@/components/BasicPerplexityDetail';
import AutoPromptDetail from '@/components/AutoPromptDetail';

interface AgentData {
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
}

const agentData: Record<string, AgentData> = {
  'qoffee': {
    id: 'qoffee',
    name: 'Qoffee',
    description: 'An automated analysis engine that transforms any news topic into clear, comprehensive, and insightful reports',
    model: 'Gemini 2.5 Pro',
    architecture: 'We are living in a paradox: while we have access to more information than ever before, true understanding is increasingly elusive. Headlines flash by, but the crucial context and deeper implications—the "so what"—are often lost. Qoffee is engineered to be an antidote to this complexity. At its core, Qoffee is not a single AI. Instead, it is a sophisticated multi-agent system, a digital newsroom where autonomous AI agents collaborate. Each agent has a specialized role, and together they work through a dynamic workflow to research, draft, critique, and refine every piece of analysis. This collaborative process is orchestrated by LangGraph, a powerful state machine framework. LangGraph provides the backbone for our agent-workflow synergy, moving beyond simple content generation. It enables a structured, stateful process where tasks are intelligently routed, ensuring a level of depth and accuracy that a single AI cannot achieve.',
    tools: ['web search with temporal filtering for recent content prioritization', 'TTS model to create multi-speaker audio summaries', 'Intelligent Image Extraction and Processing from web sources', 'LangGraph State Management for workflow orchestration', 'Multi-agent collaboration system with specialized roles'],
    workflow: [
      'Report Plan Generation: A "Planner" agent powered by Gemini 2.5 Pro analyzes the given topic and creates a detailed, multi-section outline, providing logical structure and clear focus for the entire process',
      'Intelligent Query Generation: A "Query" agent generates multiple, targeted search phrases designed to explore the topic from various angles, ensuring comprehensive coverage beyond generic searches',
      'Temporally-Aware Web Search: Generated queries are executed in parallel against the Linkup Search API with crucial temporal filtering applied, focusing on recent periods to prioritize current and relevant information',
      'Content & Image Extraction: Raw web content is processed using advanced scraping techniques, intelligently extracting clean, readable text while simultaneously identifying and cataloging relevant images for visual context',
      'Context-Driven Section Writing: With a rich corpus of information, the "Writer" agent leverages Gemini 2.5 Pro to draft each section, strictly adhering to the initial blueprint and maintaining narrative coherence',
      'The Self-Correction Loop - AI Critic: Each drafted section is immediately passed to a separate "Grader" agent for rigorous quality checks. If incomplete or lacking depth, the Grader provides constructive feedback and generates new, specific queries, triggering a refinement loop',
      'Final Report Assembly: Once all sections pass quality grading, a final agent assembles them into a single, cohesive document with proper formatting and citations',
      'Persistent Storage & Scheduling: Completed reports are saved to Supabase Storage, creating a permanent historical archive, with the system designed for autonomous operation at regular intervals'
    ],

    dataFlow: 'News Topic Input → Multi-Agent Collaboration → Report Plan Blueprint → Intelligent Query Generation → Parallel Temporal Web Search → Content & Image Extraction → Context-Driven Section Writing → AI Critic Quality Loop → Final Assembly → Supabase Archive → Autonomous Scheduling',
    chatPath: '/qoffee'
  },
  'multiagent-system': {
    id: 'multiagent-system',
    name: 'MultiAgent System',
    description: 'Collaborative AI agents working together - research, math, and synthesis',
    model: 'Gemini 2.5 Flash Lite',
    architecture: 'Supervisor-Agent coordination pattern implementing sequential task delegation with specialized agent roles. Uses LangGraph Commands and Send operations for inter-agent communication with state management and handoff protocols.',
    tools: ['Tavily Search API (4 results max)', 'Advanced Web Scraper with BeautifulSoup', 'Sandboxed Python REPL Environment', 'Agent Handoff Tools', 'PostgreSQL Checkpointer'],
    workflow: [
      'Query Analysis: Supervisor analyzes user request and determines required expertise',
      'Task Decomposition: Breaks complex queries into specialized sub-tasks',
      'Agent Selection: Chooses appropriate specialist agents based on task requirements',
      'Research Delegation: Research agent performs web search and content extraction',
      'Mathematical Processing: Math agent handles calculations and data analysis',
      'Cross-Agent Communication: Agents share findings through structured handoff tools',
      'Result Synthesis: Supervisor aggregates specialist outputs into coherent response',
      'Quality Assurance: Final verification and formatting of combined results'
    ],
    keyFeatures: [
      'Supervisor agent with intelligent task delegation and coordination capabilities',
      'Specialized Research Agent with mandatory web search and scraping protocols',
      'Dedicated Math Agent with sandboxed Python execution environment',
      'Sequential handoff system with structured task descriptions and state transfer',
      'Comprehensive error handling and graceful degradation across agent failures',
      'PostgreSQL-based conversation persistence with session management',
      'Date-aware processing with current timestamp injection for time-sensitive queries',
      'Forbidden termination policy for specialist agents to ensure complete task execution'
    ],
    dataFlow: 'User Query → Supervisor Analysis → Task Decomposition → Agent Selection → Research Agent (Web Search + Scraping) → Math Agent (Calculations) → Inter-Agent Communication → Result Aggregation → Supervisor Synthesis → Final Response',
    chatPath: '/chat/multiagent-system'
  },
  'basic-perplexity': {
    id: 'basic-perplexity',
    name: 'Basic Perplexity',
    description: 'Web search, summarization, and calculations with advanced tools',
    model: 'Gemini 2.5 Flash Lite',
    architecture: 'Single-agent architecture implementing Plan-Execute-Verify methodology with comprehensive tool orchestration. Features proactive tool selection, graceful error handling, and dynamic response formatting based on content analysis.',
    tools: ['Tavily Search API (4 results, optimized)', 'Advanced Web Scraper with Content Extraction', 'Sandboxed Python REPL (2000 char limit)', 'Dynamic Response Formatter', 'PostgreSQL Session Management'],
    workflow: [
      'Strategic Planning: Analyzes query complexity and formulates step-by-step execution plan',
      'Tool Selection: Determines optimal tool sequence based on information requirements',
      'Web Search Execution: Performs targeted searches using Tavily API for current information',
      'Content Extraction: Scrapes top 3-5 authoritative URLs for comprehensive data gathering',
      'Computational Analysis: Executes Python code for calculations and data processing',
      'Information Synthesis: Combines scraped content and calculations into coherent insights',
      'Quality Verification: Reviews completeness and accuracy of gathered information',
      'Dynamic Formatting: Applies appropriate presentation format (tables, code blocks, lists)'
    ],
    keyFeatures: [
      'Proactive tool usage without permission requests - autonomous decision making',
      'Comprehensive web scraping with mandatory extraction from multiple authoritative sources',
      'Sandboxed Python execution environment with security restrictions and timeout protection',
      'Graceful error handling with silent failure recovery and alternative source utilization',
      'Dynamic response formatting with content-aware presentation (tables, code blocks, emphasis)',
      'Mandatory source citation with clickable Markdown links in dedicated Sources section',
      'Time-aware processing with current timestamp integration for temporal queries',
      'Confidence-based presentation with definitive answers based on research findings'
    ],
    dataFlow: 'User Query → Strategic Analysis → Tool Planning → Web Search (Tavily) → Content Scraping (Top URLs) → Python Processing → Information Synthesis → Quality Verification → Dynamic Formatting → Cited Response',
    chatPath: '/chat/basic-perplexity'
  },
  'auto-prompt': {
    id: 'auto-prompt',
    name: 'Auto Prompt Engineering',
    description: 'Intelligent system that automatically refines and optimizes LLM prompts for enhanced performance and reliability.',
    model: 'Gemini 2.5 Pro',
    architecture: 'A sophisticated three-phase prompt optimization system featuring Setup & Preparation, Iterative Improvement Loop, and Final Validation. The system employs dual-dataset methodology with holdout and golden datasets, implementing continuous refinement cycles with AI-powered scoring and feedback mechanisms to achieve optimal prompt performance across diverse use cases.',
    tools: [
      'Gemini 2.5 Pro for prompt generation and refinement',
      'Dual Dataset Management (Holdout & Golden datasets)',
      'AI-Powered Scoring Engine with performance metrics',
      'Iterative Feedback Collection and Analysis System',
      'Automated Prompt Variation Generator',
      'Performance Validation and Testing Framework',
      'Final Report Generation with comprehensive analytics'
    ],
    workflow: [
      'Setup & Preparation: Initialize system with holdout and golden datasets, establishing baseline performance metrics and validation criteria',
      'Data Source Configuration: Prepare both holdout dataset for testing and golden dataset for refinement, ensuring comprehensive coverage of use cases',
      'Iterative Improvement Loop Entry: Begin continuous optimization cycle with initial prompt analysis and performance baseline establishment',
      'Output Generation: Generate outputs using current prompts against golden dataset, creating comprehensive test results for evaluation',
      'AI-Powered Scoring: Judge and score outputs using Gemini 2.5 Pro, providing detailed feedback on accuracy, relevance, and effectiveness',
      'Feedback Aggregation: Collect all feedback and performance insights, identifying patterns and areas for improvement across test cases',
      'Prompt Refinement: Improve prompts using aggregated insights and Gemini 2.5 Pro recommendations, creating enhanced versions with targeted optimizations',
      'Convergence Check: Evaluate if optimization goals are met or if further iterations are needed, ensuring quality standards are achieved',
      'Final Validation: Take optimized prompts from improvement loop and run comprehensive testing on holdout dataset for unbiased performance assessment',
      'Performance Report Generation: Generate detailed analytics report with before/after comparisons, performance metrics, and optimization recommendations'
    ],
    keyFeatures: [
      'Three-Phase Architecture: Structured approach with Setup & Preparation, Iterative Improvement Loop, and Final Validation phases',
      'Dual Dataset Methodology: Separate holdout and golden datasets ensuring unbiased evaluation and comprehensive testing coverage',
      'AI-Powered Scoring System: Gemini 2.5 Pro integration for intelligent prompt evaluation and feedback generation',
      'Iterative Refinement Loop: Continuous improvement cycle with automated feedback collection and prompt optimization',
      'Performance Convergence Detection: Smart algorithms to determine optimal stopping points and quality achievement',
      'Comprehensive Validation Framework: Final testing on unseen holdout data for reliable performance assessment',
      'Detailed Analytics Reporting: Complete performance reports with metrics, comparisons, and actionable insights',
      'Automated Prompt Variation Generation: Intelligent creation of prompt alternatives based on performance feedback'
    ],
    dataFlow: 'Input Prompt → Setup & Preparation (Holdout + Golden Datasets) → Iterative Improvement Loop (Generate → Score → Feedback → Refine) → Convergence Check → Final Validation (Holdout Testing) → Performance Report → Optimized Prompt Output',
    chatPath: '/chat/auto-prompt'
  }
};

const AgentDetail: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  
  const agent = agentId ? agentData[agentId] : null;

  // Scroll to top when component mounts or agentId changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [agentId]);
  
  if (!agent) {
    return (
      <div className="min-h-screen dynamic-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Agent Not Found</h1>
          <Link to="/" className="text-emerald-600 hover:text-emerald-700">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dynamic-bg">
      {/* Dynamic background elements */}
      <div className="ambient-glow"></div>
      <div className="atmospheric-layer"></div>
      <div className="depth-layer-1"></div>
      <div className="depth-layer-2"></div>
      <div className="bg-blob-1"></div>
      <div className="bg-blob-2"></div>
      <div className="bg-blob-3"></div>
      <div className="bg-blob-4"></div>
      <div className="bg-blob-5"></div>
      <div className="bg-particle-1"></div>
      <div className="bg-particle-2"></div>
      <div className="bg-particle-3"></div>
      <div className="shimmer-overlay"></div>

      {/* Header */}
      <header className="content-layer flex items-center justify-between p-3 md:p-4 border-b border-gray-200/50 bg-white/70 backdrop-blur-sm flex-shrink-0 min-h-[70px] md:min-h-[80px] sticky top-0 z-50">
        <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
          {/* Home button */}
          <Link to="/" className="flex items-center space-x-1 md:space-x-2 text-gray-600 hover:text-gray-800 transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Home</span>
            <span className="text-xs sm:hidden">Home</span>
          </Link>
          
          <div className="min-w-0 flex-1 text-center md:text-center">
            <h1 className="text-base md:text-lg font-semibold text-gray-800 truncate">{agent.name}</h1>
            <p className="text-xs md:text-sm text-gray-600 truncate hidden sm:block">{agent.description}</p>
          </div>
        </div>
        
        {/* Right side - Go to Agent button */}
        {agent.id !== 'auto-prompt' && (
          <Button
            onClick={() => navigate(agent.chatPath)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex-shrink-0 ml-2 md:ml-4 h-8 md:h-10 px-2 md:px-4"
          >
            <ExternalLink className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline text-sm md:text-base">Go to Agent</span>
            <span className="sm:hidden text-xs">Chat</span>
          </Button>
        )}
      </header>

      {/* Main content */}
      <main className="content-layer max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Hero section */}
        <div className="text-center mb-8 sm:mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold text-gray-800 mb-4 sm:mb-6 leading-tight">
            How {agent.name} Works
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
            Deep dive into the architecture, workflow, and capabilities of this AI agent.
          </p>
        </div>

        {/* Technical Documentation */}
        {agent.id === 'qoffee' ? (
          <QoffeeDetail agent={agent} />
        ) : agent.id === 'multiagent-system' ? (
          <MultiAgentDetail agent={agent} />
        ) : agent.id === 'basic-perplexity' ? (
          <BasicPerplexityDetail agent={agent} />
        ) : agent.id === 'auto-prompt' ? (
          <AutoPromptDetail agent={agent} />
        ) : (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Architecture Overview */}
          <section className="p-6 sm:p-8 border-b border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Architecture Overview</h3>
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-gray-400">
                <p className="text-gray-700 leading-relaxed text-base">
                  {agent.architecture}
                </p>
              </div>
              {agent.id === 'qoffee' && (
                <div className="flex justify-center">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 max-w-md">
                    <img 
                      src="/qoffee-maingraph.png" 
                      alt="Qoffee Main Graph Architecture - Three interconnected graphs showing Topic Picker, Main Graph, and Section Builder Subgraph"
                      className="w-full h-auto rounded-lg"
                    />
                    <p className="text-sm text-gray-600 mt-3 text-center font-medium">
                      Main Graph Architecture
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Technical Stack */}
          <section className="p-6 sm:p-8 border-b border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Technical Stack</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  Orchestration Framework
                </h4>
                <span className="inline-block bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium">
                  LangGraph State Machine
                </span>
              </div>
            </div>
          </section>

          {/* Tools & Technologies */}
          <section className="p-6 sm:p-8 border-b border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Tools & Technologies</h3>
            <p className="text-gray-600 mb-6 text-base leading-relaxed">
              Comprehensive suite of tools and APIs enabling advanced AI capabilities and robust data processing.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {agent.tools.map((tool, index) => (
                <div 
                  key={index}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <span className="text-gray-700 font-medium text-sm">{tool}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Workflow Process */}
          <section className="p-6 sm:p-8 border-b border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Workflow Process</h3>
            <p className="text-gray-600 mb-6 text-base leading-relaxed">
              Detailed execution pipeline with step-by-step processing methodology and error handling protocols.
            </p>
            
            {agent.id === 'qoffee' && (
              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                <div className="flex justify-center">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 max-w-sm">
                    <img 
                      src="/qoffee-subgraph.png" 
                      alt="Section Builder Subgraph - Iterative loop between Writing and Grading agents"
                      className="w-full h-auto rounded-lg"
                    />
                    <p className="text-sm text-gray-600 mt-3 text-center font-medium">
                      Section Builder Subgraph
                    </p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 max-w-sm">
                    <img 
                      src="/qoffee-topicpicker.png" 
                      alt="Topic Picker Graph - Intelligent topic selection and relevance identification"
                      className="w-full h-auto rounded-lg"
                    />
                    <p className="text-sm text-gray-600 mt-3 text-center font-medium">
                      Topic Picker Graph
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {agent.workflow.map((step, index) => (
                <div key={index} className="flex items-start space-x-4 bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-700 text-sm leading-relaxed">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Data Flow */}
          <section className="p-6 sm:p-8 border-b border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Data Flow Architecture</h3>
            <p className="text-gray-600 mb-6 text-base leading-relaxed">
              Complete data processing pipeline showing information flow from input to output with intermediate processing stages.
            </p>
            <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-gray-400">
              <p className="text-gray-700 text-sm leading-relaxed font-mono bg-white p-4 rounded border">
                {agent.dataFlow}
              </p>
            </div>
          </section>

          {/* Key Features */}
          <section className="p-6 sm:p-8 border-b border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Key Features & Capabilities</h3>
            <p className="text-gray-600 mb-6 text-base leading-relaxed">
              Advanced AI technologies and implementation details delivering robust performance and reliability.
            </p>
            <div className="grid gap-4">
              {agent.keyFeatures.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <div className="flex-shrink-0 w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                  <p className="text-gray-700 text-sm leading-relaxed flex-1">{feature}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Infrastructure & Monitoring */}
          <section className="p-6 sm:p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Infrastructure */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Infrastructure</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-1 text-sm">Database & Authentication</h4>
                    <p className="text-gray-600 text-sm">Supabase PostgreSQL</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-1 text-sm">Frontend Hosting</h4>
                    <p className="text-gray-600 text-sm">Vercel Edge Network</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-1 text-sm">Backend Hosting</h4>
                    <p className="text-gray-600 text-sm">Railway Container Platform</p>
                  </div>
                </div>
              </div>
              
              {/* Monitoring */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Monitoring & Analytics</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-1 text-sm">Tracing & Debugging</h4>
                    <p className="text-gray-600 text-sm">LangSmith Observability</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-1 text-sm">Performance Metrics</h4>
                    <p className="text-gray-600 text-sm">LangSmith Analytics Dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
        )}

        {/* CTA Section */}
        {agent.id !== 'auto-prompt' && (
          <div className="text-center mt-12 sm:mt-16">
            <Button
              onClick={() => navigate(agent.chatPath)}
              size="lg"
              className="bg-gray-800 hover:bg-gray-900 text-white font-medium px-6 sm:px-8 py-3 rounded text-base sm:text-lg transition-colors duration-200"
            >
              Try {agent.name} Now
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AgentDetail;