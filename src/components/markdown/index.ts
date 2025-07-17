// Main component
export { default as MarkdownRenderer } from './MarkdownRenderer';
export { MarkdownRenderer as Markdown } from './MarkdownRenderer';

// Types
export type {
  MarkdownTheme,
  MarkdownComponents,
  MarkdownRendererProps,
  CopyState,
} from './types';

// Hooks
export { useMarkdownCopy } from './hooks/useMarkdownCopy';

// Theme creators (for advanced customization)
export { createChatTheme } from './themes/chatTheme';
export { createDocumentationTheme } from './themes/documentationTheme';
export { createArticleTheme } from './themes/articleTheme';
export { createMinimalTheme } from './themes/minimalTheme';