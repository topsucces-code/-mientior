# Design Document

## Overview

The Loyalty Program System integrates external loyalty platforms (LoyaltyLion or Smile.io) into the Mientior e-commerce platform to provide a comprehensive rewards program. The system manages member enrollment, points earning and redemption, tier progression, referral tracking, and reward fulfillment through a combination of local state management and external API synchronization.

The design follows an event-driven architecture where user actions trigger loyalty events that are processed locally and synchronized with the external platform. This approach ensures responsive user experience while maintaining data consistency with the authoritative external system.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mientior Platform                         │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐    ┌─────────────┐ │
│  │   Frontend   │─────▶│  API Routes  │───▶│  Loyalty    │ │
│  │  Components  │◀─────│  (Next.js)   │◀───│  Service    │ │
│  └──────────────┘      └──────────────┘    └──────┬──────┘ │
│                                                     │        │
│                        ┌────────────────────────────┘        │
│                        │                                     │
│                        ▼                                     │
│         ┌──────────────────────────┐                        │
│         │   Event Queue (Redis)    │                        │
│         └──────────────────────────┘                        │
│                        │                                     │
└────────────────────────┼─────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  External Loyalty Platform    │
         │  (LoyaltyLion / Smile.io)     │
         │                               │
         │  - Member Management          │
         │  - Points Calculation         │
         │  - Tier Logic                 │
         │  - Rewards Catalog            │
         └───────────────────────────────┘
```

### Component Responsibilities

**Frontend Components:**
- Display loyalty status, points balance, and tier information
- Render rewards catalog and redemption interface
- Show referral code and sharing options
- Provide points history and transaction details

**API Routes:**
- Handle loyalty-related HTTP requests
- Validate user permissions and authentication
- Coordinate between loyalty service and database
- Return formatted responses to frontend

**Loyalty Service:**
- Core business logic for loyalty operations
- Event generation and queueing
- External API communication
- Data synchronization and reconciliation
- Error handling and retry logic

**Event Queue (Redis):**
- Temporary storage for loyalty events
- Ensures reliable delivery to external platform
- Supports retry with exponential backoff
- Maintains event ordering

**External Platform:**
- Authoritative source for loyalty data
- Processes points calculations
- Manages tier progression logic
- Provides rewards catalog and redemption

## Components and Interfaces

### 1. Loyalty Service (`src/lib/loyalty.ts`)

Core service for all loyalty operations.

```typescript
interface LoyaltyService {
  // Member Management
  enrollMember(userId: string): Promise<LoyaltyMember>
  getMember(userId: string): Promise<LoyaltyMember | null>
  updateMemberTier(userId: string, tier: LoyaltyTier): Promise<void>
  
  // Points Operations
  awardPoints(userId: string, points: number, reason: string, metadata?: object): Promise<PointsTransaction>
  deductPoints(userId: string, points: number, reason: string): Promise<PointsTransaction>
  getPointsBalance(userId: string): Promise<number>
  getPointsHistory(userId: string, filters?: HistoryFilters): Promise<PointsTransaction[]>
  
  // Rewards
  getRewardsCatalog(userId: string): Promise<Reward[]>
  redeemReward(userId: string, rewardId: string): Promise<RedemptionResult>
  applyRewardCode(code: string, orderId: string): Promise<void>
  
  // Referrals
  getReferralCode(userId: string): Promise<string>
  trackReferral(referralCode: string, newUserId: string): Promise<void>
  processReferralReward(referrerId: string, referredId: string): Promise<void>
  
  // Sync and Reconciliation
  syncMemberData(userId: string): Promise<void>
  reconcileAllMembers(): Promise<ReconciliationReport>
}
```

### 2. External Platform Client (`src/lib/loyalty-client.ts`)

Abstraction layer for external API communication.

```typescript
interface LoyaltyClient {
  // Configuration
  initialize(config: LoyaltyConfig): void
  
