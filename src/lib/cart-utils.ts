/**
 * Cart utility functions for creating and managing CartItem objects
 */

import type { CartItem, Product, ProductVariant } from '@/types'

interface CreateCartItemParams {
  product: Product
  variant?: ProductVariant | null
  quantity?: number
}

/**
 * Creates a properly formatted CartItem from product data
 * Always sets inStock based on stock > 0 and populates all optional fields
 */
export function createCartItem({
  product,
  variant = null,
  quantity = 1,
}: CreateCartItemParams): CartItem {
  const effectiveStock = variant?.stock ?? product.stock
  const effectivePrice = variant?.priceModifier
    ? product.price + variant.priceModifier
    : product.price

  return {
    id: variant ? `${product.id}-${variant.id}` : product.id,
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
    productImage: product.images[0]?.url || '/placeholder-product.jpg',
    price: effectivePrice,
    quantity,
    variant: variant
      ? {
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
        }
      : undefined,
    stock: effectiveStock,
    badge: product.badge,
    freeShipping: product.shippingInfo?.freeShippingThreshold
      ? effectivePrice >= product.shippingInfo.freeShippingThreshold
      : false,
    inStock: effectiveStock > 0,
    maxQuantity: effectiveStock,
    compareAtPrice: product.compareAtPrice,
  }
}

/**
 * Safely checks if a cart item is in stock
 * Handles both legacy items without inStock field and new items with it
 */
export function isCartItemInStock(item: CartItem): boolean {
  return item.inStock ?? item.stock > 0
}

/**
 * Gets the maximum quantity that can be ordered for a cart item
 */
export function getMaxQuantity(item: CartItem): number {
  return item.maxQuantity ?? item.stock
}
