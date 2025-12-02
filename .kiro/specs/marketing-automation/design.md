# Design Document

## Overview

The Marketing Automation System integrates external marketing platforms (Klaviyo or ActiveCampaign) into the Mientior e-commerce platform to enable automated, personalized customer communication. The system manages contact synchronization, event tracking, campaign creation, automated flows, and analytics through a combination of real-time event streaming and batch synchronization.

The design follows an event-driven architecture where user actions trigger marketing events that are processed locally and synchronized with the external platform. This approach ensures responsive user experience while maintaining data consistency with the authoritative external marketing system.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mientior Platform                         │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐    ┌─────────────┐ │
│  │   Frontend   │─────▶│  API Routes  │───▶│  Marketing  │ │
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
         │  Marketing Automation Platform│
         │  (Klaviyo / ActiveCampaign)   │
         │                               │
         │  - Contact Management         │
         │  - Event Tracking             │
         │  - Campaign Execution         │
         │  - Flow Automation            │
         │  - Analytics & Reporting      │
         └───────────────────────────────┘
```

### Component Responsibilities

**Frontend Components:**
- Display newsletter subscription forms
- Show back-in-stock notification signup
- Render push notification permission requests
- Display marketing preferences in user account

**API Routes:**
- Handle marketing-related HTTP requests
- Validate user permissions and consent
- Coordinate between marketing service and database
- Return formatted responses to frontend

**Marketing Service:**
- Core business logic for marketing operations
- Event generation and queueing
- External API communication
- Contact and event synchronization
- Campaign and flow management

**Event Queue (Redis):**
- Temporary storage for marketing events
- Ensures reliable delivery to external platform
- Supports retry with exponential backoff
- Maintains event ordering

**External Platform:**
- Authoritative source for marketing data
- Executes campaigns and automated flows
- Processes segmentation logic
- Provides analytics and reporting
- Manages email/SMS/push delivery

## Components and Interfaces

### 1. Marketing Service (`src/lib/marketing.ts`)

Core service for all marketing operations.

```typescript
interface MarketingService {
  // Contact Management
  syncContact(userId: string): Promise<void>
  updateContact(userId: string, properties: ContactProperties): Promise<void>
  subscribeToNewsletter(email: string, source: string): Promise<void>
  unsubscribe(email: string, reason?: string): Promise<void>
  
  // Event Tracking
  trackEvent(event: MarketingEvent): Promise<void>
  trackProductView(userId: string, productId: string): Promise<void>
  trackAddToCart(userId: string, item: CartItem): Promise<void>
  trackPurchase(userId: string, order: Order): Promise<void>
  trackCartAbandonment(userId: string, cart: Cart): Promise<void>
  
  // Segmentation
  getSegments(): Promise<Segment[]>
  getSegmentContacts(segmentId: string): Promise<Contact[]>
  addToSegment(userId: string, segmentId: string): Promise<void>
  removeFromSegment(userId: string, segmentId: string): Promise<void>
  
  // Back-in-Stock
  subscribeToBackInStock(email: string, productId: string): Promise<void>
  notifyBackInStock(productId: string): Promise<void>
  
  // Analytics
  getCampaignMetrics(campaignId: string): Promise<CampaignMetrics>
  getFlowMetrics(flowId: string): Promise<FlowMetrics>
  getDashboardMetrics(): Promise<DashboardMetrics>
}
```

### 2. Marketing Client (`src/lib/marketing-client.ts`)

Abstraction layer for external API communication.

```typescript
interface MarketingClient {
  // Configuration
  initialize(config: MarketingConfig): void
  
  // Contact Operations
  createContact(data: CreateContactData): Promise<ExternalContact>
  updateContact(email: string, properties: ContactProperties): Promise<ExternalContact>
  getContact(email: string): Promise<ExternalContact | null>
  deleteContact(email: string): Promise<void>
  
  // Event Operations
  trackEvent(event: ExternalEvent): Promise<void>
  trackBatch(events: ExternalEvent[]): Promise<void>
  
  // List/Segment Operations
  addToList(email: string, listId: string): Promise<void>
  removeFromList(email: string, listId: string): Promise<void>
  getListMembers(listId: string): Promise<ExternalContact[]>
  
  // Campaign Operations
  getCampaigns(): Promise<ExternalCampaign[]>
  getCampaignMetrics(campaignId: string): Promise<ExternalMetrics>
  
  // Flow Operations
  getFlows(): Promise<ExternalFlow[]>
  getFlowMetrics(flowId: string): Promise<ExternalMetrics>
  
