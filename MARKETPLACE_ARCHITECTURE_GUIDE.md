# Marketplace Architecture Guide for Mientior

## Executive Summary

This guide provides comprehensive marketplace architecture for Mientior's multi-vendor e-commerce platform, specifically adapted for the Côte d'Ivoire and French-speaking African markets.

## Current Schema Analysis

### ✅ What's Already Implemented

1. **Vendor Management** - Basic vendor model with status tracking
2. **Commission System** - `commissionRate` field on Vendor model
3. **Vendor Payouts** - Basic payout tracking model
4. **Customer Segmentation** - Enhanced with automatic/manual assignment
5. **Order Management** - Complete order flow with vendor association
6. **Loyalty Program** - 4-tier system (Bronze/Silver/Gold/Platinum)

### ❌ Critical Missing Components

1. **Vendor Payout Details** - No line-item tracking for payouts
2. **Vendor Performance Metrics** - No analytics or KPIs
3. **Dispute Resolution** - No customer complaint system
4. **Vendor Onboarding** - No application workflow
5. **Multi-Vendor Order Splitting** - No logic for orders with multiple vendors
6. **Vendor Transaction Ledger** - No detailed financial tracking
7. **Mobile Money Integration** - Critical for Côte d'Ivoire market

## Architecture Recommendations

### 1. Enhanced Vendor Payout System

The current `VendorPayout` model is too simple. We need detailed tracking.


#### Recommended Schema Enhancements

Add these models to `prisma/schema.prisma`:

```prisma
// Enhanced Vendor Payout with detailed tracking
model VendorPayoutItem {
  id          String        @id @default(cuid())
  payoutId    String
  payout      VendorPayout  @relation(fields: [payoutId], references: [id], onDelete: Cascade)
  orderId     String
  order       Order         @relation(fields: [orderId], references: [id])
  orderItemId String
  orderItem   OrderItem     @relation(fields: [orderItemId], references: [id])
  itemTotal   Float         // Order item total
  commission  Float         // Platform commission
  netAmount   Float         // Amount for vendor
  createdAt   DateTime      @default(now())

  @@index([payoutId])
  @@index([orderId])
  @@map("vendor_payout_items")
}

// Vendor transaction ledger for complete financial tracking
model VendorTransaction {
  id              String                 @id @default(cuid())
  vendorId        String
  vendor          Vendor                 @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  type            VendorTransactionType
  amount          Float
  currency        String                 @default("XOF") // West African CFA franc
  description     String
  orderId         String?
  order           Order?                 @relation(fields: [orderId], references: [id])
  payoutId        String?
  payout          VendorPayout?          @relation(fields: [payoutId], references: [id])
  balanceBefore   Float                  // Vendor balance before transaction
  balanceAfter    Float                  // Vendor balance after transaction
  metadata        Json?                  // Additional transaction details
  createdAt       DateTime               @default(now())
  createdBy       String?                // Admin user ID if manual

  @@index([vendorId])
  @@index([type])
  @@index([orderId])
  @@index([payoutId])
  @@index([createdAt])
  @@map("vendor_transactions")
}

enum VendorTransactionType {
  SALE              // Revenue from order
  COMMISSION        // Platform commission deduction
  REFUND            // Refund to customer
  ADJUSTMENT        // Manual adjustment
  PAYOUT            // Payout to vendor
  BONUS             // Platform bonus
  PENALTY           // Platform penalty
  MOBILE_MONEY_FEE  // Mobile money transaction fee
}
```


### 2. Vendor Performance & Analytics

Track vendor KPIs for platform health and vendor incentives.

