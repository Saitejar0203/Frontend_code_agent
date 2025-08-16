import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore, selectArtifact, removeArtifact } from '../lib/stores/workbenchStore';
import type { ArtifactState } from '../lib/stores/workbenchStore';
import type { BoltAction } from '../lib/runtime/types';
import { useWebContainer } from '@/components/WebContainer/WebContainerProvider';
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
  const { actionRunner } = useWebContainer();
  const [actionStatuses, setActionStatuses] = useState<Map<string, any>>(new Map());
  const actionsContainerRef = useRef<HTMLDivElement>(null);
  
  const artifactList = Object.values(artifacts);
  const selectedArtifact = selectedArtifactId ? artifacts[selectedArtifactId] : null;

  // Auto-scroll to running actions
  const scrollToRunningAction = () => {
    if (actionsContainerRef.current && selectedArtifact) {
      const runningActions = selectedArtifact.actions.filter((action, index) => {
        const actionKey = `${action.type}_${action.filePath || action.content}`;
        const status = actionStatuses.get(actionKey);
        return status && status.status === 'running';
      });
      
      if (runningActions.length > 0) {
        // Scroll to top to show the latest running action (since order is reversed)
        actionsContainerRef.current.scrollTop = 0;
      }
    }
  };

  // Poll for action status updates
  useEffect(() => {
    if (!actionRunner || !selectedArtifact) {
      return;
    }

    const interval = setInterval(() => {
      const allActionStatuses = actionRunner.getAllActionStatuses();
      const statusMap = new Map<string, any>();
      
      // Create a map of action statuses keyed by action signature
      allActionStatuses.forEach(actionState => {
        const actionKey = `${actionState.type}_${actionState.filePath || actionState.content}`;
        statusMap.set(actionKey, actionState);
      });
      
      setActionStatuses(statusMap);
    }, 500);
    
    return () => clearInterval(interval);
  }, [actionRunner, selectedArtifact]);

  if (artifactList.length === 0) {
    return (
      <div className={`h-full bg-white border-l border-gray-200 flex flex-col ${className}`}>
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

  // Auto-select the first artifact if none is selected
  const displayArtifact = selectedArtifact || artifactList[0];
  
  if (!displayArtifact) {
    return (
      <div className={`h-full bg-white border-r border-gray-200 flex flex-col ${className}`}>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No artifact selected</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full bg-white border-r border-gray-200 flex flex-col ${className}`}>
      {/* Artifact Name */}
      <div className="p-3 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-800">{displayArtifact.title}</h4>
        {displayArtifact.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{displayArtifact.error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div ref={actionsContainerRef} className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {displayArtifact.actions.slice().reverse().map((action, index) => {
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
  );
}

interface ActionItemProps {
  action: BoltAction;
  index: number;
  status?: any;
}

function ActionItem({ action, index, status }: ActionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getActionStatus = (action: BoltAction) => {
    // Use the status prop passed from parent component
    if (status) {
      return status.status;
    }
    
    // Fallback to action's current status
    return action.status || 'pending';
  };
  
  const getStatusText = () => {
    const currentStatus = getActionStatus(action);
    
    switch (currentStatus) {
      case 'pending':
        return 'Pending';
      case 'running':
        // For file actions, show more specific status based on operation
        if (action.type === 'file' && action.operation) {
          return action.operation === 'create' ? 'Creating...' : 'Updating...';
        }
        return 'Running...';
      case 'complete':
        return 'Complete';
      case 'failed':
        return 'Failed';
      case 'aborted':
        return 'Aborted';
      default:
        return 'Unknown';
    }
  };
  
  const getStatusIcon = () => {
    const currentStatus = getActionStatus(action);
    
    switch (currentStatus) {
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