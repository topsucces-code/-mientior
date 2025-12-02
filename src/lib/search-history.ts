import { prisma } from '@/lib/prisma'
import type { SearchHistoryEntry } from '@/types'

/**
 * Maximum number of search history entries per user
 */
const parsedMaxEntries = parseInt(
  process.env.SEARCH_HISTORY_MAX_ENTRIES || '10',
  10
)

// Validate parsed value and fall back to default if invalid
const MAX_HISTORY_ENTRIES =
  Number.isFinite(parsedMaxEntries) && parsedMaxEntries > 0
    ? parsedMaxEntries
    : 10

// Log warning if configured value is invalid
if (
  process.env.SEARCH_HISTORY_MAX_ENTRIES &&
  (!Number.isFinite(parsedMaxEntries) || parsedMaxEntries <= 0)
) {
  console.warn(
    `Invalid SEARCH_HISTORY_MAX_ENTRIES value: "${process.env.SEARCH_HISTORY_MAX_ENTRIES}". Using default: 10`
  )
}

/**
 * Normalize search query (trim and lowercase)
 */
function normalizeQuery(query: string): string {
  return query.trim().toLowerCase()
}

/**
 * Add a search query to user's history
 * - Deduplicates by updating timestamp if normalized query exists
 * - Preserves original query casing for display
 * - Enforces max 10 entries limit
 * - Uses transactions for atomicity
 */
export async function addSearchHistory(
  userId: string,
  query: string
): Promise<void> {
  const trimmedQuery = query.trim()
  const normalizedQuery = normalizeQuery(query)

  if (!normalizedQuery) {
    return
  }

  await prisma.$transaction(async (tx) => {
    // Check if normalized query already exists for this user
    const existing = await tx.searchHistory.findFirst({
      where: {
        userId,
        normalizedQuery,
      },
    })

    if (existing) {
      // Update timestamp and original query (to preserve latest casing) to move to top
      await tx.searchHistory.update({
        where: { id: existing.id },
        data: {
          timestamp: new Date(),
          query: trimmedQuery, // Update to latest casing
        },
      })
    } else {
      // Check if user has reached max entries
      const count = await tx.searchHistory.count({
        where: { userId },
      })

      if (count >= MAX_HISTORY_ENTRIES) {
        // Delete oldest entry
        const oldest = await tx.searchHistory.findFirst({
          where: { userId },
          orderBy: { timestamp: 'asc' },
        })

        if (oldest) {
          await tx.searchHistory.delete({
            where: { id: oldest.id },
          })
        }
      }

      // Create new entry with both original and normalized query
      await tx.searchHistory.create({
        data: {
          userId,
          query: trimmedQuery,
          normalizedQuery,
        },
      })
    }
  })
}

/**
 * Get user's search history ordered by timestamp (newest first)
 */
export async function getSearchHistory(
  userId: string,
  limit: number = MAX_HISTORY_ENTRIES
): Promise<SearchHistoryEntry[]> {
  const history = await prisma.searchHistory.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: limit,
    select: {
      query: true,
      timestamp: true,
    },
  })

  return history
}

/**
 * Delete search history
 * - If query provided: delete specific entry
 * - If query not provided: clear all history for user
 */
export async function deleteSearchHistory(
  userId: string,
  query?: string
): Promise<void> {
  if (query) {
    const normalizedQuery = normalizeQuery(query)
    await prisma.searchHistory.deleteMany({
      where: {
        userId,
        normalizedQuery,
      },
    })
  } else {
    // Clear all history
    await prisma.searchHistory.deleteMany({
      where: { userId },
    })
  }
}