```prisma
model VendorMetrics {
  id                    String   @id @default(cuid())
  vendorId              String   @unique
  vendor                Vendor   @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  
  // Sales metrics
  totalSales            Float    @default(0)
  totalOrders           Int      @default(0)
  averageOrderValue     Float    @default(0)
  
  // Performance metrics
  averageRating         Float    @default(0)
  totalReviews          Int      @default(0)
  fulfillmentRate       Float    @default(100) // % of orders fulfilled on time
  cancellationRate      Float    @default(0)   // % of orders cancelled by vendor
  responseTime          Int      @default(0)   // Average response time in hours
  
  // Customer satisfaction
  positiveReviewRate    Float    @default(0)   // % of 4-5 star reviews
  repeatCustomerRate    Float    @default(0)   // % of customers who order again
  
  // Inventory
  totalProducts         Int      @default(0)
  activeProducts        Int      @default(0)
  outOfStockProducts    Int      @default(0)
  
  // Period tracking
  last30DaysSales       Float    @default(0)
  last30DaysOrders      Int      @default(0)
  lastCalculatedAt      DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([averageRating])
  @@index([totalSales])
  @@index([fulfillmentRate])
  @@map("vendor_metrics")
}
```


### 3. Dispute Resolution System

Essential for marketplace trust and customer satisfaction.

```prisma
model Dispute {
  id              String        @id @default(cuid())
  orderId         String
  order           Order         @relation(fields: [orderId], references: [id])
  customerId      String
  customer        User          @relation("CustomerDisputes", fields: [customerId], references: [id])
  vendorId        String
  vendor          Vendor        @relation(fields: [vendorId], references: [id])
  type            DisputeType
  status          DisputeStatus @default(OPEN)
  subject         String
  description     String        @db.Text
  customerEvidence Json?        // Photos, documents, etc.
  vendorResponse  String?       @db.Text
  vendorEvidence  Json?
  resolution      String?       @db.Text
  resolvedBy      String?       // Admin user ID
  resolvedAt      DateTime?
  refundAmount    Float?
  refundIssued    Boolean       @default(false)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  messages        DisputeMessage[]

  @@index([orderId])
  @@index([customerId])
  @@index([vendorId])
  @@index([status])
  @@index([createdAt])
  @@map("disputes")
}

enum DisputeType {
  PRODUCT_NOT_RECEIVED
  PRODUCT_DAMAGED
  WRONG_PRODUCT
  PRODUCT_NOT_AS_DESCRIBED
  REFUND_REQUEST
  QUALITY_ISSUE
  DELIVERY_DELAY
  OTHER
}

enum DisputeStatus {
  OPEN
  VENDOR_RESPONDED
  UNDER_REVIEW
  RESOLVED
  CLOSED
  ESCALATED
}

model DisputeMessage {
  id         String   @id @default(cuid())
  disputeId  String
  dispute    Dispute  @relation(fields: [disputeId], references: [id], onDelete: Cascade)
  senderId   String   // User ID or Admin ID
  senderType String   // CUSTOMER, VENDOR, ADMIN
  message    String   @db.Text
  attachments Json?
  createdAt  DateTime @default(now())

  @@index([disputeId])
  @@index([createdAt])
  @@map("dispute_messages")
}
```


### 4. Vendor Onboarding Workflow

Structured application process for vendor quality control.

```prisma
model VendorApplication {
  id                  String                    @id @default(cuid())
  email               String                    @unique
  businessName        String
  businessType        String                    // INDIVIDUAL, COMPANY, COOPERATIVE
  contactPerson       String
  phoneNumber         String
  address             Json                      // Full address details
  taxId               String?
  businessLicense     String?                   // Document URL
  identityDocument    String?                   // Document URL
  bankDetails         Json?                     // Bank account information
  mobileMoneyDetails  Json?                     // Orange Money, MTN Money, Moov Money
  productCategories   String[]                  // Categories they want to sell
  estimatedMonthlyVolume Float?
  status              VendorApplicationStatus   @default(PENDING)
  reviewedBy          String?                   // Admin user ID
  reviewedAt          DateTime?
  rejectionReason     String?
  notes               String?                   @db.Text
  createdAt           DateTime                  @default(now())
  updatedAt           DateTime                  @updatedAt

  @@index([status])
  @@index([createdAt])
  @@index([email])
  @@map("vendor_applications")
}

enum VendorApplicationStatus {
  PENDING           // Awaiting review
  UNDER_REVIEW      // Being reviewed by admin
  APPROVED          // Approved, vendor account created
  REJECTED          // Application rejected
  MORE_INFO_NEEDED  // Requires additional information
}
```

### 5. Update Existing Models

Add missing relations to existing models:

