import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { workbenchStore, toggleFolder, setSelectedFile, type FileNode } from '@/lib/stores/workbenchStore';

interface FileExplorerProps {
  className?: string;
  onFileSelect?: (file: FileNode) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ className, onFileSelect }) => {
  const { fileTree: files, selectedFile } = useStore(workbenchStore);

  const handleFileClick = (file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file.path);
      onFileSelect?.(file);
    } else {
      toggleFolder(file.path);
    }
  };

  const renderFileNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = node.isExpanded || false;
    const isSelected = selectedFile === node.path;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-700 transition-colors duration-150 ${
            isSelected ? 'bg-blue-600 text-white' : 'text-gray-300'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleFileClick(node)}
        >
          {node.type === 'folder' && (
            <span className="mr-1 text-gray-400">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          )}
          <span className="mr-2 text-gray-400">
            {node.type === 'folder' ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4" />
              ) : (
                <Folder className="w-4 h-4" />
              )
            ) : (
              <File className="w-4 h-4" />
            )}
          </span>
          <span className="text-sm font-medium">{node.name}</span>
        </div>
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map((child) =>
              renderFileNode(child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm h-full ${className || ''}`}>
      <div className="border-b border-gray-200 dark:border-gray-700 p-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Files</h3>
      </div>
      <div className="p-2">
        {files && files.length > 0 ? files.map((file) => renderFileNode(file)) : (
          <div className="text-gray-500 text-sm p-2">No files to display</div>
        )}
      </div>
    </div>
  );
};

export { FileExplorer };