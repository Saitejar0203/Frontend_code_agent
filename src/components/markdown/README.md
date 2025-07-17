# Markdown Renderer System

A flexible and reusable markdown rendering system built on top of `react-markdown` with multiple themes and customization options.

## Features

- 🎨 **Multiple Themes**: Chat, Documentation, Article, and Minimal themes
- 📋 **Copy-to-Clipboard**: Built-in code block copying functionality
- 🔧 **Highly Customizable**: Override components, plugins, and styling
- 🌙 **Dark Mode Support**: All themes support dark mode
- 📱 **Responsive Design**: Mobile-friendly layouts
- ⚡ **Performance Optimized**: Efficient rendering with minimal re-renders
- 🔌 **Plugin Support**: GitHub Flavored Markdown, syntax highlighting, LaTeX math, and more

## Quick Start

```tsx
import { MarkdownRenderer } from '@/components/markdown';

// Basic usage
<MarkdownRenderer content="# Hello World\nThis is **markdown**!" />

// With theme
<MarkdownRenderer 
  content={markdownContent} 
  theme="documentation" 
/>

// With custom options
<MarkdownRenderer 
  content={markdownContent}
  theme="article"
  enableCopy={true}
  enableGfm={true}
  enableMath={true}
  className="my-custom-class"
/>
```

## Available Themes

### Chat Theme (Default)
Optimized for chat interfaces with:
- Compact spacing
- macOS-style code blocks with window chrome
- Emerald accent colors
- Copy-to-clipboard functionality

### Documentation Theme
Perfect for technical documentation:
- Clean, professional styling
- Excellent typography hierarchy
- Table of contents friendly
- Code highlighting with copy functionality

### Article Theme
Designed for long-form content:
- Serif typography for readability
- Generous spacing and margins
- Article-style formatting
- External link indicators

### Minimal Theme
Lightweight and compact:
- Minimal spacing and styling
- Small font sizes
- Perfect for previews or constrained spaces
- Optional copy functionality

## LaTeX Math Support

The markdown renderer supports LaTeX mathematical expressions using KaTeX:

### Inline Math
Use single dollar signs for inline math: `$E = mc^2$` renders as $E = mc^2$

### Block Math
Use double dollar signs for block math:
```
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

### Supported Features
- **Basic Operations**: `$a + b - c \times d \div e$`
- **Fractions**: `$\frac{a}{b}$`, `$\frac{\partial f}{\partial x}$`
- **Exponents & Subscripts**: `$x^2$`, `$H_2O$`, `$x_i^{(n)}`
- **Greek Letters**: `$\alpha$`, `$\beta$`, `$\gamma$`, `$\Delta$`, `$\Omega$`
- **Integrals**: `$\int$`, `$\iint$`, `$\oint$`
- **Summations**: `$\sum_{i=1}^{n}$`, `$\prod_{i=1}^{n}$`
- **Matrices**: `$\begin{pmatrix} a & b \\ c & d \end{pmatrix}$`
- **Functions**: `$\sin$`, `$\cos$`, `$\log$`, `$\ln$`, `$\sqrt{x}$`
- **Limits**: `$\lim_{x \to \infty}$`
- **Arrows**: `$\rightarrow$`, `$\Rightarrow$`, `$\leftrightarrow$`

### Math Examples
```markdown
# Mathematical Expressions

## Quadratic Formula
The quadratic formula is: $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$

## Euler's Identity
$$e^{i\pi} + 1 = 0$$

## Matrix Multiplication
$$\begin{pmatrix} a & b \\ c & d \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} ax + by \\ cx + dy \end{pmatrix}$$

## Calculus
The derivative of $f(x) = x^n$ is:
$$\frac{d}{dx}x^n = nx^{n-1}$$
```

## API Reference

### MarkdownRenderer Props

```tsx
interface MarkdownRendererProps {
  content: string;                    // Markdown content to render
  theme?: MarkdownTheme;             // 'chat' | 'documentation' | 'article' | 'minimal'
  enableCopy?: boolean;              // Enable copy-to-clipboard (default: true)
  enableGfm?: boolean;               // Enable GitHub Flavored Markdown (default: true)
  enableHighlight?: boolean;         // Enable syntax highlighting (default: true)
  enableRaw?: boolean;               // Enable raw HTML (default: false)
  enableMath?: boolean;              // Enable LaTeX math rendering (default: true)
  customComponents?: MarkdownComponents; // Override specific components
  className?: string;                // Additional CSS classes
  [key: string]: any;               // Additional props passed to container
}
```

### Theme Types

```tsx
type MarkdownTheme = 'chat' | 'documentation' | 'article' | 'minimal';
```

## Advanced Usage

### Custom Components

You can override specific markdown components:

```tsx
import { MarkdownRenderer } from '@/components/markdown';

