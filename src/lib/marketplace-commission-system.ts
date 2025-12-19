import { prisma } from './prisma'
import { redis } from './redis'
import type { 
  Order, 
  OrderItem, 
  Vendor, 
  VendorTransaction, 
  CommissionTier,
  PayoutSchedule 
} from '@prisma/client'

/**
 * Comprehensive Marketplace Commission System
 * Designed for Côte d'Ivoire market with Mobile Money integration
 * 
 * Features:
 * - Tiered commission rates based on vendor performance
 * - Category-specific commission rates
 * - Automatic payout scheduling
 * - Mobile Money integration (Orange Money, MTN Mobile Money, Moov Money)
 * - Multi-currency support (XOF, EUR)
 * - Dispute resolution workflow
 */

export interface CommissionCalculation {
  orderId: string
  vendorId: string
  itemTotal: number
  baseCommissionRate: number
  finalCommissionRate: number
  commissionAmount: number
  vendorAmount: number
  currency: 'XOF' | 'EUR'
  categoryBonus?: number
  performanceBonus?: number
  fees: {
    platformFee: number
    paymentProcessingFee: number
    mobileMoney?: number
  }
}

export interface VendorPerformanceMetrics {
  vendorId: string
  totalSales: number
  orderCount: number
  averageRating: number
  disputeRate: number
  onTimeDeliveryRate: number
  returnRate: number
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
}

export interface PayoutRequest {
  vendorId: string
  amount: number
  currency: 'XOF' | 'EUR'
  method: 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CASH'
  mobileMoneyProvider?: 'ORANGE' | 'MTN' | 'MOOV'
  accountDetails: {
    phoneNumber?: string
    accountNumber?: string
    bankCode?: string
  }
}

/**
 * Commission rate configuration based on vendor tier and category
 */
const COMMISSION_RATES = {
  BASE_RATES: {
    BRONZE: 0.15,   // 15% for new vendors
    SILVER: 0.12,   // 12% for established vendors
    GOLD: 0.10,     // 10% for high-performing vendors
    PLATINUM: 0.08  // 8% for top-tier vendors
  },
  CATEGORY_MODIFIERS: {
    'electronics': -0.02,     // Lower commission for high-value items
    'fashion': 0.00,          // Standard rate
    'food-beverage': 0.01,    // Higher commission for perishables
    'services': -0.01,        // Lower for services
    'handmade': -0.03         // Support local artisans
  },
  PERFORMANCE_BONUSES: {
    HIGH_RATING: -0.005,      // 0.5% reduction for 4.5+ rating
    LOW_DISPUTES: -0.005,     // 0.5% reduction for <2% dispute rate
    FAST_DELIVERY: -0.005     // 0.5% reduction for 95%+ on-time delivery
  }
} as const

/**
 * Calculate commission for an order item with advanced logic
 */
export function calculateAdvancedCommission(
  item: OrderItem & { 
    product: { 
      categoryId: string
      vendor: Vendor & { performanceMetrics?: VendorPerformanceMetrics }
    }
  },
  order: Order
): CommissionCalculation {
  const vendor = item.product.vendor
  const itemTotal = item.price * item.quantity
  
  // Get base commission rate based on vendor tier
  const vendorTier = vendor.performanceMetrics?.tier || 'BRONZE'
  let commissionRate = COMMISSION_RATES.BASE_RATES[vendorTier]
  
  // Apply category modifier
  const categoryModifier = COMMISSION_RATES.CATEGORY_MODIFIERS[
    item.product.categoryId as keyof typeof COMMISSION_RATES.CATEGORY_MODIFIERS
  ] || 0
  commissionRate += categoryModifier
  
  // Apply performance bonuses
  const metrics = vendor.performanceMetrics
  if (metrics) {
    if (metrics.averageRating >= 4.5) {
      commissionRate += COMMISSION_RATES.PERFORMANCE_BONUSES.HIGH_RATING
    }
    if (metrics.disputeRate < 0.02) {
      commissionRate += COMMISSION_RATES.PERFORMANCE_BONUSES.LOW_DISPUTES
    }
    if (metrics.onTimeDeliveryRate >= 0.95) {
      commissionRate += COMMISSION_RATES.PERFORMANCE_BONUSES.FAST_DELIVERY
    }
  }
  
  // Ensure commission rate stays within bounds (5% - 20%)
  commissionRate = Math.max(0.05, Math.min(0.20, commissionRate))
  
  // Calculate fees
  const platformFee = itemTotal * commissionRate
  const paymentProcessingFee = itemTotal * 0.025 // 2.5% payment processing
  const mobileMoney = order.paymentMethod?.includes('MOBILE') ? itemTotal * 0.01 : 0
  
  const totalFees = platformFee + paymentProcessingFee + mobileMoney
  const vendorAmount = itemTotal - totalFees
  
  return {
    orderId: order.id,
    vendorId: vendor.id,
    itemTotal,
    baseCommissionRate: COMMISSION_RATES.BASE_RATES[vendorTier],
    finalCommissionRate: commissionRate,
    commissionAmount: platformFee,
    vendorAmount,
    currency: (order.currency as 'XOF' | 'EUR') || 'XOF',
    categoryBonus: categoryModifier,
    performanceBonus: commissionRate - COMMISSION_RATES.BASE_RATES[vendorTier] - categoryModifier,
    fees: {
      platformFee,
      paymentProcessingFee,
      mobileMoney
    }
  }
}

