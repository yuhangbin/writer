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
    deleteWorkspace,
    getWorkspace,
  } = useWorkspaces();

  const {
    articles,
    loading: articlesLoading,
    createArticle,
    updateArticle,
    deleteArticle,
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user) {
      // Fetch workspaces only when authenticated
      fetchWorkspaces();
    }
  }, [user, authLoading, router, fetchWorkspaces]);

  // Load articles when workspace changes
  useEffect(() => {
    if (currentWorkspaceId) {
      fetchArticles(currentWorkspaceId);
    }
  }, [currentWorkspaceId, fetchArticles]);

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

  // Handle workspace selection
  const handleSelectWorkspace = useCallback(
    async (id: string) => {
      setCurrentWorkspaceId(id);

      // Load articles for this workspace
      await fetchArticles(id);

      // Select first article for this workspace
      const workspaceArticles = articles.filter(a => a.workspaceId === id);
      if (workspaceArticles.length > 0) {
        setCurrentArticleId(workspaceArticles[0].id);
        setArticleContent(workspaceArticles[0].content || '');
        setArticleTitle(workspaceArticles[0].title);
      }
    },
    [currentWorkspaceId]
  );

  const handleSelectArticle = useCallback(
    (id: string) => {
      setCurrentArticleId(id);
      const article = articles.find(a => a.id === id);
      if (article) {
        setArticleContent(article.content || '');
        setArticleTitle(article.title);
      }
    },
    [articles]
  );

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
    },
    [createWorkspace]
  );

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
    [currentWorkspaceId, updateWorkspace]
  );

  const handleDeleteWorkspace = useCallback(
    async (id: string) => {
      try {
        await deleteWorkspace(id);

        // Clear current workspace if deleted
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
    [currentWorkspaceId, deleteWorkspace]
  );

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  // Handle generating content with AI
  const handleGenerate = useCallback(async () => {
    if (!inputValue.trim() || !currentWorkspaceId) return;

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

      const data = await response.json();
      setArticleContent(data.content || '');
      setArticleTitle(generateTitleFromPrompt(inputValue));
      setInputValue('');
    } catch (error) {
        console.error('Failed to generate article:', error);
        const errorMessage = error instanceof Error ? error.message : 'Generation failed';
        alert(`Error: ${errorMessage}`);
      } finally {
        setIsGenerating(false);
      }
    },
    [inputValue, currentWorkspaceId, selectedModelId, createArticle]
  );

  const handleArticleChange = useCallback(
    async (content: string) => {
      setArticleContent(content);
      if (currentArticleId) {
        await updateArticle(currentArticleId, { content });
      }
    },
    [currentArticleId, updateArticle]
  );

  const handleTitleChange = useCallback(
    async (title: string) => {
      setArticleTitle(title);
      if (currentArticleId) {
        await updateArticle(currentArticleId, { title });
      }
    },
    [currentArticleId, updateArticle]
  );

  // Handle export functionality
  const handleExport = useCallback((format: ExportFormat) => {
    if (!articleContent) return;

    let content = articleContent;
    let filename = `${articleTitle || 'untitled'}`;
    let mimeType = 'text/plain';

    switch (format) {
      case 'markdown':
        filename += '.md';
        mimeType = 'text/markdown';
        break;
      case 'html':
        filename += '.html';
        mimeType = 'text/html';
        break;
      case 'plain':
        filename += '.txt';
        mimeType = 'text/plain';
        break;
    }

    // Create blob and download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [articleContent, articleTitle]);

  // Get articles for a workspace
  const handleGetArticlesForWorkspace = useCallback(
    (workspaceId: string) => {
      return articles.filter(a => a.workspaceId === workspaceId);
    },
    [articles]
  );

  // Create a new article
  const handleCreateArticle = useCallback(async (workspaceId?: string) => {
    const targetWorkspaceId = workspaceId || currentWorkspaceId;
    if (!targetWorkspaceId) return;

    try {
      const newArticle = await createArticle({
        workspaceId: targetWorkspaceId,
        title: 'Untitled Article',
        content: '',
      });
      setCurrentArticleId(newArticle.id);
      setArticleContent('');
      setArticleTitle('Untitled Article');
    } catch (error) {
      console.error('Failed to create article:', error);
    }
  }, [currentWorkspaceId, createArticle]);

  // Delete an article
  const handleDeleteArticle = useCallback(async (articleId: string) => {
    try {
      await deleteArticle(articleId);

      // If deleted article was current one, select another or clear
      if (currentArticleId === articleId) {
        const workspaceArticles = articles.filter(a => a.workspaceId === currentWorkspaceId);
        if (workspaceArticles.length > 0) {
          setCurrentArticleId(workspaceArticles[0].id);
          setArticleContent(workspaceArticles[0].content || '');
          setArticleTitle(workspaceArticles[0].title);
        } else {
          setCurrentArticleId(null);
          setArticleContent('');
          setArticleTitle('');
        }
      }
    } catch (error) {
      console.error('Failed to delete article:', error);
    }
  }, [currentArticleId, currentWorkspaceId, articles, deleteArticle]);

  // Auto-save article content
  useEffect(() => {
    const saveArticle = async () => {
      if (currentArticleId) {
        try {
          await updateArticle(currentArticleId, { content: articleContent });
        } catch (error) {
          console.error('Failed to save article:', error);
        }
      }
    };

    saveArticle();
  }, [articleContent, currentArticleId, updateArticle]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

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
            onSettingsClick={(workspaceId) => {
              setCurrentWorkspaceId(workspaceId);
              setSettingsOpen(true);
            }}
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
            onExport={handleExport}
            hasWorkspace={!!currentWorkspaceId}
            articleTitle={articleTitle}
            onTitleChange={handleTitleChange}
          />
        }
        userProfile={
          <UserProfileHeader
            user={user}
            onLogout={logout}
          />
        }
      />
      {settingsOpen && (
        <WorkspaceSettings
          workspace={workspaces.find((w) => w.id === currentWorkspaceId) || null}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          onSave={handleSaveWorkspaceSettings}
          onDeleteWorkspace={handleDeleteWorkspace}
        />
      )}
    </>
  );
}
