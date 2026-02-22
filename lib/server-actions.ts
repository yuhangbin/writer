'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CACHE_TAGS } from '@/lib/cache'
import type { Workspace, Article } from '@/types'

// ============================================================================
// Workspace Server Actions
// ============================================================================

export interface CreateWorkspaceInput {
  name: string
  targetReader?: string
  referenceExample?: string
}

export interface UpdateWorkspaceInput {
  name?: string
  targetReader?: string
  referenceExample?: string
}

export async function createWorkspace(data: CreateWorkspaceInput): Promise<{
  success: boolean
  workspace?: Workspace
  error?: string
}> {
  try {
    const user = await requireAuth()

    // Validate input
    if (!data.name?.trim()) {
      return { success: false, error: 'Name is required' }
    }

    const workspace = await prisma.workspace.create({
      data: {
        userId: user.id,
        name: data.name.trim(),
        targetReader: data.targetReader?.trim() || null,
        referenceExample: data.referenceExample?.trim() || null,
      },
    })

    // Revalidate cache
    revalidateTag(CACHE_TAGS.WORKSPACES[0], 'max')
    revalidatePath('/dashboard', 'page')

    return { success: true, workspace }
  } catch (error) {
    console.error('Create workspace error:', error)
    return { success: false, error: 'Failed to create workspace' }
  }
}

export async function updateWorkspace(
  workspaceId: string,
  data: UpdateWorkspaceInput
): Promise<{
  success: boolean
  workspace?: Workspace
  error?: string
}> {
  try {
    const user = await requireAuth()

    // Verify ownership
    const existing = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: user.id, isDeleted: false },
    })

    if (!existing) {
      return { success: false, error: 'Workspace not found' }
    }

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.targetReader !== undefined && {
          targetReader: data.targetReader.trim() || null,
        }),
        ...(data.referenceExample !== undefined && {
          referenceExample: data.referenceExample.trim() || null,
        }),
      },
    })

    // Revalidate cache
    revalidateTag(CACHE_TAGS.WORKSPACES[0], 'max')
    revalidatePath('/dashboard', 'page')

    return { success: true, workspace }
  } catch (error) {
    console.error('Update workspace error:', error)
    return { success: false, error: 'Failed to update workspace' }
  }
}

export async function deleteWorkspace(workspaceId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const user = await requireAuth()

    // Verify ownership
    const existing = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: user.id, isDeleted: false },
    })

    if (!existing) {
      return { success: false, error: 'Workspace not found' }
    }

    // Soft delete workspace
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { isDeleted: true },
    })

    // Cascade delete articles
    await prisma.article.updateMany({
      where: { workspaceId },
      data: { isDeleted: true },
    })

    // Revalidate cache
    revalidateTag(CACHE_TAGS.WORKSPACES[0], 'max')
    revalidateTag(CACHE_TAGS.ARTICLES[0], 'max')
    revalidatePath('/dashboard', 'page')

    return { success: true }
  } catch (error) {
    console.error('Delete workspace error:', error)
    return { success: false, error: 'Failed to delete workspace' }
  }
}

// ============================================================================
// Article Server Actions
// ============================================================================

export interface CreateArticleInput {
  workspaceId: string
  title?: string
  content?: string
  prompt?: string
}

export interface UpdateArticleInput {
  title?: string
  content?: string
  prompt?: string
}

export async function createArticle(data: CreateArticleInput): Promise<{
  success: boolean
  article?: Article
  error?: string
}> {
  try {
    const user = await requireAuth()

    // Verify workspace ownership
    const workspace = await prisma.workspace.findFirst({
      where: { id: data.workspaceId, userId: user.id, isDeleted: false },
    })

    if (!workspace) {
      return { success: false, error: 'Workspace not found' }
    }

    const article = await prisma.article.create({
      data: {
        workspaceId: data.workspaceId,
        title: data.title?.trim() || 'Untitled',
        content: data.content?.trim() || '',
        prompt: data.prompt?.trim() || null,
        wordCount: data.content ? calculateWordCount(data.content) : 0,
      },
    })

    // Revalidate cache
    revalidateTag(CACHE_TAGS.ARTICLES[0], 'max')
    revalidatePath('/dashboard', 'page')

    return { success: true, article }
  } catch (error) {
    console.error('Create article error:', error)
    return { success: false, error: 'Failed to create article' }
  }
}

export async function updateArticle(
  articleId: string,
  data: UpdateArticleInput
): Promise<{
  success: boolean
  article?: Article
  error?: string
}> {
  try {
    const user = await requireAuth()

    // Verify ownership
    const existing = await prisma.article.findFirst({
      where: {
        id: articleId,
        workspace: { userId: user.id },
        isDeleted: false,
      },
    })

    if (!existing) {
      return { success: false, error: 'Article not found' }
    }

    const updateData: {
      title?: string
      content?: string
      prompt?: string | null
      wordCount?: number
    } = {}

    if (data.title !== undefined) {
      updateData.title = data.title.trim()
    }

    if (data.content !== undefined) {
      updateData.content = data.content
      updateData.wordCount = calculateWordCount(data.content)
    }

    if (data.prompt !== undefined) {
      updateData.prompt = data.prompt.trim() || null
    }

    const article = await prisma.article.update({
      where: { id: articleId },
      data: updateData,
    })

    // Revalidate cache
    revalidateTag(CACHE_TAGS.ARTICLES[0], 'max')
    revalidatePath('/dashboard', 'page')

    return { success: true, article }
  } catch (error) {
    console.error('Update article error:', error)
    return { success: false, error: 'Failed to update article' }
  }
}

export async function deleteArticle(articleId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const user = await requireAuth()

    // Verify ownership
    const existing = await prisma.article.findFirst({
      where: {
        id: articleId,
        workspace: { userId: user.id },
        isDeleted: false,
      },
    })

    if (!existing) {
      return { success: false, error: 'Article not found' }
    }

    // Soft delete article
    await prisma.article.update({
      where: { id: articleId },
      data: { isDeleted: true },
    })

    // Revalidate cache
    revalidateTag(CACHE_TAGS.ARTICLES[0], 'max')
    revalidatePath('/dashboard', 'page')

    return { success: true }
  } catch (error) {
    console.error('Delete article error:', error)
    return { success: false, error: 'Failed to delete article' }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate word count from content
 */
function calculateWordCount(content: string): number {
  const text = content.trim()
  if (!text) return 0

  // Split by whitespace and count non-empty strings
  const words = text.split(/\s+/).filter(word => word.length > 0)
  return words.length
}
