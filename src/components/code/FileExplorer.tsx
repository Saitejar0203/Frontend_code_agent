import React, { useState, useRef, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen, 
  Search,
  Plus,
  MoreHorizontal,
  FileText,
  FolderPlus,
  Copy,
  Scissors,
  Trash2,
  Download,
  Edit3,
  Eye,
  EyeOff,
  Archive
} from 'lucide-react';
import { workbenchStore, setSelectedFile, toggleFolder, type FileNode } from '@/lib/stores/workbenchStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuSeparator, 
  ContextMenuTrigger, 
} from '@/components/ui/context-menu'; 
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
} from '@/components/ui/dropdown-menu'; 
import { getDownloadService } from '@/services/downloadService'; 
import { useWebContainer } from '@/components/WebContainer/WebContainerProvider'; 
import { ActionRunner } from '@/lib/runtime/ActionRunner';

interface FileExplorerProps {
  className?: string;
  onFileSelect?: (file: FileNode) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ className, onFileSelect }) => {
  const { fileTree: files, selectedFile, modifiedFiles } = useStore(workbenchStore);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHiddenFiles, setShowHiddenFiles] = useState(false);
  const [draggedItem, setDraggedItem] = useState<FileNode | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [contextMenuNode, setContextMenuNode] = useState<FileNode | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { webcontainer, actionRunner } = useWebContainer();

  // Get file icon based on extension
  const getFileIcon = (filename: string, isFolder: boolean = false) => {
    if (isFolder) return <Folder className="w-4 h-4" />;
    
    const ext = filename.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      'js': '🟨', 'jsx': '🟦', 'ts': '🟦', 'tsx': '🟦',
      'py': '🐍', 'html': '🌐', 'css': '🎨', 'scss': '🎨',
      'json': '📋', 'md': '📝', 'yml': '⚙️', 'yaml': '⚙️',
      'xml': '📄', 'sql': '🗃️', 'sh': '⚡', 'bash': '⚡',
      'dockerfile': '🐳', 'go': '🐹', 'rs': '🦀', 'php': '🐘',
      'rb': '💎', 'java': '☕', 'c': '🔧', 'cpp': '🔧', 'cs': '🔷'
    };
    
    return (
      <span className="text-xs mr-1">
        {iconMap[ext || ''] || '📄'}
      </span>
    );
  };

  // Filter files based on search and hidden files setting
  const filterFiles = useCallback((nodes: FileNode[]): FileNode[] => {
    return nodes.filter(node => {
      // Filter hidden files
      if (!showHiddenFiles && node.name.startsWith('.')) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        // Check if any children match for folders
        if (node.type === 'folder' && node.children) {
          const hasMatchingChildren = filterFiles(node.children).length > 0;
          return hasMatchingChildren;
        }
        return false;
      }
      
      return true;
    }).map(node => {
      if (node.type === 'folder' && node.children) {
        return {
          ...node,
          children: filterFiles(node.children)
        };
      }
      return node;
    });
  }, [searchQuery, showHiddenFiles]);

  const handleFileClick = useCallback((file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file.path);
      onFileSelect?.(file);
    } else {
      toggleFolder(file.path);
    }
  }, [onFileSelect]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, node: FileNode) => {
    setDraggedItem(node);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(targetPath);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetNode: FileNode) => {
    e.preventDefault();
    setDragOverItem(null);
    
    if (draggedItem && targetNode.type === 'folder' && draggedItem.path !== targetNode.path) {
      // TODO: Implement file move logic
      console.log('Moving', draggedItem.path, 'to', targetNode.path);
    }
    
    setDraggedItem(null);
  };

  // Context menu handlers
  const handleCreateFile = (parentPath?: string) => {
    const fileName = prompt('Enter file name:');
    if (fileName) {
      // TODO: Implement file creation
      console.log('Creating file:', fileName, 'in', parentPath || 'root');
    }
  };

  const handleCreateFolder = (parentPath?: string) => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      // TODO: Implement folder creation
      console.log('Creating folder:', folderName, 'in', parentPath || 'root');
    }
  };

  const handleRename = (node: FileNode) => {
    const newName = prompt('Enter new name:', node.name);
    if (newName && newName !== node.name) {
      // TODO: Implement rename
      console.log('Renaming', node.path, 'to', newName);
    }
  };

  const handleDelete = (node: FileNode) => {
    if (confirm(`Are you sure you want to delete ${node.name}?`)) {
      // TODO: Implement delete
      console.log('Deleting', node.path);
    }
  };

  const handleCopy = (node: FileNode) => {
    // TODO: Implement copy to clipboard
    console.log('Copying', node.path);
  };

  const handleCut = (node: FileNode) => {
    // TODO: Implement cut
    console.log('Cutting', node.path);
  };

  const handleDownload = async (node: FileNode) => {
    if (!actionRunner || !webcontainer) {
      console.error('WebContainer or ActionRunner not available');
      return;
    }

    try {
      setIsDownloading(true);
      const downloadService = getDownloadService(actionRunner, webcontainer);
      await downloadService.downloadFile(node);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadProject = async () => {
    if (!actionRunner || !webcontainer) {
      console.error('WebContainer or ActionRunner not available');
      return;
    }

    try {
      setIsDownloading(true);
      const downloadService = getDownloadService(actionRunner, webcontainer);
      await downloadService.downloadProject();
    } catch (error) {
      console.error('Failed to download project:', error);
      alert(`Failed to download project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const renderFileNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = node.isExpanded || false;
    const isSelected = selectedFile === node.path;
    const isModified = modifiedFiles?.has(node.path);
    const isDraggedOver = dragOverItem === node.path;

    return (
      <ContextMenu key={node.path}>
        <ContextMenuTrigger>
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, node)}
            onDragOver={(e) => handleDragOver(e, node.path)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, node)}
            className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ${
              isSelected ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'
            } ${
              isDraggedOver ? 'bg-blue-50 dark:bg-blue-950 border-l-2 border-blue-500' : ''
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
                getFileIcon(node.name)
              )}
            </span>
            <span className="text-sm font-medium flex-1">{node.name}</span>
            {isModified && (
              <Badge variant="secondary" className="w-2 h-2 p-0 bg-orange-500 ml-2" />
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {node.type === 'folder' ? (
            <>
              <ContextMenuItem onClick={() => handleCreateFile(node.path)}>
                <FileText className="w-4 h-4 mr-2" />
                New File
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleCreateFolder(node.path)}>
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          ) : null}
          <ContextMenuItem onClick={() => handleRename(node)}>
            <Edit3 className="w-4 h-4 mr-2" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleCopy(node)}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleCut(node)}>
            <Scissors className="w-4 h-4 mr-2" />
            Cut
          </ContextMenuItem>
          {node.type === 'file' && (
            <ContextMenuItem onClick={() => handleDownload(node)} disabled={isDownloading}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => handleDelete(node)} className="text-red-600">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {filterFiles(node.children).map((child) =>
              renderFileNode(child, depth + 1)
            )}
          </div>
        )}
      </ContextMenu>
    );
  };

  const filteredFiles = files ? filterFiles(files) : [];

  return (
    <div className={`bg-white dark:bg-gray-900 h-full flex flex-col ${className || ''}`}>
      {/* Header with search and actions */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Files</h3>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadProject}
              disabled={isDownloading || !files || files.length === 0}
              className="h-6 w-6 p-0"
              title="Download Project as ZIP"
            >
              <Archive className={`w-3 h-3 ${isDownloading ? 'animate-pulse' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHiddenFiles(!showHiddenFiles)}
              className="h-6 w-6 p-0"
            >
              {showHiddenFiles ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Plus className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleCreateFile()}>
                  <FileText className="w-4 h-4 mr-2" />
                  New File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCreateFolder()}>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-7 text-xs"
          />
        </div>
      </div>
      
      {/* File tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredFiles.length > 0 ? (
          filteredFiles.map((file) => renderFileNode(file))
        ) : (
          <div className="text-gray-500 text-sm p-2 text-center">
            {searchQuery ? 'No files match your search' : 'No files to display'}
          </div>
        )}
      </div>
    </div>
  );
};

export { FileExplorer };