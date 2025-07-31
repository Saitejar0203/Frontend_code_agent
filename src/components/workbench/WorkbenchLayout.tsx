import React, { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { CodeEditor } from './CodeEditor';
import { FileExplorer } from '../code/FileExplorer';
import CodeChatInterface from '../code/CodeChatInterface';
import { Artifact } from '../Artifact';
import { Preview } from './Preview';
import { Terminal, TerminalIcon, X, Maximize2, Minimize2, Package, FileText, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '@/lib/stores/workbenchStore';
import { useTerminalIntegration } from '@/hooks/useTerminalIntegration';

interface WorkbenchLayoutProps {
  className?: string;
}

interface PanelSizes {
  sidebar: number;
  editor: number;
  terminal: number;
}

const DEFAULT_PANEL_SIZES: PanelSizes = {
  sidebar: 25,
  editor: 55,
  terminal: 20
};

export function WorkbenchLayout({ className }: WorkbenchLayoutProps) {
  const [panelSizes, setPanelSizes] = useState<PanelSizes>(() => {
    // Load saved panel sizes from localStorage
    const saved = localStorage.getItem('workbench-panel-sizes');
    return saved ? JSON.parse(saved) : DEFAULT_PANEL_SIZES;
  });
  
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState('terminal');
  const [activeMainTab, setActiveMainTab] = useState('files');
  const [terminalCount, setTerminalCount] = useState(1);
  const [activeTerminal, setActiveTerminal] = useState(0);
  
  const { terminalOutput, artifacts, artifactPanelVisible, hasActivePreview, previews } = useStore(workbenchStore);
  
  // Initialize terminal integration for preview detection
  const { isReady: isWebContainerReady } = useTerminalIntegration();

  // Auto-switch to preview tab when a preview becomes available
  useEffect(() => {
    if (hasActivePreview && previews.length > 0) {
      setActiveMainTab('preview');
    }
  }, [hasActivePreview, previews.length]);

  // Save panel sizes to localStorage when they change
  useEffect(() => {
    localStorage.setItem('workbench-panel-sizes', JSON.stringify(panelSizes));
  }, [panelSizes]);

  const handlePanelResize = (sizes: number[]) => {
    if (sizes.length === 3) {
      setPanelSizes({
        sidebar: sizes[0],
        editor: sizes[1],
        terminal: sizes[2]
      });
    }
  };

  const toggleTerminal = () => {
    setIsTerminalCollapsed(!isTerminalCollapsed);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const addTerminal = () => {
    setTerminalCount(prev => prev + 1);
    setActiveTerminal(terminalCount);
  };

  const closeTerminal = (index: number) => {
    if (terminalCount > 1) {
      setTerminalCount(prev => prev - 1);
      if (activeTerminal === index) {
        setActiveTerminal(Math.max(0, index - 1));
      }
    }
  };

  const handleSendMessage = (message: string) => {
    // TODO: Implement message sending logic
    console.log('Sending message:', message);
  };

  return (
    <div className={`h-full flex flex-col bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={handlePanelResize}
          className="h-full"
        >
          {/* Left Sidebar - Chat & Artifacts */}
          <ResizablePanel
            defaultSize={panelSizes.sidebar}
            minSize={15}
            maxSize={40}
            collapsible={true}
            onCollapse={() => setIsSidebarCollapsed(true)}
            onExpand={() => setIsSidebarCollapsed(false)}
          >
            <div className="h-full flex flex-col">
              <Tabs defaultValue="chat" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 m-2">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="artifacts" className="relative">
                    <Package className="w-3 h-3 mr-1" />
                    Artifacts
                    {Object.keys(artifacts).length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 text-xs">
                        {Object.keys(artifacts).length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="chat" className="flex-1 m-0 p-2">
                  <CodeChatInterface 
                    onSendMessage={handleSendMessage}
                    className="h-full border-0 rounded-none"
                  />
                </TabsContent>
                
                <TabsContent value="artifacts" className="flex-1 m-0 p-2">
                  <Artifact className="h-full border-0 rounded-none" />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Main Editor Area */}
          <ResizablePanel defaultSize={panelSizes.editor} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              {/* Main Content Area */}
              <ResizablePanel 
                defaultSize={isTerminalCollapsed ? 100 : 70} 
                minSize={30}
              >
                <div className="h-full flex flex-col bg-white dark:bg-gray-900">
                  {/* Top Level Tabs */}
                  <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="h-full flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <TabsList className="h-8">
                        <TabsTrigger value="files" className="text-xs">
                          <FileText className="w-3 h-3 mr-1" />
                          Files
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="text-xs relative">
                          <Globe className="w-3 h-3 mr-1" />
                          Preview
                          {previews.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-4 text-xs">
                              {previews.length}
                            </Badge>
                          )}
                        </TabsTrigger>
                      </TabsList>
                      
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleSidebar}
                          className="h-6 w-6 p-0"
                        >
                          {isSidebarCollapsed ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Files Tab Content - Unified Explorer + Editor */}
                    <TabsContent value="files" className="flex-1 m-0 p-0">
                      <ResizablePanelGroup direction="horizontal" className="h-full">
                        {/* File Explorer Panel */}
                        <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                          <FileExplorer className="h-full border-0 rounded-none" />
                        </ResizablePanel>
                        
                        <ResizableHandle withHandle />
                        
                        {/* Code Editor Panel */}
                        <ResizablePanel defaultSize={70} minSize={50}>
                          <CodeEditor className="h-full" />
                        </ResizablePanel>
                      </ResizablePanelGroup>
                    </TabsContent>
                    
                    {/* Preview Tab Content */}
                    <TabsContent value="preview" className="flex-1 m-0 p-0">
                      <Preview className="h-full" />
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>

              {/* Terminal/Bottom Panel */}
              {!isTerminalCollapsed && (
                <>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={30} minSize={15} maxSize={60}>
                    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
                      {/* Terminal Header */}
                      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <Tabs value={activeBottomTab} onValueChange={setActiveBottomTab} className="flex-1">
                          <TabsList className="h-8">
                            <TabsTrigger value="terminal" className="text-xs">
                              <TerminalIcon className="w-3 h-3 mr-1" />
                              Terminal
                              {terminalOutput && (
                                <Badge variant="secondary" className="ml-1 h-4 text-xs">
                                  {terminalOutput.split('\n').length - 1}
                                </Badge>
                              )}
                            </TabsTrigger>
                            <TabsTrigger value="output" className="text-xs">
                              Output
                            </TabsTrigger>
                            <TabsTrigger value="problems" className="text-xs">
                              Problems
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={addTerminal}
                            className="h-6 w-6 p-0"
                          >
                            <Terminal className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleTerminal}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Terminal Content */}
                      <div className="flex-1 overflow-hidden">
                        <Tabs value={activeBottomTab} className="h-full">
                          <TabsContent value="terminal" className="h-full m-0 p-0">
                            <div className="h-full flex flex-col">
                              {/* Terminal Tabs */}
                              {terminalCount > 1 && (
                                <div className="flex items-center px-2 py-1 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                  {Array.from({ length: terminalCount }, (_, i) => (
                                    <div
                                      key={i}
                                      className={`flex items-center px-2 py-1 text-xs cursor-pointer rounded ${
                                        activeTerminal === i
                                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                      }`}
                                      onClick={() => setActiveTerminal(i)}
                                    >
                                      <TerminalIcon className="w-3 h-3 mr-1" />
                                      Terminal {i + 1}
                                      {terminalCount > 1 && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            closeTerminal(i);
                                          }}
                                          className="ml-1 text-gray-400 hover:text-gray-600"
                                        >
                                          <X className="w-2 h-2" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Terminal Output */}
                              <div className="flex-1 p-4 font-mono text-sm bg-black text-green-400 overflow-y-auto">
                                {terminalOutput ? (
                                  <pre className="whitespace-pre-wrap">{terminalOutput}</pre>
                                ) : (
                                  <div className="text-gray-500">
                                    Terminal {activeTerminal + 1} - Ready
                                    <br />
                                    <span className="text-green-400">$</span> <span className="animate-pulse">_</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="output" className="h-full m-0 p-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <p>Build output and logs will appear here...</p>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="problems" className="h-full m-0 p-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <p>Code problems and diagnostics will appear here...</p>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </div>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-blue-600 text-white text-xs flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <span>Ready</span>
          <span>Ln 1, Col 1</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>TypeScript</span>
          <button
            onClick={toggleTerminal}
            className="hover:bg-blue-700 px-2 py-1 rounded"
          >
            {isTerminalCollapsed ? 'Show Terminal' : 'Hide Terminal'}
          </button>
        </div>
      </div>
    </div>
  );
}