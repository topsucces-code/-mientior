# Marketplace Commission Architecture Guide

## Overview

This document outlines the comprehensive commission system architecture for the Mientior marketplace, specifically designed for the Côte d'Ivoire market with Mobile Money integration.

## Architecture Principles

### 1. **Multi-Tier Commission Structure**
- **Performance-based rates**: Commission rates decrease as vendor performance improves
- **Category-specific modifiers**: Different rates for different product categories
- **Dynamic adjustments**: Real-time rate calculations based on vendor metrics

### 2. **Mobile Money First**
- **Primary payment method**: Orange Money, MTN Mobile Money, Moov Money
- **Local market focus**: Optimized for West African payment preferences
- **Multi-currency support**: XOF (primary) and EUR

### 3. **Scalable Architecture**
- **Atomic transactions**: All commission calculations use database transactions
- **Redis caching**: Performance optimization for high-volume operations
- **Event-driven updates**: Automatic metric recalculation on order completion

## Commission Tier System

### Vendor Tiers and Rates

| Tier | Base Rate | Min Sales (XOF) | Min Rating | Max Dispute Rate |
|------|-----------|-----------------|------------|------------------|
| Bronze | 15% | 0 | 0.00 | 100% |
| Silver | 12% | 1,000,000 | 4.00 | 5% |
| Gold | 10% | 5,000,000 | 4.50 | 2% |
| Platinum | 8% | 10,000,000 | 4.80 | 1% |

### Category Modifiers

| Category | Modifier | Reason |
|----------|----------|---------|
| Electronics | -2% | High-value items, lower handling |
| Fashion | 0% | Standard rate |
| Food & Beverage | +1% | Perishables, higher risk |
| Services | -1% | Lower overhead |
| Handmade | -3% | Support local artisans |

### Performance Bonuses

| Metric | Threshold | Bonus |
|--------|-----------|-------|
| High Rating | ≥4.5 stars | -0.5% |
| Low Disputes | <2% rate | -0.5% |
| Fast Delivery | ≥95% on-time | -0.5% |

## Database Schema

### Core Tables

