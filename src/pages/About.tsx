
import { Link, useNavigate } from "react-router-dom";
import { Mail, Code2, Rocket, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { LoginModal, LogoutModal } from "@/components/auth";
import { useState } from "react";

const About = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const skills = [
    "Product Management",
    "Strategy",
    "Financial Analysis",
    "LLM Application Development",
    "Machine Learning",
    "Model Training & Fine-Tuning",
    "Prompt Engineering",
    "Python Development",
    "Web Development",
    "System Design",
    "API Design"
  ];

  const projects = [
    {
      name: "Qoffee",
      status: "Live",
      description: "AI-powered news analysis with WebSearch and Deep Research Architecture",
      id: "qoffee"
    },
    {
      name: "MultiAgent System",
      status: "Live",
      description: "Collaborative AI agents working together - research, math, and synthesis with Web Search, Web Scraper, Python REPL",
      id: "multiagent-system"
    },
    {
      name: "Basic Perplexity",
      status: "Live",
      description: "Web search, summarization, and calculations with WebSearch, WebScrapper, and Python REPL tools",
      id: "basic-perplexity"
    }
  ];

  const handleAuthButtonClick = () => {
    if (isAuthenticated) {
      setShowLogoutModal(true);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLoginSuccess = () => {
    // User will stay on the about page after login
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
          <Link to="/" className="text-2xl sm:text-xl font-semibold text-gray-800 truncate hover:text-gray-900 transition-colors cursor-pointer">
            Studio Twenty Three
          </Link>
        </div>
        <div className="flex space-x-4 sm:space-x-6 md:space-x-6 items-center md:justify-center md:w-fit md:ml-40">
          <Link to="/" className="text-gray-700 hover:text-gray-900 transition-colors text-lg sm:text-base">
            Home
          </Link>
          <Link to="/about" className="text-gray-700 hover:text-gray-900 transition-colors text-lg sm:text-base font-medium">
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

      <div className="content-layer max-w-4xl mx-auto px-6 py-16">

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="text-center space-y-1">
                <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden">
                  <img 
                    src="/profile_image.jpeg" 
                    alt="Sai Teja" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardTitle className="text-2xl text-gray-800 mb-1">Sai Teja</CardTitle>
                <div className="text-center">
                  <div className="sm:block">
                    <p className="text-gray-800 text-lg font-semibold hidden sm:block">Product Manager</p>
                    <p className="text-gray-600 text-base hidden sm:block">(Technical Generalist)</p>
                  </div>
                  <div className="sm:hidden">
                    <p className="text-gray-800 text-lg font-semibold">
                      Product Manager <span className="text-gray-600 font-normal">(Technical Generalist)</span>
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2 sm:pt-6">
                <div className="space-y-2 sm:space-y-4">
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="text-base sm:text-xs">chinthas2019@email.iimcal.ac.in</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio */}
            <Card variant="knappily" className="bg-white/70 backdrop-blur-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Code2 className="w-5 h-5" />
                  <span>About Me</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    I am a Product Manager with over 6 years of experience in fintech and ecommerce domains. With a passion for continuous learning, I hold an MBA from IIM Calcutta, an Engineering degree from IIT Kanpur, and have cleared all three levels of the CFA examination.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    I believe AI is a powerful catalyst, accelerating not only human productivity and innovation but also the speed of learning itself. I've embraced this by deep-diving into the technologies I work with, building technical expertise in LLM applications, web development, and system design.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    As a Product Manager, this hands-on approach has been invaluable. It has enhanced my work both quantitatively, and qualitatively, by allowing me to build and demonstrate functional MVPs to effectively test ideas.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    My exploration of AI extends to the model side. To address privacy needs at work, we used open-source LLMs, which allowed me to gain practical experience in model training, fine-tuning, and deployment. This journey of discovery is what led to the creation of this personal space.
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3">About This Project</h4>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    This website is a non-commercial project I created to experiment, learn, and share my findings with the wider community. The AI agents showcased here are powered by more cost-effective LLMs to keep things sustainable, which may occasionally result in performance issues.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    While these agents may not always match the utility of commercial alternatives, I am making their internal execution flows transparent. In doing so, my goal is for visitors to find value by understanding the mechanics of how these agents operate.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    If you'd like to learn more about this journey into tech, the tools I'm using, the development of this website, or even view the source code, please feel free to connect with me on LinkedIn or send me an email.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Rocket className="w-5 h-5" />
                  <span>Skills & Technologies</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Projects */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Coffee className="w-5 h-5" />
                  <span>Weekend Projects</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map((project, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-start p-4 bg-white/50 rounded-lg space-y-3 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                          <h4 className="font-semibold text-gray-800">{project.name}</h4>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium w-fit mt-1 sm:mt-0">
                            {project.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/80 border-gray-400 text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-500 text-xs px-3 py-1.5 h-auto transition-all"
                          onClick={() => navigate(`/agent/${project.id}`)}
                        >
                          Learn how it works
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
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

export default About;