const customComponents = {
  h1: ({ children }) => (
    <h1 className="custom-heading">{children}</h1>
  ),
  p: ({ children }) => (
    <p className="custom-paragraph">{children}</p>
  ),
};

<MarkdownRenderer 
  content={content}
  theme="documentation"
  customComponents={customComponents}
/>
```

### Using Theme Creators Directly

For advanced customization, you can use theme creators directly:

```tsx
import { createChatTheme, MarkdownRenderer } from '@/components/markdown';
import ReactMarkdown from 'react-markdown';

const customChatTheme = createChatTheme(false); // Disable copy functionality

<ReactMarkdown components={customChatTheme}>
  {content}
</ReactMarkdown>
```

### Custom Hook Usage

Use the copy functionality in your own components:

```tsx
import { useMarkdownCopy } from '@/components/markdown';

function MyCodeBlock({ code }) {
  const { copyToClipboard, isCopied } = useMarkdownCopy();
  const codeId = 'my-code-block';

  return (
    <div>
      <button onClick={() => copyToClipboard(code, codeId)}>
        {isCopied(codeId) ? 'Copied!' : 'Copy'}
      </button>
      <pre>{code}</pre>
    </div>
  );
}
```

## Migration Guide

### From MessageRenderer

If you're migrating from the old `MessageRenderer`:

```tsx
// Old
<MessageRenderer content={content} className="my-class" />

// New
<MarkdownRenderer 
  content={content} 
  theme="chat" 
  className="prose prose-sm max-w-none dark:prose-invert my-class"
/>
```

### Creating New Themes

To create a custom theme:

```tsx
import { MarkdownComponents } from '@/components/markdown/types';
import { useMarkdownCopy } from '@/components/markdown/hooks/useMarkdownCopy';

export const createMyTheme = (enableCopy: boolean = true): MarkdownComponents => {
  const { copyToClipboard, isCopied } = useMarkdownCopy();

  return {
    h1: ({ children }) => (
      <h1 className="my-custom-h1">{children}</h1>
    ),
    // ... other components
  };
};
```

## Performance Considerations

- The `useMarkdownCopy` hook uses `useState` and `setTimeout` efficiently
- Theme components are memoized to prevent unnecessary re-renders
- Large markdown content is handled efficiently by react-markdown
- Syntax highlighting is lazy-loaded through rehype-highlight

## Dependencies

- `react-markdown`: Core markdown rendering
- `remark-gfm`: GitHub Flavored Markdown support
- `remark-math`: LaTeX math parsing
- `rehype-highlight`: Syntax highlighting
- `rehype-katex`: LaTeX math rendering
- `rehype-raw`: Raw HTML support (optional)
- `katex`: LaTeX math rendering engine and styles
- `highlight.js`: Syntax highlighting styles
- `lucide-react`: Icons for copy functionality

## Browser Support

- Modern browsers with ES2018+ support
- Clipboard API support for copy functionality
- Fallback for older browsers without Clipboard API

## Contributing

When adding new themes or features:

1. Follow the existing theme structure
2. Ensure dark mode compatibility
3. Add proper TypeScript types
4. Test with various markdown content
5. Update this README with new features

## Examples

### Chat Interface
```tsx
<MarkdownRenderer 
  content={aiResponse}
  theme="chat"
  enableCopy={true}
  enableMath={true}
/>
```

### Documentation Site
```tsx
<MarkdownRenderer 
  content={docContent}
  theme="documentation"
  enableMath={true}
  className="max-w-4xl mx-auto"
/>
```

### Blog Article
```tsx
<MarkdownRenderer 
  content={articleContent}
  theme="article"
  enableMath={true}
  className="max-w-prose mx-auto"
/>
```

### Mathematical Content
```tsx
const mathContent = `
# Physics Equations

Einstein's mass-energy equivalence: $E = mc^2$

The Schrödinger equation:
$$i\hbar\frac{\partial}{\partial t}\Psi = \hat{H}\Psi$$

Maxwell's equations in vacuum:
$$\nabla \cdot \mathbf{E} = \frac{\rho}{\epsilon_0}$$
`;

<MarkdownRenderer 
  content={mathContent}
  theme="documentation"
  enableMath={true}
/>
```

### Preview/Summary
```tsx
<MarkdownRenderer 
  content={summaryContent}
  theme="minimal"
  enableCopy={false}
  enableMath={false}
  className="text-sm"
/>
```