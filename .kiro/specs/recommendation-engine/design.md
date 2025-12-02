# Design Document - Recommendation Engine Integration

## Overview

This design document outlines the integration of an AI-powered recommendation engine (Recombee or Nosto) into the Mientior e-commerce platform. The system will provide personalized product recommendations across multiple touchpoints including product pages, homepage, cart, and checkout.

The design follows a service-oriented architecture where the recommendation engine is integrated as an external service, with our platform handling event tracking, product synchronization, and recommendation display. The system supports multiple recommendation scenarios, A/B testing, and privacy-compliant personalization.

Key capabilities include:
- Real-time personalized product recommendations
- Multiple recommendation types (similar, frequently bought together, trending, personalized)
- Event tracking for continuous learning
- Product catalog synchronization
- A/B testing for optimization
- Privacy-compliant personalization
- Performance monitoring and fallback strategies
- Admin configuration interface

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Front-End                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Product Page │  │ Homepage     │  │ Cart Page    │         │
│  │ Widgets      │  │ Widgets      │  │ Widgets      │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          │ API Calls        │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Routes Layer                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/recommendations/similar                            │  │
│  │  /api/recommendations/personalized                       │  │
│  │  /api/recommendations/trending                           │  │
│  │  /api/recommendations/cart                               │  │
│  │  /api/recommendations/track                              │  │
│  └──────────────────┬───────────────────────────────────────┘  │
└─────────────────────┼──────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  Service Layer   │    │  External API    │
│  ┌────────────┐  │    │  ┌────────────┐  │
│  │ Recommend  │◄─┼────┼─►│ Recombee/  │  │
│  │ Service    │  │    │  │ Nosto API  │  │
│  │            │  │    │  └────────────┘  │
│  │ Event      │  │    └──────────────────┘
│  │ Tracker    │  │
│  │            │  │
│  │ Product    │  │
│  │ Sync       │  │
│  │            │  │
│  │ A/B Test   │  │
│  │ Manager    │  │
│  └────────────┘  │
└──────────────────┘
          │
          ▼
┌──────────────────┐
│  Data Layer      │
│  ┌────────────┐  │
│  │ PostgreSQL │  │
│  │ - Config   │  │
│  │ - A/B Tests│  │
│  │ - Metrics  │  │
│  └────────────┘  │
│  ┌────────────┐  │
│  │ Redis      │  │
│  │ - Cache    │  │
│  │ - Queue    │  │
│  └────────────┘  │
└──────────────────┘
```

## Components and Interfaces

### Database Schema Extensions

```prisma
// Recommendation Configuration
model RecommendationScenario {
  id                String              @id @default(cuid())
  code              String              @unique
  name              String
  type              RecommendationType
  isEnabled         Boolean             @default(true)
  itemCount         Int                 @default(6)
  displayRules      Json?               // Display conditions
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  @@index([code])
  @@index([isEnabled])
  @@map("recommendation_scenarios")
}

// A/B Test Configuration
model RecommendationABTest {
  id                String              @id @default(cuid())
  name              String
  scenarioCode      String
  isActive          Boolean             @default(true)
  startDate         DateTime
  endDate           DateTime?
  variants          Json                // Array of variant configurations
  results           Json?               // Test results
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  assignments       ABTestAssignment[]
  
  @@index([scenarioCode])
  @@index([isActive])
  @@map("recommendation_ab_tests")
}

// User A/B Test Assignment
model ABTestAssignment {
  id                String              @id @default(cuid())
  testId            String
  userId            String?
  sessionId         String?
  variantId         String
  assignedAt        DateTime            @default(now())
  
  test              RecommendationABTest @relation(fields: [testId], references: [id], onDelete: Cascade)
  
  @@unique([testId, userId])
  @@unique([testId, sessionId])
  @@index([testId])
  @@map("ab_test_assignments")
}

// Recommendation Metrics
model RecommendationMetric {
  id                String              @id @default(cuid())
  scenarioCode      String
  productId         String
  userId            String?
  sessionId         String?
  eventType         String              // impression, click, add_to_cart, purchase
  variantId         String?
  metadata          Json?
  createdAt         DateTime            @default(now())
  
  @@index([scenarioCode])
  @@index([productId])
  @@index([createdAt])
  @@map("recommendation_metrics")
}

