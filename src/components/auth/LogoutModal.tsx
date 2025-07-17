import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose }) => {
  const { signOut, user, isLoading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      toast.success('Successfully signed out');
      onClose();
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[85vw] w-full sm:max-w-md max-h-[75vh] bg-white/80 backdrop-blur-md border-0 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 text-center mb-2">
            Sign Out
          </DialogTitle>
          <p className="text-gray-600 text-center text-sm">
            Are you sure you want to sign out?
          </p>
        </DialogHeader>
        
        <div className="space-y-6 pt-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-400 to-red-500 rounded-full flex items-center justify-center">
              <LogOut className="w-8 h-8 text-white" />
            </div>
            {user && (
              <div className="space-y-2">
                <p className="font-medium text-gray-800">{user.name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-white/50 hover:bg-white/70 border-gray-200 text-gray-700 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogout}
              disabled={isSigningOut || isLoading}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSigningOut || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing out...
                </>
              ) : (
                'Sign Out'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LogoutModal;