```prisma
// Update Vendor model
model Vendor {
  // ... existing fields ...
  balance           Float                @default(0)  // Current balance
  pendingBalance    Float                @default(0)  // Pending (not yet paid out)
  
  // Add new relations
  transactions      VendorTransaction[]
  metrics           VendorMetrics?
  disputes          Dispute[]
  payoutItems       VendorPayoutItem[]
}

// Update VendorPayout model
model VendorPayout {
  // ... existing fields ...
  periodStart       DateTime             // Payout period start
  periodEnd         DateTime             // Payout period end
  totalSales        Float    @default(0)
  platformFees      Float    @default(0)
  adjustments       Float    @default(0)
  payoutAmount      Float    @default(0)
  paymentMethod     String?              // BANK_TRANSFER, MOBILE_MONEY
  paymentReference  String?
  paymentDetails    Json?
  processedBy       String?              // Admin user ID
  notes             String?              @db.Text
  
  // Add new relations
  items             VendorPayoutItem[]
  transactions      VendorTransaction[]
}

// Update Order model
model Order {
  // ... existing fields ...
  
  // Add new relations
  disputes          Dispute[]
  vendorTransactions VendorTransaction[]
  payoutItems       VendorPayoutItem[]
}

// Update OrderItem model
model OrderItem {
  // ... existing fields ...
  vendorId          String?              // Track which vendor this item belongs to
  commissionRate    Float?               // Commission rate at time of order
  commissionAmount  Float?               // Calculated commission
  vendorAmount      Float?               // Amount vendor receives
  
  // Add new relations
  payoutItems       VendorPayoutItem[]
}

// Update User model
model User {
  // ... existing fields ...
  
  // Add new relations
  disputes          Dispute[]            @relation("CustomerDisputes")
}
```


## Implementation Guide

### Phase 1: Core Marketplace Functions

#### 1.1 Commission Calculation Service

Create `src/lib/vendor-commission.ts`:

```typescript
import { prisma } from './prisma'
import type { Order, OrderItem, Vendor } from '@prisma/client'

interface CommissionCalculation {
  orderId: string
  vendorId: string
  itemTotal: float
  commissionRate: number
  commissionAmount: number
  vendorAmount: number
}

/**
 * Calculate commission for an order item
 * Supports tiered, category-based, and vendor-specific rates
 */
export async function calculateCommission(
  orderItem: OrderItem & { product: { vendorId: string; categoryId: string } },
  vendor: Vendor
): Promise<CommissionCalculation> {
  const itemTotal = orderItem.price * orderItem.quantity
  
  // Get commission rate (priority: item-specific > vendor-specific > default)
  let commissionRate = vendor.commissionRate || 15.0
  
  // Check for category-specific commission rates
  const categoryCommission = await prisma.categoryCommission.findUnique({
    where: { 
      vendorId_categoryId: {
        vendorId: vendor.id,
        categoryId: orderItem.product.categoryId
      }
    }
  })
  
  if (categoryCommission) {
    commissionRate = categoryCommission.rate
  }
  
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
        description: `Platform commission (${items[0].commissionRate}%) for order ${order.orderNumber}`,
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
```


#### 1.2 Vendor Payout Service

Create `src/lib/vendor-payout.ts`:

```typescript
import { prisma } from './prisma'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

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
  const orders = await prisma.order.findMany({
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
  const vendors = await prisma.vendor.findMany({
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
        periodStart,
        periodEnd,
        totalSales: summary.totalSales,
        platformFees: summary.platformFees,
        adjustments: summary.adjustments,
        payoutAmount: summary.payoutAmount,
        status: 'PENDING',
        period: `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`
      }
    })
    
    // Create payout items for each order
    const orders = await prisma.order.findMany({
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
 * Process payout payment (integrate with payment gateway)
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
  
  if (payout.status !== 'PENDING' && payout.status !== 'APPROVED') {
    throw new Error(`Payout ${payoutId} cannot be processed (status: ${payout.status})`)
  }
  
  // Update status to processing
  await prisma.vendorPayout.update({
    where: { id: payoutId },
    data: { status: 'PROCESSING' }
  })
  
  try {
    // TODO: Integrate with payment gateway (Paystack, Mobile Money, etc.)
    // For now, mark as paid
    
    const paymentReference = `PAY-${Date.now()}-${payout.vendorId.slice(0, 8)}`
    
    // Update payout as paid
    await prisma.vendorPayout.update({
      where: { id: payoutId },
      data: {
        status: 'PAID',
        processedAt: new Date(),
        processedBy: adminUserId,
        paymentReference
      }
    })
    
    // Create vendor transaction
    const vendor = await prisma.vendor.findUnique({
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
      await prisma.vendor.update({
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
```