  // Webhooks
  verifyWebhookSignature(payload: string, signature: string): boolean
  handleWebhook(event: WebhookEvent): Promise<void>
}
```

### 3. Event Queue Manager (`src/lib/marketing-queue.ts`)

Manages event queueing and retry logic.

```typescript
interface EventQueueManager {
  // Queue Operations
  enqueue(event: MarketingEvent): Promise<void>
  dequeueBatch(batchSize: number): Promise<MarketingEvent[]>
  
  // Processing
  processQueue(): Promise<ProcessingResult>
  retryFailed(): Promise<void>
  
  // Monitoring
  getQueueSize(): Promise<number>
  getFailedEvents(): Promise<MarketingEvent[]>
  clearQueue(): Promise<void>
}

interface MarketingEvent {
  id: string
  type: 'contact_created' | 'contact_updated' | 'product_viewed' | 'added_to_cart' | 'placed_order' | 'cart_abandoned'
  userId?: string
  email: string
  data: object
  timestamp: Date
  retryCount: number
  maxRetries: number
  nextRetryAt?: Date
}
```

### 4. Contact Sync Manager (`src/lib/marketing-contact-sync.ts`)

Manages contact synchronization between platforms.

```typescript
interface ContactSyncManager {
  // Sync Operations
  syncContact(userId: string): Promise<SyncResult>
  syncAllContacts(): Promise<SyncReport>
  reconcileContact(userId: string): Promise<ReconciliationResult>
  
  // Property Mapping
  mapUserToContact(user: User): ContactData
  mapContactProperties(user: User): ContactProperties
  
  // Consent Management
  updateConsent(userId: string, consent: ConsentData): Promise<void>
  getConsentHistory(userId: string): Promise<ConsentRecord[]>
}
```

### 5. Campaign Manager (`src/lib/marketing-campaigns.ts`)

Manages campaign creation and analytics.

```typescript
interface CampaignManager {
  // Campaign Operations
  getCampaigns(filters?: CampaignFilters): Promise<Campaign[]>
  getCampaignById(campaignId: string): Promise<Campaign | null>
  getCampaignMetrics(campaignId: string): Promise<CampaignMetrics>
  
  // Flow Operations
  getFlows(filters?: FlowFilters): Promise<Flow[]>
  getFlowById(flowId: string): Promise<Flow | null>
  getFlowMetrics(flowId: string): Promise<FlowMetrics>
  
  // Analytics
  getDashboardMetrics(dateRange?: DateRange): Promise<DashboardMetrics>
  compareMetrics(campaignIds: string[]): Promise<ComparisonResult>
}
```

## Data Models

### Database Schema Extensions

```prisma
model MarketingContact {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  email             String   @unique
  externalId        String?  @unique // ID from external platform
  newsletterOptIn   Boolean  @default(false)
  smsOptIn          Boolean  @default(false)
  pushOptIn         Boolean  @default(false)
  lastSyncAt        DateTime @default(now())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  consents          MarketingConsent[]
  events            MarketingEventLog[]
  backInStockSubs   BackInStockSubscription[]
  
  @@index([email])
  @@index([externalId])
  @@index([userId])
}

model MarketingConsent {
  id              String   @id @default(cuid())
  contactId       String
  contact         MarketingContact @relation(fields: [contactId], references: [id], onDelete: Cascade)
  type            ConsentType
  granted         Boolean
  source          String   // 'registration', 'checkout', 'preferences', etc.
  ipAddress       String?
  userAgent       String?
  timestamp       DateTime @default(now())
  
  @@index([contactId, type])
  @@index([timestamp])
}

enum ConsentType {
  EMAIL
  SMS
  PUSH
  MARKETING
  ANALYTICS
}

model MarketingEventLog {
  id              String   @id @default(cuid())
  contactId       String?
  contact         MarketingContact? @relation(fields: [contactId], references: [id], onDelete: SetNull)
  type            String
  data            Json
  externalId      String?  // ID from external platform
  status          EventStatus @default(PENDING)
  retryCount      Int      @default(0)
  maxRetries      Int      @default(5)
  nextRetryAt     DateTime?
  processedAt     DateTime?
  error           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([status, nextRetryAt])
  @@index([contactId])
  @@index([type])
}

enum EventStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model BackInStockSubscription {
  id              String   @id @default(cuid())
  contactId       String
  contact         MarketingContact @relation(fields: [contactId], references: [id], onDelete: Cascade)
  productId       String
  product         Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  notified        Boolean  @default(false)
  notifiedAt      DateTime?
  createdAt       DateTime @default(now())
  
