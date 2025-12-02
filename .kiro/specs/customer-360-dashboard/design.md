# Design Document

## Overview

The Customer 360 Dashboard provides a comprehensive, unified view of customer data within the Refine.dev admin panel. It aggregates information from multiple sources (orders, loyalty, marketing, support, analytics) into a single interface, enabling administrators to deliver superior customer service and make data-driven decisions.

The design follows Refine.dev patterns and integrates with existing Mientior systems through API endpoints and real-time data synchronization.

## Architecture

### Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│              Refine Admin Panel                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Customer 360 Dashboard Page                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │ Profile Card │  │ Metrics Card │  │ Health Card │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │ Orders       │  │ Loyalty      │  │ Marketing   │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │ Support      │  │ Timeline     │  │ Analytics   │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer                                 │
│  GET /api/admin/customers/[id]/360                          │
│  GET /api/admin/customers/[id]/orders                       │
│  GET /api/admin/customers/[id]/loyalty                      │
│  GET /api/admin/customers/[id]/marketing                    │
│  GET /api/admin/customers/[id]/support                      │
│  GET /api/admin/customers/[id]/timeline                     │
│  GET /api/admin/customers/[id]/analytics                    │
│  POST /api/admin/customers/[id]/notes                       │
│  POST /api/admin/customers/[id]/tags                        │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### API Endpoints

```typescript
// Main 360 view
GET /api/admin/customers/[id]/360
Response: {
  profile: CustomerProfile
  metrics: CustomerMetrics
  healthScore: HealthScore
  churnRisk: ChurnRisk
  segments: Segment[]
  tags: Tag[]
}

// Orders
GET /api/admin/customers/[id]/orders
Response: {
  orders: Order[]
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
}

// Loyalty
GET /api/admin/customers/[id]/loyalty
Response: {
  tier: string
  pointsBalance: number
  lifetimePoints: number
  referralCode: string
  referralCount: number
  recentTransactions: PointsTransaction[]
}

// Marketing
GET /api/admin/customers/[id]/marketing
Response: {
  emailOptIn: boolean
  smsOptIn: boolean
  pushOptIn: boolean
  campaigns: Campaign[]
  openRate: number
  clickRate: number
  segments: string[]
}

// Support
GET /api/admin/customers/[id]/support
Response: {
  tickets: SupportTicket[]
  totalTickets: number
  averageResolutionTime: number
  openTickets: number
}

// Timeline
GET /api/admin/customers/[id]/timeline
Query: { type?: string, from?: date, to?: date, limit?: number }
Response: {
  events: TimelineEvent[]
  hasMore: boolean
}

// Analytics
GET /api/admin/customers/[id]/analytics
Response: {
  topCategories: CategoryStat[]
  sessionStats: SessionStats
  deviceBreakdown: DeviceStats
  shoppingTimes: TimeStats
}

// Notes
POST /api/admin/customers/[id]/notes
Body: { content: string }
Response: { note: CustomerNote }

// Tags
POST /api/admin/customers/[id]/tags
Body: { tagId: string }
DELETE /api/admin/customers/[id]/tags/[tagId]
```

## Data Models

### Database Schema Extensions

```prisma
model CustomerNote {
  id          String   @id @default(cuid())
  customerId  String
  customer    User     @relation(fields: [customerId], references: [id], onDelete: Cascade)
  content     String   @db.Text
  createdBy   String
  author      User     @relation("NoteAuthor", fields: [createdBy], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([customerId])
  @@index([createdAt])
}

model CustomerTag {
  id          String   @id @default(cuid())
  name        String   @unique
  color       String
  description String?
  createdAt   DateTime @default(now())
  
  customers   CustomerTagAssignment[]
}

model CustomerTagAssignment {
  id          String   @id @default(cuid())
  customerId  String
  customer    User     @relation(fields: [customerId], references: [id], onDelete: Cascade)
  tagId       String
  tag         CustomerTag @relation(fields: [tagId], references: [id], onDelete: Cascade)
  assignedBy  String
  assignedAt  DateTime @default(now())
  
  @@unique([customerId, tagId])
  @@index([customerId])
  @@index([tagId])
}

model CustomerSegment {
  id          String   @id @default(cuid())
  name        String   @unique
  criteria    Json
  isAutomatic Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  assignments CustomerSegmentAssignment[]
}

model CustomerSegmentAssignment {
  id          String   @id @default(cuid())
  customerId  String
  customer    User     @relation(fields: [customerId], references: [id], onDelete: Cascade)
  segmentId   String
  segment     CustomerSegment @relation(fields: [segmentId], references: [id], onDelete: Cascade)
  assignedAt  DateTime @default(now())
  
  @@unique([customerId, segmentId])
  @@index([customerId])
  @@index([segmentId])
}

model CustomerHealthScore {
  id                String   @id @default(cuid())
  customerId        String   @unique
  customer          User     @relation(fields: [customerId], references: [id], onDelete: Cascade)
  score             Float    // 0-100
  purchaseScore     Float
  engagementScore   Float
  supportScore      Float
  recencyScore      Float
  calculatedAt      DateTime @default(now())
  
  @@index([score])
}

model CustomerChurnRisk {
  id                String   @id @default(cuid())
  customerId        String   @unique
  customer          User     @relation(fields: [customerId], references: [id], onDelete: Cascade)
  riskLevel         ChurnRiskLevel
  riskScore         Float    // 0-100
  daysSinceLastPurchase Int
  engagementDecline Float
  supportIssues     Int
  calculatedAt      DateTime @default(now())
  
  @@index([riskLevel])
}

enum ChurnRiskLevel {
  LOW
  MEDIUM
  HIGH
}
```