  // Member Operations
  createMember(data: CreateMemberData): Promise<ExternalMember>
  getMember(externalId: string): Promise<ExternalMember>
  updateMember(externalId: string, data: UpdateMemberData): Promise<ExternalMember>
  
  // Points Operations
  addPoints(externalId: string, points: number, metadata: PointsMetadata): Promise<ExternalTransaction>
  subtractPoints(externalId: string, points: number, reason: string): Promise<ExternalTransaction>
  getBalance(externalId: string): Promise<number>
  
  // Rewards Operations
  listRewards(tierId?: string): Promise<ExternalReward[]>
  redeemReward(externalId: string, rewardId: string): Promise<ExternalRedemption>
  
  // Webhooks
  verifyWebhookSignature(payload: string, signature: string): boolean
  handleWebhook(event: WebhookEvent): Promise<void>
}
```

### 3. Event Queue Manager (`src/lib/loyalty-queue.ts`)

Manages event queueing and retry logic.

```typescript
interface EventQueueManager {
  // Queue Operations
  enqueue(event: LoyaltyEvent): Promise<void>
  dequeue(): Promise<LoyaltyEvent | null>
  peek(): Promise<LoyaltyEvent | null>
  
  // Processing
  processQueue(): Promise<ProcessingResult>
  retryFailed(): Promise<void>
  
  // Monitoring
  getQueueSize(): Promise<number>
  getFailedEvents(): Promise<LoyaltyEvent[]>
  clearQueue(): Promise<void>
}

interface LoyaltyEvent {
  id: string
  type: 'points_earned' | 'points_redeemed' | 'member_created' | 'tier_upgraded' | 'referral_completed'
  userId: string
  data: object
  timestamp: Date
  retryCount: number
  maxRetries: number
  nextRetryAt?: Date
}
```

### 4. Points Calculator (`src/lib/loyalty-calculator.ts`)

Calculates points based on business rules.

```typescript
interface PointsCalculator {
  // Purchase Points
  calculatePurchasePoints(orderTotal: number, tier: LoyaltyTier): number
  
  // Engagement Points
  getReviewPoints(): number
  getSocialSharePoints(): number
  getNewsletterPoints(): number
  getBirthdayPoints(): number
  
  // Referral Points
  getReferrerRewardPoints(): number
  getReferredRewardPoints(): number
  getAmbassadorBonusPoints(): number
  
  // Tier Multipliers
  getTierMultiplier(tier: LoyaltyTier): number
  
  // Tier Thresholds
  getTierThreshold(tier: LoyaltyTier): number
  calculateNextTier(lifetimePoints: number): LoyaltyTier | null
}
```

### 5. Rewards Manager (`src/lib/loyalty-rewards.ts`)

Manages reward catalog and redemption.

```typescript
interface RewardsManager {
  // Catalog
  getAvailableRewards(userId: string): Promise<Reward[]>
  getRewardById(rewardId: string): Promise<Reward | null>
  filterByTier(rewards: Reward[], tier: LoyaltyTier): Reward[]
  
  // Redemption
  validateRedemption(userId: string, rewardId: string): Promise<ValidationResult>
  processRedemption(userId: string, rewardId: string): Promise<string> // Returns reward code
  generateRewardCode(rewardId: string): string
  
  // Code Management
  validateRewardCode(code: string): Promise<RewardCodeValidation>
  markCodeAsUsed(code: string): Promise<void>
  restoreCode(code: string): Promise<void>
}
```

## Data Models

### Database Schema Extensions

```prisma
model LoyaltyMember {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  externalId        String   @unique // ID from external platform
  tier              LoyaltyTier @default(BRONZE)
  pointsBalance     Int      @default(0)
  lifetimePoints    Int      @default(0)
  referralCode      String   @unique
  referredBy        String?
  referralCount     Int      @default(0)
  enrolledAt        DateTime @default(now())
  lastSyncAt        DateTime @default(now())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  transactions      PointsTransaction[]
  redemptions       RewardRedemption[]
  
  @@index([userId])
  @@index([externalId])
  @@index([referralCode])
}