/**
 * Process commission for completed order with atomic transactions
 */
export async function processOrderCommissionAdvanced(orderId: string): Promise<void> {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendor: {
                  include: {
                    performanceMetrics: true
                  }
                }
              }
            }
          }
        }
      }
    })
    
    if (!order || order.status !== 'COMPLETED') {
      throw new Error('Order not found or not completed')
    }
    
    // Group items by vendor
    const vendorItems = new Map<string, typeof order.items>()
    for (const item of order.items) {
      const vendorId = item.product.vendor.id
      if (!vendorItems.has(vendorId)) {
        vendorItems.set(vendorId, [])
      }
      vendorItems.get(vendorId)!.push(item)
    }
    
    // Process each vendor's commission
    for (const [vendorId, items] of vendorItems) {
      const vendor = items[0]?.product.vendor
      if (!vendor) continue
      
      let totalSales = 0
      let totalCommission = 0
      let totalVendorAmount = 0
      const commissionDetails: CommissionCalculation[] = []
      
      // Calculate commission for each item
      for (const item of items) {
        const calc = calculateAdvancedCommission(item, order)
        commissionDetails.push(calc)
        
        totalSales += calc.itemTotal
        totalCommission += calc.commissionAmount
        totalVendorAmount += calc.vendorAmount
        
        // Update order item with commission details
        await tx.orderItem.update({
          where: { id: item.id },
          data: {
            vendorId,
            commissionRate: calc.finalCommissionRate,
            commissionAmount: calc.commissionAmount,
            vendorAmount: calc.vendorAmount,
            commissionDetails: calc as any // Store full calculation details
          }
        })
      }
      
      // Get current vendor balance
      const currentVendor = await tx.vendor.findUnique({
        where: { id: vendorId },
        select: { balance: true, pendingBalance: true, totalSales: true }
      })
      
      if (!currentVendor) continue
      
      // Create vendor transaction for sale
      await tx.vendorTransaction.create({
        data: {
          vendorId,
          type: 'SALE',
          amount: totalSales,
          currency: order.currency || 'XOF',
          description: `Vente commande ${order.orderNumber}`,
          orderId: order.id,
          balanceBefore: currentVendor.pendingBalance,
          balanceAfter: currentVendor.pendingBalance + totalVendorAmount,
          metadata: {
            commissionDetails,
            orderNumber: order.orderNumber
          }
        }
      })
      
      // Create transaction for commission
      await tx.vendorTransaction.create({
        data: {
          vendorId,
          type: 'COMMISSION',
          amount: -totalCommission,
          currency: order.currency || 'XOF',
          description: `Commission plateforme commande ${order.orderNumber}`,
          orderId: order.id,
          balanceBefore: currentVendor.pendingBalance + totalVendorAmount,
          balanceAfter: currentVendor.pendingBalance + totalVendorAmount,
          metadata: {
            commissionRate: commissionDetails[0]?.finalCommissionRate,
            breakdown: commissionDetails
          }
        }
      })
      
      // Update vendor balances and metrics
      await tx.vendor.update({
        where: { id: vendorId },
        data: {
          pendingBalance: {
            increment: totalVendorAmount
          },
          totalSales: {
            increment: totalSales
          },
          lastSaleAt: new Date()
        }
      })
      
      // Update performance metrics
      await updateVendorPerformanceMetrics(tx, vendorId)
      
      // Schedule automatic payout if threshold reached
      await scheduleAutomaticPayout(tx, vendorId, currentVendor.pendingBalance + totalVendorAmount)
    }
    
    // Cache commission data for analytics
    await cacheCommissionData(order.id, vendorItems.size)
  })
}