#### 1.3 Multi-Vendor Order Splitting

Create `src/lib/order-splitting.ts`:

```typescript
import { prisma } from './prisma'
import type { CartItem } from '@/types'

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
  
  // Calculate shipping per vendor (can be customized)
  for (const group of vendorGroups.values()) {
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
  shippingAddress: any,
  billingAddress: any,
  paymentMethod: string
): Promise<string[]> {
  const vendorGroups = splitCartByVendor(cartItems)
  const orderIds: string[] = []
  
  // Generate a parent order number for tracking
  const parentOrderNumber = `ORD-${Date.now()}`
  
  for (let i = 0; i < vendorGroups.length; i++) {
    const group = vendorGroups[i]
    const orderNumber = vendorGroups.length > 1 
      ? `${parentOrderNumber}-${i + 1}`
      : parentOrderNumber
    
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        vendorId: group.vendorId === 'platform' ? null : group.vendorId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        subtotal: group.subtotal,
        shipping: group.shipping,
        total: group.total,
        shippingAddress,
        billingAddress,
        paymentGateway: paymentMethod as any,
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
```


### Phase 2: Mobile Money Integration (Critical for Côte d'Ivoire)

#### 2.1 Mobile Money Service

Create `src/lib/mobile-money.ts`:

```typescript
import { prisma } from './prisma'

export type MobileMoneyProvider = 'ORANGE_MONEY' | 'MTN_MONEY' | 'MOOV_MONEY' | 'WAVE'

interface MobileMoneyPayment {
  provider: MobileMoneyProvider
  phoneNumber: string
  amount: number
  currency: string
  reference: string
}

interface MobileMoneyPayout {
  provider: MobileMoneyProvider
  phoneNumber: string
  amount: number
  currency: string
  reference: string
  recipientName: string
}

/**
 * Initialize mobile money payment (customer pays platform)
 * Integrate with Orange Money, MTN Money, Moov Money APIs
 */
export async function initiateMobileMoneyPayment(
  payment: MobileMoneyPayment
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    // TODO: Integrate with actual mobile money APIs
    // Each provider has different API endpoints and authentication
    
    switch (payment.provider) {
      case 'ORANGE_MONEY':
        return await initiateOrangeMoneyPayment(payment)
      case 'MTN_MONEY':
        return await initiateMTNMoneyPayment(payment)
      case 'MOOV_MONEY':
        return await initiateMoovMoneyPayment(payment)
      case 'WAVE':
        return await initiateWavePayment(payment)
      default:
        throw new Error(`Unsupported provider: ${payment.provider}`)
    }
  } catch (error) {
    console.error('Mobile money payment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment failed'
    }
  }
}

/**
 * Process mobile money payout (platform pays vendor)
 */
export async function processMobileMoneyPayout(
  payout: MobileMoneyPayout
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    switch (payout.provider) {
      case 'ORANGE_MONEY':
        return await processOrangeMoneyPayout(payout)
      case 'MTN_MONEY':
        return await processMTNMoneyPayout(payout)
      case 'MOOV_MONEY':
        return await processMoovMoneyPayout(payout)
      case 'WAVE':
        return await processWavePayout(payout)
      default:
        throw new Error(`Unsupported provider: ${payout.provider}`)
    }
  } catch (error) {
    console.error('Mobile money payout error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payout failed'
    }
  }
}

// Provider-specific implementations (placeholders)
async function initiateOrangeMoneyPayment(payment: MobileMoneyPayment) {
  // TODO: Implement Orange Money API integration
  // API docs: https://developer.orange.com/apis/orange-money-webpay/
  return { success: true, transactionId: `OM-${Date.now()}` }
}

async function initiateMTNMoneyPayment(payment: MobileMoneyPayment) {
  // TODO: Implement MTN Mobile Money API integration
  // API docs: https://momodeveloper.mtn.com/
  return { success: true, transactionId: `MTN-${Date.now()}` }
}

async function initiateMoovMoneyPayment(payment: MobileMoneyPayment) {
  // TODO: Implement Moov Money API integration
  return { success: true, transactionId: `MOOV-${Date.now()}` }
}

async function initiateWavePayment(payment: MobileMoneyPayment) {
  // TODO: Implement Wave API integration
  return { success: true, transactionId: `WAVE-${Date.now()}` }
}

async function processOrangeMoneyPayout(payout: MobileMoneyPayout) {
  // TODO: Implement Orange Money payout API
  return { success: true, transactionId: `OM-OUT-${Date.now()}` }
}

async function processMTNMoneyPayout(payout: MobileMoneyPayout) {
  // TODO: Implement MTN Mobile Money payout API
  return { success: true, transactionId: `MTN-OUT-${Date.now()}` }
}

async function processMoovMoneyPayout(payout: MobileMoneyPayout) {
  // TODO: Implement Moov Money payout API
  return { success: true, transactionId: `MOOV-OUT-${Date.now()}` }
}

async function processWavePayout(payout: MobileMoneyPayout) {
  // TODO: Implement Wave payout API
  return { success: true, transactionId: `WAVE-OUT-${Date.now()}` }
}

/**
 * Verify mobile money transaction status
 */
export async function verifyMobileMoneyTransaction(
  provider: MobileMoneyProvider,
  transactionId: string
): Promise<{ status: 'PENDING' | 'SUCCESS' | 'FAILED'; amount?: number }> {
  // TODO: Implement transaction verification for each provider
  return { status: 'SUCCESS', amount: 0 }
}
```


