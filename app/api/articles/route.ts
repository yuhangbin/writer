import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/articles - List all articles (optionally filtered by workspace)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    const where: {
      workspace: { userId: string; isDeleted: boolean };
      workspaceId?: string;
      isDeleted: boolean;
    } = {
      workspace: { userId: user.id, isDeleted: false },
      isDeleted: false,
    };

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    const articles = await prisma.article.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Get articles error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/articles - Create a new article
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { workspaceId, title, content, prompt } = body;

    // Validation
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    // Check if workspace exists and belongs to user
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId: user.id,
        isDeleted: false,
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Calculate word count
    const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;

    const article = await prisma.article.create({
      data: {
        workspaceId,
        title: title?.trim() || 'Untitled Article',
        content: content || null,
        prompt: prompt?.trim() || null,
        wordCount,
      },
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error('Create article error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