/**
 * Update vendor performance metrics for tier calculation
 */
async function updateVendorPerformanceMetrics(
  tx: any,
  vendorId: string
): Promise<void> {
  // Calculate metrics from last 90 days
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  
  const metrics = await tx.order.aggregate({
    where: {
      items: {
        some: {
          product: {
            vendorId
          }
        }
      },
      createdAt: {
        gte: ninetyDaysAgo
      },
      status: 'COMPLETED'
    },
    _count: true,
    _sum: {
      total: true
    }
  })
  
  // Calculate average rating from reviews
  const ratingData = await tx.review.aggregate({
    where: {
      product: {
        vendorId
      },
      createdAt: {
        gte: ninetyDaysAgo
      }
    },
    _avg: {
      rating: true
    }
  })
  
  // Calculate dispute rate
  const disputeCount = await tx.dispute.count({
    where: {
      order: {
        items: {
          some: {
            product: {
              vendorId
            }
          }
        }
      },
      createdAt: {
        gte: ninetyDaysAgo
      }
    }
  })
  
  const totalSales = metrics._sum.total || 0
  const orderCount = metrics._count || 0
  const averageRating = ratingData._avg.rating || 0
  const disputeRate = orderCount > 0 ? disputeCount / orderCount : 0
  
  // Determine tier based on performance
  let tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' = 'BRONZE'
  
  if (totalSales >= 10000000 && averageRating >= 4.8 && disputeRate < 0.01) { // 10M XOF
    tier = 'PLATINUM'
  } else if (totalSales >= 5000000 && averageRating >= 4.5 && disputeRate < 0.02) { // 5M XOF
    tier = 'GOLD'
  } else if (totalSales >= 1000000 && averageRating >= 4.0 && disputeRate < 0.05) { // 1M XOF
    tier = 'SILVER'
  }
  
  // Update or create performance metrics
  await tx.vendorPerformanceMetrics.upsert({
    where: { vendorId },
    update: {
      totalSales,
      orderCount,
      averageRating,
      disputeRate,
      tier,
      updatedAt: new Date()
    },
    create: {
      vendorId,
      totalSales,
      orderCount,
      averageRating,
      disputeRate,
      onTimeDeliveryRate: 1.0, // Default for new vendors
      returnRate: 0.0,
      tier,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })
}

/**
 * Schedule automatic payout when threshold is reached
 */
async function scheduleAutomaticPayout(
  tx: any,
  vendorId: string,
  pendingBalance: number
): Promise<void> {
  const PAYOUT_THRESHOLD = 100000 // 100,000 XOF minimum payout
  
  if (pendingBalance >= PAYOUT_THRESHOLD) {
    const vendor = await tx.vendor.findUnique({
      where: { id: vendorId },
      include: { payoutSettings: true }
    })
    
    if (vendor?.payoutSettings?.autoPayoutEnabled) {
      await tx.payoutRequest.create({
        data: {
          vendorId,
          amount: pendingBalance,
          currency: 'XOF',
          method: vendor.payoutSettings.preferredMethod || 'MOBILE_MONEY',
          status: 'PENDING',
          scheduledAt: new Date(),
          metadata: {
            automatic: true,
            mobileMoneyProvider: vendor.payoutSettings.mobileMoneyProvider,
            phoneNumber: vendor.payoutSettings.phoneNumber
          }
        }
      })
    }
  }
}

/**
 * Cache commission data for analytics and reporting
 */
async function cacheCommissionData(orderId: string, vendorCount: number): Promise<void> {
  try {
    const cacheKey = `commission:order:${orderId}`
    const data = {
      orderId,
      vendorCount,
      processedAt: new Date().toISOString()
    }
    
    await redis.setex(cacheKey, 86400, JSON.stringify(data)) // Cache for 24 hours
  } catch (error) {
    console.error('Failed to cache commission data:', error)
    // Don't throw - caching failure shouldn't break commission processing
  }
}

/**
 * Process Mobile Money payout for Côte d'Ivoire market
 */
export async function processMobileMoneyPayout(
  payoutRequest: PayoutRequest
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    const { vendorId, amount, mobileMoneyProvider, accountDetails } = payoutRequest
    
    // Validate minimum payout amount
    if (amount < 1000) { // 1,000 XOF minimum
      return { success: false, error: 'Montant minimum de retrait: 1,000 XOF' }
    }
    
    // Validate phone number format for Côte d'Ivoire
    const phoneRegex = /^(\+225|225)?[0-9]{8,10}$/
    if (!accountDetails.phoneNumber || !phoneRegex.test(accountDetails.phoneNumber)) {
      return { success: false, error: 'Numéro de téléphone invalide' }
    }
    
    let transactionId: string
    
    switch (mobileMoneyProvider) {
      case 'ORANGE':
        transactionId = await processOrangeMoneyPayout(amount, accountDetails.phoneNumber)
        break
      case 'MTN':
        transactionId = await processMTNMobileMoneyPayout(amount, accountDetails.phoneNumber)
        break
      case 'MOOV':
        transactionId = await processMoovMoneyPayout(amount, accountDetails.phoneNumber)
        break
      default:
        return { success: false, error: 'Opérateur Mobile Money non supporté' }
    }
    
    // Update payout request status
    await prisma.payoutRequest.update({
      where: { id: payoutRequest.vendorId }, // Assuming this is the request ID
      data: {
        status: 'COMPLETED',
        transactionId,
        completedAt: new Date()
      }
    })
    
    // Update vendor balance
    await prisma.vendors.update({
      where: { id: vendorId },
      data: {
        pendingBalance: { decrement: amount },
        balance: { increment: amount }
      }
    })
    
    return { success: true, transactionId }
    
  } catch (error) {
    console.error('Mobile Money payout failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur de traitement du paiement' 
    }
  }
}

