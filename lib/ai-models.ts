import type { AIModel } from '@/types';

// Model list - Update model IDs to match your unified API provider
// These IDs should match what your API provider expects
export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'deepseek-v3.2',
    provider: 'deepseek',
    name: 'DeepSeek V3.2',
    description: 'Advanced reasoning and generation',
    maxTokens: 64000,
  },
  {
    id: 'gemini-3-flash',
    provider: 'google',
    name: 'Gemini 3 Flash',
    description: 'Fast and efficient for most tasks',
    maxTokens: 1000000,
  },
  {
    id: 'kimi-k2.5',
    provider: 'kimi',
    name: 'Kimi K2.5',
    description: 'Long context understanding',
    maxTokens: 128000,
  },
  // Add more models as needed
  // Example:
  // {
  //   id: 'gpt-4o',
  //   provider: 'openai',
  //   name: 'GPT-4o',
  //   description: 'OpenAI most capable model',
  //   maxTokens: 128000,
  // },
];

export const DEFAULT_MODEL_ID = 'deepseek-v3.2';

// Get model by ID
export function getModelById(id: string): AIModel | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === id);
}
