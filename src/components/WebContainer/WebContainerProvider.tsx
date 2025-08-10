import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WebContainer } from '@webcontainer/api';
import { PreviewManager } from '../../lib/preview/PreviewManager';
import { ActionRunner } from '../../lib/runtime/ActionRunner';
import { workbenchStore } from '../../lib/stores/workbenchStore';
import { messageQueue } from '../../services/codeAgentService';

interface WebContainerContextType {
  webcontainer: WebContainer | null;
  isReady: boolean;
  actionRunner: ActionRunner | null;
  previewManager: PreviewManager | null;
}

const WebContainerContext = createContext<WebContainerContextType | null>(null);

export function useWebContainer() {
  const context = useContext(WebContainerContext);
  if (!context) {
    throw new Error('useWebContainer must be used within a WebContainerProvider');
  }
  return context;
}

interface WebContainerProviderProps {
  children: ReactNode;
}

export function WebContainerProvider({ children }: WebContainerProviderProps) {
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [actionRunner, setActionRunner] = useState<ActionRunner | null>(null);
  const [previewManager, setPreviewManager] = useState<PreviewManager | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initializeWebContainer() {
      try {
        console.log('[WebContainer] Initializing WebContainer...');
        
        // Boot WebContainer
        const webcontainerInstance = await WebContainer.boot();
        
        if (!isMounted) return;
        
        console.log('[WebContainer] WebContainer booted successfully');
        console.log('[WebContainer] WebContainer instance:', webcontainerInstance);
        
        setWebcontainer(webcontainerInstance);
        
        // Initialize PreviewManager
        const previewManagerInstance = new PreviewManager(Promise.resolve(webcontainerInstance));
        setPreviewManager(previewManagerInstance);
        
        // Initialize ActionRunner
        const actionRunnerInstance = new ActionRunner(Promise.resolve(webcontainerInstance));
        setActionRunner(actionRunnerInstance);
        
        // Update workbench store
        workbenchStore.setKey('isWebContainerReady', true);
        
        console.log('[WebContainer] Notifying message queue that WebContainer is ready');
        messageQueue.notifyWebContainerReady(webcontainerInstance, actionRunnerInstance);
        
        setIsReady(true);
        
      } catch (error) {
        console.error('[WebContainer] Failed to initialize:', error);
        if (isMounted) {
          setIsReady(false);
        }
      }
    }

    initializeWebContainer();

    return () => {
      isMounted = false;
    };
  }, []);

  const value: WebContainerContextType = {
    webcontainer,
    isReady,
    actionRunner,
    previewManager
  };

  return (
    <WebContainerContext.Provider value={value}>
      {children}
    </WebContainerContext.Provider>
  );
}

export default WebContainerProvider;