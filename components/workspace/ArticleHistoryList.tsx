'use client';

import type { Article } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Trash2, Plus } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';

export interface ArticleHistoryListProps {
  articles: Article[];
  currentArticleId: string | null;
  onSelectArticle: (articleId: string) => void;
  onDeleteArticle: (articleId: string) => void;
  onCreateArticle: () => void;
}

export function ArticleHistoryList({
  articles,
  currentArticleId,
  onSelectArticle,
  onDeleteArticle,
  onCreateArticle,
}: ArticleHistoryListProps) {
  const handleDelete = (e: React.MouseEvent, articleId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this article?')) {
      onDeleteArticle(articleId);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header with New Article button */}
      <div className="flex items-center justify-between border-b border-zinc-200 p-3 dark:border-zinc-800">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Articles ({articles.length})
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={onCreateArticle}
        >
          <Plus className="h-3 w-3" />
          New
        </Button>
      </div>

      {/* Article List */}
      <ScrollArea className="flex-1">
        {articles.length === 0 ? (
          <div className="py-6 px-3 text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No articles yet
            </p>
            <Button
              variant="link"
              className="mt-1 h-auto p-0 text-xs"
              onClick={onCreateArticle}
            >
              Create your first article
            </Button>
          </div>
        ) : (
          <div className="space-y-0 p-1">
            {articles.map((article) => (
              <div
                key={article.id}
                className={cn(
                  'group relative flex items-start gap-2 rounded-md p-2 text-sm transition-colors',
                  currentArticleId === article.id
                    ? 'bg-zinc-100 dark:bg-zinc-800/80'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                )}
              >
                <button
                  className="flex-1 text-left"
                  onClick={() => onSelectArticle(article.id)}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 shrink-0 text-zinc-400" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-50">
                        {article.title || 'Untitled'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>{article.wordCount} words</span>
                        <span>•</span>
                        <span>{formatRelativeTime(article.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => handleDelete(e, article.id)}
                  title="Delete article"
                >
                  <Trash2 className="h-3 w-3 text-zinc-600 dark:text-zinc-400" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
