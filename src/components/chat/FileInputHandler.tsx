import React, { useRef, useCallback, forwardRef } from 'react';
import { ImageAttachment } from '@/lib/stores/chatStore';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FileInputHandlerProps {
  onFilesSelected: (files: ImageAttachment[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  disabled?: boolean;
}

const FileInputHandler = forwardRef<HTMLInputElement, FileInputHandlerProps>((
  {
    onFilesSelected,
    maxFiles = 5,
    maxFileSize = 10 * 1024 * 1024, // 10MB
    acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    disabled = false
  },
  ref
) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): FileValidationResult => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type not supported. Please use: ${acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}`
      };
    }

    // Check file size
    if (file.size > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
      return {
        isValid: false,
        error: `File size too large. Maximum size is ${maxSizeMB}MB`
      };
    }

    return { isValid: true };
  }, [acceptedTypes, maxFileSize]);

  const createImageAttachment = useCallback((file: File): Promise<ImageAttachment> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        resolve({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview,
          uploadStatus: 'pending',
          uploadProgress: 0
        });
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }, []);

  const processFiles = useCallback(async (fileList: FileList) => {
    if (disabled) return;
    
    const files = Array.from(fileList);
    
    // Limit files to maxFiles
    if (files.length > maxFiles) {
      alert(`You can only select up to ${maxFiles} images at once. Only the first ${maxFiles} will be selected.`);
      files.splice(maxFiles);
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate each file
    for (const file of files) {
      const validation = validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }

    // Show validation errors
    if (errors.length > 0) {
      alert(`Some files were rejected:\n\n${errors.join('\n')}`);
    }

    // Process valid files
    if (validFiles.length > 0) {
      try {
        const imageAttachments = await Promise.all(
          validFiles.map(file => createImageAttachment(file))
        );
        onFilesSelected(imageAttachments);
      } catch (error) {
        console.error('Error processing files:', error);
        alert('Error processing some files. Please try again.');
      }
    }
  }, [disabled, maxFiles, validateFile, createImageAttachment, onFilesSelected]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [processFiles]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      const fileList = new DataTransfer();
      imageFiles.forEach(file => fileList.items.add(file));
      processFiles(fileList.files);
    }
  }, [processFiles]);

  // Add paste event listener
  React.useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  return (
    <input
      ref={ref || fileInputRef}
      type="file"
      accept={acceptedTypes.join(',')}
      multiple
      onChange={handleFileChange}
      disabled={disabled}
      style={{ display: 'none' }}
    />
  );
});

FileInputHandler.displayName = 'FileInputHandler';

export default FileInputHandler;