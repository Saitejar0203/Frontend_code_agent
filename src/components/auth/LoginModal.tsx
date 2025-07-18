import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const { signInWithGoogle, isLoading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
      
      // Note: The actual login success will be handled by the auth state change
      // in AuthContext, so we don't need to call onLoginSuccess here immediately
      toast.success('Redirecting to Google for authentication...');
      
      // The modal will close automatically when the user is authenticated
      // via the AuthGuard component
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Failed to sign in with Google. Please try again.');
      setIsSigningIn(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-full sm:max-w-lg max-h-[80vh] bg-white/90 backdrop-blur-xl border-0 shadow-2xl rounded-2xl">
        <DialogHeader className="relative">
          <DialogTitle className="text-3xl font-light text-gray-800 text-center mb-3 mt-4">
            Welcome Back
          </DialogTitle>
          <p className="text-gray-500 text-center text-base font-light">
            Sign in to access conversational AI agents
          </p>
        </DialogHeader>
        
        <div className="space-y-8 pt-8 pb-2">
          
          <Button
            onClick={handleGoogleLogin}
            disabled={isSigningIn || isLoading}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] py-4 h-auto rounded-xl font-light text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="flex items-center justify-center space-x-4">
              {isSigningIn || isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>
                {isSigningIn || isLoading ? 'Signing in...' : 'Continue with Google'}
              </span>
            </div>
          </Button>
          
          <div className="text-center pt-2">
            <p className="text-sm text-gray-400 font-light">
              Sign-in is required only to enforce rate limits on conversational AI agents, helping me manage LLM API usage responsibly
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;