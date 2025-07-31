import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore, selectArtifact, removeArtifact } from '../lib/stores/workbenchStore';
import type { ArtifactState } from '../lib/stores/workbenchStore';
import type { BoltAction } from '../lib/runtime/types';
import { actionRunner } from '../lib/runtime/actionRunner';
import { 
  FileText, 
  Terminal, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  X,
  Loader2
} from 'lucide-react';

interface ArtifactProps {
  className?: string;
}

export function Artifact({ className = '' }: ArtifactProps) {
  const { artifacts, selectedArtifactId } = useStore(workbenchStore);
  const [actionStatuses, setActionStatuses] = useState<Map<string, any>>(new Map());
  
  const artifactList = Object.values(artifacts);
  const selectedArtifact = selectedArtifactId ? artifacts[selectedArtifactId] : null;

  // Poll for action status updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (actionRunner) {
        const allStatuses = actionRunner.getAllActionStatuses();
        const statusMap = new Map();
        allStatuses.forEach(status => {
          const key = `${status.type}_${status.filePath || status.content}`;
          statusMap.set(key, status);
        });
        setActionStatuses(statusMap);
      }
    }, 500); // Update every 500ms

    return () => clearInterval(interval);
  }, []);

  if (artifactList.length === 0) {
    return (
      <div className={`h-full bg-white border-l border-gray-200 flex flex-col ${className}`}>
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Artifacts</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No artifacts yet</p>
            <p className="text-xs mt-1">Start a conversation to see code generation and execution</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full bg-white border-l border-gray-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Artifacts</h3>
        
        {/* Artifact Tabs */}
        <div className="mt-3 space-y-1">
          {artifactList.map((artifact) => (
            <div
              key={artifact.id}
              role="button"
              tabIndex={0}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all duration-200 group cursor-pointer ${
                selectedArtifactId === artifact.id 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                  : 'hover:bg-gray-50 border border-transparent text-gray-700'
              }`}
              onClick={() => selectArtifact(artifact.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectArtifact(artifact.id);
                }
              }}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {artifact.isRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                ) : artifact.error ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                <span className="text-sm font-medium truncate">{artifact.title}</span>
              </div>
              
              <button
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  removeArtifact(artifact.id);
                }}
              >
                <X className="w-3 h-3 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Content */}
      {selectedArtifact && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Artifact Info */}
          <div className="p-4 border-b border-gray-100">
            <h4 className="font-medium text-gray-800 mb-2">{selectedArtifact.title}</h4>
            {selectedArtifact.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-700 mt-1">{selectedArtifact.error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-700">Actions</h5>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {selectedArtifact.actions.length}
                </span>
              </div>
              
              <div className="space-y-2">
                {selectedArtifact.actions.map((action, index) => {
                  const actionKey = `${action.type}_${action.filePath || action.content}`;
                  const actionStatus = actionStatuses.get(actionKey);
                  return (
                    <ActionItem 
                      key={index} 
                      action={action} 
                      index={index} 
                      status={actionStatus}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ActionItemProps {
  action: BoltAction;
  index: number;
  status?: any;
}

function ActionItem({ action, index, status }: ActionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getStatusIcon = () => {
    if (!status) {
      return <Clock className="w-4 h-4 text-gray-400" />;
    }
    
    switch (status.status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'aborted':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };
  
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'shell':
        return <Terminal className="w-4 h-4 text-green-600" />;
      default:
        return <Play className="w-4 h-4 text-gray-600" />;
    }
  };
  
  const getActionTitle = (action: BoltAction) => {
    if (action.type === 'file' && action.filePath) {
      return action.filePath;
    }
    if (action.type === 'shell') {
      const command = action.content?.trim().split('\n')[0] || 'Shell command';
      return command.length > 40 ? `${command.substring(0, 40)}...` : command;
    }
    return `${action.type} action`;
  };

  const getStatusColor = () => {
    if (!status) return 'border-gray-200';
    
    switch (status.status) {
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'complete':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'aborted':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200';
    }
  };

  return (
    <div className={`border rounded-lg transition-all duration-200 ${getStatusColor()}`}>
      <div 
        className="p-3 cursor-pointer hover:bg-white/50 transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          {getActionIcon(action.type)}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {action.type}
              </span>
              {status && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  status.status === 'complete' ? 'bg-green-100 text-green-700' :
                  status.status === 'running' ? 'bg-blue-100 text-blue-700' :
                  status.status === 'failed' ? 'bg-red-100 text-red-700' :
                  status.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  status.status === 'aborted' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {status.status}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-800 truncate mt-1">
              {getActionTitle(action)}
            </p>
          </div>
          
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-200 bg-white/30">
          <div className="p-3 space-y-3">
            {/* Meta information */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                Type: {action.type}
              </span>
              {action.filePath && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Path: {action.filePath}
                </span>
              )}
              {status && status.error && (
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded">
                  Error: {status.error}
                </span>
              )}
            </div>
            
            {/* Content */}
            {action.content && (
              <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                <pre className="text-sm text-gray-100 whitespace-pre-wrap">
                  <code>{action.content}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Artifact;