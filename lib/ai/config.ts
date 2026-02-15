// Simple OpenAI-compatible API client
// Uses direct fetch to work with any OpenAI-compatible API provider

const BASE_URL = process.env.UNIFIED_API_BASE_URL || 'https://api.openai.com/v1';
const API_KEY = process.env.UNIFIED_API_KEY || '';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generate text using OpenAI-compatible API (non-streaming)
 */
export async function generateTextDirect(
  modelId: string,
  prompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  } = {},
  systemMessage?: string
): Promise<{
  text: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  finishReason: string;
}> {
  const messages: ChatMessage[] = systemMessage
    ? [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt },
      ]
    : [{ role: 'user', content: prompt }];

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4000,
      top_p: options.topP,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error (${response.status}): ${error}`);
  }

  const data: ChatCompletionResponse = await response.json();
  const choice = data.choices[0];

  return {
    text: choice.message.content,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
    finishReason: choice.finish_reason,
  };
}

/**
 * Stream text generation using OpenAI-compatible API
 */
export async function* streamTextDirect(
  modelId: string,
  prompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  } = {},
  systemMessage?: string
): AsyncGenerator<{
  type: 'text' | 'finish';
  content?: string;
  done: boolean;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  error?: string;
}> {
  const messages: ChatMessage[] = systemMessage
    ? [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt },
      ]
    : [{ role: 'user', content: prompt }];

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4000,
      top_p: options.topP,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    yield {
      type: 'finish',
      done: true,
      error: `API error (${response.status}): ${error}`,
    };
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    yield {
      type: 'finish',
      done: true,
      error: 'No response body',
    };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(5).trim();
          if (data === '[DONE]') {
            yield {
              type: 'finish',
              done: true,
            };
            break;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            const finishReason = parsed.choices?.[0]?.finish_reason;
            const usage = parsed.usage;

            if (content) {
              yield {
                type: 'text',
                content,
                done: false,
              };
            }

            if (finishReason || usage) {
              yield {
                type: 'finish',
                done: true,
                usage: usage ? {
                  promptTokens: usage.prompt_tokens,
                  completionTokens: usage.completion_tokens,
                  totalTokens: usage.total_tokens,
                } : undefined,
              };
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    yield {
      type: 'finish',
      done: true,
      error: error instanceof Error ? error.message : 'Stream error',
    };
  }
}
