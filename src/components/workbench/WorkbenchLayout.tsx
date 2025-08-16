import React, { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { CodeEditor } from './CodeEditor';
import { FileExplorer } from '../code/FileExplorer';
import CodeChatInterface from '../code/CodeChatInterface';
import { Artifact } from '../Artifact';
import { Preview } from './Preview';
import { Terminal, TerminalIcon, X, Maximize2, Minimize2, Package, FileText, Globe, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@nanostores/react';
import { workbenchStore, setActiveTab } from '@/lib/stores/workbenchStore';
import { useWebContainer } from '@/components/WebContainer/WebContainerProvider';
import { sendChatMessage } from '@/services/codeAgentService';
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
  
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [terminalCount, setTerminalCount] = useState(1);
  const [activeTerminal, setActiveTerminal] = useState(0);
  
  const { terminalOutput, artifacts, artifactPanelVisible, hasActivePreview, previews, activeTab } = useStore(workbenchStore);
  
  // Initialize terminal integration for preview detection
  const { isReady: isWebContainerReady } = useTerminalIntegration();

  // Note: Auto-switch to preview tab is now handled by the global store in Preview.tsx

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

  const { webcontainer, actionRunner } = useWebContainer();

  const handleSendMessage = async (message: string) => {
    console.log('🚀 WorkbenchLayout sending message:', message);
    await sendChatMessage(message, webcontainer, actionRunner);
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
          {/* Left Sidebar - Chat Only */}
          <ResizablePanel
            defaultSize={panelSizes.sidebar}
            minSize={15}
            maxSize={40}
            collapsible={true}
            onCollapse={() => setIsSidebarCollapsed(true)}
            onExpand={() => setIsSidebarCollapsed(false)}
          >
            <div className="h-full flex flex-col min-h-0">
              <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Chat</h3>
              </div>
              <div className="flex-1 min-h-0">
                <CodeChatInterface 
                  onSendMessage={handleSendMessage}
                  className="h-full border-0 rounded-none"
                />
              </div>
            </div>
          </ResizablePanel>



          {/* Vertical separator line */}
          <div className="w-px bg-gray-200 dark:bg-gray-700"></div>

            {/* Main Editor Area */}
          <ResizablePanel defaultSize={panelSizes.editor} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              {/* Main Content Area */}
              <ResizablePanel 
                defaultSize={isTerminalCollapsed ? 100 : 70} 
                minSize={30}
              >
                <div className="h-full flex flex-col bg-white dark:bg-gray-900 relative">
                  {/* Top Level Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
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
                        {activeTab === 'preview' && (
                          <Button
                            onClick={() => {
                              // Trigger refresh for preview
                              const previewIframe = document.querySelector('iframe[title="Preview"]') as HTMLIFrameElement;
                              if (previewIframe) {
                                previewIframe.src = previewIframe.src;
                              }
                            }}
                            className="bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium h-8 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm border border-emerald-500/30 hover:border-emerald-400/50"
                          >
                            <RefreshCw className="w-3 h-3 mr-2" />
                            <span className="text-sm">Refresh</span>
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Files Tab Content - Three Panel Layout: Artifacts + Explorer + Editor */}
                    <TabsContent value="files" className="flex-1 m-0 p-0">
                      <ResizablePanelGroup direction="horizontal" className="h-full">
                        {/* Artifacts Panel */}
                        <ResizablePanel defaultSize={25} minSize={15} maxSize={40} collapsible={true}>
                          <Artifact className="h-full border-0 rounded-none" />
                        </ResizablePanel>
                        

                        
                        {/* Vertical separator line */}
                        <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
 
                          
                          {/* File Explorer Panel */}
                        <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                          <FileExplorer className="h-full border-0 rounded-none" />
                        </ResizablePanel>
                        

                        
                        {/* Vertical separator line */}
                        <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
 
                          
                          {/* Code Editor Panel */}
                        <ResizablePanel defaultSize={45} minSize={30}>
                          <CodeEditor className="h-full" />
                        </ResizablePanel>
                      </ResizablePanelGroup>
                    </TabsContent>
                    
                    {/* Preview Tab Content */}
                    <TabsContent value="preview" className="flex-1 m-0 p-0">
                      <Preview className="h-full" />
                    </TabsContent>
                  </Tabs>
                  
                  {/* Floating Show Terminal Button */}
                  {isTerminalCollapsed && activeTab !== 'preview' && (
                    <Button
                      onClick={toggleTerminal}
                      className="absolute bottom-4 right-4 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium h-10 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm border border-blue-500/30 hover:border-blue-400/50 z-50"
                    >
                      <TerminalIcon className="w-4 h-4 mr-2" />
                      <span className="text-sm">Show Terminal</span>
                    </Button>
                  )}
                </div>
              </ResizablePanel>

              {/* Terminal/Bottom Panel - Only show when not on Preview tab */}
              {!isTerminalCollapsed && activeTab !== 'preview' && (
                 <>
                 {/* Horizontal separator line */}
                 <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
 
                    <ResizablePanel defaultSize={30} minSize={15} maxSize={60}>
                    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
                      {/* Terminal Header */}
                      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <TerminalIcon className="w-3 h-3 mr-2" />
                            <span className="text-sm font-medium">Terminal</span>
                            {terminalOutput && (
                              <Badge variant="secondary" className="ml-2 h-4 text-xs">
                                {terminalOutput.split('\n').length - 1}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
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