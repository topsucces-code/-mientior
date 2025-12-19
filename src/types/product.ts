/**
 * Product type definitions for components
 * Extends the main Product type from index.ts with additional component-specific properties
 */

import type { Product as BaseProduct } from './index'

/**
 * Product type for home page components (Best Sellers, Featured, Trending)
 * Uses a simplified category field (string) instead of the full Category object
 */
export interface Product extends Omit<BaseProduct, 'category' | 'images'> {
  /** Category name as a string for filtering */
  category?: string
  /** Simplified image structure for performance */
  image?: string
  images?: string[]
  /** Additional fields for Temu-style display */
  vendor?: string
  brand?: string
  salesCount?: number
  stockCount?: number
  isVerifiedSeller?: boolean
  isOfficialStore?: boolean
  freeShipping?: boolean
  deliveryDays?: number
  inStock?: boolean
  badge?: {
    text: string
    variant: 'new' | 'bestseller' | 'sale' | 'trending' | 'local'
  }
}
