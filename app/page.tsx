'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { UserProfileHeader } from '@/components/layout/UserProfileHeader';
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar';
import { WorkspaceSettings } from '@/components/workspace/WorkspaceSettings';
import { InputBar } from '@/components/input-bar/InputBar';
import { CreativeZone } from '@/components/creative-zone/CreativeZone';
import type { ExportFormat, Workspace, Article } from '@/types';
import { calculateWordCount, generateTitleFromPrompt } from '@/lib/utils';
import { DEFAULT_MODEL_ID, getModelById } from '@/lib/ai-models';
import { useAuth } from '@/hooks/use-auth';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { useArticles } from '@/hooks/use-articles';

export default function Home() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();

  const {
    workspaces,
    loading: workspacesLoading,
    fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace: deleteWorkspaceApi,
    getWorkspace,
  } = useWorkspaces();

  const {
    articles,
    loading: articlesLoading,
    createArticle,
    updateArticle,
    deleteArticle: deleteArticleApi,
    fetchArticles,
  } = useArticles();

  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articleTitle, setArticleTitle] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID);

  // TEMPORARILY DISABLED: Redirect to login if not authenticated
  useEffect(() => {
    // if (!authLoading && !user) {
    //   router.push('/login');
    // } else if (!authLoading && user) {
    //   // Fetch workspaces only when authenticated
    //   fetchWorkspaces();
    // }
    // Fetch workspaces for testing
    fetchWorkspaces();
  }, [user, authLoading, router, fetchWorkspaces]);

  // Load articles when workspace changes
  useEffect(() => {
    if (currentWorkspaceId) {
      fetchArticles(currentWorkspaceId);
    }
  }, [currentWorkspaceId, fetchArticles]);

  // Select first workspace and article on load
  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspaceId) {
      setCurrentWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, currentWorkspaceId]);

  // Select first article when articles load
  useEffect(() => {
    if (articles.length > 0 && !currentArticleId && currentWorkspaceId) {
      const workspaceArticles = articles.filter(a => a.workspaceId === currentWorkspaceId);
      if (workspaceArticles.length > 0) {
        setCurrentArticleId(workspaceArticles[0].id);
        setArticleContent(workspaceArticles[0].content || '');
        setArticleTitle(workspaceArticles[0].title);
      }
    }
  }, [articles, currentArticleId, currentWorkspaceId]);

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);
  const currentArticle = articles.find((a) => a.id === currentArticleId);

  // Get articles for a workspace
  const handleGetArticlesForWorkspace = useCallback(
    (workspaceId: string) => {
      return articles
        .filter((a) => a.workspaceId === workspaceId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    },
    [articles]
  );

  // Handle workspace selection
  const handleSelectWorkspace = useCallback(
    async (id: string) => {
      setCurrentWorkspaceId(id);

      // Load articles for this workspace
      await fetchArticles(id);

      // Select the first article for this workspace
      const workspaceArticles = articles.filter((a) => a.workspaceId === id);
      if (workspaceArticles.length > 0) {
        const sortedArticles = workspaceArticles.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setCurrentArticleId(sortedArticles[0].id);
        setArticleContent(sortedArticles[0].content || '');
        setArticleTitle(sortedArticles[0].title);
      } else {
        setCurrentArticleId(null);
        setArticleContent('');
        setArticleTitle('');
      }
    },
    [articles, fetchArticles]
  );

  // Handle article selection
  const handleSelectArticle = useCallback(
    (id: string) => {
      setCurrentArticleId(id);
      const article = articles.find((a) => a.id === id);
      if (article) {
        setArticleContent(article.content || '');
        setArticleTitle(article.title);
      }
    },
    [articles]
  );

  // Handle creating a new workspace
  const handleCreateWorkspace = useCallback(async () => {
    try {
      const workspace = await createWorkspace({
        name: 'New Workspace',
        targetReader: '',
        referenceExample: '',
      });
      setCurrentWorkspaceId(workspace.id);
      setArticleContent('');
      setArticleTitle('');
      setCurrentArticleId(null);
      setSettingsOpen(true);
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  }, [createWorkspace]);

  // Handle creating a new article
  const handleCreateArticle = useCallback(async () => {
    if (!currentWorkspaceId) return;

    try {
      const article = await createArticle({
        workspaceId: currentWorkspaceId,
        title: 'Untitled Article',
        content: '',
        prompt: '',
      });
      setCurrentArticleId(article.id);
      setArticleContent('');
      setArticleTitle('Untitled Article');
    } catch (error) {
      console.error('Failed to create article:', error);
    }
  }, [currentWorkspaceId, createArticle]);

  // Handle updating workspace settings
  const handleSaveWorkspaceSettings = useCallback(
    async (workspace: Workspace) => {
      try {
        await updateWorkspace(workspace.id, {
          name: workspace.name,
          targetReader: workspace.targetReader || undefined,
          referenceExample: workspace.referenceExample || undefined,
        });
      } catch (error) {
        console.error('Failed to update workspace:', error);
      }
    },
    [updateWorkspace]
  );

  // Handle deleting a workspace
  const handleDeleteWorkspace = useCallback(
    async (id: string) => {
      try {
        await deleteWorkspaceApi(id);

        if (currentWorkspaceId === id) {
          setCurrentWorkspaceId(null);
          setCurrentArticleId(null);
          setArticleContent('');
          setArticleTitle('');
        }
      } catch (error) {
        console.error('Failed to delete workspace:', error);
      }
    },
    [currentWorkspaceId, deleteWorkspaceApi]
  );

  // Handle deleting an article
  const handleDeleteArticle = useCallback(
    async (id: string) => {
      try {
        await deleteArticleApi(id);

        // If the deleted article was the current one, select another or clear
        if (currentArticleId === id && currentWorkspaceId) {
          const workspaceArticles = articles.filter(
            (a) => a.workspaceId === currentWorkspaceId && a.id !== id
          );
          if (workspaceArticles.length > 0) {
            const sortedArticles = workspaceArticles.sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            setCurrentArticleId(sortedArticles[0].id);
            setArticleContent(sortedArticles[0].content || '');
            setArticleTitle(sortedArticles[0].title);
          } else {
            setCurrentArticleId(null);
            setArticleContent('');
            setArticleTitle('');
          }
        }
      } catch (error) {
        console.error('Failed to delete article:', error);
      }
    },
    [currentArticleId, currentWorkspaceId, articles, deleteArticleApi]
  );

  // Handle input changes
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  // Handle generating content with AI
  const handleGenerate = useCallback(async () => {
    if (!inputValue.trim() || !currentWorkspaceId) {
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModelId,
          prompt: inputValue,
          options: {
            temperature: 0.7,
            maxTokens: 4000,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const { content } = await response.json();

      // Create a new article with the generated content
      const newArticle = await createArticle({
        workspaceId: currentWorkspaceId,
        title: generateTitleFromPrompt(inputValue),
        content,
        prompt: inputValue,
      });

      setCurrentArticleId(newArticle.id);
      setArticleContent(content);
      setArticleTitle(newArticle.title);
      setInputValue('');
      setIsGenerating(false);
    } catch (error) {
      console.error('Failed to generate article:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate content';
      alert(`Error: ${errorMessage}`);
      setIsGenerating(false);
    }
  }, [inputValue, currentWorkspaceId, selectedModelId, createArticle]);

  // Handle article content changes
  const handleArticleChange = useCallback(
    async (content: string) => {
      setArticleContent(content);

      // Auto-save article content
      if (currentArticleId) {
        try {
          await updateArticle(currentArticleId, { content });
        } catch (error) {
          console.error('Failed to save article:', error);
        }
      }
    },
    [currentArticleId, updateArticle]
  );

  // Handle article title changes
  const handleTitleChange = useCallback(
    async (title: string) => {
      setArticleTitle(title);

      // Auto-save article title
      if (currentArticleId) {
        try {
          await updateArticle(currentArticleId, { title });
        } catch (error) {
          console.error('Failed to save article title:', error);
        }
      }
    },
    [currentArticleId, updateArticle]
  );

  // Handle export (placeholder)
  const handleExport = useCallback((format: ExportFormat) => {
    console.log('Exporting as:', format);
    // The actual export is handled in the ExportDialog component
  }, []);

  // Show loading state while checking auth
  // if (authLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-muted-foreground">Loading...</div>
  //     </div>
  //   );
  // }

  // TEMPORARILY DISABLED: Don't render if not authenticated
  // if (!user) {
  //   return null;
  // }

  // Show loading for workspaces
  if (workspacesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading workspaces...</div>
      </div>
    );
  }

  return (
    <>
      <MainLayout
        sidebar={
          <WorkspaceSidebar
            workspaces={workspaces}
            currentWorkspaceId={currentWorkspaceId}
            onSelectWorkspace={handleSelectWorkspace}
            onCreateWorkspace={handleCreateWorkspace}
            onSettingsClick={() => setSettingsOpen(true)}
            onDeleteWorkspace={handleDeleteWorkspace}
            getArticlesForWorkspace={handleGetArticlesForWorkspace}
            currentArticleId={currentArticleId}
            onSelectArticle={handleSelectArticle}
            onDeleteArticle={handleDeleteArticle}
            onCreateArticle={handleCreateArticle}
          />
        }
        inputBar={
          <InputBar
            value={inputValue}
            onChange={handleInputChange}
            onGenerate={handleGenerate}
            isLoading={isGenerating}
            selectedModelId={selectedModelId}
            onModelChange={setSelectedModelId}
          />
        }
        creativeZone={
          <CreativeZone
            content={articleContent}
            onChange={handleArticleChange}
            onTitleChange={handleTitleChange}
            onExport={handleExport}
            hasWorkspace={!!currentWorkspaceId}
            articleTitle={articleTitle}
          />
        }
        userProfile={
          <UserProfileHeader
            user={user}
            onLogout={logout}
            onSettingsClick={() => setSettingsOpen(true)}
          />
        }
      />

      {/* Workspace Settings Dialog */}
      <WorkspaceSettings
        workspace={currentWorkspace || null}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSave={handleSaveWorkspaceSettings}
      />
    </>
  );
}