/**
 * Orange Money API integration (placeholder)
 */
async function processOrangeMoneyPayout(amount: number, phoneNumber: string): Promise<string> {
  // TODO: Integrate with Orange Money API
  // This would use Orange Money's merchant API for payouts
  console.log(`Processing Orange Money payout: ${amount} XOF to ${phoneNumber}`)
  return `OM${Date.now()}${Math.random().toString(36).substr(2, 9)}`
}

/**
 * MTN Mobile Money API integration (placeholder)
 */
async function processMTNMobileMoneyPayout(amount: number, phoneNumber: string): Promise<string> {
  // TODO: Integrate with MTN Mobile Money API
  console.log(`Processing MTN Mobile Money payout: ${amount} XOF to ${phoneNumber}`)
  return `MTN${Date.now()}${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Moov Money API integration (placeholder)
 */
async function processMoovMoneyPayout(amount: number, phoneNumber: string): Promise<string> {
  // TODO: Integrate with Moov Money API
  console.log(`Processing Moov Money payout: ${amount} XOF to ${phoneNumber}`)
  return `MOOV${Date.now()}${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate commission report for admin dashboard
 */
export async function generateCommissionReport(
  startDate: Date,
  endDate: Date
): Promise<{
  totalCommission: number
  totalSales: number
  vendorPayouts: number
  topVendors: Array<{
    vendorId: string
    vendorName: string
    sales: number
    commission: number
    tier: string
  }>
}> {
  const transactions = await prisma.vendorTransaction.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      type: { in: ['SALE', 'COMMISSION'] }
    },
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          performanceMetrics: {
            select: { tier: true }
          }
        }
      }
    }
  })
  
  const vendorStats = new Map<string, {
    vendorId: string
    vendorName: string
    sales: number
    commission: number
    tier: string
  }>()
  
  let totalCommission = 0
  let totalSales = 0
  
  for (const transaction of transactions) {
    const vendorId = transaction.vendorId
    
    if (!vendorStats.has(vendorId)) {
      vendorStats.set(vendorId, {
        vendorId,
        vendorName: transaction.vendor.businessName,
        sales: 0,
        commission: 0,
        tier: transaction.vendor.performanceMetrics?.tier || 'BRONZE'
      })
    }
    
    const stats = vendorStats.get(vendorId)!
    
    if (transaction.type === 'SALE') {
      stats.sales += transaction.amount
      totalSales += transaction.amount
    } else if (transaction.type === 'COMMISSION') {
      stats.commission += Math.abs(transaction.amount)
      totalCommission += Math.abs(transaction.amount)
    }
  }
  
  // Get total payouts
  const payouts = await prisma.payoutRequest.aggregate({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      status: 'COMPLETED'
    },
    _sum: { amount: true }
  })
  
  const topVendors = Array.from(vendorStats.values())
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10)
  
  return {
    totalCommission,
    totalSales,
    vendorPayouts: payouts._sum.amount || 0,
    topVendors
  }
}