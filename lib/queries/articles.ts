import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE_TAGS, CACHE_CONFIG } from '@/lib/cache'
import type { Article } from '@/types'

/**
 * Get all articles for a user across all workspaces (cached)
 */
export const getCachedArticles = unstable_cache(
  async (userId: string) => {
    const articles = await prisma.article.findMany({
      where: {
        workspace: { userId },
        isDeleted: false,
      },
      orderBy: { updatedAt: 'desc' },
    })
    return articles
  },
  ['articles'],
  {
    tags: [...CACHE_TAGS.ARTICLES],
    revalidate: CACHE_CONFIG.ARTICLES.revalidate,
  }
)

/**
 * Get articles for a specific workspace (cached with workspace-specific tag)
 */
export const getCachedArticlesByWorkspace = unstable_cache(
  async (workspaceId: string, userId: string) => {
    const articles = await prisma.article.findMany({
      where: {
        workspaceId,
        workspace: { userId },
        isDeleted: false,
      },
      orderBy: { updatedAt: 'desc' },
    })
    return articles
  },
  ['articles-by-workspace'],
  {
    tags: [...CACHE_TAGS.ARTICLES],
    revalidate: CACHE_CONFIG.ARTICLES.revalidate,
  }
)

/**
 * Get a single article by ID (not cached, used for specific lookups)
 */
export async function getArticleById(articleId: string) {
  return prisma.article.findUnique({
    where: { id: articleId },
  })
}

/**
 * Get article with ownership check
 */
export async function getArticleWithAuth(articleId: string, userId: string) {
  return prisma.article.findFirst({
    where: {
      id: articleId,
      workspace: { userId },
      isDeleted: false,
    },
  })
}
