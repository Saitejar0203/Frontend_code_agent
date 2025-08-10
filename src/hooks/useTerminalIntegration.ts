import { useEffect, useRef } from 'react';
import { useWebContainer } from '@/components/WebContainer/WebContainerProvider';
import { workbenchStore } from '../lib/stores/workbenchStore';
import { useStore } from '@nanostores/react';

/**
 * Hook that integrates terminal functionality with WebContainer and preview management
 */
export function useTerminalIntegration() {
  const { webcontainer, previewManager } = useWebContainer();
  const { terminalOutput } = useStore(workbenchStore);
  const lastProcessedOutput = useRef('');

  useEffect(() => {
    if (!webcontainer || !previewManager || !terminalOutput) {
      return;
    }

    // Only process new output to avoid duplicate processing
    const newOutput = terminalOutput.slice(lastProcessedOutput.current.length);
    if (!newOutput.trim()) {
      return;
    }

    lastProcessedOutput.current = terminalOutput;

    // Check for development server start patterns in the new output
    const lines = newOutput.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for common development server patterns
      if (previewManager.detectDevServerFromCommand(trimmedLine)) {
        console.log('Development server detected from terminal output:', trimmedLine);
        
        // Extract port if mentioned in the output
        const portMatch = trimmedLine.match(/(?:port|localhost:)(\d+)/i);
        if (portMatch) {
          const port = parseInt(portMatch[1]);
          previewManager.handlePortReady(port);
        }
      }
      
      // Check for WebContainer server ready messages
      const webcontainerUrlMatch = trimmedLine.match(/🚀\s+Server\s+ready\s+at\s+`([^`]+)`/);
      if (webcontainerUrlMatch) {
        const webcontainerUrl = webcontainerUrlMatch[1];
        console.log(`WebContainer server ready detected:`, webcontainerUrl);
        previewManager.handleWebContainerUrl(webcontainerUrl);
        continue;
      }
      
      // Check for standard server ready messages
      const serverReadyPatterns = [
        /server\s+(?:running|started|ready).*(?:port|localhost:)(\d+)/i,
        /local:\s+https?:\/\/localhost:(\d+)/i,
        /dev\s+server\s+running.*:(\d+)/i,
        /listening\s+on.*:(\d+)/i,
        /available\s+on.*:(\d+)/i
      ];
      
      for (const pattern of serverReadyPatterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          const port = parseInt(match[1]);
          console.log(`Server ready detected on port ${port}:`, trimmedLine);
          previewManager.handlePortReady(port);
          break;
        }
      }
    }
  }, [webcontainer, previewManager, terminalOutput]);

  return {
    webcontainer,
    previewManager,
    isReady: !!webcontainer && !!previewManager
  };
}

export default useTerminalIntegration;