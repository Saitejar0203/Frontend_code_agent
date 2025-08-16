import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImagePreviewItem from './ImagePreviewItem';
import { ImageAttachment } from '@/lib/stores/chatStore';
import { cn } from '@/lib/utils';

interface ImagePreviewListProps {
  images: ImageAttachment[];
  onRemoveImage: (id: string) => void;
  onRetryUpload?: (id: string) => void;
  onImageUpdate?: (imageId: string, updates: Partial<ImageAttachment>) => void;
  maxImages?: number;
  className?: string;
}

const ImagePreviewList: React.FC<ImagePreviewListProps> = ({
  images,
  onRemoveImage,
  onRetryUpload,
  onImageUpdate,
  maxImages = 5,
  className
}) => {
  if (images.length === 0) {
    return null;
  }

  const hasErrors = images.some(img => img.uploadStatus === 'error');
  const isUploading = images.some(img => img.uploadStatus === 'uploading');
  const allCompleted = images.every(img => img.uploadStatus === 'completed');

  const getStatusMessage = () => {
    if (hasErrors) {
      const errorCount = images.filter(img => img.uploadStatus === 'error').length;
      return `${errorCount} image${errorCount > 1 ? 's' : ''} failed to upload`;
    }
    if (isUploading) {
      const uploadingCount = images.filter(img => img.uploadStatus === 'uploading').length;
      return `Uploading ${uploadingCount} image${uploadingCount > 1 ? 's' : ''}...`;
    }
    if (allCompleted) {
      return `${images.length} image${images.length > 1 ? 's' : ''} ready to send`;
    }
    return `${images.length} image${images.length > 1 ? 's' : ''} selected`;
  };

  const getStatusColor = () => {
    if (hasErrors) return 'text-red-600';
    if (isUploading) return 'text-blue-600';
    if (allCompleted) return 'text-emerald-600';
    return 'text-gray-600';
  };

  return (
    <div className={cn("space-y-2 p-3 bg-gray-50/50 rounded-lg border border-gray-200", className)}>
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={cn("text-sm font-medium", getStatusColor())}>
            {getStatusMessage()}
          </span>
          {images.length >= maxImages && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              Max {maxImages} images
            </span>
          )}
        </div>
      </div>
      
      {/* Image grid */}
      <div className="grid grid-cols-auto-fit gap-2 justify-items-start" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))'}}>
        {images.map((image) => (
          <ImagePreviewItem
            key={image.id}
            image={image}
            onRemove={onRemoveImage}
            onRetry={onRetryUpload}
          />
        ))}
      </div>
      
      {/* Upload progress summary */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Upload Progress</span>
            <span>
              {images.filter(img => img.uploadStatus === 'completed').length} / {images.length} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(images.filter(img => img.uploadStatus === 'completed').length / images.length) * 100}%`
              }}
            />
          </div>
        </div>
      )}
      
      {/* Error summary */}
      {hasErrors && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
          Some images failed to upload. Click retry on individual images or remove them to continue.
        </div>
      )}
    </div>
  );
};

export default ImagePreviewList;