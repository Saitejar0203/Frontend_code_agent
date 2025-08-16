import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ImageAttachment } from '@/lib/stores/chatStore';

interface CompactImageThumbnailProps {
  image: ImageAttachment;
  onRemove: (id: string) => void;
  className?: string;
}

const CompactImageThumbnail: React.FC<CompactImageThumbnailProps> = ({
  image,
  onRemove,
  className
}) => {
  const { id, file, preview, uploadStatus, error } = image;

  const getStatusBorder = () => {
    switch (uploadStatus) {
      case 'completed':
        return 'border-emerald-300';
      case 'error':
        return 'border-red-300';
      case 'uploading':
        return 'border-blue-300';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <div className={cn(
      "relative group inline-block w-8 h-8 rounded-md border-2 overflow-hidden bg-gray-100 transition-all duration-200",
      getStatusBorder(),
      className
    )}>
      {/* Image thumbnail */}
      <img
        src={preview}
        alt={file.name}
        className="w-full h-full object-cover"
      />
      
      {/* Remove button - appears on hover */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(id)}
        className="absolute -top-1 -right-1 w-4 h-4 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
      >
        <X className="w-2.5 h-2.5" />
      </Button>
      
      {/* Upload status indicator */}
      {uploadStatus === 'uploading' && (
        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {uploadStatus === 'error' && (
        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
        </div>
      )}
    </div>
  );
};

export default CompactImageThumbnail;