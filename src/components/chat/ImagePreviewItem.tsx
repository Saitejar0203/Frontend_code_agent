import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ImageAttachment } from '@/lib/stores/chatStore';

interface ImagePreviewItemProps {
  image: ImageAttachment;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
  className?: string;
}

const ImagePreviewItem: React.FC<ImagePreviewItemProps> = ({
  image,
  onRemove,
  onRetry,
  className
}) => {
  const { id, file, preview, uploadProgress = 0, uploadStatus, error } = image;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'completed':
        return 'border-emerald-200 bg-emerald-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'uploading':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={cn(
      "relative group rounded-lg border-2 transition-all duration-200 overflow-hidden w-24",
      getStatusColor(),
      className
    )}>
      {/* Image thumbnail */}
      <div className="relative aspect-square w-full">
        <img
          src={preview}
          alt={file.name}
          className="w-full h-full object-cover object-center rounded-md"
        />
        
        {/* Upload overlay */}
        {uploadStatus === 'uploading' && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-md">
            <div className="text-white text-xs font-medium">
              {Math.round(uploadProgress)}%
            </div>
          </div>
        )}
        
        {/* Error overlay */}
        {uploadStatus === 'error' && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center rounded-md">
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
        )}
        
        {/* Remove button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(id)}
          className="absolute -top-1 -right-1 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
      
      {/* File info */}
      <div className="p-1.5 space-y-0.5">
        <div className="text-xs font-medium text-gray-700 truncate leading-tight" title={file.name}>
          {file.name}
        </div>
        <div className="text-xs text-gray-500 leading-tight">
          {formatFileSize(file.size)}
        </div>
        
        {/* Progress bar */}
        {uploadStatus === 'uploading' && (
          <Progress 
            value={uploadProgress} 
            className="h-1 bg-gray-200"
          />
        )}
        
        {/* Error message with retry */}
        {uploadStatus === 'error' && (
          <div className="space-y-1">
            <div className="text-xs text-red-600 truncate" title={error}>
              {error || 'Upload failed'}
            </div>
            {onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRetry(id)}
                className="h-5 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Retry
              </Button>
            )}
          </div>
        )}
        
        {/* Success indicator */}
        {uploadStatus === 'completed' && (
          <div className="text-xs text-emerald-600 font-medium">
            ✓ Uploaded
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagePreviewItem;