import React from 'react';
import { Copy, Check } from 'lucide-react';
import { MarkdownComponents } from '../types';
import { useMarkdownCopy } from '../hooks/useMarkdownCopy';

export const createMinimalTheme = (enableCopy: boolean = false): MarkdownComponents => {
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
      <p className="mb-3 text-gray-700 dark:text-gray-300">
        {children}
      </p>
    ),
    h1: ({ children }) => (
      <h1 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-200">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">
        {children}
      </h4>
    ),
    h5: ({ children }) => (
      <h5 className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
        {children}
      </h5>
    ),
    h6: ({ children }) => (
      <h6 className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
        {children}
      </h6>
    ),
    ul: ({ children }) => (
      <ul className="mb-3 space-y-1 text-gray-700 dark:text-gray-300 pl-4">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 space-y-1 text-gray-700 dark:text-gray-300 pl-4 list-decimal">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="text-sm">
        {children}
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-gray-300 dark:border-gray-600 pl-3 mb-3">
        <div className="text-gray-600 dark:text-gray-400 text-sm italic">
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
          <div className="mb-3 relative rounded border border-gray-200 dark:border-gray-700">
            <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">{match[1]}</span>
              <button
                onClick={() => copyToClipboard(codeContent, codeId)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                title="Copy code"
              >
                {isCopied(codeId) ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <pre className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-3 overflow-x-auto">
              <code className={`${className} text-xs`} {...props}>
                {children}
              </code>
            </pre>
          </div>
        );
      }
      
      return (
        <code className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1 py-0.5 rounded text-xs font-mono" {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded p-3 overflow-x-auto border border-gray-200 dark:border-gray-700 mb-3">
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto mb-3">
        <table className="min-w-full text-xs border border-gray-200 dark:border-gray-700">
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
      <tbody className="bg-white dark:bg-gray-900">
        {children}
      </tbody>
    ),
    th: ({ children }) => (
      <th className="px-2 py-1 text-left text-xs font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-2 py-1 text-xs text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
        {children}
      </td>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900 dark:text-gray-100">
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em className="italic text-gray-600 dark:text-gray-400">
        {children}
      </em>
    ),
    a: ({ href, children }) => (
      <a 
        href={href} 
        className="text-blue-600 dark:text-blue-400 hover:underline" 
        target={href && (href.startsWith('http') || href.startsWith('https')) ? "_blank" : undefined}
        rel={href && (href.startsWith('http') || href.startsWith('https')) ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    ),
    hr: () => (
      <hr className="border-gray-200 dark:border-gray-700 my-3" />
    ),
  };
};