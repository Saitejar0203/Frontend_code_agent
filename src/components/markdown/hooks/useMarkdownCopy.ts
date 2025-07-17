import { useState, useCallback } from 'react';
import { CopyState } from '../types';

export const useMarkdownCopy = () => {
  const [copiedStates, setCopiedStates] = useState<CopyState>({});

  const copyToClipboard = useCallback(async (text: string, codeId: string) => {
    try {
      // Clean up the text by removing extra whitespace and ensuring proper formatting
      const cleanText = text.trim();
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(cleanText);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = cleanText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      setCopiedStates(prev => ({ ...prev, [codeId]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [codeId]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Show user feedback even if copy failed
      setCopiedStates(prev => ({ ...prev, [codeId]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [codeId]: false }));
      }, 1000);
    }
  }, []);

  const isCopied = useCallback((codeId: string) => {
    return copiedStates[codeId] || false;
  }, [copiedStates]);

  return {
    copyToClipboard,
    isCopied,
    copiedStates
  };
};