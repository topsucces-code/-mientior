/**
 * SEARCH SUGGESTIONS SERVICE
 *
 * Centralized service for autocomplete suggestions with fuzzy matching
 * using PostgreSQL's pg_trgm extension.
 *
 * Features:
 * - Fuzzy text matching with similarity() and word_similarity()
 * - Tolerance for typos and spelling variations
 * - Automatic fallback to contains search
 * - Configurable similarity thresholds
 * - Performance optimized with trigram indexes
 *
 * @module search-suggestions-service
 */

import { prisma } from '@/lib/prisma';
import type { SupportedLocale } from '@/types';
import { getSearchableFields } from './i18n-search';

// ================================================================
// TYPE DEFINITIONS
// ================================================================

export interface SuggestionOptions {
  query: string;
  limit?: number;
  threshold?: number;
  useWordSimilarity?: boolean;
}

export type SuggestionType = 'product' | 'category' | 'tag' | 'keyword';

export interface Suggestion {
  type: SuggestionType;
  id: string;
  text: string;
  image?: string;
  category?: string;
  score?: number;
}

export interface SuggestionResult {
  suggestions: Suggestion[];
  metadata: {
    usedFuzzy: boolean;
    executionTime: number;
    cacheHit: boolean;
  };
}

// ================================================================
// CONFIGURATION
// ================================================================

const DEFAULT_SIMILARITY_THRESHOLD = 0.3;
const DEFAULT_WORD_SIMILARITY_THRESHOLD = 0.3;
const DEFAULT_LIMIT = 10;

// Product, category, tag distribution for suggestions
const SUGGESTION_DISTRIBUTION = {
  products: 5,
  categories: 3,
  tags: 2,
};

// Get similarity threshold from environment or use default
function getSimilarityThreshold(): number {
  const envThreshold = process.env.SEARCH_SIMILARITY_THRESHOLD;

  if (!envThreshold) {
    return DEFAULT_SIMILARITY_THRESHOLD;
  }

  const threshold = parseFloat(envThreshold);

  // Validate threshold is between 0 and 1
  if (isNaN(threshold) || threshold < 0 || threshold > 1) {
    console.warn(
      `[search-suggestions] Invalid SEARCH_SIMILARITY_THRESHOLD: ${envThreshold}. Using default: ${DEFAULT_SIMILARITY_THRESHOLD}`
    );
    return DEFAULT_SIMILARITY_THRESHOLD;
  }

  // Warn if threshold is too low or too high
  if (threshold < 0.2) {
    console.warn(
      `[search-suggestions] SEARCH_SIMILARITY_THRESHOLD (${threshold}) is very low. This may return too many irrelevant results.`
    );
  } else if (threshold > 0.5) {
    console.warn(
      `[search-suggestions] SEARCH_SIMILARITY_THRESHOLD (${threshold}) is very high. This may return too few results.`
    );
  }

  return threshold;
}

// Get word similarity threshold from environment or use default
function getWordSimilarityThreshold(): number {
  const envThreshold = process.env.SEARCH_WORD_SIMILARITY_THRESHOLD;

  if (!envThreshold) {
    return DEFAULT_WORD_SIMILARITY_THRESHOLD;
  }

  const threshold = parseFloat(envThreshold);

  if (isNaN(threshold) || threshold < 0 || threshold > 1) {
    console.warn(
      `[search-suggestions] Invalid SEARCH_WORD_SIMILARITY_THRESHOLD: ${envThreshold}. Using default: ${DEFAULT_WORD_SIMILARITY_THRESHOLD}`
    );
    return DEFAULT_WORD_SIMILARITY_THRESHOLD;
  }

  return threshold;
}

// ================================================================
// MAIN FUNCTION
// ================================================================

/**
 * Get search suggestions with fuzzy matching
 *
 * @param options - Query options
 * @returns Promise with suggestions and metadata
 */
