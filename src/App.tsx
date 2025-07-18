
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { KnappilyProvider } from "@/contexts/KnappilyContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import BasicPerplexityChat from "./pages/BasicPerplexityChat";
import CodeRefactorChat from "./pages/CodeRefactorChat";
import TravelPlannerChat from "./pages/TravelPlannerChat";
import MultiAgentChat from "./pages/MultiAgentChat";
import DataAnalysisChat from "./pages/DataAnalysisChat";
import KnappilyCloneChat from "./pages/KnappilyCloneChat";
import AutoPromptChat from "./pages/AutoPromptChat";
import CodeAgentChat from "./pages/CodeAgentChat";
import AgentDetail from "./pages/AgentDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SessionProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/chat/basic-perplexity" element={<BasicPerplexityChat />} />
            <Route path="/chat/code-refactor" element={<CodeRefactorChat />} />
            <Route path="/chat/travel-planner" element={<TravelPlannerChat />} />
            <Route path="/chat/multiagent-system" element={<MultiAgentChat />} />
            <Route path="/chat/data-analysis" element={<DataAnalysisChat />} />
            <Route path="/chat/auto-prompt" element={<AutoPromptChat />} />
            <Route path="/chat/code-agent" element={<CodeAgentChat />} />
            <Route path="/qoffee" element={<AudioPlayerProvider><KnappilyProvider><KnappilyCloneChat /></KnappilyProvider></AudioPlayerProvider>} />
            <Route path="/qoffee/:articleId/:section" element={<AudioPlayerProvider><KnappilyProvider><KnappilyCloneChat /></KnappilyProvider></AudioPlayerProvider>} />
            <Route path="/agent/:agentId" element={<AgentDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </SessionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