  @@unique([contactId, productId])
  @@index([productId, notified])
}

model MarketingCampaignCache {
  id              String   @id @default(cuid())
  externalId      String   @unique
  name            String
  type            CampaignType
  status          CampaignStatus
  metrics         Json
  lastFetchedAt   DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([type, status])
}

enum CampaignType {
  EMAIL
  SMS
  PUSH
  FLOW
}

enum CampaignStatus {
  DRAFT
  SCHEDULED
  SENDING
  SENT
  PAUSED
  ARCHIVED
}
```

### TypeScript Interfaces

```typescript
interface ContactData {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  properties: ContactProperties
}

interface ContactProperties {
  userId: string
  registrationDate: Date
  loyaltyTier?: string
  lifetimeValue: number
  orderCount: number
  lastPurchaseDate?: Date
  location?: string
  language: string
  timezone: string
  [key: string]: any
}

interface MarketingEvent {
  type: string
  email: string
  userId?: string
  timestamp: Date
  properties: Record<string, any>
}

interface CampaignMetrics {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  unsubscribed: number
  openRate: number
  clickRate: number
  conversionRate: number
  revenue: number
  roi: number
}

interface FlowMetrics extends CampaignMetrics {
  enrolled: number
  completed: number
  completionRate: number
  averageTimeToComplete: number
  messageMetrics: MessageMetrics[]
}

interface MessageMetrics {
  messageId: string
  messageName: string
  sent: number
  opened: number
  clicked: number
  openRate: number
  clickRate: number
}

interface DashboardMetrics {
  totalContacts: number
  contactGrowth: number
  activeFlows: number
  recentCampaigns: number
  revenue30Days: number
  topCampaigns: CampaignSummary[]
  topFlows: FlowSummary[]
  contactGrowthTrend: DataPoint[]
}

interface Segment {
  id: string
  name: string
  description: string
  contactCount: number
  filters: SegmentFilter[]
}

interface SegmentFilter {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
}
```

## Error Handling

### Error Categories

**1. External API Errors**
- Network failures
- Rate limiting (429)
- Authentication errors (401)
- Service unavailable (503)
- Invalid requests (400)

**Strategy:** Queue events in Redis and retry with exponential backoff (1s, 2s, 4s, 8s, 16s, 32s). After max retries, alert administrators and mark for manual review.

**2. Contact Synchronization Errors**
- Duplicate email addresses
- Missing required fields
- Invalid email format
- Contact not found

**Strategy:** Validate data before sending. Log errors with contact details. Retry with corrected data. Alert administrators for manual resolution if needed.

**3. Event Tracking Errors**
- Missing event properties
- Invalid event type
- Event too large
- Timestamp in future

**Strategy:** Validate events before queueing. Drop invalid events and log warnings. Ensure event schema compliance.

**4. Consent Management Errors**
- Missing consent record
- Conflicting consent states
- Expired consent

**Strategy:** Default to no consent if unclear. Require explicit opt-in for marketing. Maintain complete audit trail.

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
async function trackEvent(event: MarketingEvent): Promise<void> {
  try {
    // Try external platform first
    await marketingClient.trackEvent(event)
  } catch (error) {
    // Fall back to queue
    logger.warn('External API unavailable, queueing event', { event, error })
    await eventQueue.enqueue(event)
  }
}
```

### Monitoring and Alerts

- Queue size exceeds 10,000 events → Alert administrators
- Sync failure rate > 5% → Alert administrators
- Event processing lag > 5 minutes → Alert administrators
- API response time > 5 seconds → Log warning
- Failed events older than 24 hours → Alert administrators
- Unsubscribe rate > 2% → Alert marketing team

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Contact creation includes required fields

*For any* user registration, when a contact is created, the contact should have email, name, and registration date populated.

**Validates: Requirements 1.1**

### Property 2: Contact updates sync within time limit

*For any* user profile update, the corresponding contact properties should be updated in the external platform within 5 minutes.

**Validates: Requirements 1.2**

### Property 3: Newsletter subscription adds to segment

*For any* newsletter subscription, the contact should be added to the newsletter segment immediately.

**Validates: Requirements 1.3**

### Property 4: Unsubscribe stops all communications

*For any* unsubscribe action, the contact should be added to the suppression list and no further marketing messages should be sent.

**Validates: Requirements 1.4**

### Property 5: Failed sync retries with backoff

*For any* contact sync failure, the system should queue the update and retry with exponential backoff timing until success or max retries reached.

