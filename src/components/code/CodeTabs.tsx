import React, { useState } from 'react';
import { Files, Eye } from 'lucide-react';
import FileExplorer from './FileExplorer';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
}

interface CodeTabsProps {
  files: FileNode[];
  previewUrl?: string;
}

const CodeTabs: React.FC<CodeTabsProps> = ({ files, previewUrl }) => {
  const [activeTab, setActiveTab] = useState<'files' | 'preview'>('files');
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);

  const handleFileSelect = (file: FileNode) => {
    setSelectedFile(file);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-700 bg-gray-800">
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

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'files' ? (
          <div className="h-full flex">
            {/* File Explorer */}
            <div className="w-1/3 border-r border-gray-700">
              <FileExplorer files={files} onFileSelect={handleFileSelect} />
            </div>
            
            {/* File Content Viewer */}
            <div className="flex-1 bg-gray-900">
              {selectedFile && selectedFile.type === 'file' ? (
                <div className="h-full flex flex-col">
                  <div className="px-4 py-3 border-b border-gray-700 bg-gray-800">
                    <h4 className="text-sm font-medium text-gray-200">{selectedFile.name}</h4>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto">
                    <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                      {selectedFile.content || '// File content will be displayed here'}
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
            {previewUrl ? (
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
    </div>
  );
};

export default CodeTabs;