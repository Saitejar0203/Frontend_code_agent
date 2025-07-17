import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User as AuthUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
  google_id: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data from our backend API
  const fetchUserData = async (session: Session): Promise<User | null> => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBaseUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        return {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          google_id: userData.google_id
        };
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
    return null;
  };

  // Refresh user data
  const refreshUser = async () => {
    if (session) {
      const userData = await fetchUserData(session);
      setUser(userData);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserData(session).then(setUser);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      setSession(session);
      
      if (session && event === 'SIGNED_IN') {
        // User signed in, fetch their data
        const userData = await fetchUserData(session);
        setUser(userData);
      } else if (event === 'SIGNED_OUT') {
        // User signed out
        setUser(null);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error('Error signing in with Google:', error);
        throw error;
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // Get the current session ID before clearing it
      const currentSessionId = localStorage.getItem('chat_session_id');
      
      // Clear session data from localStorage on logout
      localStorage.removeItem('chat_session_id');
      
      // Also remove the chat history associated with that session for both agent types
      if (currentSessionId) {
        localStorage.removeItem(`chat_history_${currentSessionId}_basic_perplexity`);
        localStorage.removeItem(`chat_history_${currentSessionId}_multiagent`);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      setUser(null);
      setSession(null);
      
      // Broadcast session clear to other tabs
      const broadcastChannel = new BroadcastChannel('session_sync');
      broadcastChannel.postMessage({
        type: 'SESSION_CLEARED'
      });
      broadcastChannel.close();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user && !!session,
    signInWithGoogle,
    signOut,
    isLoading,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};