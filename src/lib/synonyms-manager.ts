import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { updateIndexSettings, getIndex } from '@/lib/meilisearch-client'

/**
 * Synonym management service for MeiliSearch
 * Provides CRUD operations for synonym mappings
 */

// Types
export interface SynonymMap {
  [key: string]: string[]
}

export interface SynonymEntry {
  key: string
  terms: string[]
}

export interface SynonymsFile {
  synonyms: SynonymMap
  version: string
  lastUpdated: string
}

// Cache
let synonymsCache: { data: SynonymMap | null; timestamp: number } = {
  data: null,
  timestamp: 0,
}

// Configure cache TTL from environment variable (in seconds, default: 300 = 5 minutes)
const SYNONYMS_CACHE_TTL_MS = (() => {
  const ttlSec = process.env.SYNONYMS_CACHE_TTL ? parseInt(process.env.SYNONYMS_CACHE_TTL, 10) : 300
  return isNaN(ttlSec) ? 5 * 60 * 1000 : ttlSec * 1000
})()

// Configure synonyms file path from environment variable (default: synonyms.json in project root)
const SYNONYMS_FILE_PATH = process.env.SYNONYMS_FILE_PATH
  ? join(process.cwd(), process.env.SYNONYMS_FILE_PATH)
  : join(process.cwd(), 'synonyms.json')

/**
 * Get all synonyms from file
 * @returns Synonym map (key → array of terms)
 */
export async function getSynonyms(): Promise<SynonymMap> {
  const metadata = await getSynonymsWithMetadata()
  return metadata.synonyms
}

/**
 * Get all synonyms with metadata from file
 * @returns Object with synonyms map, lastUpdated timestamp, and version
 */
export async function getSynonymsWithMetadata(): Promise<{
  synonyms: SynonymMap
  lastUpdated?: string
  version?: string
}> {
  try {
    // Check cache
    const now = Date.now()
    if (synonymsCache.data && now - synonymsCache.timestamp < SYNONYMS_CACHE_TTL_MS) {
      return { synonyms: synonymsCache.data }
    }

    // Check if file exists
    if (!existsSync(SYNONYMS_FILE_PATH)) {
      console.log('No synonyms.json found, returning empty map')
      return { synonyms: {} }
    }

    // Read and parse file
    const fileContent = await readFile(SYNONYMS_FILE_PATH, 'utf-8')
    const parsedData: SynonymsFile = JSON.parse(fileContent)

    // Validate structure
    if (!parsedData.synonyms || typeof parsedData.synonyms !== 'object') {
      console.error('Invalid synonyms.json structure')
      return { synonyms: {} }
    }

    // Update cache
    synonymsCache = {
      data: parsedData.synonyms,
      timestamp: now,
    }

    return {
      synonyms: parsedData.synonyms,
      lastUpdated: parsedData.lastUpdated,
      version: parsedData.version,
    }
  } catch (error: any) {
    console.error('Failed to load synonyms:', error.message)
    return { synonyms: {} }
  }
}

/**
 * Add a new synonym
 * @param key - Synonym key (e.g., "téléphone")
 * @param terms - Array of synonym terms (e.g., ["smartphone", "mobile"])
 */
export async function addSynonym(key: string, terms: string[]): Promise<void> {
  // Validate key
  if (!validateSynonymKey(key)) {
    throw new Error(
      'Invalid synonym key format (lowercase, alphanumeric + spaces/hyphens, max 50 chars)'
    )
  }

  // Validate terms
  if (!validateSynonymTerms(terms)) {
    throw new Error(
      'Invalid terms (min 2, max 20, lowercase, unique, max 50 chars each)'
    )
  }

  // Normalize
  const normalizedKey = key.toLowerCase().trim()
  const normalizedTerms = terms.map((t) => t.toLowerCase().trim())

  // Load current synonyms
  const synonyms = await getSynonyms()

  // Check for duplicate key
  if (synonyms[normalizedKey]) {
    throw new Error(`Synonym key "${normalizedKey}" already exists`)
  }

  // Add new synonym
  synonyms[normalizedKey] = normalizedTerms

  // Write to file
  await writeSynonymsFile(synonyms)

  // Apply to MeiliSearch
  await applySynonymsToMeiliSearch()

  // Invalidate cache
  synonymsCache.data = null
}

/**
 * Update an existing synonym
 * @param key - Synonym key to update
 * @param terms - New array of synonym terms
 */
