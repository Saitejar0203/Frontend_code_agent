export interface MarkdownTheme {
  name: string;
  components: MarkdownComponents;
}

export interface MarkdownComponents {
  p?: React.ComponentType<any>;
  h1?: React.ComponentType<any>;
  h2?: React.ComponentType<any>;
  h3?: React.ComponentType<any>;
  h4?: React.ComponentType<any>;
  h5?: React.ComponentType<any>;
  h6?: React.ComponentType<any>;
  ul?: React.ComponentType<any>;
  ol?: React.ComponentType<any>;
  li?: React.ComponentType<any>;
  blockquote?: React.ComponentType<any>;
  code?: React.ComponentType<any>;
  pre?: React.ComponentType<any>;
  table?: React.ComponentType<any>;
  thead?: React.ComponentType<any>;
  tbody?: React.ComponentType<any>;
  th?: React.ComponentType<any>;
  td?: React.ComponentType<any>;
  strong?: React.ComponentType<any>;
  em?: React.ComponentType<any>;
  a?: React.ComponentType<any>;
  hr?: React.ComponentType<any>;
}

export interface MarkdownRendererProps {
  content: string;
  theme?: MarkdownTheme;
  enableCopy?: boolean;
  enableGfm?: boolean;
  enableHighlight?: boolean;
  enableRaw?: boolean;
  enableMath?: boolean;
  customComponents?: MarkdownComponents;
  className?: string;
  [key: string]: any;
}

export interface CopyState {
  [key: string]: boolean;
}