**Validates: Requirements 1.5**

### Property 6: Product view events tracked

*For any* product view, a product viewed event should be recorded with product details within 30 seconds.

**Validates: Requirements 2.1, 2.5**

### Property 7: Cart events tracked

*For any* add to cart action, an added to cart event should be recorded with item details within 30 seconds.

**Validates: Requirements 2.2, 2.5**

### Property 8: Purchase events tracked

*For any* completed purchase, a placed order event should be recorded with order details within 30 seconds.

**Validates: Requirements 2.3, 2.5**

### Property 9: Cart abandonment detected

*For any* cart that remains inactive for 1 hour, a cart abandoned event should be recorded.

**Validates: Requirements 2.4**

### Property 10: Segment membership updates

*For any* contact whose attributes change, segment membership should be updated within 10 minutes.

**Validates: Requirements 3.3**

### Property 11: Suppression list respected

*For any* campaign send, contacts on the suppression list should not receive messages.

**Validates: Requirements 4.5**

### Property 12: Flow enrollment on trigger

*For any* trigger event occurrence, the contact should be enrolled in the corresponding flow immediately.

**Validates: Requirements 5.1**

### Property 13: Duplicate enrollment prevented

*For any* contact already in a flow, subsequent enrollment attempts for the same flow should be rejected.

**Validates: Requirements 5.4**

### Property 14: Flow exit on condition

*For any* contact meeting an exit condition, they should be removed from the flow immediately.

**Validates: Requirements 5.3**

### Property 15: Welcome flow enrollment

*For any* user registration, the user should be enrolled in the welcome flow immediately.

**Validates: Requirements 6.1**

### Property 16: Welcome flow exit on purchase

*For any* user who makes a purchase while in the welcome flow, they should be exited from the flow.

**Validates: Requirements 6.5**

### Property 17: Cart recovery enrollment timing

*For any* abandoned cart, the contact should be enrolled in the cart recovery flow after exactly 1 hour of inactivity.

**Validates: Requirements 7.1**

### Property 18: Cart recovery exit on purchase

*For any* user who completes a purchase while in the cart recovery flow, they should be exited from the flow.

**Validates: Requirements 7.5**

### Property 19: Post-purchase enrollment

*For any* completed purchase, the contact should be enrolled in the post-purchase flow immediately.

**Validates: Requirements 8.1**

### Property 20: Win-back enrollment timing

*For any* customer with no purchase for 90 days, they should be enrolled in the win-back flow.

**Validates: Requirements 9.1**

### Property 21: SMS opt-in validation

*For any* SMS campaign, only contacts who have explicitly opted in to SMS should receive messages.

**Validates: Requirements 10.1**

### Property 22: SMS opt-out link included

*For any* SMS message sent, the message should include an opt-out link.

**Validates: Requirements 10.2**

### Property 23: SMS opt-out immediate

*For any* SMS opt-out action, the contact should be added to the SMS suppression list immediately.

**Validates: Requirements 10.3**

### Property 24: Push permission required

*For any* push notification send, only users who have granted push permission should receive the notification.

**Validates: Requirements 11.3**

### Property 25: Push token removal on revoke

*For any* user who revokes push permission, their device token should be removed immediately.

**Validates: Requirements 11.5**

### Property 26: Campaign metrics calculated correctly

*For any* campaign, the open rate should equal (opened / delivered) * 100 and click rate should equal (clicked / delivered) * 100.

**Validates: Requirements 12.2**

### Property 27: A/B test random assignment

*For any* A/B test, contacts should be randomly assigned to variants with equal probability within the test sample.

**Validates: Requirements 14.3**

### Property 28: A/B test winner selection

*For any* completed A/B test, the variant with the highest performance metric should be sent to remaining contacts.

**Validates: Requirements 14.4**

### Property 29: Personalization fallback

*For any* message with missing personalization variables, default fallback values should be used.

**Validates: Requirements 16.4**

### Property 30: Consent timestamp recorded

*For any* subscription action, the consent timestamp and source should be recorded.

**Validates: Requirements 17.1**

### Property 31: Unsubscribe processed timely

*For any* unsubscribe request, the request should be processed within 24 hours.

**Validates: Requirements 17.2**

### Property 32: Unsubscribe link in emails

*For any* marketing email sent, the email should contain an unsubscribe link.

**Validates: Requirements 17.3**

### Property 33: Back-in-stock notification timing

*For any* product returning to stock, notifications should be sent to all waitlist contacts within 1 hour.

**Validates: Requirements 19.3**

