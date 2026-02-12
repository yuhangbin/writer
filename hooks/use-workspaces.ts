'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Workspace } from '@/types';

export interface UseWorkspacesReturn {
  workspaces: Workspace[];
  loading: boolean;
  error: string | null;
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (data: {
    name: string;
    targetReader?: string;
    referenceExample?: string;
  }) => Promise<Workspace>;
  updateWorkspace: (
    id: string,
    data: { name?: string; targetReader?: string; referenceExample?: string }
  ) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
  getWorkspace: (id: string) => Promise<Workspace>;
}

export function useWorkspaces(): UseWorkspacesReturn {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/workspaces');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch workspaces');
      }

      setWorkspaces(data.workspaces);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch workspaces';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Don't auto-fetch on mount - let the parent component decide when to fetch
  // useEffect(() => {
  //   fetchWorkspaces();
  // }, [fetchWorkspaces]);

  const createWorkspace = async (data: {
    name: string;
    targetReader?: string;
    referenceExample?: string;
  }): Promise<Workspace> => {
    setError(null);
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create workspace');
      }

      const workspace = responseData.workspace;
      setWorkspaces((prev) => [workspace, ...prev]);
      return workspace;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create workspace';
      setError(message);
      throw err;
    }
  };

  const updateWorkspace = async (
    id: string,
    data: { name?: string; targetReader?: string; referenceExample?: string }
  ): Promise<Workspace> => {
    setError(null);
    try {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update workspace');
      }

      const workspace = responseData.workspace;
      setWorkspaces((prev) =>
        prev.map((w) => (w.id === id ? workspace : w))
      );
      return workspace;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update workspace';
      setError(message);
      throw err;
    }
  };

  const deleteWorkspace = async (id: string): Promise<void> => {
    setError(null);
    try {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete workspace');
      }

      setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete workspace';
      setError(message);
      throw err;
    }
  };

  const getWorkspace = async (id: string): Promise<Workspace> => {
    setError(null);
    try {
      const response = await fetch(`/api/workspaces/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch workspace');
      }

      return data.workspace;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch workspace';
      setError(message);
      throw err;
    }
  };

  return {
    workspaces,
    loading,
    error,
    fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    getWorkspace,
  };
}
