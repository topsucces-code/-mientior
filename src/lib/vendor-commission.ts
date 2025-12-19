// import { prisma } from './prisma' // Commented out as not currently used
import type { OrderItem, Vendor } from '@prisma/client'

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
 * 
 * NOTE: This function is currently disabled as it requires additional database schema changes.
 * The following fields need to be added to the schema:
 * - OrderItem: vendorId, commissionRate, commissionAmount, vendorAmount
 * - Vendor: balance, pendingBalance
 * - VendorTransaction model needs to be created
 */
export async function processOrderCommission(_orderId: string): Promise<void> {
  console.warn('processOrderCommission is disabled - requires schema updates')
  
  // TODO: Uncomment and implement when schema is updated
  /*
  const order = await prisma.orders.findUnique({
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
  const vendorEntries = Array.from(vendorItems.entries())
  for (const [vendorId, items] of vendorEntries) {
    const vendor = items[0]?.product.vendor
    if (!vendor) continue
    
    let totalSales = 0
    let totalCommission = 0
    let totalVendorAmount = 0
    
    for (const item of items) {
      const calc = await calculateCommission(item, vendor)
      totalSales += calc.itemTotal
      totalCommission += calc.commissionAmount
      totalVendorAmount += calc.vendorAmount
    }
    
    // Update vendor total sales
    await prisma.vendors.update({
      where: { id: vendorId },
      data: {
        totalSales: {
          increment: totalSales
        }
      }
    })
  }
  */
}

/**
 * Recalculate commission if vendor rate changes
 * 
 * NOTE: This function is currently disabled as it requires additional database schema changes.
 * The OrderItem model needs the following fields: commissionRate, commissionAmount, vendorAmount
 */
export async function recalculateOrderCommission(
  _orderId: string,
  _newCommissionRate: number
): Promise<void> {
  console.warn('recalculateOrderCommission is disabled - requires schema updates')
  
  // TODO: Uncomment and implement when schema is updated
  /*
  const order = await prisma.orders.findUnique({
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
    
    // This would work once the schema is updated
    // await prisma.orderItem.update({
    //   where: { id: item.id },
    //   data: {
    //     commissionRate: newCommissionRate,
    //     commissionAmount,
    //     vendorAmount
    //   }
    // })
  }
  */
}
