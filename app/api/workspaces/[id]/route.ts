import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/workspaces/[id] - Get a single workspace
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const workspace = await prisma.workspace.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error('Get workspace error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/workspaces/[id] - Update a workspace
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, targetReader, referenceExample } = body;

    // Check if workspace exists and belongs to user
    const existingWorkspace = await prisma.workspace.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingWorkspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Update workspace
    const updateData: {
      name?: string;
      targetReader?: string | null;
      referenceExample?: string | null;
    } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Workspace name must be a non-empty string' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (targetReader !== undefined) {
      updateData.targetReader = targetReader?.trim() || null;
    }

    if (referenceExample !== undefined) {
      updateData.referenceExample = referenceExample?.trim() || null;
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error('Update workspace error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[id] - Delete a workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if workspace exists and belongs to user
    const existingWorkspace = await prisma.workspace.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingWorkspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Delete workspace (cascade will delete associated articles)
    await prisma.workspace.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error('Delete workspace error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