// Product Boost Rules
model ProductBoostRule {
  id                String              @id @default(cuid())
  productId         String
  boostStrength     Float               @default(1.5)
  startDate         DateTime
  endDate           DateTime?
  isActive          Boolean             @default(true)
  createdBy         String
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  product           Product             @relation(fields: [productId], references: [id], onDelete: Cascade)
  creator           User                @relation(fields: [createdBy], references: [id])
  
  @@index([productId])
  @@index([isActive])
  @@map("product_boost_rules")
}

// Enums
enum RecommendationType {
  SIMILAR
  FREQUENTLY_BOUGHT_TOGETHER
  PERSONALIZED
  TRENDING
  CART_BASED
  CATEGORY_BASED
}

// Update existing Product model
model Product {
  // ... existing fields ...
  boostRules        ProductBoostRule[]
}

// Update existing User model
model User {
  // ... existing fields ...
  boostRulesCreated ProductBoostRule[]
}
```

### API Endpoints

**GET /api/recommendations/similar/[productId]**
Get similar products for a given product.

Query Parameters:
- `limit`: Number of recommendations (default: 6)
- `userId`: User ID for personalization

**GET /api/recommendations/personalized**
Get personalized recommendations for a user.

Query Parameters:
- `userId`: User ID (required for logged-in users)
- `sessionId`: Session ID (for anonymous users)
- `limit`: Number of recommendations (default: 12)

**GET /api/recommendations/trending**
Get trending products.

Query Parameters:
- `limit`: Number of recommendations (default: 8)
- `category`: Filter by category

**GET /api/recommendations/cart**
Get recommendations based on cart contents.

Request Body:
```typescript
{
  cartItems: string[]  // Array of product IDs
  userId?: string
  limit?: number
}
```

**POST /api/recommendations/track**
Track user interaction event.

Request Body:
```typescript
{
  eventType: 'view' | 'click' | 'add_to_cart' | 'purchase'
  productId: string
  userId?: string
  sessionId?: string
  scenarioCode?: string
  metadata?: object
}
```

**GET /api/recommendations/frequently-bought-together/[productId]**
Get products frequently bought together.

Query Parameters:
- `limit`: Number of recommendations (default: 4)

### Service Layer

```typescript
class RecommendationService {
  /**
   * Gets similar products
   */
  async getSimilarProducts(
    productId: string,
    userId?: string,
    limit?: number
  ): Promise<Product[]>
  
  /**
   * Gets personalized recommendations
   */
  async getPersonalizedRecommendations(
    userId?: string,
    sessionId?: string,
    limit?: number
  ): Promise<Product[]>
  
  /**
   * Gets trending products
   */
  async getTrendingProducts(
    limit?: number,
    category?: string
  ): Promise<Product[]>
  
  /**
   * Gets cart-based recommendations
   */
  async getCartRecommendations(
    cartItems: string[],
    userId?: string,
    limit?: number
  ): Promise<Product[]>
  
  /**
   * Gets frequently bought together
   */
  async getFrequentlyBoughtTogether(
    productId: string,
    limit?: number
  ): Promise<Product[]>
}

class EventTrackingService {
  /**
   * Tracks user interaction
   */
  async trackInteraction(event: InteractionEvent): Promise<void>
  
  /**
   * Batches and sends events
   */
  async flushEventBatch(): Promise<void>
  
  /**
   * Tracks recommendation impression
   */
  async trackImpression(
    scenarioCode: string,
    productIds: string[],
    userId?: string
  ): Promise<void>
  
  /**
   * Tracks recommendation click
   */
  async trackClick(
    scenarioCode: string,
    productId: string,
    userId?: string
  ): Promise<void>
}

class ProductSyncService {
  /**
   * Syncs product to recommendation engine
   */
  async syncProduct(productId: string): Promise<void>
  
  /**
   * Syncs all products
   */
  async syncAllProducts(): Promise<void>
  
  /**
   * Removes product from engine
   */
  async removeProduct(productId: string): Promise<void>
  
  /**
   * Updates product availability
   */
  async updateAvailability(
    productId: string,
    inStock: boolean
  ): Promise<void>
}