export async function updateSynonym(
  key: string,
  terms: string[]
): Promise<void> {
  // Validate terms
  if (!validateSynonymTerms(terms)) {
    throw new Error(
      'Invalid terms (min 2, max 20, lowercase, unique, max 50 chars each)'
    )
  }

  // Normalize
  const normalizedKey = key.toLowerCase().trim()
  const normalizedTerms = terms.map((t) => t.toLowerCase().trim())

  // Load current synonyms
  const synonyms = await getSynonyms()

  // Check key exists
  if (!synonyms[normalizedKey]) {
    throw new Error(`Synonym key "${normalizedKey}" not found`)
  }

  // Update synonym
  synonyms[normalizedKey] = normalizedTerms

  // Write to file
  await writeSynonymsFile(synonyms)

  // Apply to MeiliSearch
  await applySynonymsToMeiliSearch()

  // Invalidate cache
  synonymsCache.data = null
}

/**
 * Delete a synonym
 * @param key - Synonym key to delete
 */
export async function deleteSynonym(key: string): Promise<void> {
  // Normalize
  const normalizedKey = key.toLowerCase().trim()

  // Load current synonyms
  const synonyms = await getSynonyms()

  // Check key exists
  if (!synonyms[normalizedKey]) {
    throw new Error(`Synonym key "${normalizedKey}" not found`)
  }

  // Remove synonym
  delete synonyms[normalizedKey]

  // Write to file
  await writeSynonymsFile(synonyms)

  // Apply to MeiliSearch
  await applySynonymsToMeiliSearch()

  // Invalidate cache
  synonymsCache.data = null
}

/**
 * Apply synonyms to MeiliSearch
 * Merges synonyms.json with meilisearch.config.json
 */
export async function applySynonymsToMeiliSearch(): Promise<void> {
  try {
    // Get synonyms from file
    const fileSynonyms = await getSynonyms()

    // Get config synonyms (if any)
    let configSynonyms: SynonymMap = {}
    try {
      const configPath = join(process.cwd(), 'meilisearch.config.json')
      if (existsSync(configPath)) {
        const configContent = await readFile(configPath, 'utf-8')
        const config = JSON.parse(configContent)
        if (config.indexes?.products?.synonyms) {
          configSynonyms = config.indexes.products.synonyms
        }
      }
    } catch (error: any) {
      console.warn('Could not load config synonyms:', error.message)
    }

    // Merge (file takes precedence)
    const mergedSynonyms = { ...configSynonyms, ...fileSynonyms }

    // Apply to MeiliSearch
    await updateIndexSettings('products', { synonyms: mergedSynonyms })

    console.log(
      `✅ Applied ${Object.keys(mergedSynonyms).length} synonym groups to MeiliSearch`
    )
  } catch (error: any) {
    console.error('Failed to apply synonyms to MeiliSearch:', error.message)
    throw new Error('Failed to sync synonyms with MeiliSearch')
  }
}

/**
 * Validate synonym key format
 * @param key - Key to validate
 * @returns true if valid
 */
export function validateSynonymKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false
  if (key.length < 1 || key.length > 50) return false

  // Lowercase, alphanumeric (including French), spaces, hyphens
  const regex = /^[a-zà-ÿ0-9\s-]+$/
  return regex.test(key.toLowerCase())
}

/**
 * Validate synonym terms array
 * @param terms - Terms to validate
 * @returns true if valid
 */
export function validateSynonymTerms(terms: string[]): boolean {
  if (!Array.isArray(terms)) return false
  if (terms.length < 2 || terms.length > 20) return false

  // Check each term
  for (const term of terms) {
    if (!term || typeof term !== 'string') return false
    if (term.length < 1 || term.length > 50) return false
  }

  // Check for duplicates (case-insensitive)
  const normalized = terms.map((t) => t.toLowerCase().trim())
  const uniqueSet = new Set(normalized)
  if (uniqueSet.size !== normalized.length) return false

  // All terms must be lowercase
  for (const term of terms) {
    if (term !== term.toLowerCase()) return false
  }

  return true
}

/**
 * Write synonyms to file
 * @param synonyms - Synonym map to write
 */
async function writeSynonymsFile(synonyms: SynonymMap): Promise<void> {
  try {
    const data: SynonymsFile = {
      synonyms,
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
    }

    await writeFile(SYNONYMS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8')

    console.log(`✅ Wrote ${Object.keys(synonyms).length} synonyms to file`)
  } catch (error: any) {
    console.error('Failed to write synonyms file:', error.message)
    throw new Error('Failed to save synonyms to file')
  }
}
