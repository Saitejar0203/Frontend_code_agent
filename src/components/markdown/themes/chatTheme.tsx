import React from 'react';
import { Copy, Check } from 'lucide-react';
import { MarkdownComponents } from '../types';
import { useMarkdownCopy } from '../hooks/useMarkdownCopy';

export const createChatTheme = (enableCopy: boolean = true): MarkdownComponents => {
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
      <p className="mb-2 leading-relaxed text-gray-800 dark:text-gray-200 text-[15px] tracking-wide max-w-none">
        {children}
      </p>
    ),
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold mb-3 mt-4 text-gray-900 dark:text-gray-100 border-b-2 border-emerald-200 dark:border-emerald-700 pb-2 tracking-tight">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-semibold mb-2 mt-4 text-gray-900 dark:text-gray-100 tracking-tight">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold mb-2 mt-3 text-gray-900 dark:text-gray-100 tracking-tight">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-base font-semibold mb-2 mt-3 text-gray-800 dark:text-gray-200 tracking-tight">
        {children}
      </h4>
    ),
    h5: ({ children }) => (
      <h5 className="text-sm font-semibold mb-1 mt-2 text-gray-800 dark:text-gray-200 uppercase tracking-wider">
        {children}
      </h5>
    ),
    h6: ({ children }) => (
      <h6 className="text-sm font-medium mb-1 mt-2 text-gray-700 dark:text-gray-300 uppercase tracking-wider">
        {children}
      </h6>
    ),
    ul: ({ children }) => (
      <ul className="mb-3 space-y-1 text-gray-800 dark:text-gray-200 pl-1">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 space-y-1 text-gray-800 dark:text-gray-200 counter-reset-list pl-1">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="leading-relaxed text-[15px] flex items-start group">
        <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mt-2.5 mr-4 flex-shrink-0 group-hover:bg-emerald-600 transition-colors"></span>
        <span className="flex-1 tracking-wide">{children}</span>
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 pl-6 py-4 mb-3 rounded-r-lg shadow-sm">
        <div className="text-emerald-800 dark:text-emerald-200 text-[15px] italic leading-relaxed font-medium">
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
          <div className="mb-3 relative shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-3 text-sm font-medium border-b border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="font-semibold text-gray-200 tracking-wide">{match[1].toUpperCase()}</span>
              </div>
              <button
                onClick={() => copyToClipboard(codeContent, codeId)}
                className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 px-3 py-2 rounded-md transition-all duration-200 flex items-center gap-2 text-gray-200 hover:text-white border border-gray-600 hover:border-gray-500 text-sm font-medium shadow-sm hover:shadow-md"
                title="Copy code to clipboard"
              >
                {isCopied(codeId) ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-5 overflow-x-auto max-h-96 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              <code className={`${className} text-[14px] leading-relaxed font-mono`} {...props}>
                {children}
              </code>
            </pre>
          </div>
        );
      }
      
      return (
        <code className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-md text-[14px] font-mono border border-emerald-200 dark:border-emerald-700" {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-5 overflow-x-auto border border-gray-700 mb-3 max-h-96 shadow-lg font-mono text-[14px] leading-relaxed scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto mb-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg max-w-full">
        <table className="min-w-full border-collapse table-auto">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30">
        {children}
      </thead>
    ),
    tbody: ({ children }) => (
      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        {children}
      </tbody>
    ),
    th: ({ children }) => (
      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-emerald-800 dark:text-emerald-200 uppercase tracking-wider border-b border-emerald-200 dark:border-emerald-700 min-w-0">
        <div className="break-words overflow-wrap-anywhere">
          {children}
        </div>
      </th>
    ),
    td: ({ children }) => (
      <td className="px-3 md:px-6 py-3 md:py-4 text-sm md:text-[15px] text-gray-800 dark:text-gray-200 leading-relaxed min-w-0">
        <div className="break-words overflow-wrap-anywhere max-w-[200px] md:max-w-none">
          {children}
        </div>
      </td>
    ),
    strong: ({ children }) => (
      <strong className="font-bold text-gray-900 dark:text-gray-100 tracking-tight">
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em className="italic text-gray-700 dark:text-gray-300 font-medium">
        {children}
      </em>
    ),
    a: ({ href, children }) => {
      const isExternal = href && (href.startsWith('http') || href.startsWith('https'));
      const displayText = children?.toString() || href || '';
      
      const truncateUrl = (url: string, maxLength: number = 50) => {
        if (url.length <= maxLength) return url;
        const start = url.substring(0, maxLength / 2);
        const end = url.substring(url.length - maxLength / 2);
        return `${start}...${end}`;
      };
      
      const shouldTruncate = displayText === href && displayText.length > 50;
      const finalDisplayText = shouldTruncate ? truncateUrl(displayText) : displayText;
      
      return (
        <a 
          href={href} 
          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 underline decoration-blue-300 dark:decoration-blue-600 decoration-1 underline-offset-2 hover:decoration-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-sm px-1 py-0.5 hover:bg-blue-50 dark:hover:bg-blue-900/20" 
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          title={shouldTruncate ? displayText : undefined}
          aria-label={isExternal ? `${finalDisplayText} (opens in new tab)` : finalDisplayText}
        >
          <span className="break-words">{finalDisplayText}</span>
          {isExternal && (
            <svg 
              className="w-3 h-3 flex-shrink-0 opacity-70" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
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
      <hr className="border-gray-300 dark:border-gray-600 my-8 border-t-2" />
    ),
  };
};