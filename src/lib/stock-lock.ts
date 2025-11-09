/**
 * Redis-based distributed locking for stock management
 * Prevents race conditions during concurrent order creation
 */

import { redis } from './redis'

const LOCK_TTL = 10 // seconds - lock expires after 10s to prevent deadlocks
const LOCK_RETRY_DELAY = 50 // milliseconds
const MAX_LOCK_ATTEMPTS = 100 // Max attempts to acquire lock (5 seconds total)

/**
 * Acquire a distributed lock for a product's stock
 * Uses Redis SETNX (SET if Not eXists) for atomic lock acquisition
 */
export async function acquireStockLock(productId: string): Promise<boolean> {
  const lockKey = `stock:lock:${productId}`
  const lockValue = `${Date.now()}-${Math.random()}`
  
  try {
    // SETNX with expiration - returns 1 if lock acquired, 0 if already locked
    const result = await redis.set(lockKey, lockValue, 'EX', LOCK_TTL, 'NX')
    return result === 'OK'
  } catch (error) {
    console.error(`Error acquiring lock for product ${productId}:`, error)
    return false
  }
}

/**
 * Release a distributed lock for a product's stock
 */
export async function releaseStockLock(productId: string): Promise<void> {
  const lockKey = `stock:lock:${productId}`
  
  try {
    await redis.del(lockKey)
  } catch (error) {
    console.error(`Error releasing lock for product ${productId}:`, error)
  }
}

/**
 * Acquire locks for multiple products with retry logic
 * Returns array of successfully locked product IDs
 */
export async function acquireMultipleStockLocks(
  productIds: string[]
): Promise<{ success: boolean; lockedIds: string[] }> {
  const lockedIds: string[] = []
  
  for (const productId of productIds) {
    let attempts = 0
    let acquired = false
    
    while (attempts < MAX_LOCK_ATTEMPTS && !acquired) {
      acquired = await acquireStockLock(productId)
      
      if (!acquired) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, LOCK_RETRY_DELAY))
        attempts++
      }
    }
    
    if (acquired) {
      lockedIds.push(productId)
    } else {
      // Failed to acquire lock - release all previously acquired locks
      for (const lockedId of lockedIds) {
        await releaseStockLock(lockedId)
      }
      return { success: false, lockedIds: [] }
    }
  }
  
  return { success: true, lockedIds }
}

/**
 * Release locks for multiple products
 */
export async function releaseMultipleStockLocks(productIds: string[]): Promise<void> {
  await Promise.all(productIds.map(id => releaseStockLock(id)))
}

/**
 * Check if an order has already been processed (idempotency check)
 */
export async function isOrderProcessed(paymentIntentId: string): Promise<boolean> {
  const key = `order:processed:${paymentIntentId}`
  const exists = await redis.exists(key)
  return exists === 1
}

/**
 * Mark an order as processed (idempotency)
 * TTL of 24 hours to prevent duplicate processing
 */
export async function markOrderProcessed(paymentIntentId: string, orderId: string): Promise<void> {
  const key = `order:processed:${paymentIntentId}`
  await redis.setex(key, 86400, orderId) // 24 hours
}

/**
 * Atomically decrement stock with validation
 * This is the core function that ensures stock doesn't go negative
 */
export async function decrementStockAtomic(
  productId: string,
  quantity: number
): Promise<{ success: boolean; error?: string; currentStock?: number }> {
  try {
    const { prisma } = await import('./prisma')

    // Fetch current product with fresh data
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true }
    })

    if (!product) {
      return { success: false, error: 'Product not found' }
    }

    const currentStock = product.stock || 0

    // Validate stock availability
    if (currentStock < quantity) {
      return {
        success: false,
        error: `Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`,
        currentStock,
      }
    }

    // Calculate new stock
    const newStock = currentStock - quantity

    // Update stock
    await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock }
    })

    return { success: true, currentStock: newStock }
  } catch (error) {
    console.error(`Error decrementing stock for product ${productId}:`, error)
    return { success: false, error: 'Failed to update stock' }
  }
}

