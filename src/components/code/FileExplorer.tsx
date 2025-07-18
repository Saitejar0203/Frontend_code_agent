import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
}

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect?: (file: FileNode) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, onFileSelect }) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = (file: FileNode, path: string) => {
    if (file.type === 'file') {
      setSelectedFile(path);
      onFileSelect?.(file);
    } else {
      toggleFolder(path);
    }
  };

  const renderFileNode = (node: FileNode, path: string = '', depth: number = 0) => {
    const currentPath = path ? `${path}/${node.name}` : node.name;
    const isExpanded = expandedFolders.has(currentPath);
    const isSelected = selectedFile === currentPath;

    return (
      <div key={currentPath}>
        <div
          className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-700 transition-colors duration-150 ${
            isSelected ? 'bg-blue-600 text-white' : 'text-gray-300'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleFileClick(node, currentPath)}
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
              renderFileNode(child, currentPath, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-800 text-gray-300 overflow-y-auto">
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-200">Explorer</h3>
      </div>
      <div className="p-2">
        {files.map((file) => renderFileNode(file))}
      </div>
    </div>
  );
};

export default FileExplorer;