export async function getSuggestions(
  options: SuggestionOptions,
  locale?: SupportedLocale
): Promise<SuggestionResult> {
  const startTime = Date.now();
  const { 
    query, 
    limit = DEFAULT_LIMIT, 
    threshold,
    useWordSimilarity = false 
  } = options;

  // Validate query length
  if (!query || query.trim().length < 2) {
    return {
      suggestions: [],
      metadata: {
        usedFuzzy: false,
        executionTime: Date.now() - startTime,
        cacheHit: false,
      },
    };
  }

  const trimmedQuery = query.trim();

  try {
    // Try fuzzy search with pg_trgm first
    const suggestions = await searchWithTrigram(
      trimmedQuery,
      limit,
      threshold ?? getSimilarityThreshold(),
      getWordSimilarityThreshold(),
      useWordSimilarity,
      locale
    );

    return {
      suggestions,
      metadata: {
        usedFuzzy: true,
        executionTime: Date.now() - startTime,
        cacheHit: false, // Will be set by API layer
      },
    };
  } catch (error) {
    // Log error and fallback to contains search
    console.error('[search-suggestions] Trigram search failed, using fallback:', error);

    const suggestions = await searchWithContains(trimmedQuery, limit, locale);

    return {
      suggestions,
      metadata: {
        usedFuzzy: false,
        executionTime: Date.now() - startTime,
        cacheHit: false,
      },
    };
  }
}

// ================================================================
// TRIGRAM FUZZY SEARCH
// ================================================================

/**
 * Search with pg_trgm similarity and word_similarity
 */
async function searchWithTrigram(
  query: string,
  limit: number,
  similarityThreshold: number,
  wordSimilarityThreshold: number,
  useWordSimilarity: boolean,
  locale?: SupportedLocale
): Promise<Suggestion[]> {
  const searchPattern = `%${query}%`;
  const effectiveLocale = locale || 'fr';
  const fields = getSearchableFields(effectiveLocale);

  // Use COALESCE for locale-aware field selection
  const nameField = effectiveLocale === 'en' ? `COALESCE(name_en, name)` : 'name';

  // Construct the score expression based on whether word_similarity is enabled
  const scoreExpression = useWordSimilarity
    ? `GREATEST(similarity(${nameField}, $1), word_similarity($1, ${nameField}))`
    : `similarity(${nameField}, $1)`;

  // Construct the WHERE clause based on whether word_similarity is enabled
  const whereClause = useWordSimilarity
    ? `(similarity(${nameField}, $1) > $2 OR word_similarity($1, ${nameField}) > $3 OR ${nameField} ILIKE $4)`
    : `(similarity(${nameField}, $1) > $2 OR ${nameField} ILIKE $4)`;

  // Query products with similarity scoring
  const productResults = await prisma.$queryRawUnsafe<
    Array<{ id: string; name: string; score: number; image: string | null; categoryId: string | null }>
  >(`
    SELECT
      id::text,
      name,
      ${scoreExpression} as score,
      image,
      "categoryId"::text
    FROM "Product"
    WHERE ${whereClause}
    ORDER BY score DESC
    LIMIT ${SUGGESTION_DISTRIBUTION.products}
  `, query, similarityThreshold, wordSimilarityThreshold, searchPattern);

  // Query categories with similarity scoring
  const categoryResults = await prisma.$queryRawUnsafe<
    Array<{ id: string; name: string; score: number; image: string | null }>
  >(`
    SELECT
      id::text,
      name,
      ${scoreExpression} as score,
      image
    FROM "Category"
    WHERE ${whereClause}
    ORDER BY score DESC
    LIMIT ${SUGGESTION_DISTRIBUTION.categories}
  `, query, similarityThreshold, wordSimilarityThreshold, searchPattern);

  // Query tags with similarity scoring
  const tagResults = await prisma.$queryRawUnsafe<
    Array<{ id: string; name: string; score: number }>
  >(`
    SELECT
      id::text,
      name,
      ${scoreExpression} as score
    FROM "Tag"
    WHERE ${whereClause}
    ORDER BY score DESC
    LIMIT ${SUGGESTION_DISTRIBUTION.tags}
  `, query, similarityThreshold, wordSimilarityThreshold, searchPattern);

  // Transform results to Suggestion format
  const productSuggestions: Suggestion[] = productResults.map((p) => ({
    type: 'product' as const,
    id: p.id,
    text: p.name,
    image: p.image ?? undefined,
    score: Number(p.score),
  }));

  const categorySuggestions: Suggestion[] = categoryResults.map((c) => ({
    type: 'category' as const,
    id: c.id,
    text: c.name,
    image: c.image ?? undefined,
    score: Number(c.score),
  }));

  const tagSuggestions: Suggestion[] = tagResults.map((t) => ({
    type: 'tag' as const,
    id: t.id,
    text: t.name,
    score: Number(t.score),
  }));

  // Combine and sort all suggestions by score
  const allSuggestions = [
    ...productSuggestions,
    ...categorySuggestions,
    ...tagSuggestions,
  ].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  // Add trending keywords if query is short
  const keywords = getTrendingKeywords(query);

  // Return limited results
  return [...allSuggestions, ...keywords].slice(0, limit);
}

