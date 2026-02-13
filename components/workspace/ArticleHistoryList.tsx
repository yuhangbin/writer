'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Article } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, MoreHorizontal, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ArticleHistoryListProps {
  articles: Article[];
  currentArticleId: string | null;
  onSelectArticle: (articleId: string) => void;
  onDeleteArticle: (articleId: string) => void;
}

export function ArticleHistoryList({
  articles,
  currentArticleId,
  onSelectArticle,
  onDeleteArticle,
}: ArticleHistoryListProps) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleDelete = (articleId: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      onDeleteArticle(articleId);
      setOpenDropdownId(null);
      setDropdownPosition(null);
    }
  };

  const openDropdown = (articleId: string) => {
    const button = buttonRefs.current[articleId];
    if (button) {
      const rect = button.getBoundingClientRect();
      setDropdownPosition({
        top: rect.top,
        left: rect.right + 4, // 4px gap to the right of button
      });
      setOpenDropdownId(articleId);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openDropdownId) {
        const target = e.target as Node;
        const button = buttonRefs.current[openDropdownId];
        const dropdown = dropdownRef.current;

        // Check if click is outside both button and dropdown
        const isOutsideButton = !button || !button.contains(target);
        const isOutsideDropdown = !dropdown || !dropdown.contains(target);

        if (isOutsideButton && isOutsideDropdown) {
          setOpenDropdownId(null);
          setDropdownPosition(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openDropdownId) {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [openDropdownId]);

  return (
    <div className="flex h-full flex-col">
      {/* Article List */}
      <ScrollArea className="flex-1">
        {articles.length === 0 ? (
          <div className="py-6 px-3 text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No articles yet
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 px-2">
            {articles.map((article) => (
              <div
                key={article.id}
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <button
                  className="flex flex-1 items-center gap-2 text-left"
                  onClick={() => onSelectArticle(article.id)}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <span className={cn(
                    "truncate font-medium",
                    currentArticleId === article.id
                      ? 'text-zinc-900 dark:text-zinc-50'
                      : 'text-zinc-900 dark:text-zinc-50'
                  )}>
                    {article.title || 'Untitled'}
                  </span>
                </button>

                {/* Ellipsis menu button */}
                <button
                  ref={(el) => { buttonRefs.current[article.id] = el; }}
                  className="h-7 w-7 shrink-0 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDropdown(article.id);
                  }}
                  title="More options"
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Dropdown rendered at top level using portal */}
      {openDropdownId && dropdownPosition && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 min-w-[120px]"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors duration-200"
            onClick={() => handleDelete(openDropdownId)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