enum LoyaltyTier {
  BRONZE
  SILVER
  GOLD
  PLATINUM
}

model PointsTransaction {
  id              String   @id @default(cuid())
  memberId        String
  member          LoyaltyMember @relation(fields: [memberId], references: [id], onDelete: Cascade)
  type            TransactionType
  points          Int
  reason          String
  metadata        Json?
  balanceAfter    Int
  expiresAt       DateTime?
  externalId      String?  // ID from external platform
  createdAt       DateTime @default(now())
  
  @@index([memberId, createdAt])
  @@index([expiresAt])
}

enum TransactionType {
  EARNED
  REDEEMED
  EXPIRED
  ADJUSTED
  REFUNDED
}

model RewardRedemption {
  id              String   @id @default(cuid())
  memberId        String
  member          LoyaltyMember @relation(fields: [memberId], references: [id], onDelete: Cascade)
  rewardId        String
  rewardName      String
  pointsCost      Int
  rewardCode      String   @unique
  status          RedemptionStatus @default(PENDING)
  usedAt          DateTime?
  expiresAt       DateTime?
  orderId         String?
  order           Order?   @relation(fields: [orderId], references: [id])
  externalId      String?  // ID from external platform
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([memberId])
  @@index([rewardCode])
  @@index([status])
}

enum RedemptionStatus {
  PENDING
  ACTIVE
  USED
  EXPIRED
  CANCELLED
}

model LoyaltyEvent {
  id              String   @id @default(cuid())
  type            String
  userId          String
  data            Json
  status          EventStatus @default(PENDING)
  retryCount      Int      @default(0)
  maxRetries      Int      @default(5)
  nextRetryAt     DateTime?
  processedAt     DateTime?
  error           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([status, nextRetryAt])
  @@index([userId])
}

enum EventStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

### TypeScript Interfaces

```typescript
interface LoyaltyMember {
  id: string
  userId: string
  externalId: string
  tier: LoyaltyTier
  pointsBalance: number
  lifetimePoints: number
  referralCode: string
  referredBy?: string
  referralCount: number
  enrolledAt: Date
  lastSyncAt: Date
}

interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number
  type: 'discount' | 'free_shipping' | 'product' | 'custom'
  value: number | string
  tierRequirement?: LoyaltyTier
  availableQuantity?: number
  expiryDays?: number
  imageUrl?: string
}

interface RedemptionResult {
  success: boolean
  rewardCode?: string
  message: string
  expiresAt?: Date
}

interface PointsTransaction {
  id: string
  memberId: string
  type: TransactionType
  points: number
  reason: string
  metadata?: object
  balanceAfter: number
  expiresAt?: Date
  createdAt: Date
}

interface TierBenefits {
  tier: LoyaltyTier
  pointsMultiplier: number
  discountPercentage: number
  freeShipping: boolean
  expressShipping: boolean
  earlyAccess: boolean
}
```

## Error Hand
ling

### Error Categories

**1. External API Errors**
- Network failures
- Rate limiting (429)
- Authentication errors (401)
- Service unavailable (503)
- Invalid requests (400)

**Strategy:** Queue events in Redis and retry with exponential backoff (1s, 2s, 4s, 8s, 16s, 32s). After max retries, alert administrators and mark for manual review.

**2. Data Synchronization Errors**
- Points balance mismatch
- Missing member records
- Duplicate transactions
- Stale data

**Strategy:** Daily reconciliation job compares local and external data. Discrepancies are logged and flagged for admin review. Critical mismatches trigger immediate alerts.

**3. Redemption Errors**
- Insufficient points
- Reward out of stock
- Expired reward code
- Already used code

**Strategy:** Validate before processing. If redemption fails after points deduction, automatically restore points and notify user with clear error message.

