'use client';

import { useState, useCallback } from 'react';
import type { Workspace } from '@/types';
import type { WorkspaceSidebarProps } from './workspace.types';
import { ArticleHistoryList } from './ArticleHistoryList';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, Plus, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WorkspaceSidebar({
  workspaces,
  currentWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onSettingsClick,
  onDeleteWorkspace,
  getArticlesForWorkspace,
  currentArticleId,
  onSelectArticle,
  onDeleteArticle,
  onCreateArticle,
}: WorkspaceSidebarProps) {
  const [expandedWorkspaceId, setExpandedWorkspaceId] = useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this workspace and all its articles?')) {
      onDeleteWorkspace(id);
      if (expandedWorkspaceId === id) {
        setExpandedWorkspaceId(null);
      }
    }
  };

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
  const getArticleCount = (workspaceId: string) => getArticlesForWorkspace(workspaceId).length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Workspaces
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onCreateWorkspace}
          title="Create new workspace"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Workspace List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {workspaces.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No workspaces yet
              </p>
              <Button
                variant="link"
                className="mt-2 h-auto p-0 text-sm"
                onClick={onCreateWorkspace}
              >
                Create your first workspace
              </Button>
            </div>
          ) : (
            workspaces.map((workspace) => {
              const articleCount = getArticleCount(workspace.id);
              const expanded = isExpanded(workspace.id);

              return (
                <div key={workspace.id} className="overflow-hidden rounded-md">
                  {/* Workspace Header */}
                  <div
                    className={cn(
                      'group relative flex items-center gap-2 rounded-md p-3 text-sm transition-colors',
                      currentWorkspaceId === workspace.id
                        ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                        : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50'
                    )}
                  >
                    <button
                      className="flex flex-1 items-center gap-2 text-left"
                      onClick={() => handleWorkspaceClick(workspace.id)}
                    >
                      <div className="shrink-0">
                        {expanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                      <span className="truncate" title={workspace.name}>
                        {workspace.name}
                      </span>
                      {articleCount > 0 && (
                        <span className="text-xs text-zinc-400">
                          ({articleCount})
                        </span>
                      )}
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      {currentWorkspaceId === workspace.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSettingsClick();
                          }}
                          title="Workspace settings"
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-zinc-600 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                        onClick={(e) => handleDelete(e, workspace.id)}
                        title="Delete workspace"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Article List (expanded) */}
                  {expanded && (
                    <div className="ml-2 mt-1 border-l border-zinc-200 pl-2 dark:border-zinc-700">
                      <ArticleHistoryList
                        articles={getArticlesForWorkspace(workspace.id)}
                        currentArticleId={currentArticleId}
                        onSelectArticle={onSelectArticle}
                        onDeleteArticle={onDeleteArticle}
                        onCreateArticle={onCreateArticle}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer with settings for current workspace */}
      {currentWorkspaceId && !expandedWorkspaceId && (
        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <Button
            variant="outline"
            className="w-full justify-start text-sm"
            onClick={onSettingsClick}
          >
            <Settings className="mr-2 h-4 w-4" />
            Workspace Settings
          </Button>
        </div>
      )}
    </div>
  );
}