### Phase 3: Vendor Dashboard & Analytics

#### 3.1 Vendor Metrics Calculator

Create `src/lib/vendor-metrics.ts`:

```typescript
import { prisma } from './prisma'
import { subDays } from 'date-fns'

/**
 * Calculate and update vendor metrics
 * Should be run daily via cron job
 */
export async function updateVendorMetrics(vendorId: string): Promise<void> {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    include: {
      products: true,
      orders: {
        where: {
          status: { in: ['DELIVERED', 'SHIPPED'] },
          paymentStatus: 'PAID'
        }
      }
    }
  })
  
  if (!vendor) return
  
  // Calculate sales metrics
  const totalSales = vendor.orders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = vendor.orders.length
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0
  
  // Calculate last 30 days metrics
  const thirtyDaysAgo = subDays(new Date(), 30)
  const recentOrders = vendor.orders.filter(
    order => order.createdAt >= thirtyDaysAgo
  )
  const last30DaysSales = recentOrders.reduce((sum, order) => sum + order.total, 0)
  const last30DaysOrders = recentOrders.length
  
  // Calculate product metrics
  const totalProducts = vendor.products.length
  const activeProducts = vendor.products.filter(p => p.status === 'ACTIVE').length
  const outOfStockProducts = vendor.products.filter(p => p.stock === 0).length
  
  // Calculate review metrics
  const reviews = await prisma.review.findMany({
    where: {
      product: { vendorId }
    }
  })
  
  const totalReviews = reviews.length
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0
  const positiveReviews = reviews.filter(r => r.rating >= 4).length
  const positiveReviewRate = totalReviews > 0
    ? (positiveReviews / totalReviews) * 100
    : 0
  
  // Calculate fulfillment rate
  const completedOrders = vendor.orders.filter(o => o.status === 'DELIVERED').length
  const cancelledOrders = vendor.orders.filter(o => o.status === 'CANCELLED').length
  const fulfillmentRate = totalOrders > 0
    ? (completedOrders / totalOrders) * 100
    : 100
  const cancellationRate = totalOrders > 0
    ? (cancelledOrders / totalOrders) * 100
    : 0
  
  // Calculate repeat customer rate
  const customerOrders = new Map<string, number>()
  for (const order of vendor.orders) {
    const count = customerOrders.get(order.userId) || 0
    customerOrders.set(order.userId, count + 1)
  }
  const repeatCustomers = Array.from(customerOrders.values()).filter(count => count > 1).length
  const totalCustomers = customerOrders.size
  const repeatCustomerRate = totalCustomers > 0
    ? (repeatCustomers / totalCustomers) * 100
    : 0
  
  // Upsert metrics
  await prisma.vendorMetrics.upsert({
    where: { vendorId },
    create: {
      vendorId,
      totalSales,
      totalOrders,
      averageOrderValue,
      averageRating,
      totalReviews,
      fulfillmentRate,
      cancellationRate,
      positiveReviewRate,
      repeatCustomerRate,
      totalProducts,
      activeProducts,
      outOfStockProducts,
      last30DaysSales,
      last30DaysOrders,
      lastCalculatedAt: new Date()
    },
    update: {
      totalSales,
      totalOrders,
      averageOrderValue,
      averageRating,
      totalReviews,
      fulfillmentRate,
      cancellationRate,
      positiveReviewRate,
      repeatCustomerRate,
      totalProducts,
      activeProducts,
      outOfStockProducts,
      last30DaysSales,
      last30DaysOrders,
      lastCalculatedAt: new Date()
    }
  })
}

/**
 * Update metrics for all active vendors
 * Run this daily via cron
 */
export async function updateAllVendorMetrics(): Promise<void> {
  const vendors = await prisma.vendor.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true }
  })
  
  for (const vendor of vendors) {
    try {
      await updateVendorMetrics(vendor.id)
    } catch (error) {
      console.error(`Failed to update metrics for vendor ${vendor.id}:`, error)
    }
  }
}
```


