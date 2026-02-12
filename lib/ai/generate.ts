import { generateTextDirect } from './config';

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

/**
 * Generate article content (non-streaming)
 */
export async function generateArticle(
  modelId: string,
  prompt: string,
  options: GenerateOptions = {}
) {
  try {
    const { text, usage, finishReason } = await generateTextDirect(
      modelId,
      prompt,
      options
    );

    return {
      content: text,
      usage,
      finishReason,
      success: true,
    };
  } catch (error) {
    console.error('Generate article error:', error);
    return {
      content: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
