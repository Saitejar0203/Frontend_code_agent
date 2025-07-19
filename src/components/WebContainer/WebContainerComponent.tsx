import React, { useEffect, useRef, useState, useCallback } from 'react';
import { webcontainerManager, StreamedFile } from '../../services/webcontainerService';
import '@xterm/xterm/css/xterm.css';

interface WebContainerComponentProps {
  files: StreamedFile[];
  onPreviewUrlChange?: (url: string | null) => void;
  onStatusChange?: (status: 'booting' | 'ready' | 'installing' | 'running' | 'error') => void;
  autoInstall?: boolean;
  autoStart?: boolean;
  skipInitialization?: boolean;
}

const WebContainerComponent: React.FC<WebContainerComponentProps> = ({
  files,
  onPreviewUrlChange,
  onStatusChange,
  autoInstall = true,
  autoStart = true,
  skipInitialization = false
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const initAttemptedRef = useRef(false);
  const [status, setStatus] = useState<'booting' | 'ready' | 'installing' | 'running' | 'error'>('booting');
  const [isInitialized, setIsInitialized] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);

  const updateStatus = useCallback((newStatus: typeof status) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  const initializeWebContainer = useCallback(async () => {
    // Skip initialization if requested or already initialized
    if (skipInitialization || initAttemptedRef.current || isInitialized) {
      // If WebContainer is already booted externally, just set up the terminal and callbacks
      if (webcontainerManager.isWebContainerBooted()) {
        try {
          // Set up preview URL callback
          webcontainerManager.onPreviewUrlChanged((url) => {
            onPreviewUrlChange?.(url);
          });
          
          // Set up terminal output callback
          webcontainerManager.onTerminalData((data) => {
            setTerminalOutput(prev => [...prev, data]);
          });
          
          // Initialize terminal if element is available
           if (terminalRef.current && !webcontainerManager.getTerminal()) {
             webcontainerManager.initializeTerminal(terminalRef.current);
           }
          
          updateStatus('ready');
          setIsInitialized(true);
        } catch (error) {
          console.error('Failed to set up WebContainer callbacks:', error);
          updateStatus('error');
        }
      }
      return;
    }
    
    initAttemptedRef.current = true;
    
    try {
      updateStatus('booting');
      
      // Check cross-origin isolation
      if (!webcontainerManager.isCrossOriginIsolated()) {
        console.warn('Cross-origin isolation not enabled. WebContainer may not work properly.');
        setTerminalOutput(prev => [...prev, '⚠️ Warning: Cross-origin isolation not enabled. Some features may not work.\n']);
      }
      
      // Boot WebContainer
      await webcontainerManager.boot();
      
      // Set up preview URL callback
      webcontainerManager.onPreviewUrlChanged((url) => {
        onPreviewUrlChange?.(url);
      });
      
      // Set up terminal output callback
      webcontainerManager.onTerminalData((data) => {
        setTerminalOutput(prev => [...prev, data]);
      });
      
      // Initialize terminal if element is available
      if (terminalRef.current) {
        webcontainerManager.initializeTerminal(terminalRef.current);
        // Write welcome message to terminal
        const terminal = webcontainerManager.getTerminal();
        if (terminal) {
          terminal.write('\r\n\x1b[36m🚀 WebContainer initialized successfully!\x1b[0m\r\n');
          terminal.write('\x1b[33mReady to execute commands...\x1b[0m\r\n\r\n');
        }
      }
      
      updateStatus('ready');
      setIsInitialized(true);
      
    } catch (error) {
      console.error('Failed to initialize WebContainer:', error);
      setTerminalOutput(prev => [...prev, `❌ WebContainer initialization failed: ${error}\n`]);
      updateStatus('error');
      initAttemptedRef.current = false; // Reset on error to allow retry
    }
  }, [skipInitialization, isInitialized, updateStatus, onPreviewUrlChange]);

  const mountFiles = useCallback(async () => {
    if (!isInitialized || files.length === 0) return;
    
    try {
      await webcontainerManager.mountFiles(files);
      
      if (autoInstall) {
        updateStatus('installing');
        const installResult = await webcontainerManager.installDependencies();
        
        if (installResult.exitCode === 0) {
          if (autoStart) {
            updateStatus('running');
            await webcontainerManager.startDevServer();
          } else {
            updateStatus('ready');
          }
        } else {
          console.error('Failed to install dependencies:', installResult.output);
          updateStatus('error');
        }
      }
    } catch (error) {
      console.error('Failed to mount files:', error);
      updateStatus('error');
    }
  }, [files, isInitialized, autoInstall, autoStart, updateStatus]);

  // Initialize WebContainer on mount or when skipInitialization changes
  useEffect(() => {
    initializeWebContainer();
    
    return () => {
      // Only dispose if we're not skipping initialization (meaning we own the WebContainer)
      if (!skipInitialization) {
        webcontainerManager.dispose();
      }
    };
  }, [initializeWebContainer]); // Depend on initializeWebContainer which includes skipInitialization

  // Mount files when they change
  useEffect(() => {
    mountFiles();
  }, [mountFiles]);

  const getStatusMessage = () => {
    switch (status) {
      case 'booting':
        return 'Initializing WebContainer...';
      case 'ready':
        return 'WebContainer ready';
      case 'installing':
        return 'Installing dependencies...';
      case 'running':
        return 'Development server running';
      case 'error':
        return 'Error occurred';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'booting':
      case 'installing':
        return 'text-yellow-600';
      case 'ready':
      case 'running':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      {/* Status Bar */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              status === 'running' ? 'bg-green-500' :
              status === 'error' ? 'bg-red-500' :
              status === 'booting' || status === 'installing' ? 'bg-yellow-500' :
              'bg-blue-500'
            }`} />
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusMessage()}
            </span>
          </div>
          
          {files.length > 0 && (
            <span className="text-xs text-gray-400">
              {files.length} file{files.length !== 1 ? 's' : ''} loaded
            </span>
          )}
        </div>
      </div>

      {/* Terminal */}
      <div className="flex-1 p-4">
        <div className="bg-black rounded-lg p-4 h-full">
          <div className="mb-2">
            <span className="text-green-400 text-sm font-mono">Terminal</span>
          </div>
          <div 
            ref={terminalRef} 
            className="h-full w-full"
            style={{ minHeight: '300px' }}
          />
        </div>
      </div>


    </div>
  );
};

export default WebContainerComponent;