### TypeScript Interfaces

```typescript
interface Customer360View {
  profile: CustomerProfile
  metrics: CustomerMetrics
  healthScore: HealthScore
  churnRisk: ChurnRisk
  segments: Segment[]
  tags: Tag[]
}

interface CustomerProfile {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  registrationDate: Date
  accountStatus: string
  addresses: Address[]
}

interface CustomerMetrics {
  lifetimeValue: number
  totalOrders: number
  averageOrderValue: number
  totalSpent: number
  daysSinceLastPurchase: number
  purchaseFrequency: number
  customerTenure: number
}

interface HealthScore {
  score: number // 0-100
  level: 'excellent' | 'good' | 'fair' | 'poor'
  factors: {
    purchase: number
    engagement: number
    support: number
    recency: number
  }
  recommendations: string[]
}

interface ChurnRisk {
  level: 'low' | 'medium' | 'high'
  score: number // 0-100
  factors: {
    daysSinceLastPurchase: number
    engagementDecline: number
    supportIssues: number
  }
  retentionStrategies: string[]
}

interface TimelineEvent {
  id: string
  type: 'order' | 'support' | 'loyalty' | 'marketing' | 'account'
  title: string
  description: string
  timestamp: Date
  metadata?: object
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: Profile data completeness
*For any* customer 360 view request, all required profile fields (name, email, registration date, account status) should be present in the response.
**Validates: Requirements 1.1**

### Property 2: Metrics calculation accuracy
*For any* customer, the displayed lifetime value should equal the sum of all completed order totals.
**Validates: Requirements 3.1, 3.2**

### Property 3: Timeline chronological ordering
*For any* timeline view, events should be displayed in reverse chronological order (newest first).
**Validates: Requirements 7.1, 7.3**

### Property 4: Health score range validity
*For any* calculated health score, the value should be between 0 and 100 inclusive.
**Validates: Requirements 12.1**

### Property 5: Permission enforcement
*For any* admin user accessing customer data, the system should verify appropriate permissions before displaying sensitive information.
**Validates: Requirements 19.1, 19.2, 19.3**

### Property 6: Real-time update propagation
*For any* customer data change, all open dashboard sessions viewing that customer should receive the update within 5 seconds.
**Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5**

### Property 7: Note attribution
*For any* customer note created, the system should record the creating admin's identity and timestamp.
**Validates: Requirements 8.2**

### Property 8: Tag uniqueness per customer
*For any* customer, each tag should be assigned at most once (no duplicate tag assignments).
**Validates: Requirements 8.3, 8.4**

### Property 9: Export data completeness
*For any* customer data export, the generated file should contain all visible customer information from the dashboard.
**Validates: Requirements 17.2, 17.3**

### Property 10: Search result accuracy
*For any* customer search query, all returned results should match the search criteria.
**Validates: Requirements 15.1**

## Testing Strategy

### Unit Testing
- Health score calculation logic
- Churn risk calculation logic
- Metrics aggregation functions
- Timeline event formatting
- Permission checking logic

### Property-Based Testing
**Framework**: fast-check
**Configuration**: 100 iterations per test

Property tests for:
- Metrics calculation accuracy
- Health score range validity
- Timeline ordering
- Tag uniqueness enforcement
- Search result accuracy

### Integration Testing
- Complete 360 view data loading
- Real-time updates via WebSocket
- Note creation and display
- Tag assignment and removal
- Export generation

### E2E Testing
- Admin navigates to customer 360 view
- Admin adds note and sees it appear
- Admin applies tag and filters by it
- Admin exports customer data
- Real-time order update appears

## Implementation Notes

### Technology Stack
- **Frontend**: Refine.dev with Ant Design
- **Real-time**: Pusher or Socket.io
- **Charts**: Recharts
- **Export**: jsPDF, ExcelJS

### Performance Optimization
- Cache customer 360 data for 30 seconds
- Lazy load timeline events (pagination)
- Debounce search queries
- Optimize database queries with proper indexes

### Monitoring
- Track dashboard load times
- Monitor API response times
- Track real-time update latency
- Monitor export generation times
