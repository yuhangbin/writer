export interface Workspace {
  id: string;
  userId: string;
  name: string;
  targetReader: string | null;
  referenceExample: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Article {
  id: string;
  workspaceId: string;
  title: string;
  content: string | null;
  prompt: string | null;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// AI Provider type - can be extended
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'kimi';

// Individual AI model definition
export interface AIModel {
  id: string;                // e.g., 'gpt-4', 'claude-3-5-sonnet'
  provider: AIProvider;       // Which provider this model belongs to
  name: string;              // Display name: 'GPT-4', 'Claude 3.5 Sonnet'
  description?: string;       // Optional description
  maxTokens?: number;        // Max context length
}

// Configuration for each provider (for API keys later)
export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
}

export interface AppSettings {
  selectedModelId: string;        // Currently selected model ID
  providerConfigs: Record<AIProvider, ProviderConfig>;
}

export interface AppState {
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  currentArticleId: string | null;
  articles: Article[];
  selectedModelId: string;        // Currently selected AI model
}

export type ExportFormat = 'markdown' | 'html' | 'plain';

export interface EditorContent {
  html: string;
  text: string;
  markdown: string;
}
