import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE_TAGS, CACHE_CONFIG } from '@/lib/cache'
import type { Workspace } from '@/types'

/**
 * Get all workspaces for a user (cached)
 */
export const getCachedWorkspaces = unstable_cache(
  async (userId: string) => {
    const workspaces = await prisma.workspace.findMany({
      where: { userId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
    })
    return workspaces
  },
  ['workspaces'],
  {
    tags: [...CACHE_TAGS.WORKSPACES],
    revalidate: CACHE_CONFIG.WORKSPACES.revalidate,
  }
)

/**
 * Get a single workspace by ID (not cached, used for specific lookups)
 */
export async function getWorkspaceById(workspaceId: string) {
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
  })
}

/**
 * Get workspace with ownership check
 */
export async function getWorkspaceWithAuth(workspaceId: string, userId: string) {
  return prisma.workspace.findFirst({
    where: { id: workspaceId, userId, isDeleted: false },
  })
}
