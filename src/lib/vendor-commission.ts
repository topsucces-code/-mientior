import { prisma } from './prisma'
import type { Order, OrderItem, Vendor } from '@prisma/client'

interface CommissionCalculation {
  orderId: string
  vendorId: string
  itemTotal: number
  commissionRate: number
  commissionAmount: number
  vendorAmount: number
}

/**
 * Calculate commission for an order item
 * Supports vendor-specific commission rates
 */
export async function calculateCommission(
  orderItem: OrderItem & { product: { vendorId: string | null } },
  vendor: Vendor
): Promise<CommissionCalculation> {
  const itemTotal = orderItem.subtotal || (orderItem.price * orderItem.quantity)
  
  // Use vendor-specific commission rate
  const commissionRate = vendor.commissionRate || 15.0
  
  const commissionAmount = (itemTotal * commissionRate) / 100
  const vendorAmount = itemTotal - commissionAmount
  
  return {
    orderId: orderItem.orderId,
    vendorId: vendor.id,
    itemTotal,
    commissionRate,
    commissionAmount,
    vendorAmount
  }
}

/**
 * Process commission for completed order
 * Creates vendor transaction and updates balances
 */
export async function processOrderCommission(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: { vendor: true }
          }
        }
      }
    }
  })
  
  if (!order) {
    throw new Error(`Order ${orderId} not found`)
  }
  
  // Group items by vendor
  const vendorItems = new Map<string, typeof order.items>()
  
  for (const item of order.items) {
    const vendorId = item.product.vendorId
    if (!vendorId) continue
    
    if (!vendorItems.has(vendorId)) {
      vendorItems.set(vendorId, [])
    }
    vendorItems.get(vendorId)!.push(item)
  }
  
  // Process each vendor's items
  for (const [vendorId, items] of vendorItems) {
    const vendor = items[0].product.vendor
    if (!vendor) continue
    
    let totalSales = 0
    let totalCommission = 0
    let totalVendorAmount = 0
    
    for (const item of items) {
      const calc = await calculateCommission(item, vendor)
      totalSales += calc.itemTotal
      totalCommission += calc.commissionAmount
      totalVendorAmount += calc.vendorAmount
      
      // Update order item with commission details
      await prisma.orderItem.update({
        where: { id: item.id },
        data: {
          vendorId,
          commissionRate: calc.commissionRate,
          commissionAmount: calc.commissionAmount,
          vendorAmount: calc.vendorAmount
        }
      })
    }
    
    // Get current vendor balance
    const currentVendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { balance: true, pendingBalance: true }
    })
    
    if (!currentVendor) continue
    
    // Create vendor transaction for sale
    await prisma.vendorTransaction.create({
      data: {
        vendorId,
        type: 'SALE',
        amount: totalSales,
        description: `Sale from order ${order.orderNumber}`,
        orderId: order.id,
        balanceBefore: currentVendor.pendingBalance,
        balanceAfter: currentVendor.pendingBalance + totalVendorAmount
      }
    })
    
    // Create transaction for commission
    await prisma.vendorTransaction.create({
      data: {
        vendorId,
        type: 'COMMISSION',
        amount: -totalCommission,
        description: `Platform commission (${vendor.commissionRate}%) for order ${order.orderNumber}`,
        orderId: order.id,
        balanceBefore: currentVendor.pendingBalance + totalVendorAmount,
        balanceAfter: currentVendor.pendingBalance + totalVendorAmount
      }
    })
    
    // Update vendor pending balance
    await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        pendingBalance: {
          increment: totalVendorAmount
        },
        totalSales: {
          increment: totalSales
        }
      }
    })
  }
}

/**
 * Recalculate commission if vendor rate changes
 */
export async function recalculateOrderCommission(
  orderId: string,
  newCommissionRate: number
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      vendor: true
    }
  })
  
  if (!order || !order.vendor) {
    throw new Error('Order or vendor not found')
  }
  
  for (const item of order.items) {
    const itemTotal = item.subtotal || (item.price * item.quantity)
    const commissionAmount = (itemTotal * newCommissionRate) / 100
    const vendorAmount = itemTotal - commissionAmount
    
    await prisma.orderItem.update({
      where: { id: item.id },
      data: {
        commissionRate: newCommissionRate,
        commissionAmount,
        vendorAmount
      }
    })
  }
}
