import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Wait a moment for Supabase to process the OAuth callback
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get the current session after OAuth redirect
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setError(error.message);
          toast.error('Authentication failed. Please try again.');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        if (data.session) {
          // Authentication successful
          console.log('Authentication successful:', data.session.user);
          toast.success('Successfully signed in!');
          // Redirect to home page
          navigate('/', { replace: true });
        } else {
          // No session found - this might be normal if the session is still being processed
          console.log('No session found immediately, checking URL parameters...');
          
          // Check if we have OAuth parameters in the URL
          const urlParams = new URLSearchParams(window.location.search);
          const accessToken = urlParams.get('access_token');
          const refreshToken = urlParams.get('refresh_token');
          
          if (accessToken) {
            console.log('Found OAuth tokens in URL, waiting for session to be established...');
            // Wait a bit more and try again
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const { data: retrySession, error: retryError } = await supabase.auth.getSession();
            
            if (retryError) {
              console.error('Retry session error:', retryError);
              setError(retryError.message);
              toast.error('Authentication failed. Please try again.');
              setTimeout(() => navigate('/'), 3000);
              return;
            }
            
            if (retrySession.session) {
              console.log('Session established after retry:', retrySession.session.user);
              toast.success('Successfully signed in!');
              navigate('/', { replace: true });
              return;
            }
          }
          
          // No session found
          setError('No authentication session found.');
          toast.error('Authentication failed. Please try again.');
          setTimeout(() => navigate('/'), 3000);
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        setError('An unexpected error occurred.');
        toast.error('An unexpected error occurred. Please try again.');
        setTimeout(() => navigate('/'), 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to home page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Completing Sign In</h2>
          <p className="text-gray-600">Please wait while we complete your authentication...</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;