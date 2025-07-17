import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import { MarkdownRendererProps, MarkdownTheme } from './types';
import { createChatTheme } from './themes/chatTheme';
import { createDocumentationTheme } from './themes/documentationTheme';
import { createArticleTheme } from './themes/articleTheme';
import { createMinimalTheme } from './themes/minimalTheme';

// Import styles
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';

const themeMap: Record<MarkdownTheme, (enableCopy?: boolean) => any> = {
  chat: createChatTheme,
  documentation: createDocumentationTheme,
  article: createArticleTheme,
  minimal: createMinimalTheme,
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  theme = 'chat',
  enableCopy = true,
  enableGfm = true,
  enableHighlight = true,
  enableRaw = false,
  enableMath = true,
  customComponents = {},
  className = '',
  ...domProps
}) => {
  // Get the theme components
  const themeComponents = themeMap[theme]?.(enableCopy) || createChatTheme(enableCopy);
  
  // Merge theme components with custom components (custom components take precedence)
  const components = {
    ...themeComponents,
    ...customComponents,
  };

  // Build plugins array based on enabled features
  const remarkPlugins = [];
  const rehypePlugins = [];

  if (enableGfm) {
    remarkPlugins.push(remarkGfm);
  }

  if (enableMath) {
    remarkPlugins.push(remarkMath);
  }

  if (enableHighlight) {
    rehypePlugins.push(rehypeHighlight);
  }

  if (enableMath) {
    rehypePlugins.push(rehypeKatex);
  }

  if (enableRaw) {
    rehypePlugins.push(rehypeRaw);
  }

  // Filter out React-specific props that shouldn't be passed to DOM
  const {
    enableHighlighting,
    enableRawHtml,
    ...validDomProps
  } = domProps as any;

  return (
    <div className={`markdown-renderer ${className}`} {...validDomProps}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;