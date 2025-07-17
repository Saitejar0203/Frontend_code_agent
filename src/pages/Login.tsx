import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Login = () => {
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
      <nav className="content-layer flex justify-between items-center p-6 max-w-7xl mx-auto">
        <h1 className="text-xl font-semibold text-gray-800">Studio Twenty Three</h1>
        <div className="flex space-x-8">
          <Link to="/" className="text-gray-700 hover:text-gray-900 transition-colors">
            Home
          </Link>
          <Link to="/about" className="text-gray-700 hover:text-gray-900 transition-colors">
            About
          </Link>
          <Link to="/login" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
            Login
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

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">Login</h2>
          <p className="text-gray-600 text-lg">
            This page is currently under development.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;