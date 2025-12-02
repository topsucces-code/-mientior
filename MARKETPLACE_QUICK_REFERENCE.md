# Marketplace Quick Reference

## 🚀 Quick Commands

```bash
# Apply migration
./scripts/apply-marketplace-migration.sh

# Or manually
npx prisma migrate dev --name add_marketplace_phase1
npx prisma generate

# Open database viewer
npx prisma studio
```

## 📝 Common Code Snippets

### Process Commission (After Order Delivery)

```typescript
import { processOrderCommission } from '@/lib/vendor-commission'

// In your order completion handler
if (order.status === 'DELIVERED' && order.paymentStatus === 'PAID') {
  await processOrderCommission(order.id)
}
```

### Generate Monthly Payouts

```typescript
import { generateMonthlyPayouts } from '@/lib/vendor-payout'

// Generate for last month
const payoutIds = await generateMonthlyPayouts()

// Generate for specific month
const payoutIds = await generateMonthlyPayouts(new Date('2024-01-01'))
```

### Process Payout Payment

```typescript
import { processPayoutPayment } from '@/lib/vendor-payout'

// Process payout (admin only)
await processPayoutPayment(payoutId, adminUserId)
```

### Multi-Vendor Checkout

```typescript
import { createMultiVendorOrders, hasMultipleVendors } from '@/lib/order-splitting'

// Check if multi-vendor
const isMultiVendor = hasMultipleVendors(cartItems)

// Create orders (one per vendor)
const orderIds = await createMultiVendorOrders(
  userId,
  cartItems,
  shippingAddress,
  billingAddress,
  'PAYSTACK'
)

// Process commission for each order
for (const orderId of orderIds) {
  await processOrderCommission(orderId)
}
```

### Get Vendor Dashboard Data

```typescript
import { prisma } from '@/lib/prisma'

const vendor = await prisma.vendor.findUnique({
  where: { id: vendorId },
  include: {
    metrics: true,
    payouts: {
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' }
    }
  }
})
```

### Get Payout Details

```typescript
import { getPayoutDetails } from '@/lib/vendor-payout'

const payout = await getPayoutDetails(payoutId)
// Returns payout with vendor info and all items
```

### Get Order Vendor Breakdown

```typescript
import { getOrderVendorBreakdown } from '@/lib/order-splitting'

const breakdown = await getOrderVendorBreakdown(orderId)
// Returns order with vendor-wise breakdown
```

## 🔧 Configuration

### Set Vendor Commission Rate

```typescript
await prisma.vendor.update({
  where: { id: vendorId },
  data: { commissionRate: 12.5 } // 12.5%
})
```

### Update Vendor Balance

```typescript
// Add adjustment
await prisma.vendorTransaction.create({
  data: {
    vendorId,
    type: 'ADJUSTMENT',
    amount: 100, // Add 100 EUR
    description: 'Bonus for excellent service',
    balanceBefore: vendor.pendingBalance,
    balanceAfter: vendor.pendingBalance + 100,
    createdBy: adminUserId
  }
})

await prisma.vendor.update({
  where: { id: vendorId },
  data: {
    pendingBalance: { increment: 100 }
  }
})
```

## 📊 Useful Queries

### Get Vendor Transactions

```typescript
const transactions = await prisma.vendorTransaction.findMany({
  where: { vendorId },
  orderBy: { createdAt: 'desc' },
  take: 50
})
```

### Get Pending Payouts

```typescript
const pendingPayouts = await prisma.vendorPayout.findMany({
  where: {
    status: { in: ['PENDING', 'PROCESSING'] }
  },
  include: { vendor: true }
})
```

### Get Vendor Orders

```typescript
const orders = await prisma.order.findMany({
  where: {
    vendorId,
    status: 'DELIVERED',
    paymentStatus: 'PAID'
  },
  include: {
    items: {
      where: { vendorId }
    }
  }
})
```

### Calculate Vendor Earnings

```typescript
const earnings = await prisma.orderItem.aggregate({
  where: {
    vendorId,
    order: {
      status: 'DELIVERED',
      paymentStatus: 'PAID'
    }
  },
  _sum: {
    vendorAmount: true,
    commissionAmount: true
  }
})

console.log('Vendor earned:', earnings._sum.vendorAmount)
console.log('Platform earned:', earnings._sum.commissionAmount)
```

## 🎯 Default Values

| Setting | Value | Location |
|---------|-------|----------|
| Default Commission Rate | 15% | Vendor model |
| Free Shipping Threshold | 50 EUR | order-splitting.ts |
| Payout Currency | EUR | VendorPayout model |
| Payout Status | PENDING | VendorPayout model |
| Vendor Status | PENDING | Vendor model |

## 📁 File Locations

| File | Purpose |
|------|---------|
| `src/lib/vendor-commission.ts` | Commission calculation |
| `src/lib/vendor-payout.ts` | Payout generation |
| `src/lib/order-splitting.ts` | Multi-vendor orders |
| `src/types/marketplace.ts` | TypeScript types |
| `prisma/schema.prisma` | Database schema |

## 🔍 Debugging

### Check Commission Calculation

```typescript
// Get order with commission details
const order = await prisma.order.findUnique({
  where: { id: orderId },
  include: {
    items: {
      select: {
        productName: true,
        quantity: true,
        price: true,
        subtotal: true,
        commissionRate: true,
        commissionAmount: true,
        vendorAmount: true
      }
    }
  }
})
```

### Check Vendor Balance

```typescript
const vendor = await prisma.vendor.findUnique({
  where: { id: vendorId },
  select: {
    businessName: true,
    balance: true,
    pendingBalance: true,
    totalSales: true
  }
})

console.log('Available:', vendor.balance)
console.log('Pending:', vendor.pendingBalance)
console.log('Total Sales:', vendor.totalSales)
```

### Check Transaction History

```typescript
const transactions = await prisma.vendorTransaction.findMany({
  where: { vendorId },
  orderBy: { createdAt: 'desc' },
  take: 10,
  select: {
    type: true,
    amount: true,
    description: true,
    balanceBefore: true,
    balanceAfter: true,
    createdAt: true
  }
})
```

## ⚠️ Common Issues

### Commission Not Calculated
- Check order status is DELIVERED
- Check payment status is PAID
- Verify vendorId is set on order items
- Ensure vendor has commission rate

### Payout Generation Fails
- Verify vendor status is ACTIVE
- Check date range includes delivered orders
- Ensure orders have commission processed
- Verify no duplicate payouts for period

### Order Splitting Issues
- Check products have vendorId set
- Verify cart items include product relations
- Ensure vendor data is loaded
- Check shipping calculation logic

## 📞 Support

- Architecture Guide: `MARKETPLACE_ARCHITECTURE_GUIDE.md`
- Implementation Details: `PHASE_1_IMPLEMENTATION_COMPLETE.md`
- Schema Changes: `MARKETPLACE_SCHEMA_CHANGES.md`
- Summary: `MARKETPLACE_PHASE1_SUMMARY.md`