**4. Referral Tracking Errors**
- Invalid referral code
- Self-referral attempt
- Duplicate referral claim

**Strategy:** Validate referral codes before registration. Prevent self-referrals by checking user identity. Track referral claims to prevent duplicates.

### Error Recovery Patterns

```typescript
// Retry with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 5
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      const delay = Math.pow(2, i) * 1000
      await sleep(delay)
    }
  }
  
  throw lastError
}

// Graceful degradation
async function getPointsBalance(userId: string): Promise<number> {
  try {
    // Try external platform first
    const member = await loyaltyClient.getMember(userId)
    return member.pointsBalance
  } catch (error) {
    // Fall back to local cache
    logger.warn('External API unavailable, using cached balance', { userId, error })
    const localMember = await prisma.loyaltyMember.findUnique({
      where: { userId }
    })
    return localMember?.pointsBalance ?? 0
  }
}
```

### Monitoring and Alerts

- Queue size exceeds 1000 events → Alert administrators
- Sync failure rate > 5% → Alert administrators
- Points balance discrepancy > 100 points → Alert administrators
- API response time > 5 seconds → Log warning
- Failed events older than 24 hours → Alert administrators


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Member enrollment creates Bronze tier with referral code

*For any* user registration, when enrollment completes, the created member profile should have Bronze tier status and a unique referral code that doesn't collide with existing codes.

**Validates: Requirements 1.1, 1.2**

### Property 2: Welcome bonus awarded on enrollment

*For any* successful member enrollment, the member should receive the configured welcome bonus points in their initial balance.

**Validates: Requirements 1.3**

### Property 3: Purchase points exclude taxes and shipping

*For any* completed order, the points calculation should be based only on the subtotal (product prices) and should not include taxes or shipping costs.

**Validates: Requirements 2.1**

### Property 4: Tier multipliers applied correctly

*For any* order and member tier combination, the points awarded should equal the base points multiplied by the tier-specific multiplier (Bronze: 1x, Silver: 1.25x, Gold: 1.5x, Platinum: 2x).

**Validates: Requirements 2.2**

### Property 5: Refund deducts corresponding points

*For any* order that is refunded, the points previously awarded for that order should be deducted from the member's balance, maintaining the invariant that total points earned equals sum of all non-refunded order points.

**Validates: Requirements 2.4**

### Property 6: Duplicate engagement actions prevented

*For any* engagement action (review, social share, newsletter), if the same action is performed by the same member within 24 hours, only the first occurrence should award points.

**Validates: Requirements 3.5**

### Property 7: Tier upgrades apply benefits immediately

*For any* member who crosses a tier threshold, all subsequent transactions should use the new tier's multiplier and benefits, not the previous tier's.

**Validates: Requirements 4.5**

### Property 8: Highest discount applied when multiple available

*For any* order where multiple discounts are applicable (tier discount, reward code, promotion), only the discount with the highest value should be applied to the order total.

**Validates: Requirements 5.5**

### Property 9: Reward affordability correctly indicated

*For any* member viewing the rewards catalog, rewards should be marked as redeemable if and only if the member's available points balance is greater than or equal to the reward's point cost.

**Validates: Requirements 6.2**

### Property 10: Tier-exclusive rewards filtered correctly

*For any* member viewing rewards, only rewards with no tier requirement or with a tier requirement less than or equal to the member's current tier should be displayed.

**Validates: Requirements 6.3**

### Property 11: Out-of-stock rewards prevent redemption

*For any* reward with zero available quantity, redemption attempts should be rejected with an appropriate error, regardless of the member's points balance.

**Validates: Requirements 6.5**

### Property 12: Redemption deducts points atomically

*For any* successful reward redemption, the points deduction and reward code generation should occur atomically - either both succeed or both fail, never leaving the system in an inconsistent state.

**Validates: Requirements 7.2, 7.3**

### Property 13: Unique reward codes generated

