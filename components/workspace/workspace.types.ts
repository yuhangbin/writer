import type { Workspace, Article } from '@/types';

export interface WorkspaceListProps {
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  onSelectWorkspace: (id: string) => void;
  onCreateWorkspace: () => void;
  onDeleteWorkspace: (id: string) => void;
}

export interface WorkspaceSettingsProps {
  workspace: Workspace | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (workspace: Workspace) => void;
  onDeleteWorkspace?: (id: string) => void;
}

export interface WorkspaceSidebarProps {
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  onSelectWorkspace: (id: string) => void;
  onCreateWorkspace: () => void;
  onSettingsClick: (workspaceId: string) => void;
  getArticlesForWorkspace: (workspaceId: string) => Article[];
  currentArticleId: string | null;
  onSelectArticle: (articleId: string) => void;
  onDeleteArticle: (articleId: string) => void;
  onCreateArticle: (workspaceId: string) => void;
}
