/**
 * Type definitions for the MeiliSearch indexer system
 */

export type JobType = 'index' | 'update' | 'delete' | 'reindex-all'

export interface IndexJob {
  id: string
  type: JobType
  productId?: string
  productIds?: string[]
  filters?: {
    categoryId?: string
    vendorId?: string
    status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED'
  }
  attempts: number
  createdAt: number
  error?: string
}

export interface QueueStats {
  mainQueue: number
  processingQueue: number
  failedQueue: number
  timestamp: number
}

export interface IndexResult {
  success: boolean
  productId?: string
  taskUid?: number
  error?: string
  duration?: number
}

export interface BatchIndexResult {
  total: number
  indexed: number
  failed: number
  errors: Array<{ productId: string; error: string }>
  duration: number
}

export interface MeiliSearchProductDocument {
  id: string
  name: string
  slug: string
  description: string | null
  // Multilingual fields for English support
  nameEn: string | null
  descriptionEn: string | null
  price: number
  compareAtPrice: number | null
  stock: number
  inStock: boolean
  rating: number
  reviewCount: number
  // Popularity field - auto-calculated by ranking service
  // Represents engagement score (views * weight + sales * weight)
  popularity: number
  // Final score - popularity with boost factors applied
  // Used for ranking: popularity * (1 + totalBoost%)
  // Includes: inStock (+10%), featured (+20%), rating (+rating*5%)
  finalScore: number
  featured: boolean
  onSale: boolean
  status: string
  approvalStatus: string
  categoryId: string
  categoryName: string
  vendorId: string | null
  vendorName: string | null
  tags: string[]
  colors: string[]
  sizes: string[]
  thumbnail: string | null
  createdAt: number
  updatedAt: number
}

export interface ReindexOptions {
  filters?: {
    categoryId?: string
    vendorId?: string
    status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED'
  }
  batchSize?: number
  onProgress?: (progress: { total: number; indexed: number; failed: number }) => void
  dryRun?: boolean
}

export interface WorkerConfig {
  pollInterval: number
  maxRetries: number
  backoffBase: number
  batchSize: number
  enabled: boolean
}
