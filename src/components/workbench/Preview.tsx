import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '../../lib/stores/workbenchStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RefreshCw, ExternalLink, Globe, AlertCircle, Loader2 } from 'lucide-react';
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
  const [customUrl, setCustomUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activePreview = workbench.previews[workbench.activePreviewIndex];
  const currentUrl = customUrl || workbench.previewUrl || activePreview?.url || '';

  // Debug current URL selection
  useEffect(() => {
    console.log(`[Preview] Current URL selected:`, {
      customUrl,
      previewUrl: workbench.previewUrl,
      activePreviewUrl: activePreview?.url,
      finalUrl: currentUrl
    });
  }, [customUrl, workbench.previewUrl, activePreview?.url, currentUrl]);

  // Reset custom URL when active preview changes
  useEffect(() => {
    setCustomUrl('');
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

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl && iframeRef.current) {
      setIsLoading(true);
      setError(null);
      iframeRef.current.src = customUrl;
    }
  };

  const handlePreviewChange = (index: string) => {
    workbenchStore.setKey('activePreviewIndex', parseInt(index));
  };

  const handleOpenExternal = () => {
    if (currentUrl) {
      window.open(currentUrl, '_blank');
    }
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
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">Preview</span>
          </div>
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
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <span className="text-sm font-medium">Preview</span>
          {workbench.previews.length > 1 && (
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
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={!currentUrl || isLoading}
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenExternal}
            disabled={!currentUrl}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* URL Bar */}
      <div className="p-4 border-b border-border">
        <form onSubmit={handleUrlSubmit} className="flex gap-2">
          <Input
            type="url"
            placeholder={activePreview?.url || 'Enter URL...'}
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="flex-1 text-sm"
          />
          <Button type="submit" size="sm" disabled={!customUrl}>
            Go
          </Button>
        </form>
      </div>

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