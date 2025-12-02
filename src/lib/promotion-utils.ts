import { formatCurrency } from '@/lib/currency'
import type { PromotionType, AppliedPromotion, CartItem, CouponCode } from '@/types'
import { differenceInHours, formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Sparkles, Gift, Tag, Star, type LucideIcon } from 'lucide-react'

/**
 * Calculate the discount percentage between an original price and a discounted price
 */
export function calculateDiscountPercentage(originalPrice: number, discountedPrice: number): number {
  if (!originalPrice || originalPrice <= 0) return 0
  if (originalPrice <= discountedPrice) return 0
  
  return Math.round((1 - discountedPrice / originalPrice) * 100)
}

/**
 * Format a discount amount for display
 */
export function formatDiscountAmount(discount: number, type: 'percentage' | 'fixed'): string {
  if (type === 'percentage') {
    return `-${discount}%`
  }
  return `-${formatCurrency(discount)}`
}

/**
 * Get a human-readable label for a promotion type
 */
export function getPromotionTypeLabel(type: PromotionType): string {
  switch (type) {
    case 'automatic':
      return 'Promotion automatique'
    case 'manual':
      return 'Code promo'
    case 'sale':
      return 'Soldes'
    case 'new':
      return 'Nouveau'
    default:
      return 'Promotion'
  }
}

/**
 * Get the appropriate icon for a promotion type
 */
export function getPromotionIcon(type: PromotionType): LucideIcon {
  switch (type) {
    case 'automatic':
      return Sparkles
    case 'manual':
      return Gift
    case 'sale':
      return Tag
    case 'new':
      return Star
    default:
      return Tag
  }
}

/**
 * Check if a promotion is expiring soon (within threshold hours)
 */
export function isPromotionExpiringSoon(expiresAt: Date | undefined, thresholdHours: number = 24): boolean {
  if (!expiresAt) return false
  
  const hoursUntilExpiry = differenceInHours(new Date(expiresAt), new Date())
  return hoursUntilExpiry > 0 && hoursUntilExpiry <= thresholdHours
}

/**
 * Format the expiration date of a promotion
 */
export function formatPromotionExpiry(expiresAt: Date | undefined): string {
  if (!expiresAt) return 'Pas de date d\'expiration'
  
  const now = new Date()
  const expiry = new Date(expiresAt)
  
  if (expiry < now) {
    return 'Expiré'
  }
  
  const hoursUntilExpiry = differenceInHours(expiry, now)
  
  if (hoursUntilExpiry < 24) {
    return `Expire ${formatDistanceToNow(expiry, { addSuffix: true, locale: fr })}`
  }
  
  return `Expire le ${format(expiry, 'd MMMM', { locale: fr })}`
}

/**
 * Aggregate all active promotions from items and applied coupon
 */
export function aggregatePromotions(items: CartItem[], appliedCoupon?: CouponCode): AppliedPromotion[] {
  const promotions: AppliedPromotion[] = []
  
  // 1. Item-level promotions (automatic from compareAtPrice)
  items.forEach(item => {
    if (item.compareAtPrice && item.compareAtPrice > item.price) {
      const discount = (item.compareAtPrice - item.price) * item.quantity
      const percentage = calculateDiscountPercentage(item.compareAtPrice, item.price)
      
      promotions.push({
        id: `auto-${item.id}`,
        type: 'automatic',
        label: 'Promotion',
        discount,
        discountType: 'percentage',
        scope: 'item',
        appliedTo: [item.id],
        description: `-${percentage}% de réduction sur ${item.name}`
      })
    }
    
    // Badge promotions
    if (item.badge) {
      // Only add if it's a promotion type badge
      if (item.badge === 'SALE' || item.badge === 'NEW' || typeof item.badge === 'string') {
        // This is more for display, might not have a discount value attached directly
      }
    }
  })
  
  // 2. Cart-level promotions (coupon)
  if (appliedCoupon) {
    // We need to calculate the actual discount amount for the coupon
    // This logic should ideally match the store's getDiscount() method
    // For now we'll assume the caller handles the total discount calculation or we approximate
    let discountAmount = 0
    
    if (appliedCoupon.scope === 'cart') {
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      if (appliedCoupon.type === 'percentage') {
        discountAmount = Math.round((subtotal * appliedCoupon.discount) / 100)
      } else {
        discountAmount = appliedCoupon.discount
      }
    } else if (appliedCoupon.scope === 'shipping') {
      // Shipping discount logic would go here
      // For display purposes we might set a placeholder or 0 if unknown context
      discountAmount = 0 // This would need context of shipping cost
    }
    
    promotions.push({
      id: appliedCoupon.code,
      type: 'manual',
      code: appliedCoupon.code,
      label: 'Code promo',
      description: appliedCoupon.type === 'percentage' ? `-${appliedCoupon.discount}% sur votre commande` : `-${formatCurrency(appliedCoupon.discount)} sur votre commande`,
      discount: discountAmount,
      discountType: appliedCoupon.type,
      scope: appliedCoupon.scope,
      expiresAt: appliedCoupon.expiresAt ? new Date(appliedCoupon.expiresAt) : undefined,
      conditions: appliedCoupon.minPurchase ? `Minimum d'achat: ${formatCurrency(appliedCoupon.minPurchase)}` : undefined
    })
  }
  
  return promotions
}
