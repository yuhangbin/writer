'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useEffect, useState } from 'react';
import 'highlight.js/styles/github.css';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for dark mode
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(darkModeQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    darkModeQuery.addEventListener('change', handler);

    // Also check for dark class on html element
    const checkDarkClass = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    const observer = new MutationObserver(checkDarkClass);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      darkModeQuery.removeEventListener('change', handler);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className={`prose prose-zinc dark:prose-invert max-w-none p-6 ${
        isDark ? 'dark' : ''
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
