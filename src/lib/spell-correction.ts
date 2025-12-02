import { prisma } from '@/lib/prisma'

/**
 * Result of a spell correction operation
 */
export interface SpellCorrectionResult {
  correctedQuery: string
  originalQuery: string
  confidence: number
  source: 'product' | 'category' | 'tag'
}

/**
 * Get the spell correction threshold from environment variables
 * @returns Threshold value between 0.0 and 1.0
 */
function getSpellCorrectionThreshold(): number {
  const envValue = process.env.SEARCH_SPELL_CORRECTION_THRESHOLD

  if (!envValue) {
    return 0.4 // Default threshold (higher than autocomplete for quality)
  }

  const threshold = parseFloat(envValue)

  // Validate range
  if (isNaN(threshold) || threshold < 0 || threshold > 1) {
    console.warn(
      `Invalid SEARCH_SPELL_CORRECTION_THRESHOLD: ${envValue}. Using default 0.4`
    )
    return 0.4
  }

  // Warn about extreme values
  if (threshold < 0.3) {
    console.warn(
      `SEARCH_SPELL_CORRECTION_THRESHOLD is very low (${threshold}). This may produce inaccurate corrections.`
    )
  }

  if (threshold > 0.7) {
    console.warn(
      `SEARCH_SPELL_CORRECTION_THRESHOLD is very high (${threshold}). This may miss valid corrections.`
    )
  }

  return threshold
}

/**
 * Get spell correction for a search query using PostgreSQL's pg_trgm extension
 *
 * This function attempts to find the best spelling correction for a query that
 * returned zero results. It searches across Product names, Category names, and
 * Tag names using trigram similarity matching.
 *
 * The algorithm:
 * 1. Query multiple tables (Product, Category, Tag) using similarity() function
 * 2. Filter results where similarity > threshold (default 0.4)
 * 3. Order by similarity score DESC
 * 4. Return the top result with highest confidence
 *
 * @param query - The original search query to correct
 * @returns Spell correction result or null if no correction found
 *
 * @example
 * const correction = await getSpellCorrection('smartphon')
 * // Returns: { correctedQuery: 'smartphone', originalQuery: 'smartphon', confidence: 0.89, source: 'product' }
 */
export async function getSpellCorrection(
  query: string
): Promise<SpellCorrectionResult | null> {
  if (!query || query.trim().length === 0) {
    return null
  }

  const threshold = getSpellCorrectionThreshold()
  const normalizedQuery = query.trim().toLowerCase()

  try {
    // Query Product names for similar terms
    const productResults = await prisma.$queryRawUnsafe<
      Array<{ name: string; similarity: number }>
    >(
      `
      SELECT
        name,
        similarity(name, $1) as similarity
      FROM "Product"
      WHERE similarity(name, $1) > $2
      ORDER BY similarity DESC
      LIMIT 1
      `,
      normalizedQuery,
      threshold
    )

    // Query Category names for similar terms
    const categoryResults = await prisma.$queryRawUnsafe<
      Array<{ name: string; similarity: number }>
    >(
      `
      SELECT
        name,
        similarity(name, $1) as similarity
      FROM "Category"
      WHERE similarity(name, $1) > $2
      ORDER BY similarity DESC
      LIMIT 1
      `,
      normalizedQuery,
      threshold
    )

    // Query Tag names for similar terms
    const tagResults = await prisma.$queryRawUnsafe<
      Array<{ name: string; similarity: number }>
    >(
      `
      SELECT
        name,
        similarity(name, $1) as similarity
      FROM "Tag"
      WHERE similarity(name, $1) > $2
      ORDER BY similarity DESC
      LIMIT 1
      `,
      normalizedQuery,
      threshold
    )

    // Combine all results and find the best match
    const allResults = [
      ...(productResults.length > 0
        ? [{ ...productResults[0], source: 'product' as const }]
        : []),
      ...(categoryResults.length > 0
        ? [{ ...categoryResults[0], source: 'category' as const }]
        : []),
      ...(tagResults.length > 0
        ? [{ ...tagResults[0], source: 'tag' as const }]
        : []),
    ]

    if (allResults.length === 0) {
      return null
    }

    // Sort by similarity and take the best match
    const bestMatch = allResults.sort((a, b) => b.similarity - a.similarity)[0]

    // Don't correct if the corrected query is the same as original (case-insensitive)
    if (bestMatch.name.toLowerCase() === normalizedQuery) {
      return null
    }

    return {
      correctedQuery: bestMatch.name,
      originalQuery: query,
      confidence: bestMatch.similarity,
      source: bestMatch.source,
    }
  } catch (error) {
    console.error('Error in spell correction:', error)
    // Return null on error to gracefully degrade
    return null
  }
}
