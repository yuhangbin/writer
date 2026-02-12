'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Article } from '@/types';

export interface UseArticlesReturn {
  articles: Article[];
  loading: boolean;
  error: string | null;
  fetchArticles: (workspaceId?: string) => Promise<void>;
  createArticle: (data: {
    workspaceId: string;
    title?: string;
    content?: string;
    prompt?: string;
  }) => Promise<Article>;
  updateArticle: (
    id: string,
    data: { title?: string; content?: string; prompt?: string }
  ) => Promise<Article>;
  deleteArticle: (id: string) => Promise<void>;
  getArticle: (id: string) => Promise<Article>;
}

export function useArticles(): UseArticlesReturn {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async (workspaceId?: string) => {
    setError(null);
    setLoading(true);
    try {
      const url = workspaceId
        ? `/api/articles?workspaceId=${workspaceId}`
        : '/api/articles';
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch articles');
      }

      setArticles(data.articles);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch articles';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createArticle = async (data: {
    workspaceId: string;
    title?: string;
    content?: string;
    prompt?: string;
  }): Promise<Article> => {
    setError(null);
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create article');
      }

      const article = responseData.article;
      setArticles((prev) => [article, ...prev]);
      return article;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create article';
      setError(message);
      throw err;
    }
  };

  const updateArticle = async (
    id: string,
    data: { title?: string; content?: string; prompt?: string }
  ): Promise<Article> => {
    setError(null);
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update article');
      }

      const article = responseData.article;
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? article : a))
      );
      return article;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update article';
      setError(message);
      throw err;
    }
  };

  const deleteArticle = async (id: string): Promise<void> => {
    setError(null);
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete article');
      }

      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete article';
      setError(message);
      throw err;
    }
  };

  const getArticle = async (id: string): Promise<Article> => {
    setError(null);
    try {
      const response = await fetch(`/api/articles/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch article');
      }

      return data.article;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch article';
      setError(message);
      throw err;
    }
  };

  return {
    articles,
    loading,
    error,
    fetchArticles,
    createArticle,
    updateArticle,
    deleteArticle,
    getArticle,
  };
}
