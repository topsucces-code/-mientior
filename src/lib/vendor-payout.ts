import { prisma } from './prisma'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

interface PayoutSummary {
  vendorId: string
  periodStart: Date
  periodEnd: Date
  totalSales: number
  platformFees: number
  adjustments: number
  payoutAmount: number
  orderCount: number
}

/**
 * Calculate payout for a vendor for a given period
 */
export async function calculateVendorPayout(
  vendorId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<PayoutSummary> {
  // Get all completed orders in period
  const orders = await prisma.orders.findMany({
    where: {
      vendorId,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      createdAt: {
        gte: periodStart,
        lte: periodEnd
      }
    },
    include: {
      items: {
        where: { vendorId }
      }
    }
  })
  
  let totalSales = 0
  let platformFees = 0
  
  for (const order of orders) {
    for (const item of order.items) {
      totalSales += item.subtotal || (item.price * item.quantity)
      platformFees += item.commissionAmount || 0
    }
  }
  
  // Get any adjustments (refunds, bonuses, penalties)
  const adjustments = await prisma.vendorTransaction.aggregate({
    where: {
      vendorId,
      type: { in: ['ADJUSTMENT', 'REFUND', 'BONUS', 'PENALTY'] },
      createdAt: {
        gte: periodStart,
        lte: periodEnd
      }
    },
    _sum: { amount: true }
  })
  
  const adjustmentTotal = adjustments._sum.amount || 0
  const payoutAmount = totalSales - platformFees + adjustmentTotal
  
  return {
    vendorId,
    periodStart,
    periodEnd,
    totalSales,
    platformFees,
    adjustments: adjustmentTotal,
    payoutAmount,
    orderCount: orders.length
  }
}

/**
 * Generate monthly payouts for all active vendors
 */
export async function generateMonthlyPayouts(
  month?: Date
): Promise<string[]> {
  const targetMonth = month || subMonths(new Date(), 1)
  const periodStart = startOfMonth(targetMonth)
  const periodEnd = endOfMonth(targetMonth)
  
  // Get all active vendors
  const vendors = await prisma.vendors.findMany({
    where: { status: 'ACTIVE' }
  })
  
  const payoutIds: string[] = []
  
  for (const vendor of vendors) {
    const summary = await calculateVendorPayout(
      vendor.id,
      periodStart,
      periodEnd
    )
    
    // Only create payout if there's money to pay
    if (summary.payoutAmount <= 0) continue
    
    // Create payout record
    const payout = await prisma.vendorPayout.create({
      data: {
        vendorId: vendor.id,
        amount: summary.payoutAmount,
        periodStart,
        periodEnd,
        totalSales: summary.totalSales,
        platformFees: summary.platformFees,
        adjustments: summary.adjustments,
        payoutAmount: summary.payoutAmount,
        status: 'PENDING',
        period: format(periodStart, 'yyyy-MM')
      }
    })
    
    // Create payout items for each order
    const orders = await prisma.orders.findMany({
      where: {
        vendorId: vendor.id,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        }
      },
      include: {
        items: {
          where: { vendorId: vendor.id }
        }
      }
    })
    
    for (const order of orders) {
      for (const item of order.items) {
        await prisma.vendorPayoutItem.create({
          data: {
            payoutId: payout.id,
            orderId: order.id,
            orderItemId: item.id,
            itemTotal: item.subtotal || (item.price * item.quantity),
            commission: item.commissionAmount || 0,
            netAmount: item.vendorAmount || 0
          }
        })
      }
    }
    
    payoutIds.push(payout.id)
  }
  
  return payoutIds
}

/**
 * Process payout payment
 */
export async function processPayoutPayment(
  payoutId: string,
  adminUserId: string
): Promise<void> {
  const payout = await prisma.vendorPayout.findUnique({
    where: { id: payoutId },
    include: { vendor: true }
  })
  
  if (!payout) {
    throw new Error(`Payout ${payoutId} not found`)
  }
  
  if (payout.status !== 'PENDING' && payout.status !== 'PROCESSING') {
    throw new Error(`Payout ${payoutId} cannot be processed (status: ${payout.status})`)
  }
  
  // Update status to processing
  await prisma.vendorPayout.update({
    where: { id: payoutId },
    data: { status: 'PROCESSING' }
  })
  
  try {
    // TODO: Integrate with payment gateway (Paystack, Mobile Money, etc.)
    const paymentReference = `PAY-${Date.now()}-${payout.vendorId.slice(0, 8)}`
    
    // Update payout as paid
    await prisma.vendorPayout.update({
      where: { id: payoutId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        processedBy: adminUserId,
        paymentReference
      }
    })
    
    // Create vendor transaction
    const vendor = await prisma.vendors.findUnique({
      where: { id: payout.vendorId },
      select: { balance: true, pendingBalance: true }
    })
    
    if (vendor) {
      await prisma.vendorTransaction.create({
        data: {
          vendorId: payout.vendorId,
          type: 'PAYOUT',
          amount: -payout.payoutAmount,
          description: `Payout for period ${payout.period}`,
          payoutId: payout.id,
          balanceBefore: vendor.pendingBalance,
          balanceAfter: vendor.pendingBalance - payout.payoutAmount,
          createdBy: adminUserId
        }
      })
      
      // Update vendor balances
      await prisma.vendors.update({
        where: { id: payout.vendorId },
        data: {
          pendingBalance: {
            decrement: payout.payoutAmount
          },
          balance: {
            increment: payout.payoutAmount
          }
        }
      })
    }
  } catch (error) {
    // Mark as failed
    await prisma.vendorPayout.update({
      where: { id: payoutId },
      data: {
        status: 'FAILED',
        notes: error instanceof Error ? error.message : 'Payment failed'
      }
    })
    throw error
  }
}

/**
 * Get payout details with items
 */
export async function getPayoutDetails(payoutId: string) {
  return prisma.vendorPayout.findUnique({
    where: { id: payoutId },
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          email: true,
          bankDetails: true,
          mobileMoneyDetails: true
        }
      },
      items: {
        include: {
          order: {
            select: {
              orderNumber: true,
              createdAt: true,
              total: true
            }
          },
          orderItem: {
            select: {
              productName: true,
              quantity: true,
              price: true
            }
          }
        }
      }
    }
  })
}
