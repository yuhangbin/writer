import { generateTextDirect } from './config';
import { buildPrompt, WorkspaceContext } from './prompt-builder';

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
  options: GenerateOptions = {},
  workspaceContext?: WorkspaceContext
) {
  try {
    // Build enhanced prompt with workspace context
    const { system, user: enhancedPrompt } = buildPrompt(prompt, workspaceContext);

    const { text, usage, finishReason } = await generateTextDirect(
      modelId,
      enhancedPrompt,
      options,
      system  // Pass system message
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
