import { NextRequest } from 'next/server';
import { generateArticle } from '@/lib/ai/generate';
import { NextResponse } from 'next/server';

// POST /api/ai/generate - Generate article content using AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, prompt, options, workspaceContext } = body;

    // Validation
    if (!modelId) {
      return NextResponse.json(
        { error: 'modelId is required' },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'prompt is required and must be a string' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const result = await generateArticle(
      modelId,
      prompt,
      options,
      workspaceContext  // Pass it through
    );
    const duration = Date.now() - startTime;

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate content' },
        { status: 500 }
      );
    }

    // Return generated content with metadata
    return NextResponse.json({
      content: result.content,
      usage: result.usage,
      finishReason: result.finishReason,
      duration,
      modelId,
    });
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content. Please try again.' },
      { status: 500 }
    );
  }
}