*For any* set of reward redemptions, all generated reward codes should be unique with no collisions.

**Validates: Requirements 7.3**

### Property 14: Failed redemption restores points

*For any* redemption that fails after points are deducted (due to external API error, code generation failure, etc.), the deducted points should be restored to the member's balance.

**Validates: Requirements 7.5**

### Property 15: Reward code single-use enforcement

*For any* reward code that has been successfully applied to an order, subsequent attempts to use the same code should be rejected.

**Validates: Requirements 8.2**

### Property 16: Expired codes rejected

*For any* reward code with an expiry date in the past, validation should fail and the code should not be applicable to any order.

**Validates: Requirements 8.3**

### Property 17: Cancelled order restores code

*For any* order that is cancelled after a reward code was applied, the reward code should be marked as unused and become available for reuse.

**Validates: Requirements 8.5**

### Property 18: Referral links tracked

*For any* new user registration that includes a valid referral code, the system should create a link between the new member and the referrer member.

**Validates: Requirements 9.2**

### Property 19: Transaction history chronological ordering

*For any* member's points history, transactions should be displayed in reverse chronological order (newest first) based on the transaction creation timestamp.

**Validates: Requirements 10.1**

### Property 20: Transaction display completeness

*For any* displayed transaction, all required fields (date, action type, points amount, running balance) should be present in the rendered output.

**Validates: Requirements 10.2**

### Property 21: History filtering correctness

*For any* points history with applied filters (date range, transaction type), all displayed transactions should match the filter criteria and no matching transactions should be excluded.

**Validates: Requirements 10.3**

### Property 22: CSV export completeness

*For any* points history export, the generated CSV should contain all transactions with all fields, and parsing the CSV should reconstruct the complete transaction data.

**Validates: Requirements 10.4**

### Property 23: Points expiry date set correctly

*For any* points transaction that awards points, the expiry date should be set to exactly 12 months from the transaction creation date.

**Validates: Requirements 11.1**

### Property 24: FIFO points redemption

*For any* points redemption, the system should deduct points starting with the oldest (earliest expiry date) points first, maintaining FIFO ordering.

**Validates: Requirements 11.5**

### Property 25: Tier progress calculation accuracy

*For any* member, the displayed progress toward the next tier should equal (current lifetime points - current tier threshold) / (next tier threshold - current tier threshold), expressed as a percentage.

**Validates: Requirements 12.2**

### Property 26: Manual adjustment logging

*For any* administrator manual points adjustment, the system should create a transaction record with type ADJUSTED, include the adjustment reason, and log the administrator's identity.

**Validates: Requirements 13.3**

### Property 27: Deactivated rewards block new redemptions

*For any* reward that has been deactivated by an administrator, new redemption attempts should be rejected, but existing unredeemed codes for that reward should remain valid.

**Validates: Requirements 13.5**

### Property 28: API failure queueing and retry

*For any* loyalty event that fails to sync with the external API, the event should be added to the retry queue with exponential backoff timing, and retry attempts should continue until success or max retries reached.

**Validates: Requirements 14.2**

### Property 29: Rate limit throttling

*For any* sequence of API requests that would exceed the rate limit, the system should automatically throttle requests by introducing delays to stay within the allowed rate.

**Validates: Requirements 14.5**

## Testing Strategy

### Unit Testing

Unit tests will verify specific business logic, calculations, and edge cases:

- **Points Calculator**: Test tier multipliers, purchase point calculations, engagement point awards
- **Tier Progression**: Test threshold detection, tier upgrade logic
- **Reward Validation**: Test affordability checks, tier requirements, stock validation
- **Code Generation**: Test uniqueness, format validation
- **FIFO Logic**: Test points expiry ordering, oldest-first deduction
- **Error Handling**: Test balance restoration on failures, negative balance prevention
- **Filtering**: Test date range filters, transaction type filters
- **CSV Export**: Test format correctness, data completeness

