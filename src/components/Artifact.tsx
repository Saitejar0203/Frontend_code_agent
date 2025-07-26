import React from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore, selectArtifact, removeArtifact } from '../lib/stores/workbenchStore';
import type { ArtifactState } from '../lib/stores/workbenchStore';

interface ArtifactProps {
  className?: string;
}

export function Artifact({ className = '' }: ArtifactProps) {
  const { artifacts, selectedArtifactId } = useStore(workbenchStore);
  
  const artifactList = Object.values(artifacts);
  const selectedArtifact = selectedArtifactId ? artifacts[selectedArtifactId] : null;

  if (artifactList.length === 0) {
    return (
      <div className={`artifact-panel ${className}`}>
        <div className="artifact-empty">
          <p>No artifacts yet. Start a conversation to see code generation and execution.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`artifact-panel ${className}`}>
      <div className="artifact-header">
        <h3>Artifacts</h3>
        <div className="artifact-tabs">
          {artifactList.map((artifact) => (
            <button
              key={artifact.id}
              className={`artifact-tab ${
                selectedArtifactId === artifact.id ? 'active' : ''
              } ${artifact.isRunning ? 'running' : ''}`}
              onClick={() => selectArtifact(artifact.id)}
            >
              <span className="artifact-title">{artifact.title}</span>
              {artifact.isRunning && (
                <span className="artifact-spinner">⟳</span>
              )}
              <button
                className="artifact-close"
                onClick={(e) => {
                  e.stopPropagation();
                  removeArtifact(artifact.id);
                }}
              >
                ×
              </button>
            </button>
          ))}
        </div>
      </div>
      
      {selectedArtifact && (
        <div className="artifact-content">
          <div className="artifact-info">
            <h4>{selectedArtifact.title}</h4>
            {selectedArtifact.error && (
              <div className="artifact-error">
                <strong>Error:</strong> {selectedArtifact.error}
              </div>
            )}
          </div>
          
          <div className="artifact-actions">
            <h5>Actions ({selectedArtifact.actions.length})</h5>
            <div className="action-list">
              {selectedArtifact.actions.map((action, index) => (
                <ActionItem key={index} action={action} index={index} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ActionItemProps {
  action: any;
  index: number;
}

function ActionItem({ action, index }: ActionItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'file':
        return '📄';
      case 'shell':
        return '⚡';
      default:
        return '🔧';
    }
  };
  
  const getActionTitle = (action: any) => {
    if (action.type === 'file' && action.filePath) {
      return `Create ${action.filePath}`;
    }
    if (action.type === 'shell') {
      const command = action.content?.trim().split('\n')[0] || 'Shell command';
      return command.length > 50 ? `${command.substring(0, 50)}...` : command;
    }
    return `${action.type} action`;
  };

  return (
    <div className="action-item">
      <div 
        className="action-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="action-icon">{getActionIcon(action.type)}</span>
        <span className="action-title">{getActionTitle(action)}</span>
        <span className="action-toggle">{isExpanded ? '▼' : '▶'}</span>
      </div>
      
      {isExpanded && (
        <div className="action-content">
          <div className="action-meta">
            <span className="action-type">Type: {action.type}</span>
            {action.filePath && (
              <span className="action-path">Path: {action.filePath}</span>
            )}
          </div>
          
          {action.content && (
            <div className="action-code">
              <pre><code>{action.content}</code></pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Artifact;