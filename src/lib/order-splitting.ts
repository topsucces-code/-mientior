import { prisma } from './prisma'

interface CartItem {
  productId: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    vendorId: string | null
    images: Array<{ url: string }>
    vendor?: {
      id: string
      businessName: string
    } | null
  }
}

interface VendorOrderGroup {
  vendorId: string
  vendorName: string
  items: CartItem[]
  subtotal: number
  shipping: number
  total: number
}

/**
 * Split cart items by vendor for multi-vendor checkout
 */
export function splitCartByVendor(cartItems: CartItem[]): VendorOrderGroup[] {
  const vendorGroups = new Map<string, VendorOrderGroup>()
  
  for (const item of cartItems) {
    const vendorId = item.product.vendorId || 'platform'
    
    if (!vendorGroups.has(vendorId)) {
      vendorGroups.set(vendorId, {
        vendorId,
        vendorName: item.product.vendor?.businessName || 'Mientior',
        items: [],
        subtotal: 0,
        shipping: 0,
        total: 0
      })
    }
    
    const group = vendorGroups.get(vendorId)!
    group.items.push(item)
    group.subtotal += item.price * item.quantity
  }
  
  // Calculate shipping per vendor
  const groups = Array.from(vendorGroups.values())
  for (const group of groups) {
    // Free shipping over 50 EUR per vendor
    group.shipping = group.subtotal >= 50 ? 0 : 5
    group.total = group.subtotal + group.shipping
  }
  
  return Array.from(vendorGroups.values())
}

/**
 * Create separate orders for each vendor in a multi-vendor cart
 */
export async function createMultiVendorOrders(
  userId: string,
  cartItems: CartItem[],
  shippingAddress: Record<string, unknown>,
  billingAddress: Record<string, unknown>,
  paymentGateway: 'PAYSTACK' | 'FLUTTERWAVE'
): Promise<string[]> {
  const vendorGroups = splitCartByVendor(cartItems)
  const orderIds: string[] = []
  
  // Generate a parent order number for tracking
  const parentOrderNumber = `ORD-${Date.now()}`
  
  for (let i = 0; i < vendorGroups.length; i++) {
    const group = vendorGroups[i]
    if (!group) continue
    
    const orderNumber = vendorGroups.length > 1 
      ? `${parentOrderNumber}-${i + 1}`
      : parentOrderNumber
    
    const order = await prisma.orders.create({
      data: {
        orderNumber,
        userId,
        vendorId: group.vendorId === 'platform' ? null : group.vendorId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        subtotal: group.subtotal,
        shipping: group.shipping,
        total: group.total,
        shippingAddress: shippingAddress as any,
        billingAddress: billingAddress as any,
        paymentGateway,
        items: {
          create: group.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            productName: item.product.name,
            productImage: item.product.images[0]?.url,
            subtotal: item.price * item.quantity,
            vendorId: group.vendorId === 'platform' ? null : group.vendorId
          }))
        }
      }
    })
    
    orderIds.push(order.id)
  }
  
  return orderIds
}

/**
 * Get vendor breakdown for an order
 */
export async function getOrderVendorBreakdown(orderId: string) {
  const order = await prisma.orders.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              vendor: {
                select: {
                  id: true,
                  businessName: true
                }
              }
            }
          }
        }
      }
    }
  })
  
  if (!order) return null
  
  const vendorBreakdown = new Map<string, {
    vendorId: string
    vendorName: string
    itemCount: number
    subtotal: number
    commission: number
    vendorAmount: number
  }>()
  
  for (const item of order.items) {
    const vendorId = item.vendorId || 'platform'
    const vendorName = item.product.vendor?.businessName || 'Mientior'
    
    if (!vendorBreakdown.has(vendorId)) {
      vendorBreakdown.set(vendorId, {
        vendorId,
        vendorName,
        itemCount: 0,
        subtotal: 0,
        commission: 0,
        vendorAmount: 0
      })
    }
    
    const breakdown = vendorBreakdown.get(vendorId)!
    breakdown.itemCount += item.quantity
    breakdown.subtotal += item.subtotal || (item.price * item.quantity)
    breakdown.commission += item.commissionAmount || 0
    breakdown.vendorAmount += item.vendorAmount || 0
  }
  
  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status
    },
    vendors: Array.from(vendorBreakdown.values())
  }
}

/**
 * Check if cart has items from multiple vendors
 */
export function hasMultipleVendors(cartItems: CartItem[]): boolean {
  const vendors = new Set<string>()
  
  for (const item of cartItems) {
    vendors.add(item.product.vendorId || 'platform')
  }
  
  return vendors.size > 1
}

/**
 * Get shipping cost for vendor group
 * Can be customized per vendor or based on location
 */
export function calculateVendorShipping(
  subtotal: number,
  _vendorId?: string,
  _shippingAddress?: Record<string, unknown>
): number {
  // Free shipping over 50 EUR
  if (subtotal >= 50) return 0
  
  // Flat rate shipping
  return 5
  
  // TODO: Implement vendor-specific or location-based shipping
}
