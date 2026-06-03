'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';
import type { Components } from 'react-markdown';

interface RichMessageRendererProps {
  content: string;
}

export function RichMessageRenderer({ content }: RichMessageRendererProps) {
  const components: Components = {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');

      // Check if this is a fenced code block (has language class or is multi-line within pre)
      const isInline = !className && !codeString.includes('\n');

      if (isInline) {
        return (
          <code
            className="rounded bg-white/10 px-1.5 py-0.5 text-sm font-mono text-white/90"
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <CodeBlock
          code={codeString}
          language={match ? match[1] : undefined}
        />
      );
    },
    pre({ children }) {
      // If pre contains our CodeBlock, just render children directly
      return <>{children}</>;
    },
    p({ children }) {
      return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
    },
    ul({ children }) {
      return <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>;
    },
    li({ children }) {
      return <li className="leading-relaxed">{children}</li>;
    },
    a({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:underline"
        >
          {children}
        </a>
      );
    },
    strong({ children }) {
      return <strong className="font-semibold text-white">{children}</strong>;
    },
    em({ children }) {
      return <em className="italic text-white/80">{children}</em>;
    },
    h1({ children }) {
      return (
        <h1 className="mb-3 mt-4 border-b border-white/10 pb-2 text-xl font-bold text-white first:mt-0">
          {children}
        </h1>
      );
    },
    h2({ children }) {
      return (
        <h2 className="mb-2 mt-3 border-b border-white/10 pb-1.5 text-lg font-bold text-white first:mt-0">
          {children}
        </h2>
      );
    },
    h3({ children }) {
      return (
        <h3 className="mb-2 mt-3 text-base font-semibold text-white first:mt-0">
          {children}
        </h3>
      );
    },
    h4({ children }) {
      return (
        <h4 className="mb-1 mt-2 text-sm font-semibold text-white first:mt-0">
          {children}
        </h4>
      );
    },
    blockquote({ children }) {
      return (
        <blockquote className="my-2 border-l-2 border-white bg-white/5 py-1 pl-4 pr-2 italic text-white/70">
          {children}
        </blockquote>
      );
    },
    hr() {
      return <hr className="my-3 border-white/10" />;
    },
    table({ children }) {
      return (
        <div className="my-2 overflow-x-auto">
          <table className="w-full border-collapse text-xs">{children}</table>
        </div>
      );
    },
    thead({ children }) {
      return <thead className="bg-white/5">{children}</thead>;
    },
    th({ children }) {
      return (
        <th className="border border-white/10 px-2.5 py-1.5 text-left font-semibold text-white">
          {children}
        </th>
      );
    },
    td({ children }) {
      return (
        <td className="border border-white/10 px-2.5 py-1.5 text-white/80 align-top">
          {children}
        </td>
      );
    },
  };

  return (
    <div className="prose-invert max-w-none text-sm leading-relaxed text-white/90">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
