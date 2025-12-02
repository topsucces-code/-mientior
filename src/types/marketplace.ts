import type { 
  Vendor, 
  VendorPayout, 
  VendorTransaction, 
  VendorMetrics,
  Dispute,
  VendorApplication,
  VendorTransactionType,
  DisputeType,
  DisputeStatus,
  VendorApplicationStatus,
  PayoutStatus
} from '@prisma/client'

// Vendor with relations
export interface VendorWithMetrics extends Vendor {
  metrics: VendorMetrics | null
  _count?: {
    products: number
    orders: number
    payouts: number
  }
}

// Payout with details
export interface PayoutWithDetails extends VendorPayout {
  vendor: {
    id: string
    businessName: string
    email: string
    bankDetails: any
    mobileMoneyDetails: any
  }
  items: Array<{
    id: string
    itemTotal: number
    commission: number
    netAmount: number
    order: {
      orderNumber: string
      createdAt: Date
      total: number
    }
    orderItem: {
      productName: string | null
      quantity: number
      price: number
    }
  }>
}

// Commission calculation result
export interface CommissionResult {
  orderId: string
  vendorId: string
  itemTotal: number
  commissionRate: number
  commissionAmount: number
  vendorAmount: number
}

// Payout summary
export interface PayoutSummary {
  vendorId: string
  periodStart: Date
  periodEnd: Date
  totalSales: number
  platformFees: number
  adjustments: number
  payoutAmount: number
  orderCount: number
}

// Vendor dashboard stats
export interface VendorDashboardStats {
  vendor: {
    id: string
    businessName: string
    status: string
    balance: number
    pendingBalance: number
    commissionRate: number
  }
  metrics: VendorMetrics | null
  recentOrders: Array<any>
  pendingPayouts: Array<VendorPayout>
  lowStockProducts: Array<any>
}

// Order vendor breakdown
export interface OrderVendorBreakdown {
  order: {
    id: string
    orderNumber: string
    total: number
    status: string
  }
  vendors: Array<{
    vendorId: string
    vendorName: string
    itemCount: number
    subtotal: number
    commission: number
    vendorAmount: number
  }>
}

// Cart item for order splitting
export interface CartItem {
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

// Vendor order group
export interface VendorOrderGroup {
  vendorId: string
  vendorName: string
  items: CartItem[]
  subtotal: number
  shipping: number
  total: number
}

// Mobile Money provider types
export type MobileMoneyProvider = 'ORANGE_MONEY' | 'MTN_MONEY' | 'MOOV_MONEY' | 'WAVE'

export interface MobileMoneyPayment {
  provider: MobileMoneyProvider
  phoneNumber: string
  amount: number
  currency: string
  reference: string
}

export interface MobileMoneyPayout {
  provider: MobileMoneyProvider
  phoneNumber: string
  amount: number
  currency: string
  reference: string
  recipientName: string
}

// Dispute with relations
export interface DisputeWithDetails extends Dispute {
  order: {
    orderNumber: string
    total: number
  }
  customer: {
    id: string
    name: string
    email: string
  }
  vendor: {
    id: string
    businessName: string
    email: string
  }
  messages: Array<{
    id: string
    senderId: string
    senderType: string
    message: string
    createdAt: Date
  }>
}

// Vendor application with status
export interface VendorApplicationWithStatus extends VendorApplication {
  _count?: {
    products: number
  }
}

// Export Prisma enums for convenience
export {
  VendorTransactionType,
  DisputeType,
  DisputeStatus,
  VendorApplicationStatus,
  PayoutStatus
}
