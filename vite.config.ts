import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Environment-specific configuration
  mode,
  server: {
    host: "0.0.0.0",
    port: 8081,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Environment variables are automatically loaded based on mode:
  // - .env.development in development
  // - .env.production in production
  // - .env.local for local overrides (highest priority)
}));
