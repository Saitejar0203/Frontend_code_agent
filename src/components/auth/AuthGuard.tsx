import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginModal } from '@/components/auth';
import { useNavigate } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, redirectTo }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowLoginModal(true);
    }
  }, [isAuthenticated, isLoading]);

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // User stays on the current agent page after login
  };

  const handleModalClose = () => {
    setShowLoginModal(false);
    // Only redirect to home if user is still not authenticated (i.e., they cancelled)
    if (!isAuthenticated) {
      if (redirectTo) {
        navigate(redirectTo);
      } else {
        navigate('/');
      }
    }
    // If user is authenticated, they stay on the current page
  };

  if (isLoading) {
    return (
      <div className="min-h-screen dynamic-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  return (
    <>
      {children}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={handleModalClose}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
};

export default AuthGuard;