#### 3.2 Vendor Dashboard API Routes

Create `src/app/api/vendor/dashboard/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get vendor for this user
    const vendor = await prisma.vendor.findFirst({
      where: {
        email: session.user.email
      },
      include: {
        metrics: true
      }
    })
    
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }
    
    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    // Get pending payouts
    const pendingPayouts = await prisma.vendorPayout.findMany({
      where: {
        vendorId: vendor.id,
        status: { in: ['PENDING', 'PROCESSING', 'APPROVED'] }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Get low stock products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        vendorId: vendor.id,
        stock: { lte: 10 },
        status: 'ACTIVE'
      },
      orderBy: { stock: 'asc' },
      take: 10
    })
    
    return NextResponse.json({
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        status: vendor.status,
        balance: vendor.balance,
        pendingBalance: vendor.pendingBalance,
        commissionRate: vendor.commissionRate
      },
      metrics: vendor.metrics,
      recentOrders,
      pendingPayouts,
      lowStockProducts
    })
  } catch (error) {
    console.error('Vendor dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    )
  }
}
```

Create `src/app/api/vendor/payouts/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const vendor = await prisma.vendor.findFirst({
      where: { email: session.user.email }
    })
    
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }
    
    const payouts = await prisma.vendorPayout.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            order: {
              select: {
                orderNumber: true,
                createdAt: true
              }
            }
          }
        }
      }
    })
    
    return NextResponse.json({ payouts })
  } catch (error) {
    console.error('Vendor payouts error:', error)
    return NextResponse.json(
      { error: 'Failed to load payouts' },
      { status: 500 }
    )
  }
}
```


### Phase 4: Admin Panel Enhancements

#### 4.1 Vendor Management API

Create `src/app/api/admin/vendors/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth('VENDORS_READ')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          metrics: true,
          _count: {
            select: {
              products: true,
              orders: true
            }
          }
        }
      }),
      prisma.vendor.count({ where })
    ])
    
    return NextResponse.json({
      vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Admin vendors list error:', error)
    return NextResponse.json(
      { error: 'Failed to load vendors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminSession = await requireAdminAuth('VENDORS_WRITE')
    const body = await request.json()
    
    const vendor = await prisma.vendor.create({
      data: {
        businessName: body.businessName,
        slug: body.slug,
        email: body.email,
        phone: body.phone,
        description: body.description,
        commissionRate: body.commissionRate || 15.0,
        status: 'PENDING'
      }
    })
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        resource: 'vendor',
        resourceId: vendor.id,
        adminUserId: adminSession.adminUser.id,
        metadata: { vendor }
      }
    })
    
    return NextResponse.json({ vendor }, { status: 201 })
  } catch (error) {
    console.error('Admin create vendor error:', error)
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    )
  }
}
```

