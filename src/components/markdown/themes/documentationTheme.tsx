import React from 'react';
import { Copy, Check } from 'lucide-react';
import { MarkdownComponents } from '../types';
import { useMarkdownCopy } from '../hooks/useMarkdownCopy';

export const createDocumentationTheme = (enableCopy: boolean = true): MarkdownComponents => {
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
      <p className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300 text-base max-w-none">
        {children}
      </p>
    ),
    h1: ({ children }) => (
      <h1 className="text-3xl font-bold mb-6 mt-8 text-blue-900 dark:text-blue-100 border-b-2 border-blue-200 dark:border-blue-700 pb-3">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-semibold mb-4 mt-6 text-blue-800 dark:text-blue-200">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold mb-3 mt-5 text-blue-700 dark:text-blue-300">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg font-semibold mb-2 mt-4 text-gray-800 dark:text-gray-200">
        {children}
      </h4>
    ),
    h5: ({ children }) => (
      <h5 className="text-base font-semibold mb-2 mt-3 text-gray-700 dark:text-gray-300">
        {children}
      </h5>
    ),
    h6: ({ children }) => (
      <h6 className="text-sm font-semibold mb-1 mt-2 text-gray-600 dark:text-gray-400 uppercase tracking-wide">
        {children}
      </h6>
    ),
    ul: ({ children }) => (
      <ul className="mb-4 space-y-2 text-gray-700 dark:text-gray-300 pl-6 list-disc">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-4 space-y-2 text-gray-700 dark:text-gray-300 pl-6 list-decimal">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="leading-relaxed text-base">
        {children}
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-900/20 pl-6 py-4 mb-4 rounded-r-lg">
        <div className="text-blue-800 dark:text-blue-200 text-base italic leading-relaxed">
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
          <div className="mb-4 relative rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm font-medium border-b border-gray-300 dark:border-gray-600 flex justify-between items-center">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{match[1].toUpperCase()}</span>
              <button
                onClick={() => copyToClipboard(codeContent, codeId)}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white text-sm flex items-center gap-2 transition-colors"
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
            <pre className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 overflow-x-auto">
              <code className={`${className} text-sm leading-relaxed font-mono`} {...props}>
                {children}
              </code>
            </pre>
          </div>
        );
      }
      
      return (
        <code className="bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-lg p-4 overflow-x-auto border border-gray-300 dark:border-gray-600 mb-4">
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto mb-4 rounded-lg border border-gray-300 dark:border-gray-600">
        <table className="min-w-full border-collapse">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-gray-100 dark:bg-gray-800">
        {children}
      </thead>
    ),
    tbody: ({ children }) => (
      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        {children}
      </tbody>
    ),
    th: ({ children }) => (
      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-6 py-4 text-base text-gray-700 dark:text-gray-300">
        {children}
      </td>
    ),
    strong: ({ children }) => (
      <strong className="font-bold text-gray-900 dark:text-gray-100">
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em className="italic text-gray-600 dark:text-gray-400">
        {children}
      </em>
    ),
    a: ({ href, children }) => {
      const isExternal = href && (href.startsWith('http') || href.startsWith('https'));
      
      return (
        <a 
          href={href} 
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors" 
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
        >
          {children}
          {isExternal && (
            <svg 
              className="w-3 h-3 inline ml-1 opacity-70" 
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
      <hr className="border-gray-300 dark:border-gray-600 my-8" />
    ),
  };
};