#### VendorTransaction
```sql
CREATE TABLE "VendorTransaction" (
    "id" TEXT PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- SALE, COMMISSION, PAYOUT, REFUND
    "amount" INTEGER NOT NULL, -- Amount in cents
    "currency" TEXT DEFAULT 'XOF',
    "description" TEXT NOT NULL,
    "orderId" TEXT,
    "balanceBefore" INTEGER DEFAULT 0,
    "balanceAfter" INTEGER DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### VendorPerformanceMetrics
```sql
CREATE TABLE "VendorPerformanceMetrics" (
    "vendorId" TEXT PRIMARY KEY,
    "totalSales" INTEGER DEFAULT 0,
    "orderCount" INTEGER DEFAULT 0,
    "averageRating" DECIMAL(3,2) DEFAULT 0.00,
    "disputeRate" DECIMAL(5,4) DEFAULT 0.0000,
    "onTimeDeliveryRate" DECIMAL(5,4) DEFAULT 1.0000,
    "tier" TEXT DEFAULT 'BRONZE',
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### PayoutRequest
```sql
CREATE TABLE "PayoutRequest" (
    "id" TEXT PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL, -- MOBILE_MONEY, BANK_TRANSFER, CASH
    "status" TEXT DEFAULT 'PENDING',
    "transactionId" TEXT,
    "metadata" JSONB, -- Mobile Money details
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Commission Calculation Flow

### 1. Order Completion Trigger
```typescript
// When order status changes to COMPLETED
await processOrderCommissionAdvanced(orderId)
```

### 2. Commission Calculation
```typescript
const calculation = calculateAdvancedCommission(item, order)
// Returns:
// - baseCommissionRate: Tier-based rate
// - finalCommissionRate: After all modifiers
// - commissionAmount: Platform fee
// - vendorAmount: Amount credited to vendor
// - fees: Breakdown of all fees
```

### 3. Balance Updates
```typescript
// Atomic transaction updates:
// 1. OrderItem commission details
// 2. Vendor pending balance
// 3. VendorTransaction records
// 4. Performance metrics
// 5. Automatic payout scheduling
```

## Mobile Money Integration

### Supported Providers (Côte d'Ivoire)

#### Orange Money
- **API Integration**: Orange Money Merchant API
- **Transaction Flow**: Direct payout to vendor phone number
- **Fees**: 1% transaction fee
- **Limits**: 1,000 - 2,000,000 XOF per transaction

#### MTN Mobile Money
- **API Integration**: MTN MoMo API
- **Transaction Flow**: Disbursement API for payouts
- **Fees**: 1.5% transaction fee
- **Limits**: 500 - 1,500,000 XOF per transaction

#### Moov Money
- **API Integration**: Moov Money API
- **Transaction Flow**: Merchant-to-wallet transfer
- **Fees**: 1.2% transaction fee
- **Limits**: 1,000 - 1,000,000 XOF per transaction

### Payout Processing Flow

```typescript
// 1. Validate payout request
const validation = validatePayoutRequest(request)

// 2. Process based on method
switch (method) {
  case 'MOBILE_MONEY':
    result = await processMobileMoneyPayout(request)
    break
  case 'BANK_TRANSFER':
    result = await processBankTransfer(request)
    break
}

// 3. Update balances and create transaction records
await updateVendorBalance(vendorId, amount)
```

## Performance Optimization

### Redis Caching Strategy

#### Commission Data Cache
```typescript
// Cache commission calculations for 24 hours
const cacheKey = `commission:order:${orderId}`
await redis.setex(cacheKey, 86400, JSON.stringify(data))
```

#### Vendor Metrics Cache
```typescript
// Cache vendor performance metrics for 1 hour
const metricsKey = `vendor:metrics:${vendorId}`
await redis.setex(metricsKey, 3600, JSON.stringify(metrics))
```

### Database Indexes

```sql
-- Performance indexes
CREATE INDEX "VendorTransaction_vendorId_createdAt_idx" 
ON "VendorTransaction"("vendorId", "createdAt");

CREATE INDEX "PayoutRequest_status_scheduledAt_idx" 
ON "PayoutRequest"("status", "scheduledAt");

CREATE INDEX "OrderItem_vendorId_idx" 
ON "OrderItem"("vendorId");
```

## Security Considerations

### 1. **Financial Data Protection**
- All amounts stored in cents to avoid floating-point errors
- Atomic transactions for all balance updates
- Audit trail for all financial operations

### 2. **Mobile Money Security**
- Phone number validation for Côte d'Ivoire format
- Transaction ID tracking for reconciliation
- Retry logic with exponential backoff

### 3. **Access Control**
- Admin permissions required for payout processing
- Vendor-specific data isolation
- Rate limiting on financial operations

## Monitoring and Analytics

### Key Metrics Dashboard

#### Platform Metrics
- Total commission revenue
- Average commission rate
- Payout processing time
- Failed payout rate

#### Vendor Metrics
- Tier distribution
- Performance trends
- Payout preferences
- Dispute resolution time

### Alerting System

#### Critical Alerts
- Failed payouts > 5%
- Commission calculation errors
- Vendor balance discrepancies
- Mobile Money API failures

#### Performance Alerts
- Payout processing time > 24 hours
- Commission calculation time > 5 seconds
- Database query performance degradation

## Implementation Checklist

### Phase 1: Core Commission System
- [ ] Database schema migration
- [ ] Commission calculation engine
- [ ] Vendor performance tracking
- [ ] Basic payout system

### Phase 2: Mobile Money Integration
- [ ] Orange Money API integration
- [ ] MTN Mobile Money API integration
- [ ] Moov Money API integration
- [ ] Payout processing automation

### Phase 3: Advanced Features
- [ ] Real-time analytics dashboard
- [ ] Automated tier adjustments
- [ ] Dispute resolution workflow
- [ ] Performance optimization

### Phase 4: Scaling and Optimization
- [ ] Redis caching implementation
- [ ] Database query optimization
- [ ] Load testing and performance tuning
- [ ] Monitoring and alerting setup

## API Endpoints

### Admin Endpoints
```
GET /api/admin/commission/stats - Commission statistics
GET /api/admin/payouts - Payout requests list
POST /api/admin/payouts - Create payout request
POST /api/admin/payouts/[id]/process - Process payout
```

### Vendor Endpoints
```
GET /api/vendor/dashboard - Vendor dashboard data
GET /api/vendor/transactions - Transaction history
POST /api/vendor/payout-request - Request payout
GET /api/vendor/performance - Performance metrics
```

## Testing Strategy

### Unit Tests
- Commission calculation accuracy
- Tier determination logic
- Mobile Money integration
- Balance update atomicity

### Integration Tests
- End-to-end order processing
- Payout workflow testing
- API endpoint validation
- Database transaction integrity

### Load Tests
- High-volume order processing
- Concurrent payout processing
- Database performance under load
- Redis cache effectiveness

## Deployment Considerations

### Environment Variables
```env
# Mobile Money API Keys
ORANGE_MONEY_API_KEY=
MTN_MOMO_API_KEY=
MOOV_MONEY_API_KEY=

# Commission Settings
DEFAULT_COMMISSION_RATE=0.15
MINIMUM_PAYOUT_AMOUNT=100000
PAYOUT_PROCESSING_SCHEDULE=daily

# Redis Configuration
REDIS_URL=redis://localhost:6379
COMMISSION_CACHE_TTL=86400
```

### Database Migration
```bash
# Apply marketplace commission schema
psql -d mientior -f prisma/marketplace-commission-schema.sql

# Verify schema changes
npm run db:studio
```

### Production Deployment
1. **Database Migration**: Apply schema changes during maintenance window
2. **Feature Flags**: Enable commission system gradually
3. **Monitoring**: Set up alerts for financial operations
4. **Backup**: Ensure financial data backup procedures

## Conclusion

This commission architecture provides a robust, scalable foundation for the Mientior marketplace. The system is designed to:

- **Scale efficiently** from 10 to 10,000+ vendors
- **Adapt to local market** needs in Côte d'Ivoire
- **Provide transparency** for all stakeholders
- **Ensure financial accuracy** and security
- **Support business growth** through performance incentives

The modular design allows for easy extension and customization as the marketplace evolves and expands to new markets.