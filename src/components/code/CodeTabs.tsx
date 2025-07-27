import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Files, Eye, Terminal } from 'lucide-react';
import { FileExplorer } from './FileExplorer';
import { WebContainerComponent, StreamedFile } from '../WebContainer';
import { workbenchStore, type FileNode } from '@/lib/stores/workbenchStore';

interface CodeTabsProps {}

const CodeTabs: React.FC<CodeTabsProps> = () => {
  const { fileTree: files, selectedFile, previewUrl } = useStore(workbenchStore);
  const [activeTab, setActiveTab] = useState<'files' | 'preview'>('files');
  const [streamedFiles, setStreamedFiles] = useState<StreamedFile[]>([]);
  const [webContainerPreviewUrl, setWebContainerPreviewUrl] = useState<string | null>(null);

  // --- Start of FIX ---
  useEffect(() => {
    if (previewUrl || webContainerPreviewUrl) {
      setActiveTab('preview');
    }
  }, [previewUrl, webContainerPreviewUrl]);
  // --- End of FIX ---

  // Convert FileNode structure to StreamedFile format for WebContainer
  useEffect(() => {
    const convertToStreamedFiles = (nodes: FileNode[]): StreamedFile[] => {
      const result: StreamedFile[] = [];
      
      for (const node of nodes) {
        if (node.type === 'file' && node.content) {
          result.push({
            file_path: node.path,
            content: node.content
          });
        } else if (node.type === 'folder' && node.children) {
          result.push(...convertToStreamedFiles(node.children));
        }
      }
      
      return result;
    };

    if (files && files.length > 0) {
      const converted = convertToStreamedFiles(files);
      setStreamedFiles(converted);
    }
  }, [files]);

  const handleWebContainerPreviewUrl = (url: string | null) => {
    setWebContainerPreviewUrl(url);
  };

  // Helper function to find file content by path
  const findFileByPath = (nodes: FileNode[], targetPath: string): FileNode | null => {
    for (const node of nodes) {
      if (node.path === targetPath) {
        return node;
      }
      if (node.type === 'folder' && node.children) {
        const found = findFileByPath(node.children, targetPath);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedFileNode = selectedFile && files ? findFileByPath(files, selectedFile) : null;

  return (
    <div className="h-full bg-gray-900" style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', gridTemplateAreas: '"header" "main" "terminal"' }}>
      {/* Tab Headers */}
      <div className="flex border-b border-gray-700 bg-gray-800" style={{ gridArea: 'header' }}>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'files'
              ? 'text-white bg-gray-900 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
          }`}
        >
          <Files className="w-4 h-4 mr-2" />
          Files
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'preview'
              ? 'text-white bg-gray-900 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
          }`}
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </button>
      </div>

      {/* Main Content Area - Takes available space */}
      <div className="overflow-hidden" style={{ gridArea: 'main', minHeight: 0 }}>
        {activeTab === 'files' ? (
          <div className="h-full flex">
            {/* File Explorer */}
            <div className="w-1/3 border-r border-gray-700">
              <FileExplorer />
            </div>
            
            {/* File Content Viewer */}
            <div className="flex-1 bg-gray-900">
              {selectedFileNode && selectedFileNode.type === 'file' ? (
                <div className="h-full flex flex-col">
                  <div className="px-4 py-3 border-b border-gray-700 bg-gray-800">
                    <h4 className="text-sm font-medium text-gray-200">{selectedFileNode.name}</h4>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto">
                    <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                      {selectedFileNode.content || '// File content will be displayed here'}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Files className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a file to view its content</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full bg-white">
            {webContainerPreviewUrl ? (
              <iframe
                src={webContainerPreviewUrl}
                className="w-full h-full border-0"
                title="Preview"
              />
            ) : previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="Preview"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No preview available</p>
                  <p className="text-sm mt-2">Preview will be shown here once your project is ready</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Terminal Panel - Always visible at bottom */}
      <div 
        className="border-t border-gray-700 bg-gray-800" 
        style={{
          gridArea: 'terminal',
          height: '300px',
          minHeight: '200px',
          maxHeight: '400px'
        }}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
            <div className="flex items-center">
              <Terminal className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Terminal</span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <WebContainerComponent
              files={streamedFiles}
              onPreviewUrlChange={handleWebContainerPreviewUrl}
              autoInstall={false}
              autoStart={false}
              skipInitialization={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeTabs;