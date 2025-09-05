
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { Search, Sparkles, Network, Newspaper, Settings, Code } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginModal, LogoutModal } from "@/components/auth";
import { useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const agents = [
    {
      title: "Code Agent",
      description: "Advanced code analysis, generation, and refactoring assistant powered by cutting-edge AI.",
      model: "Gemini 2.5 Pro",
      tools: "WebSearch, Image Generation",
      icon: Code,
      id: "code-agent"
    },
    {
      title: "Qoffee",
      description: "Advanced news research and analysis with deep research architecture.",
      model: "Gemini 2.5 Pro",
      tools: "WebSearch, Deep Research Architecture",
      icon: Newspaper,
      id: "qoffee",
    },
    {
      title: "MultiAgent System",
      description: "Collaborative AI agents working together - research, math, and synthesis.",
      model: "Gemini 2.0 flash",
      tools: "Web Search, Web Scraper, Python REPL",
      icon: Network,
      id: "multiagent-system",
    },
    {
      title: "Basic Perplexity",
      description: "Web search, summarization, and calculations with advanced tools.",
      model: "Gemini 2.0 flash",
      tools: "WebSearch, WebScrapper, Python REPL",
      icon: Search,
      id: "basic-perplexity",
    },
    {
      title: "Auto Prompt Engineering",
      description: "Intelligent system that automatically refines and optimizes LLM prompts for enhanced performance and reliability.",
      model: "Gemini 2.5 Pro",
      tools: [],
      icon: Settings,
      id: "auto-prompt"
    },
    {
      title: "Coming Soon",
      description: "Check back next weekend for more LLM constructs",
      icon: Sparkles,
      isComingSoon: true,
    },
  ];

  const handleAgentClick = (agentId: string) => {
    // Auto Prompt Engineering is not a chat agent, navigate to detail page
    if (agentId === 'auto-prompt') {
      navigate(`/agent/${agentId}`);
    } else if (agentId === 'qoffee') {
      // Qoffee has a custom route
      navigate('/qoffee');
    } else {
      // Always navigate to the chat page - AuthGuard will handle login modal if needed
      navigate(`/chat/${agentId}`);
    }
  };

  const handleLoginSuccess = () => {
    // User will stay on the home page after login
  };

  const handleAuthButtonClick = () => {
    if (isAuthenticated) {
      setShowLogoutModal(true);
    } else {
      setShowLoginModal(true);
    }
  };

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
      {/* Navigation */}
      <nav className="content-layer flex justify-between items-center py-8 px-8 sm:px-12 w-full mx-auto md:grid md:grid-cols-2 md:gap-8">
        <div className="md:flex md:justify-center">
          <h1 className="text-2xl sm:text-xl font-semibold text-gray-800 truncate">
            Studio Twenty Three
          </h1>
        </div>
        <div className="flex space-x-4 sm:space-x-6 md:space-x-6 items-center md:justify-center md:w-fit md:ml-40">
          <Link to="/" className="text-gray-700 hover:text-gray-900 transition-colors text-lg sm:text-base">
            Home
          </Link>
          <Link to="/about" className="text-gray-700 hover:text-gray-900 transition-colors text-lg sm:text-base">
            About
          </Link>
          <button 
            onClick={handleAuthButtonClick}
            className={`px-6 py-3 rounded-full font-medium transition-all duration-200 hover:scale-105 shadow-md text-center min-w-[80px] ${
              isAuthenticated 
                ? 'bg-red-400 hover:bg-red-500 text-white border-0' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-0'
            }`}
          >
            {isAuthenticated ? 'Logout' : 'Login'}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="content-layer max-w-7xl mx-auto px-6 py-16">
        {/* Hero section */}
        <div className="text-center mb-16">
          <h2 className="text-6xl font-bold text-gray-800 mb-6 leading-tight">
            Sai Teja's LLM Constructs
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            I design and build autonomous AI systems to explore the capabilities of Large Language Models. Below is a selection of my work.
          </p>
        </div>

        {/* Agent cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {agents.map((agent, index) => (
            <Card 
              key={index} 
              className={`bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                agent.isComingSoon ? 'opacity-75' : 'cursor-pointer'
              }`}
              onClick={() => !agent.isComingSoon && agent.id && handleAgentClick(agent.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <agent.icon className="w-6 h-6 text-gray-600" />
                  {!agent.isComingSoon && agent.id !== 'auto-prompt' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/80 border-gray-400 text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-500 text-xs px-1 sm:px-2 py-1 h-6 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/agent/${agent.id}`);
                      }}
                    >
                      Know More
                    </Button>
                  )}
                </div>
                <CardTitle className="text-lg font-semibold text-gray-800 leading-tight">
                  {agent.title}
                </CardTitle>
                {agent.description && (
                  <CardDescription className="text-gray-600 text-sm leading-relaxed">
                    {agent.description}
                  </CardDescription>
                )}
              </CardHeader>
              {!agent.isComingSoon && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {agent.model && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 font-medium">Model</span>
                        <span className="font-semibold text-gray-800 bg-blue-50 px-2 py-1 rounded-md text-xs">{agent.model}</span>
                      </div>
                    )}
                    {agent.tools && agent.tools.length > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-600 font-medium block mb-2">Tools</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(agent.tools) ? agent.tools : agent.tools.split(', ')).map((tool, toolIndex) => (
                            <span 
                              key={toolIndex}
                              className="inline-block bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-100"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      
      <LogoutModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)}
      />
    </div>
  );
};

export default Index;
