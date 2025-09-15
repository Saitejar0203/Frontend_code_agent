import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { Editor } from '@monaco-editor/react';
import { 
  X, 
  FileText,
  ChevronDown
} from 'lucide-react';
import { workbenchStore, setSelectedFile, updateFileContent, markFileSaved } from '@/lib/stores/workbenchStore';
import { ActionRunner } from '@/lib/runtime/ActionRunner';
import { useWebContainer } from '@/components/WebContainer/WebContainerProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Badge } from '@/components/ui/badge';

interface CodeEditorProps {
  className?: string;
}

interface EditorTab {
  path: string;
  name: string;
  content: string;
  isDirty: boolean;
  language: string;
}

export function CodeEditor({ className }: CodeEditorProps) {
  const { fileTree, selectedFile, modifiedFiles } = useStore(workbenchStore);
  const { webcontainer } = useWebContainer();
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findValue, setFindValue] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Get file language based on extension
  const getFileLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml',
      'xml': 'xml',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp'
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  // Find file content in the file tree
  const findFileContent = useCallback((path: string, nodes = fileTree): string => {
    for (const node of nodes) {
      if (node.path === path && node.type === 'file') {
        return node.content || '';
      }
      if (node.type === 'folder' && node.children) {
        const content = findFileContent(path, node.children);
        if (content !== '') return content;
      }
    }
    return '';
  }, [fileTree]);

  // Open a new tab or switch to existing one
  const openTab = useCallback((filePath: string) => {
    const existingTabIndex = openTabs.findIndex(tab => tab.path === filePath);
    
    if (existingTabIndex !== -1) {
      setActiveTabIndex(existingTabIndex);
      return;
    }

    const fileName = filePath.split('/').pop() || filePath;
    const content = findFileContent(filePath);
    const language = getFileLanguage(fileName);
    
    const newTab: EditorTab = {
      path: filePath,
      name: fileName,
      content,
      isDirty: false,
      language
    };

    setOpenTabs(prev => [...prev, newTab]);
    setActiveTabIndex(openTabs.length);
  }, [openTabs, findFileContent]);

  // Close a tab
  const closeTab = useCallback((index: number) => {
    const tab = openTabs[index];
    if (tab?.isDirty) {
      const shouldClose = confirm(`${tab.name} has unsaved changes. Close anyway?`);
      if (!shouldClose) return;
    }

    const newTabs = openTabs.filter((_, i) => i !== index);
    setOpenTabs(newTabs);
    
    if (activeTabIndex >= newTabs.length) {
      setActiveTabIndex(Math.max(0, newTabs.length - 1));
    } else if (activeTabIndex > index) {
      setActiveTabIndex(activeTabIndex - 1);
    }
  }, [openTabs, activeTabIndex]);

  // Handle editor content change
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value === undefined || openTabs.length === 0) return;
    
    const activeTab = openTabs[activeTabIndex];
    if (!activeTab) return;

    const updatedTabs = [...openTabs];
    updatedTabs[activeTabIndex] = {
      ...activeTab,
      content: value,
      isDirty: value !== findFileContent(activeTab.path)
    };
    
    setOpenTabs(updatedTabs);
  }, [openTabs, activeTabIndex, findFileContent]);

  // Save current file
  const saveCurrentFile = useCallback(async () => {
    const activeTab = openTabs[activeTabIndex];
    if (!activeTab || !activeTab.isDirty || !webcontainer) return;

    try {
      // Save to WebContainer filesystem through ActionRunner
      const actionRunner = new ActionRunner(Promise.resolve(webcontainer));
      await actionRunner.initialize();
      
      const fileAction = {
        type: 'file' as const,
        filePath: activeTab.path,
        content: activeTab.content
      };
      
      await actionRunner.runAction(fileAction);
      
      // Update local state
      updateFileContent(activeTab.path, activeTab.content);
      markFileSaved(activeTab.path);
      
      const updatedTabs = [...openTabs];
      updatedTabs[activeTabIndex] = { ...activeTab, isDirty: false };
      setOpenTabs(updatedTabs);
      
      console.log(`✅ File saved: ${activeTab.path}`);
    } catch (error) {
      console.error(`❌ Failed to save file ${activeTab.path}:`, error);
      // TODO: Show error notification to user
    }
  }, [openTabs, activeTabIndex, webcontainer]);

  // Save all files
  const saveAllFiles = useCallback(async () => {
    const dirtyTabs = openTabs.filter(tab => tab.isDirty);
    if (!webcontainer) return;
    
    try {
      // Save all dirty files to WebContainer filesystem
      const actionRunner = new ActionRunner(Promise.resolve(webcontainer));
      await actionRunner.initialize();
      
      const savePromises = dirtyTabs.map(async (tab) => {
        const fileAction = {
          type: 'file' as const,
          filePath: tab.path,
          content: tab.content
        };
        
        await actionRunner.runAction(fileAction);
        
        // Update local state
        updateFileContent(tab.path, tab.content);
        markFileSaved(tab.path);
        
        return tab.path;
      });
      
      const savedFiles = await Promise.all(savePromises);
      
      // Update all tabs to mark as not dirty
      setOpenTabs(prev => prev.map(tab => ({ ...tab, isDirty: false })));
      
      console.log(`✅ Saved ${savedFiles.length} files:`, savedFiles);
    } catch (error) {
      console.error('❌ Failed to save some files:', error);
      // TODO: Show error notification to user
    }
  }, [openTabs, webcontainer]);

  // Handle Monaco Editor mount
  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveCurrentFile();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      setShowFindReplace(true);
    });
  };

  // Handle find/replace actions
  const handleFind = () => {
    if (editorRef.current && findValue) {
      editorRef.current.getAction('actions.find').run();
    }
  };

  const handleReplace = () => {
    if (editorRef.current && findValue && replaceValue) {
      editorRef.current.getAction('editor.action.startFindReplaceAction').run();
    }
  };

  // Open file when selectedFile changes
  useEffect(() => {
    if (selectedFile) {
      openTab(selectedFile);
    }
  }, [selectedFile, openTab]);

  const activeTab = openTabs[activeTabIndex];

  return (
    <div className={`h-full flex flex-col bg-white dark:bg-gray-900 ${className || ''}`}>
      {/* Tab Bar */}
      <div className="flex items-center bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-1 flex items-center overflow-x-auto">
          {openTabs.map((tab, index) => (
            <div
              key={tab.path}
              className={`flex items-center px-3 py-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer min-w-0 ${
                index === activeTabIndex
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => setActiveTabIndex(index)}
            >
              <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="text-sm truncate">{tab.name}</span>
              {tab.isDirty && (
                <Badge variant="secondary" className="w-2 h-2 p-0 bg-orange-500 ml-2 flex-shrink-0" />
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-4 h-4 p-0 ml-2 hover:bg-gray-200 dark:hover:bg-gray-600 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(index);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>

      </div>

      {/* Find/Replace Bar */}
      {showFindReplace && (
        <div className="flex items-center p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 space-x-2">
          <Input
            placeholder="Find"
            value={findValue}
            onChange={(e) => setFindValue(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleFind()}
          />
          <Input
            placeholder="Replace"
            value={replaceValue}
            onChange={(e) => setReplaceValue(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleReplace()}
          />
          <Button size="sm" onClick={handleFind} className="h-8">
            Find
          </Button>
          <Button size="sm" onClick={handleReplace} className="h-8">
            Replace
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFindReplace(false)}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1">
        {activeTab ? (
          <Editor
            height="100%"
            language={activeTab.language}
            value={activeTab.content}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
              minimap: { enabled: true },
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              suggest: {
                showKeywords: true,
                showSnippets: true,
                showFunctions: true,
                showConstructors: true,
                showFields: true,
                showVariables: true,
                showClasses: true,
                showStructs: true,
                showInterfaces: true,
                showModules: true,
                showProperties: true,
                showEvents: true,
                showOperators: true,
                showUnits: true,
                showValues: true,
                showConstants: true,
                showEnums: true,
                showEnumMembers: true,
                showColors: true,
                showFiles: true,
                showReferences: true,
                showFolders: true,
                showTypeParameters: true,
                showUsers: true,
                showIssues: true
              },
              quickSuggestions: {
                other: true,
                comments: true,
                strings: true
              },
              parameterHints: { enabled: true },
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              autoSurround: 'languageDefined',
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderLineHighlight: 'all',
              selectOnLineNumbers: true,
              roundedSelection: false,
              readOnly: false,
              cursorStyle: 'line',
              automaticLayout: true,
              glyphMargin: true,
              folding: true,
              foldingStrategy: 'indentation',
              showFoldingControls: 'always',
              unfoldOnClickAfterEndOfLine: false,
              contextmenu: true,
              mouseWheelZoom: true,
              multiCursorModifier: 'ctrlCmd',
              accessibilitySupport: 'auto',
              find: {
                seedSearchStringFromSelection: 'always',
                autoFindInSelection: 'never',
                globalFindClipboard: false,
                addExtraSpaceOnTop: true
              }
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium mb-2">No file selected</p>
              <p className="text-sm">Select a file from the explorer to start editing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}