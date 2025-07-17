
import { Link } from "react-router-dom";
import { ArrowLeft, Github, Linkedin, Mail, Code2, Rocket, Coffee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Profile = () => {
  const skills = [
    "Large Language Models",
    "Python Development",
    "React & TypeScript",
    "Machine Learning",
    "API Design",
    "Prompt Engineering"
  ];

  const projects = [
    {
      name: "Basic Perplexity",
      status: "Live",
      description: "Web search, summarization, and calculations with WebSearch, WebScrapper, and Python REPL tools"
    },
    {
      name: "Code Refactor",
      status: "Live", 
      description: "Intelligent code optimization and refactoring assistant"
    },
    {
      name: "Travel Planner",
      status: "Live",
      description: "Personalized travel itinerary generator"
    }
  ];

  return (
    <div className="min-h-screen dynamic-bg">
      {/* Dynamic background elements */}
      <div className="ambient-glow"></div>
      <div className="atmospheric-layer"></div>
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
      <nav className="content-layer flex justify-between items-center p-6 max-w-7xl mx-auto">
        <h1 className="text-xl font-semibold text-gray-800">The Alchemist's Folio</h1>
        <div className="flex space-x-8">
          <Link to="/" className="text-gray-700 hover:text-gray-900 transition-colors">
            Home
          </Link>
          <Link to="/about" className="text-gray-700 hover:text-gray-900 transition-colors">
            About
          </Link>
          <Link to="/profile" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
            Profile
          </Link>
        </div>
      </nav>

      <div className="content-layer max-w-4xl mx-auto px-6 py-16">
        <Link 
          to="/" 
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">ST</span>
                </div>
                <CardTitle className="text-2xl text-gray-800">Sai Teja</CardTitle>
                <p className="text-gray-600">AI Engineer & LLM Architect</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">sai@alchemist.dev</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Github className="w-4 h-4" />
                    <span className="text-sm">github.com/saiteja</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Linkedin className="w-4 h-4" />
                    <span className="text-sm">linkedin.com/in/saiteja</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Code2 className="w-5 h-5" />
                  <span>About Me</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  I'm a passionate AI engineer who spends weekends crafting intelligent systems 
                  that push the boundaries of what's possible with large language models. 
                  My work focuses on creating practical, elegant solutions that demonstrate 
                  the transformative potential of AI in everyday applications.
                </p>
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
                    <div key={index} className="flex justify-between items-start p-4 bg-white/50 rounded-lg">
                      <div>
                        <h4 className="font-semibold text-gray-800">{project.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        {project.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
