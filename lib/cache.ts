/**
 * Cache tag constants for Next.js unstable_cache
 * Used for tag-based cache invalidation in Server Actions
 */

export const CACHE_TAGS = {
  WORKSPACES: ['workspaces'] as const,
  ARTICLES: ['articles'] as const,
  USER: (userId: string) => [`user:${userId}`] as const,
}

export type CacheTag = typeof CACHE_TAGS[keyof typeof CACHE_TAGS] | `user:${string}`

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  WORKSPACES: {
    revalidate: 60, // 60 seconds
  },
  ARTICLES: {
    revalidate: 60, // 60 seconds
  },
  USER: {
    revalidate: 300, // 5 minutes
  },
} as const