Create `src/app/api/admin/vendors/[id]/approve/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await requireAdminAuth('VENDORS_WRITE')
    
    const vendor = await prisma.vendor.update({
      where: { id: params.id },
      data: { status: 'ACTIVE' }
    })
    
    // TODO: Send approval email to vendor
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'APPROVE',
        resource: 'vendor',
        resourceId: vendor.id,
        adminUserId: adminSession.adminUser.id,
        metadata: { previousStatus: 'PENDING', newStatus: 'ACTIVE' }
      }
    })
    
    return NextResponse.json({ vendor })
  } catch (error) {
    console.error('Admin approve vendor error:', error)
    return NextResponse.json(
      { error: 'Failed to approve vendor' },
      { status: 500 }
    )
  }
}
```


## Best Practices & Recommendations

### 1. Commission Strategy

**Tiered Commission Model** (Recommended for Côte d'Ivoire):
- New vendors (0-3 months): 20% commission
- Growing vendors (3-12 months): 15% commission
- Established vendors (12+ months): 10% commission
- Top performers (>100 orders/month): 8% commission

**Category-Based Commission**:
- Electronics: 8-10% (high value, low margin)
- Fashion: 15-20% (high margin)
- Food & Beverages: 12-15% (perishable, higher risk)
- Beauty & Cosmetics: 15-18%

### 2. Payout Schedule

**Recommended Schedule for Côte d'Ivoire**:
- **Frequency**: Bi-weekly (every 2 weeks)
- **Processing Time**: 3-5 business days
- **Minimum Payout**: 50,000 XOF (~75 EUR)
- **Hold Period**: 7 days after delivery (for returns/disputes)

**Implementation**:
```typescript
// Run this cron job every 2 weeks
export async function processBiWeeklyPayouts() {
  const twoWeeksAgo = subDays(new Date(), 14)
  const sevenDaysAgo = subDays(new Date(), 7)
  
  // Only payout orders delivered at least 7 days ago
  const vendors = await prisma.vendor.findMany({
    where: {
      status: 'ACTIVE',
      orders: {
        some: {
          status: 'DELIVERED',
          paymentStatus: 'PAID',
          updatedAt: {
            gte: twoWeeksAgo,
            lte: sevenDaysAgo
          }
        }
      }
    }
  })
  
  for (const vendor of vendors) {
    await generateVendorPayout(vendor.id, twoWeeksAgo, sevenDaysAgo)
  }
}
```

### 3. Trust & Safety

**Vendor Verification Checklist**:
- ✅ Valid business registration
- ✅ Tax identification number
- ✅ Identity verification (passport/ID card)
- ✅ Bank account or Mobile Money verification
- ✅ Product samples review
- ✅ Background check (if applicable)

**Ongoing Monitoring**:
- Track cancellation rate (flag if >10%)
- Monitor customer complaints (flag if >5 per month)
- Check fulfillment time (flag if >3 days average)
- Review product quality (flag if rating <3.5)

### 4. Dispute Resolution Process

**Timeline**:
1. Customer opens dispute (Day 0)
2. Vendor has 48 hours to respond
3. Platform reviews evidence (2-3 days)
4. Resolution issued (Day 5-7)
5. Appeal period (3 days)

**Resolution Options**:
- Full refund to customer
- Partial refund
- Replacement product
- Store credit
- No action (dispute rejected)

### 5. Mobile Money Integration Priority

**Market Share in Côte d'Ivoire** (2024):
1. **Orange Money**: ~45% market share - **PRIORITY 1**
2. **MTN Mobile Money**: ~30% market share - **PRIORITY 2**
3. **Moov Money**: ~15% market share - **PRIORITY 3**
4. **Wave**: ~10% market share - **PRIORITY 4**

**Implementation Order**:
1. Start with Orange Money (largest user base)
2. Add MTN Mobile Money (second largest)
3. Add Moov Money and Wave based on demand

### 6. Performance Optimization

**Database Indexes** (Critical for scale):
```sql
-- Vendor performance queries
CREATE INDEX idx_vendor_metrics_rating ON vendor_metrics(average_rating DESC);
CREATE INDEX idx_vendor_metrics_sales ON vendor_metrics(total_sales DESC);

-- Payout queries
CREATE INDEX idx_vendor_payout_period ON vendor_payouts(vendor_id, period_start, period_end);
CREATE INDEX idx_vendor_transaction_date ON vendor_transactions(vendor_id, created_at DESC);

-- Order splitting queries
CREATE INDEX idx_order_item_vendor ON order_items(vendor_id, order_id);
CREATE INDEX idx_order_vendor_status ON orders(vendor_id, status, payment_status);
```

**Caching Strategy**:
```typescript
// Cache vendor metrics for 1 hour
export async function getCachedVendorMetrics(vendorId: string) {
  const cacheKey = `vendor:metrics:${vendorId}`
  
  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }
  
  const metrics = await prisma.vendorMetrics.findUnique({
    where: { vendorId }
  })
  
  if (metrics) {
    await redis.setex(cacheKey, 3600, JSON.stringify(metrics))
  }
  
  return metrics
}
```

### 7. Localization for Côte d'Ivoire

**Currency Display**:
```typescript
// Always show both XOF and EUR
export function formatPrice(amount: number, currency: 'XOF' | 'EUR' = 'XOF') {
  if (currency === 'XOF') {
    return new Intl.NumberFormat('fr-CI', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }
  
  // Convert EUR to XOF (approximate rate: 1 EUR = 655 XOF)
  const xofAmount = amount * 655
  return `${formatPrice(xofAmount, 'XOF')} (${amount.toFixed(2)} EUR)`
}
```

**French Language**:
- All vendor communications in French
- Support for local dialects in customer service
- French-first UI with English as secondary

## Migration Plan

### Step 1: Schema Migration (Week 1)
```bash
# Add new models to schema.prisma
npx prisma migrate dev --name add_marketplace_enhancements

# Generate Prisma Client
npx prisma generate

# Run seed for test data
npm run db:seed
```

### Step 2: Core Services (Week 2-3)
- Implement commission calculation
- Implement payout generation
- Implement order splitting
- Add vendor transaction ledger

### Step 3: Mobile Money (Week 4-5)
- Integrate Orange Money API
- Integrate MTN Mobile Money API
- Add payment/payout flows
- Test with sandbox accounts

### Step 4: Admin Panel (Week 6)
- Add vendor management UI
- Add payout processing UI
- Add dispute resolution UI
- Add vendor metrics dashboard

### Step 5: Vendor Portal (Week 7-8)
- Build vendor dashboard
- Add order management
- Add payout history
- Add performance analytics

### Step 6: Testing & Launch (Week 9-10)
- End-to-end testing
- Load testing
- Security audit
- Soft launch with 5-10 vendors

## Monitoring & Alerts

**Key Metrics to Track**:
- Average payout processing time
- Commission collection rate
- Vendor churn rate
- Dispute resolution time
- Mobile money success rate
- Platform GMV (Gross Merchandise Value)

**Alerts to Configure**:
- Failed payouts (immediate)
- High dispute rate (daily)
- Vendor account suspension (immediate)
- Low vendor balance (weekly)
- Mobile money API downtime (immediate)

## Conclusion

This marketplace architecture provides a solid foundation for Mientior to scale from 10 to 10,000 vendors while maintaining operational efficiency and vendor satisfaction. The focus on Mobile Money integration and French localization makes it specifically suited for the Côte d'Ivoire market.

**Next Steps**:
1. Review and approve schema changes
2. Prioritize implementation phases
3. Set up Mobile Money API accounts
4. Begin development with Phase 1

**Estimated Timeline**: 10 weeks for full implementation
**Estimated Cost**: Mobile Money API fees + development time
**Expected ROI**: 3-6 months to break even on development costs