class ABTestService {
  /**
   * Assigns user to A/B test variant
   */
  async assignVariant(
    testId: string,
    userId?: string,
    sessionId?: string
  ): Promise<string>
  
  /**
   * Gets active A/B tests
   */
  async getActiveTests(scenarioCode: string): Promise<RecommendationABTest[]>
  
  /**
   * Tracks A/B test metrics
   */
  async trackTestMetric(
    testId: string,
    variantId: string,
    eventType: string,
    metadata?: object
  ): Promise<void>
  
  /**
   * Analyzes A/B test results
   */
  async analyzeTestResults(testId: string): Promise<ABTestResults>
}
```

## Data Models

```typescript
interface InteractionEvent {
  eventType: 'view' | 'click' | 'add_to_cart' | 'purchase'
  productId: string
  userId?: string
  sessionId?: string
  scenarioCode?: string
  timestamp: Date
  metadata?: {
    price?: number
    quantity?: number
    category?: string
  }
}

interface RecommendationRequest {
  scenarioCode: string
  userId?: string
  sessionId?: string
  contextProductId?: string
  contextProductIds?: string[]
  limit: number
  filters?: {
    category?: string
    priceMin?: number
    priceMax?: number
    excludeProductIds?: string[]
  }
}

interface RecommendationResponse {
  products: Product[]
  scenarioCode: string
  reason?: string
  metadata?: {
    algorithm: string
    confidence: number
  }
}

interface ABTestResults {
  testId: string
  variants: Array<{
    variantId: string
    impressions: number
    clicks: number
    conversions: number
    ctr: number
    conversionRate: number
    revenue: number
  }>
  winner?: string
  confidence: number
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

Property 1: Recommendation retrieval
*For any* valid recommendation request, the system should return products matching the scenario type and respect the specified limit
**Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1**

Property 2: Event tracking persistence
*For any* tracked interaction event, the system should store the event and forward it to the recommendation engine
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

Property 3: Product sync consistency
*For any* product update, the system should sync changes to the recommendation engine within the specified time window
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

Property 4: A/B test variant consistency
*For any* user assigned to an A/B test variant, the system should maintain that assignment across all sessions
**Validates: Requirements 8.2, 8.3**

Property 5: Privacy compliance
*For any* user who opts out of personalization, the system should stop sending personal data and show only non-personalized recommendations
**Validates: Requirements 10.1, 10.2, 10.3**

Property 6: Cache effectiveness
*For any* recommendation request, if a valid cached response exists, the system should return it without calling the external API
**Validates: Requirements 11.5**

Property 7: Fallback behavior
*For any* failed API call to the recommendation engine, the system should return rule-based recommendations without error
**Validates: Requirements 11.2**

Property 8: Boost rule application
*For any* active boost rule, the system should increase the likelihood of the specified product appearing in recommendations
**Validates: Requirements 13.1, 13.4**

## Testing Strategy

### Unit Testing
- Recommendation service methods
- Event batching logic
- A/B test assignment logic
- Cache key generation
- Fallback recommendation logic

### Property-Based Testing
**Framework**: fast-check
**Configuration**: 100 iterations per test

Property tests for:
- Recommendation limit enforcement
- Event tracking data integrity
- A/B test variant consistency
- Privacy opt-out enforcement
- Cache expiration logic

### Integration Testing
- Complete recommendation flow (request → API → display)
- Event tracking end-to-end
- Product sync workflow
- A/B test assignment and tracking
- Fallback scenarios

## Implementation Notes

### Technology Choices

1. **Recommendation Engine**: Recombee (recommended) or Nosto
   - Recombee: Better for custom scenarios, flexible API
   - Nosto: Better for quick setup, pre-built widgets

2. **Event Batching**: Bull queue with Redis
   - Batch events every 30 seconds or 100 events
   - Retry failed batches with exponential backoff

3. **Caching**: Redis with 5-minute TTL
   - Cache recommendation responses
   - Invalidate on product updates

### Performance Optimization

1. **API Response Time**: Target < 200ms
2. **Event Tracking**: Async, non-blocking
3. **Product Sync**: Batch updates every 5 minutes
4. **Cache Hit Rate**: Target > 80%

### Monitoring

Track:
- API response times
- Cache hit rates
- Click-through rates
- Conversion rates
- Event tracking success rate
- Product sync status
