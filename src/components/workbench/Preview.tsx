import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '../../lib/stores/workbenchStore';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RefreshCw, Globe, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PreviewProps {
  className?: string;
}

export function Preview({ className }: PreviewProps) {
  const workbench = useStore(workbenchStore);

  // Debug preview URL changes
  useEffect(() => {
    console.log(`[Preview] Workbench store preview URL:`, workbench.previewUrl);
  }, [workbench.previewUrl]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activePreview = workbench.previews[workbench.activePreviewIndex];
  const currentUrl = workbench.previewUrl || activePreview?.url || '';

  // Debug current URL selection
  useEffect(() => {
    console.log(`[Preview] Current URL selected:`, {
      previewUrl: workbench.previewUrl,
      activePreviewUrl: activePreview?.url,
      finalUrl: currentUrl
    });
  }, [workbench.previewUrl, activePreview?.url, currentUrl]);

  // Reset error when active preview changes
  useEffect(() => {
    setError(null);
  }, [workbench.activePreviewIndex]);

  // Auto-switch to preview tab when preview URL becomes available
  useEffect(() => {
    if (workbench.previewUrl) {
      console.log(`[Preview] Auto-switching to preview tab for URL:`, workbench.previewUrl);
      workbenchStore.setKey('activeTab', 'preview');
    }
  }, [workbench.previewUrl]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      setError(null);
      iframeRef.current.src = iframeRef.current.src;
    }
  };



  const handlePreviewChange = (index: string) => {
    workbenchStore.setKey('activePreviewIndex', parseInt(index));
  };



  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load preview');
  };

  // Show empty state if no previews
  if (!workbench.previews.length && !workbench.previewUrl) {
    return (
      <div className={cn('flex flex-col h-full bg-background', className)}>
        <div className="p-2 border-b border-border">
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Preview Available</h3>
            <p className="text-sm">
              Start a development server to see your application preview here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      {workbench.previews.length > 1 && (
        <div className="flex items-center justify-center p-2 border-b border-border">
          <Select
            value={workbench.activePreviewIndex.toString()}
            onValueChange={handlePreviewChange}
          >
            <SelectTrigger className="w-auto h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {workbench.previews.map((preview, index) => (
                <SelectItem key={index} value={index.toString()}>
                  Port {preview.port}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Preview Content */}
      <div className="flex-1 relative">
        
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-medium mb-2">Preview Error</h3>
              <p className="text-sm mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading preview...</span>
                </div>
              </div>
            )}
            {currentUrl && (
              <iframe
                ref={iframeRef}
                src={currentUrl}
                className="w-full h-full border-0"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                title="Preview"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Preview;