Example unit tests:
- Calculate points for €100 order with Gold tier (should be 150 points with 1.5x multiplier)
- Attempt redemption with insufficient points (should fail with appropriate error)
- Apply reward code twice (second attempt should be rejected)
- Deduct 50 points from 30 point balance (should result in 0, not negative)

### Property-Based Testing

Property-based tests will verify universal correctness properties across many randomly generated inputs using **fast-check** library. Each test will run a minimum of 100 iterations.

**Test Configuration:**
```typescript
import fc from 'fast-check'

// Run each property test 100 times minimum
const testConfig = { numRuns: 100 }
```

**Property Test Examples:**

1. **Enrollment Property**: Generate random user data, enroll members, verify all have Bronze tier and unique referral codes
2. **Points Calculation Property**: Generate random orders and tiers, verify points = subtotal * tier multiplier
3. **Refund Invariant Property**: Generate orders, award points, refund, verify points deducted correctly
4. **Tier Upgrade Property**: Generate point awards that cross thresholds, verify tier upgrades and benefit application
5. **Discount Selection Property**: Generate multiple discounts, verify highest value is applied
6. **Redemption Atomicity Property**: Generate redemptions, simulate failures, verify points restored
7. **Code Uniqueness Property**: Generate many redemptions, verify no code collisions
8. **FIFO Property**: Generate points with different expiry dates, redeem some, verify oldest deducted first
9. **Filter Correctness Property**: Generate transaction histories and filters, verify all results match criteria
10. **CSV Round-trip Property**: Generate transactions, export to CSV, parse CSV, verify data matches original

**Generators:**

```typescript
// Generate random loyalty members
const memberArbitrary = fc.record({
  userId: fc.uuid(),
  tier: fc.constantFrom('BRONZE', 'SILVER', 'GOLD', 'PLATINUM'),
  pointsBalance: fc.integer({ min: 0, max: 50000 }),
  lifetimePoints: fc.integer({ min: 0, max: 100000 })
})

// Generate random orders
const orderArbitrary = fc.record({
  subtotal: fc.float({ min: 10, max: 1000, noNaN: true }),
  tax: fc.float({ min: 0, max: 200, noNaN: true }),
  shipping: fc.float({ min: 0, max: 50, noNaN: true })
})

// Generate random rewards
const rewardArbitrary = fc.record({
  id: fc.uuid(),
  pointsCost: fc.integer({ min: 100, max: 10000 }),
  tierRequirement: fc.option(fc.constantFrom('BRONZE', 'SILVER', 'GOLD', 'PLATINUM')),
  availableQuantity: fc.option(fc.integer({ min: 0, max: 100 }))
})
```

### Integration Testing

Integration tests will verify interactions between components:

- **External API Integration**: Test communication with LoyaltyLion/Smile.io APIs
- **Event Queue Processing**: Test event queueing, retry logic, failure handling
- **Database Transactions**: Test atomic operations, rollback on errors
- **Email Notifications**: Test email sending for tier upgrades, expiry reminders
- **Webhook Handling**: Test webhook signature verification, event processing

### End-to-End Testing

E2E tests will verify complete user flows:

- Complete purchase → earn points → view balance
- Redeem reward → receive code → apply at checkout
- Refer friend → friend purchases → receive referral bonus
- Reach tier threshold → upgrade → receive benefits
- View points history → filter → export CSV

### Performance Testing

- Test queue processing with 10,000+ events
- Test reconciliation with 100,000+ members
- Test reward catalog rendering with 1,000+ rewards
- Verify API response times under load

### Security Testing

- Test referral code validation (prevent self-referrals)
- Test reward code tampering prevention
- Test admin permission enforcement
- Test webhook signature verification
- Test SQL injection prevention in filters

All tests should be co-located with source files using `.test.ts` suffix. Property-based tests must be tagged with comments referencing the specific correctness property they validate using the format: `**Feature: loyalty-program, Property {number}: {property_text}**`