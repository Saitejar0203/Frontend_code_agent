import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { webcontainer } from '../../lib/webcontainer';
// --- Start of FIX ---
import { useStore } from '@nanostores/react';
import { setWebContainerReady, workbenchStore } from '../../lib/stores/workbenchStore';
// --- End of FIX ---

export interface StreamedFile {
  file_path: string;
  content: string;
}

interface WebContainerComponentProps {
  files?: StreamedFile[];
  autoInstall?: boolean;
  autoStart?: boolean;
  skipInitialization?: boolean;
  className?: string;
  onPreviewUrlChange?: (url: string | null) => void;
}

const WebContainerComponent: React.FC<WebContainerComponentProps> = ({
  files = [],
  autoInstall = true,
  autoStart = true,
  skipInitialization = false,
  className,
  onPreviewUrlChange
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [status, setStatus] = useState<'booting' | 'ready' | 'installing' | 'running' | 'error'>('booting');
  const [isInitialized, setIsInitialized] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [terminalVisible, setTerminalVisible] = useState<boolean>(true);
  
  // --- Start of FIX ---
  const { terminalOutput: storeOutput } = useStore(workbenchStore);
  const lastWrittenLength = useRef(0);

  useEffect(() => {
    if (terminalInstanceRef.current) {
      const newOutput = storeOutput.substring(lastWrittenLength.current);
      if (newOutput) {
        terminalInstanceRef.current.write(newOutput);
        lastWrittenLength.current = storeOutput.length;
      }
    }
  }, [storeOutput]);
  // --- End of FIX ---
  
  const appendTerminalOutput = useCallback((data: string) => {
    setTerminalOutput(prev => prev + data);
  }, []);

  const updateStatus = useCallback((newStatus: typeof status) => {
    setStatus(newStatus);
    setWebContainerReady(newStatus === 'ready' || newStatus === 'running');
  }, []);

  const initializeTerminal = useCallback(() => {
    if (!terminalRef.current || terminalInstanceRef.current) {
      return;
    }

    const terminal = new Terminal({
      convertEol: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1a1a1a',
        foreground: '#ffffff'
      }
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Write welcome message
    terminal.write('\r\n\x1b[36m🚀 WebContainer initialized successfully!\x1b[0m\r\n');
    terminal.write('\x1b[33mReady to execute commands...\x1b[0m\r\n\r\n');
  }, []);

  const initializeWebContainer = useCallback(async () => {
    if (skipInitialization || isInitialized) {
      return;
    }
    
    try {
      updateStatus('booting');
      appendTerminalOutput('🚀 Initializing WebContainer...\n');
      
      // Wait for WebContainer to be ready
      const container = await webcontainer;
      
      // Set up server-ready listener
      container.on('server-ready', (port, url) => {
        console.log('Server ready on port:', port, 'URL:', url);
        setPreviewUrl(url);
        onPreviewUrlChange?.(url);
        appendTerminalOutput(`🌐 Server ready at ${url}\n`);
      });
      
      // Initialize terminal
      initializeTerminal();
      
      updateStatus('ready');
      setIsInitialized(true);
      appendTerminalOutput('✅ WebContainer ready!\n');
      
    } catch (error) {
      console.error('Failed to initialize WebContainer:', error);
      appendTerminalOutput(`❌ WebContainer initialization failed: ${error}\n`);
      updateStatus('error');
    }
  }, [skipInitialization, isInitialized, updateStatus, initializeTerminal]);

  const mountFiles = useCallback(async () => {
    if (!isInitialized || files.length === 0) return;
    
    try {
      const container = await webcontainer;
      
      // Convert files to FileSystemTree format
      const fileSystemTree: any = {};
      
      for (const file of files) {
        const pathParts = file.file_path.split('/').filter(part => part !== '');
        let current = fileSystemTree;
        
        // Create nested directory structure
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          if (!current[part]) {
            current[part] = { directory: {} };
          }
          current = current[part].directory;
        }
        
        // Add the file
        const fileName = pathParts[pathParts.length - 1];
        current[fileName] = {
          file: {
            contents: file.content
          }
        };
      }
      
      await container.mount(fileSystemTree);
      appendTerminalOutput(`📁 Mounted ${files.length} files\n`);
      
      if (autoInstall) {
        updateStatus('installing');
        appendTerminalOutput('📦 Installing dependencies...\n');
        
        const installProcess = await container.spawn('npm', ['install']);
        
        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              appendTerminalOutput(data);
              if (terminalInstanceRef.current) {
                terminalInstanceRef.current.write(data);
              }
            },
          })
        );
        
        const installExitCode = await installProcess.exit;
        
        if (installExitCode === 0) {
          appendTerminalOutput('✅ Dependencies installed successfully\n');
          
          if (autoStart) {
            updateStatus('running');
            appendTerminalOutput('🚀 Starting development server...\n');
            
            const startProcess = await container.spawn('npm', ['start']);
            
            startProcess.output.pipeTo(
              new WritableStream({
                write(data) {
                  appendTerminalOutput(data);
                  if (terminalInstanceRef.current) {
                    terminalInstanceRef.current.write(data);
                  }
                },
              })
            );
          } else {
            updateStatus('ready');
          }
        } else {
          appendTerminalOutput('❌ Failed to install dependencies\n');
          updateStatus('error');
        }
      }
    } catch (error) {
      console.error('Failed to mount files:', error);
      appendTerminalOutput(`❌ Failed to mount files: ${error}\n`);
      updateStatus('error');
    }
  }, [files, isInitialized, autoInstall, autoStart, updateStatus]);

  // Initialize WebContainer on mount or when skipInitialization changes
  useEffect(() => {
    initializeWebContainer();
    
    return () => {
      // Only dispose if we're not skipping initialization (meaning we own the WebContainer)
      if (!skipInitialization) {
        // WebContainer cleanup handled automatically
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
    <div className={`w-full h-full flex flex-col bg-white dark:bg-gray-900 ${className || ''}`}>
      {/* Status Bar */}
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
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
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {files.length} file{files.length !== 1 ? 's' : ''} loaded
            </span>
          )}
        </div>
      </div>

      {/* Terminal */}
      {terminalVisible && (
        <div className="flex-1 p-4">
          <div className="bg-black dark:bg-gray-950 rounded-lg p-4 h-full">
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
      )}

      {/* Preview URL Display */}
      {previewUrl && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Preview:</span>
            <a 
              href={previewUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
            >
              {previewUrl}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebContainerComponent;