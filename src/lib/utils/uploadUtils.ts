import { ImageAttachment } from '@/lib/stores/chatStore';

/**
 * Simulates image upload with progress tracking
 * In a real implementation, this would handle actual file upload to a server
 */
export const simulateImageUpload = async (
  image: ImageAttachment,
  onProgress: (imageId: string, progress: number) => void,
  onComplete: (imageId: string, url?: string) => void,
  onError: (imageId: string, error: string) => void
): Promise<void> => {
  try {
    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      onProgress(image.id, progress);
    }
    
    // Simulate successful upload
    const mockUrl = `https://example.com/uploads/${image.id}.${image.file.name.split('.').pop()}`;
    onComplete(image.id, mockUrl);
  } catch (error) {
    onError(image.id, error instanceof Error ? error.message : 'Upload failed');
  }
};

/**
 * Batch upload multiple images with progress tracking
 */
export const batchUploadImages = async (
  images: ImageAttachment[],
  onImageProgress: (imageId: string, progress: number) => void,
  onImageComplete: (imageId: string, url?: string) => void,
  onImageError: (imageId: string, error: string) => void
): Promise<void> => {
  const uploadPromises = images.map(image => 
    simulateImageUpload(image, onImageProgress, onImageComplete, onImageError)
  );
  
  await Promise.allSettled(uploadPromises);
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate image file type
 */
export const isValidImageType = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
};

/**
 * Validate image file size
 */
export const isValidImageSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};