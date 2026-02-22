import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE_TAGS, CACHE_CONFIG } from '@/lib/cache'

type UserResult = {
  id: string
  username: string
  email: string | null
  aiModelPreference: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Get cached user by ID
 */
export const getCachedUser = unstable_cache(
  async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        aiModelPreference: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    return user
  },
  ['user'],
  {
    tags: [...CACHE_TAGS.USER('current')],
    revalidate: CACHE_CONFIG.USER.revalidate,
  }
)

/**
 * Get user by username (for auth checks, not cached)
 */
export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      email: true,
      passwordHash: true,
      aiModelPreference: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  userId: string,
  data: { aiModelPreference?: string }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      username: true,
      email: true,
      aiModelPreference: true,
      updatedAt: true,
    },
  })
}
