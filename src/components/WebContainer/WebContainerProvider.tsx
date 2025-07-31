import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WebContainer } from '@webcontainer/api';
import { PreviewManager } from '../../lib/preview/PreviewManager';
import { workbenchStore } from '../../lib/stores/workbenchStore';

// Global singleton for WebContainer
let globalWebContainer: WebContainer | null = null;
let globalWebContainerPromise: Promise<WebContainer> | null = null;
let globalPreviewManager: PreviewManager | null = null;

// Function to get or create the global WebContainer instance
function getWebContainer(): Promise<WebContainer> {
  if (globalWebContainerPromise) {
    return globalWebContainerPromise;
  }
  
  globalWebContainerPromise = WebContainer.boot().then(container => {
    globalWebContainer = container;
    return container;
  });
  
  return globalWebContainerPromise;
}

interface WebContainerContextType {
  webcontainer: WebContainer | null;
  isBooting: boolean;
  error: string | null;
  previewManager: PreviewManager | null;
}

const WebContainerContext = createContext<WebContainerContextType>({
  webcontainer: null,
  isBooting: true,
  error: null,
  previewManager: null,
});

export const useWebContainer = () => {
  const context = useContext(WebContainerContext);
  if (!context) {
    throw new Error('useWebContainer must be used within a WebContainerProvider');
  }
  return context;
};

interface WebContainerProviderProps {
  children: ReactNode;
}

export function WebContainerProvider({ children }: WebContainerProviderProps) {
  const [webcontainer, setWebContainer] = useState<WebContainer | null>(globalWebContainer);
  const [isBooting, setIsBooting] = useState(!globalWebContainer);
  const [error, setError] = useState<string | null>(null);
  const [previewManager, setPreviewManager] = useState<PreviewManager | null>(globalPreviewManager);

  useEffect(() => {
    let mounted = true;

    const initWebContainer = async () => {
      try {
        console.log('[WebContainer] Initializing WebContainer...');
        
        // Use the singleton WebContainer
        const webcontainerPromise = getWebContainer();
        
        // Initialize PreviewManager with the promise if not already created
        if (!globalPreviewManager) {
          globalPreviewManager = new PreviewManager(webcontainerPromise);
        }
        setPreviewManager(globalPreviewManager);
        
        // Wait for WebContainer to boot
        const container = await webcontainerPromise;
        
        if (!mounted) return;
        
        console.log('[WebContainer] WebContainer booted successfully');
        console.log('[WebContainer] WebContainer instance:', container);
        setWebContainer(container);
        setIsBooting(false);
        setError(null);
        
      } catch (err) {
        if (!mounted) return;
        
        console.error('Failed to initialize WebContainer:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize WebContainer');
        setIsBooting(false);
      }
    };

    // Only initialize if not already done
    if (!globalWebContainer && !globalWebContainerPromise) {
      initWebContainer();
    } else if (globalWebContainer) {
      // WebContainer already exists, just set the state
      setWebContainer(globalWebContainer);
      setPreviewManager(globalPreviewManager);
      setIsBooting(false);
    } else if (globalWebContainerPromise) {
      // WebContainer is booting, wait for it
      globalWebContainerPromise.then(container => {
        if (mounted) {
          setWebContainer(container);
          setPreviewManager(globalPreviewManager);
          setIsBooting(false);
        }
      }).catch(err => {
        if (mounted) {
          console.error('Failed to initialize WebContainer:', err);
          setError(err instanceof Error ? err.message : 'Failed to initialize WebContainer');
          setIsBooting(false);
        }
      });
    }

    return () => {
      mounted = false;
      // Don't destroy global resources on unmount
    };
  }, []);

  const value: WebContainerContextType = {
    webcontainer,
    isBooting,
    error,
    previewManager,
  };

  return (
    <WebContainerContext.Provider value={value}>
      {children}
    </WebContainerContext.Provider>
  );
}

export default WebContainerProvider;