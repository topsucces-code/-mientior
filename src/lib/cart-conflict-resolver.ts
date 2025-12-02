/**
 * Cart Conflict Resolver Utility
 * Handles conflicts when syncing cart with server (product deletion, stock changes, price changes)
 */

import { prisma } from '@/lib/prisma'
import type { CartItem } from '@/types'

export type ConflictType = 'PRODUCT_DELETED' | 'STOCK_INSUFFICIENT' | 'PRICE_CHANGED'

export interface ConflictReport {
  itemId: string
  type: ConflictType
  oldValue?: unknown
  newValue?: unknown
  message: string
}

export interface ResolveResult {
  resolvedItems: CartItem[]
  conflicts: ConflictReport[]
}

/**
 * Resolves conflicts in cart items by validating against database
 * - Checks if products still exist
 * - Validates stock availability
 * - Detects price changes (>5% threshold)
 */
export async function resolveCartConflicts(cartItems: CartItem[]): Promise<ResolveResult> {
  const resolvedItems: CartItem[] = []
  const conflicts: ConflictReport[] = []

  // Extract all product IDs to batch fetch
  const productIds = cartItems.map(item => item.productId)

  // Extract variant SKUs/IDs if present
  const variantSkus = cartItems
    .filter(item => item.variant?.sku)
    .map(item => item.variant!.sku)

  // Fetch all products in a single query
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds }
    },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      status: true
    }
  })

  // Fetch variants if needed
  const variants = variantSkus.length > 0
    ? await prisma.productVariant.findMany({
        where: {
          sku: { in: variantSkus }
        },
        select: {
          id: true,
          sku: true,
          stock: true,
          priceModifier: true,
          productId: true,
          size: true,
          color: true
        }
      })
    : []

  // Create maps for quick lookup
  const productMap = new Map(products.map(p => [p.id, p]))
  const variantMap = new Map(variants.map(v => [v.sku, v]))

  // Process each cart item
  for (const item of cartItems) {
    const product = productMap.get(item.productId)
    const variant = item.variant?.sku ? variantMap.get(item.variant.sku) : null

    // Check if product still exists and is active
    if (!product || product.status !== 'ACTIVE') {
      conflicts.push({
        itemId: item.id,
        type: 'PRODUCT_DELETED',
        message: `Le produit "${item.name || item.productName || 'Inconnu'}" n'est plus disponible`
      })
      // Don't add to resolved items - product is gone
      continue
    }

    // If item specifies a variant but it's not found in DB (and product exists)
    if (item.variant?.sku && !variant) {
      conflicts.push({
        itemId: item.id,
        type: 'PRODUCT_DELETED',
        message: `La variante du produit "${product.name}" n'est plus disponible`
      })
      continue
    }

    const modifiedItem = { ...item }

    // Determine reference stock and price
    const refStock = variant ? variant.stock : product.stock
    const refPrice = variant ? (product.price + variant.priceModifier) : product.price
    const refName = variant
      ? `${product.name} (${[variant.size, variant.color].filter(Boolean).join(' / ')})`
      : product.name

    // Check stock availability
    if (item.quantity > refStock) {
      conflicts.push({
        itemId: item.id,
        type: 'STOCK_INSUFFICIENT',
        oldValue: item.quantity,
        newValue: Math.max(0, refStock),
        message: `Le stock de "${refName}" est limité à ${refStock} unité(s)`
      })

      // Adjust quantity to available stock
      modifiedItem.quantity = Math.max(0, refStock)
      modifiedItem.stock = refStock
    }

    // Check for price changes (>5% threshold)
    if (item.price > 0) {
      const priceChange = Math.abs(item.price - refPrice) / item.price
      if (priceChange > 0.05) {
        const priceIncreased = refPrice > item.price

        conflicts.push({
          itemId: item.id,
          type: 'PRICE_CHANGED',
          oldValue: item.price,
          newValue: refPrice,
          message: `Le prix de "${refName}" a ${priceIncreased ? 'augmenté' : 'diminué'} de ${item.price.toFixed(2)}€ à ${refPrice.toFixed(2)}€`
        })

        // Update price to current value
        modifiedItem.price = refPrice
      }
    } else if (item.price !== refPrice) {
      // Directly align price without emitting conflict if item.price <= 0
      modifiedItem.price = refPrice
    }

    // If quantity is 0 after stock adjustment, don't add to cart
    if (modifiedItem.quantity === 0) {
      continue
    }

    resolvedItems.push(modifiedItem)
  }

  return {
    resolvedItems,
    conflicts
  }
}
