'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { Workspace } from '@/types';
import type { WorkspaceSidebarProps } from './workspace.types';
import { ArticleHistoryList } from './ArticleHistoryList';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WorkspaceSidebar({
  workspaces,
  currentWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onSettingsClick,
  getArticlesForWorkspace,
  currentArticleId,
  onSelectArticle,
  onDeleteArticle,
  onCreateArticle,
}: WorkspaceSidebarProps) {
  const t = useTranslations('workspace.sidebar');
  const [expandedWorkspaceId, setExpandedWorkspaceId] = useState<string | null>(null);

  const handleWorkspaceClick = useCallback(
    (id: string) => {
      if (expandedWorkspaceId === id) {
        setExpandedWorkspaceId(null);
      } else {
        setExpandedWorkspaceId(id);
        onSelectWorkspace(id);
      }
    },
    [expandedWorkspaceId, onSelectWorkspace]
  );

  const isExpanded = (workspaceId: string) => expandedWorkspaceId === workspaceId;

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {t('title')}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          onClick={onCreateWorkspace}
          title={t('createTooltip')}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Workspace List */}
      <ScrollArea className="flex-1 overflow-y-auto pb-4">
        <div className="px-3">
          {workspaces.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t('noWorkspaces')}
              </p>
              <Button
                variant="link"
                className="mt-2 h-auto p-0 text-sm"
                onClick={onCreateWorkspace}
              >
                {t('createFirstWorkspace')}
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {workspaces.map((workspace) => {
                const expanded = isExpanded(workspace.id);

                return (
                  <div key={workspace.id}>
                    {/* Workspace Item */}
                    <div
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      onClick={() => handleWorkspaceClick(workspace.id)}
                    >
                      <div className="shrink-0">
                        {expanded ? (
                          <ChevronDown className="h-[10px] text-zinc-400" />
                        ) : (
                          <ChevronRight className="h-[10px] text-zinc-400" />
                        )}
                      </div>
                      <span className="flex-1 font-semibold text-zinc-900 dark:text-zinc-50">
                        {workspace.name}
                      </span>
                      {/* Action buttons group */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSettingsClick(workspace.id);
                          }}
                          title={t('settingsTooltip')}
                        >
                          <Settings className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateArticle(workspace.id);
                          }}
                          title={t('createArticleTooltip')}
                        >
                          <Plus className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                        </Button>
                      </div>
                    </div>

                    {/* Article List (expanded) */}
                    {expanded && (
                      <div className="ml-5 mt-1 space-y-0.5">
                        <ArticleHistoryList
                          articles={getArticlesForWorkspace(workspace.id)}
                          currentArticleId={currentArticleId}
                          onSelectArticle={onSelectArticle}
                          onDeleteArticle={onDeleteArticle}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

    </div>
  );
}