// ================================================================
// FALLBACK CONTAINS SEARCH
// ================================================================

/**
 * Fallback search using Prisma contains (case-insensitive)
 */
async function searchWithContains(
  query: string,
  limit: number,
  locale?: SupportedLocale
): Promise<Suggestion[]> {
  const searchFilter = {
    name: {
      contains: query,
      mode: 'insensitive' as const,
    },
  };

  // Search products
  const products = await prisma.product.findMany({
    where: searchFilter,
    select: {
      id: true,
      name: true,
      images: {
        take: 1,
        select: {
          url: true
        },
        orderBy: {
          order: 'asc'
        }
      }
    },
    take: SUGGESTION_DISTRIBUTION.products,
  });

  // Search categories
  const categories = await prisma.category.findMany({
    where: searchFilter,
    select: {
      id: true,
      name: true,
      image: true,
    },
    take: SUGGESTION_DISTRIBUTION.categories,
  });

  // Search tags
  const tags = await prisma.tag.findMany({
    where: searchFilter,
    select: {
      id: true,
      name: true,
    },
    take: SUGGESTION_DISTRIBUTION.tags,
  });

  // Transform results
  const productSuggestions: Suggestion[] = products.map((p) => ({
    type: 'product' as const,
    id: p.id,
    text: p.name,
    image: p.images[0]?.url ?? undefined,
  }));

  const categorySuggestions: Suggestion[] = categories.map((c) => ({
    type: 'category' as const,
    id: c.id,
    text: c.name,
    image: c.image ?? undefined,
  }));

  const tagSuggestions: Suggestion[] = tags.map((t) => ({
    type: 'tag' as const,
    id: t.id,
    text: t.name,
  }));

  // Combine all suggestions
  const allSuggestions = [
    ...productSuggestions,
    ...categorySuggestions,
    ...tagSuggestions,
  ];

  // Add trending keywords if query is short
  const keywords = getTrendingKeywords(query);

  return [...allSuggestions, ...keywords].slice(0, limit);
}

// ================================================================
// TRENDING KEYWORDS
// ================================================================

/**
 * Get trending keywords matching the query
 * Only returns keywords if query is short (< 4 chars)
 */
function getTrendingKeywords(query: string): Suggestion[] {
  // Only suggest keywords for short queries
  if (query.length >= 4) {
    return [];
  }

  // Hardcoded trending keywords (in production, fetch from analytics)
  const trendingKeywords = [
    'smartphone',
    'laptop',
    'headphones',
    'smartwatch',
    'camera',
    'tablet',
    'gaming',
    'wireless',
    'portable',
    'bluetooth',
  ];

  // Filter keywords that match the query
  const matchingKeywords = trendingKeywords
    .filter((keyword) => keyword.toLowerCase().startsWith(query.toLowerCase()))
    .slice(0, 2) // Limit to 2 keyword suggestions
    .map((keyword) => ({
      type: 'keyword' as const,
      id: `keyword-${keyword}`,
      text: keyword,
    }));

  return matchingKeywords;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  getSuggestions,
};
