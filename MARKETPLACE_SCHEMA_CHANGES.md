# Marketplace Schema Changes Summary

## Overview

The `CustomerSegment` model was recently enhanced with better segmentation capabilities. This triggered a comprehensive marketplace architecture review revealing critical gaps in the multi-vendor system.

## Recent Changes to CustomerSegment

```prisma
model CustomerSegment {
  id            String                      @id @default(cuid())
  name          String                      @unique  // ✅ NEW: Unique constraint
  description   String?
  criteria      Json                        // ✅ RENAMED: from 'filters'
  isAutomatic   Boolean                     @default(true)  // ✅ NEW: Auto vs manual
  customerCount Int                         @default(0)
  isActive      Boolean                     @default(true)
  createdAt     DateTime                    @default(now())
  updatedAt     DateTime                    @updatedAt
  assignments   CustomerSegmentAssignment[] // ✅ NEW: Relation
}
```

**Benefits**:
- Prevents duplicate segment names
- Clearer semantic meaning (criteria vs filters)
- Supports both automatic (rule-based) and manual segmentation
- Proper tracking of customer assignments

## Critical Missing Components

### 1. Vendor Payout Details ❌
**Current**: Basic `VendorPayout` model with minimal tracking
**Needed**: Line-item tracking, transaction ledger, payment method details

### 2. Vendor Performance Metrics ❌
**Current**: Basic fields on Vendor model (rating, totalSales)
**Needed**: Comprehensive KPIs (fulfillment rate, cancellation rate, customer satisfaction)

### 3. Dispute Resolution ❌
**Current**: No dispute system
**Needed**: Complete dispute workflow with evidence, messaging, and resolution tracking

### 4. Vendor Onboarding ❌
**Current**: Direct vendor creation
**Needed**: Application workflow with document verification and approval process

### 5. Multi-Vendor Order Splitting ❌
**Current**: Single vendor per order
**Needed**: Logic to split cart by vendor and create multiple orders

### 6. Mobile Money Integration ❌
**Current**: Paystack and Flutterwave only
**Needed**: Orange Money, MTN Money, Moov Money (critical for Côte d'Ivoire)

## Recommended Schema Additions

### Add These Models:

```prisma
// 1. Detailed payout tracking
model VendorPayoutItem {
  id          String        @id @default(cuid())
  payoutId    String
  orderId     String
  orderItemId String
  itemTotal   Float
  commission  Float
  netAmount   Float
  // ... relations
}

// 2. Transaction ledger
model VendorTransaction {
  id            String                 @id @default(cuid())
  vendorId      String
  type          VendorTransactionType  // SALE, COMMISSION, REFUND, PAYOUT, etc.
  amount        Float
  balanceBefore Float
  balanceAfter  Float
  // ... relations
}

// 3. Performance metrics
model VendorMetrics {
  id                  String   @id @default(cuid())
  vendorId            String   @unique
  totalSales          Float
  averageRating       Float
  fulfillmentRate     Float
  cancellationRate    Float
  repeatCustomerRate  Float
  // ... more KPIs
}

// 4. Dispute system
model Dispute {
  id              String        @id @default(cuid())
  orderId         String
  customerId      String
  vendorId        String
  type            DisputeType
  status          DisputeStatus
  resolution      String?
  refundAmount    Float?
  // ... relations
}

// 5. Vendor onboarding
model VendorApplication {
  id                  String                    @id @default(cuid())
  email               String                    @unique
  businessName        String
  status              VendorApplicationStatus
  businessLicense     String?
  mobileMoneyDetails  Json?
  // ... more fields
}
```

### Update Existing Models:

```prisma
model Vendor {
  // Add these fields
  balance           Float    @default(0)
  pendingBalance    Float    @default(0)
  
  // Add these relations
  transactions      VendorTransaction[]
  metrics           VendorMetrics?
  disputes          Dispute[]
}

model OrderItem {
  // Add these fields
  vendorId          String?
  commissionRate    Float?
  commissionAmount  Float?
  vendorAmount      Float?
}
```

## Implementation Priority

### Phase 1: Critical (Weeks 1-3)
1. ✅ Commission calculation service
2. ✅ Vendor transaction ledger
3. ✅ Enhanced payout system
4. ✅ Multi-vendor order splitting

### Phase 2: Important (Weeks 4-6)
5. ✅ Mobile Money integration (Orange Money first)
6. ✅ Vendor metrics calculator
7. ✅ Dispute resolution system

### Phase 3: Nice-to-Have (Weeks 7-10)
8. ✅ Vendor onboarding workflow
9. ✅ Vendor dashboard
10. ✅ Admin vendor management UI

## Market-Specific Considerations

### Côte d'Ivoire Requirements:

1. **Currency**: Support XOF (West African CFA franc) alongside EUR
2. **Mobile Money**: Orange Money (45% market share) is critical
3. **Language**: French-first with local dialect support
4. **Payment Methods**: Mobile Money > Bank Transfer > Cards
5. **Payout Frequency**: Bi-weekly (every 2 weeks) preferred
6. **Minimum Payout**: 50,000 XOF (~75 EUR)

### Commission Strategy:
- New vendors: 20%
- Growing vendors: 15%
- Established vendors: 10%
- Top performers: 8%

## Next Steps

1. **Review** the complete architecture guide: `MARKETPLACE_ARCHITECTURE_GUIDE.md`
2. **Approve** schema changes
3. **Run migration**: `npx prisma migrate dev --name add_marketplace_enhancements`
4. **Implement** Phase 1 services
5. **Set up** Mobile Money API accounts (Orange Money, MTN)
6. **Test** with 5-10 pilot vendors

## Files Created

- ✅ `MARKETPLACE_ARCHITECTURE_GUIDE.md` - Complete implementation guide
- ✅ `MARKETPLACE_SCHEMA_CHANGES.md` - This summary document

## Estimated Timeline

- **Schema Migration**: 1 week
- **Core Services**: 2-3 weeks
- **Mobile Money**: 2 weeks
- **Admin Panel**: 1 week
- **Vendor Portal**: 2 weeks
- **Testing & Launch**: 2 weeks

**Total**: ~10 weeks for full marketplace functionality

## Questions?

Refer to the detailed architecture guide for:
- Complete schema definitions
- Implementation code examples
- API route structures
- Best practices
- Monitoring strategies
