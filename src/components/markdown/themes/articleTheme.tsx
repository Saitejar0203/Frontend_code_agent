import React from 'react';
import { Copy, Check } from 'lucide-react';
import { MarkdownComponents } from '../types';
import { useMarkdownCopy } from '../hooks/useMarkdownCopy';

export const createArticleTheme = (enableCopy: boolean = true): MarkdownComponents => {
  const { copyToClipboard, isCopied } = useMarkdownCopy();

  const getTextContent = (element: any): string => {
    if (typeof element === 'string') return element;
    if (typeof element === 'number') return String(element);
    if (Array.isArray(element)) {
      return element.map(getTextContent).join('');
    }
    if (element && typeof element === 'object') {
      if (element.props && element.props.children) {
        return getTextContent(element.props.children);
      }
    }
    return '';
  };

  return {
    p: ({ children }) => (
      <p className="mb-6 leading-relaxed text-gray-800 dark:text-gray-200 text-base max-w-none font-serif">
        {children}
      </p>
    ),
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold mb-8 mt-12 text-gray-900 dark:text-gray-100 font-serif leading-tight">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-semibold mb-6 mt-10 text-gray-900 dark:text-gray-100 font-serif">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-semibold mb-4 mt-8 text-gray-800 dark:text-gray-200 font-serif">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-xl font-semibold mb-3 mt-6 text-gray-800 dark:text-gray-200 font-serif">
        {children}
      </h4>
    ),
    h5: ({ children }) => (
      <h5 className="text-lg font-semibold mb-2 mt-4 text-gray-700 dark:text-gray-300 font-serif">
        {children}
      </h5>
    ),
    h6: ({ children }) => (
      <h6 className="text-base font-semibold mb-2 mt-3 text-gray-600 dark:text-gray-400 font-serif">
        {children}
      </h6>
    ),
    ul: ({ children }) => (
      <ul className="mb-6 space-y-3 text-gray-800 dark:text-gray-200 pl-8">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-6 space-y-3 text-gray-800 dark:text-gray-200 pl-8 list-decimal">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="leading-relaxed text-base font-serif relative">
        <span className="absolute -left-6 top-2 w-2 h-2 bg-gray-400 rounded-full"></span>
        {children}
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-400 bg-gray-50 dark:bg-gray-800/50 pl-8 py-6 mb-6 rounded-r-lg my-8">
        <div className="text-gray-700 dark:text-gray-300 text-base italic leading-relaxed font-serif">
          {children}
        </div>
      </blockquote>
    ),
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      
      if (!inline && match && enableCopy) {
        const codeContent = getTextContent(children);
        const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
        
        return (
          <div className="mb-6 relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="font-medium text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wide">{match[1]}</span>
              <button
                onClick={() => copyToClipboard(codeContent, codeId)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white text-sm flex items-center gap-2 transition-colors font-sans"
                title="Copy code to clipboard"
              >
                {isCopied(codeId) ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-6 overflow-x-auto">
              <code className={`${className} text-sm leading-relaxed font-mono`} {...props}>
                {children}
              </code>
            </pre>
          </div>
        );
      }
      
      return (
        <code className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-base font-mono" {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-lg p-6 overflow-x-auto border border-gray-200 dark:border-gray-700 mb-6 shadow-sm">
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto mb-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <table className="min-w-full border-collapse">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-gray-50 dark:bg-gray-800">
        {children}
      </thead>
    ),
    tbody: ({ children }) => (
      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        {children}
      </tbody>
    ),
    th: ({ children }) => (
      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider font-sans">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-6 py-4 text-lg text-gray-800 dark:text-gray-200 font-serif">
        {children}
      </td>
    ),
    strong: ({ children }) => (
      <strong className="font-bold text-gray-900 dark:text-gray-100">
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em className="italic text-gray-700 dark:text-gray-300">
        {children}
      </em>
    ),
    a: ({ href, children }) => {
      const isExternal = href && (href.startsWith('http') || href.startsWith('https'));
      
      return (
        <a 
          href={href} 
          className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 underline decoration-2 underline-offset-2 transition-colors" 
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
        >
          {children}
          {isExternal && (
            <svg 
              className="w-4 h-4 inline ml-1 opacity-70" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
              />
            </svg>
          )}
        </a>
      );
    },
    hr: () => (
      <hr className="border-gray-300 dark:border-gray-600 my-12 border-t-2" />
    ),
  };
};