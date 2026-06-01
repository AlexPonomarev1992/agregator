'use client';

import { useState, useEffect, useRef } from 'react';
import { Copy, Check } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('tsx', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      if (language && hljs.getLanguage(language)) {
        try {
          const result = hljs.highlight(code, { language });
          codeRef.current.innerHTML = result.value;
        } catch {
          codeRef.current.textContent = code;
        }
      } else {
        try {
          const result = hljs.highlightAuto(code);
          codeRef.current.innerHTML = result.value;
        } catch {
          codeRef.current.textContent = code;
        }
      }
    }
  }, [code, language]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayLang = language || 'code';

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-xs font-medium text-white/50">{displayLang}</span>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors',
            copied
              ? 'text-emerald-400'
              : 'text-white/40 hover:bg-white/5 hover:text-white/70'
          )}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Скопировано!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Копировать</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4">
        <pre className="text-sm leading-relaxed">
          <code ref={codeRef} className="font-mono text-white/90">
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}