### Property 34: Waitlist removal on purchase

*For any* user who purchases a product, they should be removed from that product's waitlist.

**Validates: Requirements 19.5**

## Testing Strategy

### Unit Testing

Unit tests will verify specific business logic, calculations, and edge cases:

- **Contact Mapping**: Test user-to-contact property mapping
- **Event Validation**: Test event schema validation
- **Consent Logic**: Test consent state management
- **Segment Filtering**: Test segment filter evaluation
- **Metrics Calculation**: Test rate and percentage calculations
- **Error Handling**: Test retry logic, fallback behavior
- **Queue Operations**: Test event queueing and dequeuing

Example unit tests:
- Map user with all fields to contact (should include all properties)
- Validate event with missing required field (should fail)
- Calculate open rate for campaign with 100 sent, 25 opened (should be 25%)
- Process unsubscribe for opted-in contact (should add to suppression list)

### Property-Based Testing

Property-based tests will verify universal correctness properties across many randomly generated inputs using **fast-check** library. Each test will run a minimum of 100 iterations.

**Test Configuration:**
```typescript
import fc from 'fast-check'

// Run each property test 100 times minimum
const testConfig = { numRuns: 100 }
```

**Property Test Examples:**

1. **Contact Creation Property**: Generate random users, create contacts, verify all have required fields
2. **Event Tracking Property**: Generate random events, track them, verify all sent within time limit
3. **Suppression List Property**: Generate campaigns and suppressed contacts, verify none receive messages
4. **Flow Enrollment Property**: Generate trigger events, verify contacts enrolled in correct flows
5. **Duplicate Prevention Property**: Generate enrollment attempts, verify duplicates rejected
6. **Metrics Calculation Property**: Generate campaign data, verify rates calculated correctly
7. **A/B Test Assignment Property**: Generate test participants, verify random distribution
8. **Consent Validation Property**: Generate contacts with various consent states, verify only opted-in receive messages
9. **Personalization Fallback Property**: Generate messages with missing variables, verify fallbacks used
10. **Timing Property**: Generate time-based triggers, verify actions occur at correct times

**Generators:**

```typescript
// Generate random contacts
const contactArbitrary = fc.record({
  email: fc.emailAddress(),
  firstName: fc.string({ minLength: 1, maxLength: 50 }),
  lastName: fc.string({ minLength: 1, maxLength: 50 }),
  newsletterOptIn: fc.boolean(),
  smsOptIn: fc.boolean(),
  pushOptIn: fc.boolean()
})

// Generate random events
const eventArbitrary = fc.record({
  type: fc.constantFrom('product_viewed', 'added_to_cart', 'placed_order', 'cart_abandoned'),
  email: fc.emailAddress(),
  timestamp: fc.date(),
  properties: fc.dictionary(fc.string(), fc.anything())
})

// Generate random campaigns
const campaignArbitrary = fc.record({
  id: fc.uuid(),
  sent: fc.integer({ min: 100, max: 10000 }),
  delivered: fc.integer({ min: 90, max: 9900 }),
  opened: fc.integer({ min: 10, max: 5000 }),
  clicked: fc.integer({ min: 5, max: 2000 })
})
```

### Integration Testing

Integration tests will verify interactions between components:

- **External API Integration**: Test communication with Klaviyo/ActiveCampaign APIs
- **Event Queue Processing**: Test event queueing, batch processing, retry logic
- **Database Transactions**: Test atomic operations, rollback on errors
- **Webhook Handling**: Test webhook signature verification, event processing
- **Contact Sync**: Test full sync flow from user update to external platform

### End-to-End Testing

E2E tests will verify complete user flows:

- User registers → contact created → welcome flow enrolled
- User abandons cart → cart recovery flow triggered → email received
- User purchases → post-purchase flow enrolled → review request sent
- User unsubscribes → suppression list updated → no further emails
- Product back in stock → waitlist notified → purchase link works

### Performance Testing

- Test event queue processing with 100,000+ events
- Test contact sync with 1,000,000+ contacts
- Test campaign send simulation with 500,000+ recipients
- Verify API response times under load
- Test webhook processing throughput

### Security Testing

- Test consent validation (prevent unauthorized sends)
- Test suppression list enforcement
- Test webhook signature verification
- Test data deletion compliance
- Test SQL injection prevention in filters

All tests should be co-located with source files using `.test.ts` suffix. Property-based tests must be tagged with comments referencing the specific correctness property they validate using the format: `**Feature: marketing-automation, Property {number}: {property_text}**`
