# Design Document

## Overview

This design document outlines the architecture for enhancing the Mientior cart system from a client-only implementation to a robust, server-synchronized solution. The enhancement maintains the existing optimistic UI updates while adding server-side persistence, real-time stock validation, multi-device synchronization, and abandoned cart tracking.

The design follows a hybrid approach: client-side state management with Zustand for instant UI updates, backed by server-side persistence for reliability and cross-device synchronization. All cart operations use optimistic updates with automatic rollback on failure.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Zustand    │  │  React Query │  │  localStorage│      │
│  │  Cart Store  │◄─┤  Mutations   │◄─┤  Persistence │      │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘      │
│         │                  │                                 │
│         │                  │                                 │
└─────────┼──────────────────┼─────────────────────────────────┘
          │                  │
          │                  │ HTTP/REST
          │                  │
┌─────────┼──────────────────┼─────────────────────────────────┐
│         │                  │                                 │
│         ▼                  ▼                                 │
│  ┌──────────────────────────────────┐                       │
│  │      API Routes Layer             │                       │
│  │  /api/cart                        │                       │
│  │  /api/cart/sync                   │                       │
│  │  /api/cart/validate               │                       │
│  │  /api/cart/abandoned              │                       │
│  └──────────────┬───────────────────┘                       │
│                 │                                            │
│                 ▼                                            │
│  ┌──────────────────────────────────┐                       │
│  │     Service Layer                 │                       │
│  │  - CartService                    │                       │
│  │  - StockValidationService         │                       │
│  │  - CartSyncService                │                       │
│  │  - AbandonedCartService           │                       │
│  └──────────────┬───────────────────┘                       │
│                 │                                            │
│                 ▼                                            │
│  ┌──────────────────────────────────┐                       │
│  │     Data Layer                    │                       │
│  │  - Prisma ORM                     │                       │
│  │  - PostgreSQL (Cart, CartItem)    │                       │
│  │  - Redis (Stock Locks, Sessions)  │                       │
│  └───────────────────────────────────┘                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Add to Cart Flow:**
   - User clicks "Add to Cart"
   - Zustand store updates immediately (optimistic)
   - React Query mutation triggers API call
   - API validates stock and persists to database
   - On success: mutation completes
   - On failure: Zustand store rolls back, error displayed

2. **Cart Sync Flow:**
   - User loads application
   - Client fetches server cart via API
   - Server returns cart with current prices/stock
   - Client merges server cart with localStorage
   - Conflicts resolved (server wins for authenticated users)

3. **Stock Validation Flow:**
   - User modifies quantity
   - API checks current stock levels
   - If insufficient: returns error with max available
   - If sufficient: updates cart and returns success

## Components and Interfaces

### Database Schema Extensions

```prisma
model Cart {
  id            String      @id @default(cuid())
  userId        String?     @unique
  sessionToken  String?     @unique
  items         CartItem[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  lastActivity  DateTime    @default(now())
  isAbandoned   Boolean     @default(false)
  abandonedAt   DateTime?
  recoveredAt   DateTime?
  
  user          User?       @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([sessionToken])
  @@index([isAbandoned, lastActivity])
}

model CartItem {
  id              String    @id @default(cuid())
  cartId          String
  productId       String
  variantId       String?
  quantity        Int
  priceAtAdd      Int       // Price in cents when added
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  cart            Cart      @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product         Product   @relation(fields: [productId], references: [id])
  variant         ProductVariant? @relation(fields: [variantId], references: [id])
  
  @@unique([cartId, productId, variantId])
  @@index([cartId])
  @@index([productId])
}
```

### API Endpoints

#### GET /api/cart
Retrieves the current user's cart with up-to-date pricing and stock information.

**Response:**
```typescript
{
  success: boolean
  cart: {
    id: string
    items: Array<{
      id: string
      productId: string
      productName: string
      productSlug: string
      productImage: string
      variantId?: string
      variant?: { size?: string, color?: string, sku: string }
      quantity: number
      price: number // Current price
      priceAtAdd: number // Price when added
      priceChanged: boolean
      stock: number
      inStock: boolean
      maxQuantity: number
    }>
    totals: {
      subtotal: number
      shipping: number
      tax: number
      discount: number
      total: number
    }
  }
}
```

#### POST /api/cart/items
Adds an item to the cart with stock validation.

**Request:**
```typescript
{
  productId: string
  variantId?: string
  quantity: number
}
```

**Response:**
```typescript
{
  success: boolean
  item?: CartItem
  error?: string
  maxAvailable?: number // If quantity exceeds stock
}
```

#### PATCH /api/cart/items/[itemId]
Updates the quantity of a cart item.

**Request:**
```typescript
{
  quantity: number
}
```

**Response:**
```typescript
{
  success: boolean
  item?: CartItem
  error?: string
  maxAvailable?: number
}
```

#### DELETE /api/cart/items/[itemId]
Removes an item from the cart.

**Response:**
```typescript
{
  success: boolean
}
```

#### POST /api/cart/sync
Synchronizes client cart with server cart, handling conflicts.

**Request:**
```typescript
{
  clientCart: Array<{
    productId: string
    variantId?: string
    quantity: number
  }>
}
```

**Response:**
```typescript
{
  success: boolean
  cart: Cart // Merged cart
  conflicts: Array<{
    productId: string
    variantId?: string
    clientQuantity: number
    serverQuantity: number
    resolved: 'server' | 'client' | 'merged'
  }>
}
```

#### POST /api/cart/validate
Validates all cart items before checkout.

**Response:**
```typescript
{
  valid: boolean
  issues: Array<{
    itemId: string
    type: 'out_of_stock' | 'insufficient_stock' | 'price_changed' | 'unavailable'
    message: string
    currentStock?: number
    currentPrice?: number
  }>
}
```

#### GET /api/cart/abandoned
Admin endpoint to retrieve abandoned carts.

**Query Parameters:**
- `minValue`: Minimum cart value
- `since`: Date filter
- `limit`: Number of results
- `offset`: Pagination offset

**Response:**
```typescript
{
  success: boolean
  carts: Array<{
    id: string
    userId?: string
    userEmail?: string
    items: CartItem[]
    totalValue: number
    lastActivity: Date
    abandonedAt: Date
  }>
  total: number
}
```

### Service Layer

#### CartService

```typescript
class CartService {
  /**
   * Gets or creates a cart for the current user/session
   */
  async getOrCreateCart(userId?: string, sessionToken?: string): Promise<Cart>
  
  /**
   * Adds an item to the cart with stock validation
   */
  async addItem(
    cartId: string,
    productId: string,
    variantId: string | undefined,
    quantity: number
  ): Promise<{ success: boolean; item?: CartItem; error?: string; maxAvailable?: number }>
  
  /**
   * Updates item quantity with stock validation
   */
  async updateItemQuantity(
    itemId: string,
    quantity: number
  ): Promise<{ success: boolean; item?: CartItem; error?: string; maxAvailable?: number }>
  
  /**
   * Removes an item from the cart
   */
  async removeItem(itemId: string): Promise<void>
  
  /**
   * Clears all items from a cart
   */
  async clearCart(cartId: string): Promise<void>
  
  /**
   * Merges a guest cart into a user cart upon authentication
   */
  async mergeCart(guestCartId: string, userCartId: string): Promise<Cart>
  
  /**
   * Calculates cart totals with current prices
   */
  async calculateTotals(cartId: string): Promise<CartTotals>
}
```

#### StockValidationService

```typescript
class StockValidationService {
  /**
   * Validates if requested quantity is available
   */
  async validateStock(
    productId: string,
    variantId: string | undefined,
    quantity: number
  ): Promise<{ valid: boolean; available: number }>
  
  /**
   * Validates all items in a cart
   */
  async validateCartStock(cartId: string): Promise<ValidationResult[]>
  
  /**
   * Creates temporary stock locks for checkout
   */
  async createStockLocks(cartId: string, expiresIn: number): Promise<string[]>
  
  /**
   * Releases stock locks
   */
  async releaseStockLocks(lockIds: string[]): Promise<void>
}
```

#### CartSyncService

```typescript
class CartSyncService {
  /**
   * Synchronizes client cart with server cart
   */
  async syncCart(
    cartId: string,
    clientItems: ClientCartItem[]
  ): Promise<{ cart: Cart; conflicts: Conflict[] }>
  
  /**
   * Resolves conflicts between client and server state
   */
  private resolveConflicts(
    serverItems: CartItem[],
    clientItems: ClientCartItem[]
  ): { merged: CartItem[]; conflicts: Conflict[] }
}
```

#### AbandonedCartService

```typescript
class AbandonedCartService {
  /**
   * Marks carts as abandoned based on inactivity
   */
  async markAbandonedCarts(inactiveHours: number): Promise<number>
  
  /**
   * Retrieves abandoned carts for recovery campaigns
   */
  async getAbandonedCarts(filters: AbandonedCartFilters): Promise<AbandonedCart[]>
  
  /**
   * Marks a cart as recovered when converted to order
   */
  async markAsRecovered(cartId: string): Promise<void>
}
```

## Data Models

### Cart State (Client-Side)

```typescript
interface CartState {
  items: CartItem[]
  savedForLater: SavedForLaterItem[]
  appliedCoupon?: CouponCode
  freeShippingThreshold: number
  lastSyncedAt?: Date
  syncPending: boolean
  
  // Actions
  addItem: (item: CartItem) => Promise<void>
  removeItem: (id: string) => Promise<void>
  updateQuantity: (id: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  syncWithServer: () => Promise<void>
  
  // Getters
  getTotalItems: () => number
  getSubtotal: () => number
  getTotal: () => number
}
```

### Server Cart Models

```typescript
interface ServerCart {
  id: string
  userId?: string
  sessionToken?: string
  items: ServerCartItem[]
  createdAt: Date
  updatedAt: Date
  lastActivity: Date
  isAbandoned: boolean
  abandonedAt?: Date
  recoveredAt?: Date
}

interface ServerCartItem {
  id: string
  cartId: string
  productId: string
  variantId?: string
  quantity: number
  priceAtAdd: number
  product: {
    id: string
    name: string
    slug: string
    price: number
    images: ProductImage[]
    stock: number
  }
  variant?: {
    id: string
    size?: string
    color?: string
    sku: string
    stock: number
  }
  createdAt: Date
  updatedAt: Date
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing all testable properties from the prework analysis, I've identified opportunities to consolidate redundant properties:

**Consolidations:**
- Properties 2.1, 2.3 (stock validation on add and update) can be combined into a single comprehensive stock validation property
- Properties 1.5, 1.6 (cart association for authenticated/guest users) can be combined into a single cart ownership property
- Properties 5.1, 5.5 (current prices in cart view and totals) can be combined into a single current pricing property
- Properties 8.1, 8.3 (price reduction and unavailability notifications) represent the same detection mechanism and can be combined
- Properties 9.1, 9.2, 9.3 (various cart limits) can be combined into a single cart limits enforcement property

This consolidation reduces redundancy while maintaining comprehensive coverage of all requirements.

### Correctness Properties

Property 1: Cart merge preserves all items
*For any* client cart and server cart, when merging them together, the resulting cart should contain all unique items from both carts, with quantities combined for duplicates (up to stock limits)
**Validates: Requirements 1.4, 3.2, 3.3, 6.3**

Property 2: Cart ownership is correctly assigned
*For any* cart creation or retrieval operation, if the user is authenticated then the cart should be associated with their user ID, otherwise it should be associated with a session token
**Validates: Requirements 1.5, 1.6**

Property 3: Stock validation prevents overselling
*For any* add-to-cart or quantity update operation, the system should validate that the requested quantity does not exceed available stock, and should reject operations that would exceed stock limits
**Validates: Requirements 2.1, 2.2, 2.3**

Property 4: Stock change detection is accurate
*For any* cart with items, when stock levels change for any item, the system should correctly identify which items are affected and by how much
**Validates: Requirements 2.4**

Property 5: Stock locks prevent concurrent overselling
*For any* cart proceeding to checkout, the system should create stock locks for all items that prevent other users from purchasing beyond available inventory
**Validates: Requirements 2.5**

Property 6: Abandoned cart data is complete
*For any* cart marked as abandoned, the system should record all cart items, the total value, and the last activity timestamp
**Validates: Requirements 4.2**

Property 7: Abandoned cart email association
*For any* abandoned cart where the user is authenticated, the cart should be associated with the user's email address
**Validates: Requirements 4.3**

Property 8: Cart recovery marking is accurate
*For any* abandoned cart that is converted to an order, the cart should be marked as recovered with the recovery timestamp
**Validates: Requirements 4.4**

Property 9: Abandoned cart sorting is correct
*For any* query for abandoned carts, the results should be sorted first by total value (descending) then by last activity date (descending)
**Validates: Requirements 4.5**

Property 10: Current prices are always displayed
*For any* cart view or total calculation, the system should use the current product prices, not the prices at the time items were added
**Validates: Requirements 5.1, 5.5**

Property 11: Price changes are highlighted
*For any* cart item where the current price differs from the price when added, the system should display both the old price and the new price with a visual indicator
**Validates: Requirements 5.2**

Property 12: Unavailable products prevent checkout
*For any* cart containing products that are no longer available, the system should mark those items as unavailable and prevent the checkout process from proceeding
**Validates: Requirements 5.3**

Property 13: Alternative variants are suggested
*For any* cart item with an unavailable variant, if other variants of the same product are available, the system should suggest those alternatives
**Validates: Requirements 5.4**

Property 14: Total quantity invariant
*For any* cart state, the total quantity should always equal the sum of quantities across all individual cart items
**Validates: Requirements 6.1**

Property 15: Non-negative total invariant
*For any* cart with discounts applied, the final total should never be negative, even if the discount amount exceeds the subtotal
**Validates: Requirements 6.2**

Property 16: Client-server convergence
*For any* cart synchronization operation, after sync completes, the client state and server state should converge to identical values
**Validates: Requirements 6.4**

Property 17: Last-write-wins consistency
*For any* sequence of concurrent cart updates, the final state should reflect the last write operation without data corruption or lost updates
**Validates: Requirements 6.5**

Property 18: Rollback on failure
*For any* cart operation that fails on the server, the client state should rollback to its previous state before the operation
**Validates: Requirements 7.2**

Property 19: Operation ordering is preserved
*For any* sequence of cart operations, when processed, they should be executed in the order they were initiated
**Validates: Requirements 7.4**

Property 20: Offline operations are queued
*For any* cart operations performed while offline, they should be queued and synchronized with the server when connectivity is restored
**Validates: Requirements 7.5**

Property 21: Price reduction detection
*For any* cart item, when the current price is lower than the price when added, the system should detect this as a price reduction
**Validates: Requirements 8.1, 8.3**

Property 22: Stock restoration notification
*For any* saved-for-later item that was previously out of stock, when it comes back in stock, the system should detect this change
**Validates: Requirements 8.4**

Property 23: Cart limits are enforced
*For any* cart operation, the system should enforce configured limits including maximum quantity per product, maximum cart value, and maximum number of unique items
**Validates: Requirements 9.1, 9.2, 9.3**

Property 24: Purchase restrictions are enforced
*For any* product with purchase restrictions, the system should validate those restrictions before allowing the product to be added to the cart
**Validates: Requirements 9.4**

Property 25: Incompatibility detection
*For any* product being added to a cart, if it is incompatible with existing cart items, the system should detect this incompatibility
**Validates: Requirements 9.5**

## Error Handling

### Client-Side Error Handling

1. **Network Errors:**
   - Retry with exponential backoff (100ms, 200ms, 400ms)
   - After 3 failures, preserve state in localStorage
   - Display user-friendly error message
   - Provide manual retry option

2. **Validation Errors:**
   - Display specific error message (e.g., "Only 3 units available")
   - Suggest corrective action
   - Maintain cart state

3. **Conflict Errors:**
   - Display conflict resolution UI
   - Show both client and server values
   - Allow user to choose resolution

4. **Optimistic Update Failures:**
   - Automatically rollback UI state
   - Display error toast notification
   - Log error for debugging

### Server-Side Error Handling

1. **Stock Validation Failures:**
   - Return 409 Conflict with available quantity
   - Include suggested alternatives if applicable

2. **Database Errors:**
   - Log error with full context
   - Return 500 with generic message
   - Preserve cart in transaction rollback

3. **Concurrent Update Conflicts:**
   - Use optimistic locking with version field
   - Return 409 Conflict with current state
   - Client retries with updated state

4. **Session/Auth Errors:**
   - Return 401 Unauthorized
   - Client redirects to login
   - Preserve guest cart for post-login merge

### Error Recovery Strategies

1. **Automatic Recovery:**
   - Retry transient errors automatically
   - Sync queued operations on reconnect
   - Merge carts on authentication

2. **Manual Recovery:**
   - Provide "Retry" button for failed operations
   - Allow manual cart refresh
   - Support cart export/import for data recovery

3. **Graceful Degradation:**
   - Fall back to localStorage-only mode if server unavailable
   - Display warning about limited functionality
   - Queue operations for later sync

## Testing Strategy

### Unit Testing

Unit tests will cover specific scenarios and edge cases:

1. **Cart Service Tests:**
   - Adding items with various stock levels
   - Updating quantities at boundaries (0, 1, max)
   - Removing items from different cart states
   - Merging empty carts, single-item carts, and complex carts

2. **Stock Validation Tests:**
   - Validation with sufficient stock
   - Validation with insufficient stock
   - Validation with zero stock
   - Concurrent validation requests

3. **Sync Service Tests:**
   - Syncing with no conflicts
   - Syncing with quantity conflicts
   - Syncing with deleted items
   - Syncing with new items on both sides

4. **Error Handling Tests:**
   - Network timeout scenarios
   - Database connection failures
   - Invalid input validation
   - Concurrent update conflicts

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** library:

1. **Test Configuration:**
   - Minimum 100 iterations per property test
   - Use shrinking to find minimal failing cases
   - Seed tests for reproducibility

2. **Generators:**
   - `arbitraryProduct`: Generates random products with variants and stock
   - `arbitraryCartItem`: Generates random cart items with valid quantities
   - `arbitraryCart`: Generates random carts with 0-20 items
   - `arbitraryCartOperation`: Generates random add/update/remove operations
   - `arbitraryDiscount`: Generates random discount codes and amounts

3. **Property Test Structure:**
   Each property test will:
   - Generate random inputs using fast-check arbitraries
   - Execute the operation under test
   - Assert the property holds
   - Tag with the design document property number

4. **Example Property Test:**
   ```typescript
   // Feature: cart-system-enhancement, Property 14: Total quantity invariant
   test('total quantity equals sum of item quantities', () => {
     fc.assert(
       fc.property(arbitraryCart(), (cart) => {
         const totalQuantity = cart.getTotalItems()
         const sumOfQuantities = cart.items.reduce((sum, item) => sum + item.quantity, 0)
         expect(totalQuantity).toBe(sumOfQuantities)
       }),
       { numRuns: 100 }
     )
   })
   ```

### Integration Testing

Integration tests will verify end-to-end flows:

1. **Complete Cart Flow:**
   - Add items → Update quantities → Apply coupon → Checkout
   - Verify database state at each step
   - Verify stock locks created

2. **Multi-Device Sync:**
   - Simulate two clients with same user
   - Perform operations on both
   - Verify eventual consistency

3. **Cart Merge Flow:**
   - Create guest cart
   - Authenticate user with existing cart
   - Verify merged cart correctness

4. **Abandoned Cart Flow:**
   - Create cart with items
   - Wait for abandonment threshold
   - Verify cart marked as abandoned
   - Convert to order
   - Verify marked as recovered

### Performance Testing

Performance tests will verify timing requirements:

1. **Server Persistence:**
   - Measure time from client operation to server persistence
   - Verify < 2 seconds for 95th percentile

2. **Cart Load Time:**
   - Measure time to fetch and merge cart on app load
   - Verify < 1 second for 95th percentile

3. **Stock Validation:**
   - Measure validation time for various cart sizes
   - Verify < 500ms for carts up to 50 items

4. **Concurrent Operations:**
   - Simulate 100 concurrent cart updates
   - Verify no deadlocks or data corruption
   - Measure throughput

### Test Coverage Goals

- Unit test coverage: > 80% of service layer code
- Property test coverage: All 25 correctness properties
- Integration test coverage: All critical user flows
- Performance test coverage: All timing requirements

## Implementation Notes

### Technology Choices

1. **Property-Based Testing Library:**
   - **fast-check** for TypeScript/JavaScript
   - Provides excellent shrinking capabilities
   - Integrates well with Vitest

2. **Database Transactions:**
   - Use Prisma transactions for atomic cart operations
   - Implement optimistic locking with version field

3. **Real-Time Sync:**
   - Consider WebSocket for real-time cart updates
   - Fall back to polling if WebSocket unavailable

4. **Caching Strategy:**
   - Cache cart data in Redis for fast retrieval
   - Invalidate cache on cart updates
   - Use cache-aside pattern

### Migration Strategy

1. **Phase 1: Add Server Persistence**
   - Create database schema
   - Implement API endpoints
   - Keep client-only mode as fallback

2. **Phase 2: Enable Sync**
   - Add sync logic to existing cart store
   - Test with small percentage of users
   - Monitor for issues

3. **Phase 3: Add Advanced Features**
   - Implement abandoned cart tracking
   - Add real-time notifications
   - Enable multi-device sync

4. **Phase 4: Optimize**
   - Add caching layer
   - Optimize database queries
   - Implement WebSocket sync

### Security Considerations

1. **Session Token Security:**
   - Use HTTP-only, Secure, SameSite cookies
   - Rotate tokens periodically
   - Validate token on every request

2. **Cart Ownership Validation:**
   - Always verify user owns cart before operations
   - Prevent cart enumeration attacks
   - Rate limit cart operations

3. **Stock Manipulation Prevention:**
   - Validate stock on server, never trust client
   - Use database constraints for stock levels
   - Implement stock lock timeouts

4. **Data Privacy:**
   - Encrypt sensitive cart data at rest
   - Anonymize abandoned cart data after 90 days
   - Comply with GDPR for cart data retention

### Monitoring and Observability

1. **Metrics to Track:**
   - Cart operations per second
   - Average cart value
   - Cart abandonment rate
   - Sync failure rate
   - Stock validation failures

2. **Alerts:**
   - High sync failure rate (> 5%)
   - Database connection issues
   - Stock lock timeout rate (> 1%)
   - Abandoned cart spike

3. **Logging:**
   - Log all cart operations with user/session ID
   - Log sync conflicts and resolutions
   - Log stock validation failures
   - Log error recovery attempts

## Appendix

### API Request/Response Examples

#### Add Item to Cart

**Request:**
```http
POST /api/cart/items
Content-Type: application/json

{
  "productId": "prod_123",
  "variantId": "var_456",
  "quantity": 2
}
```

**Success Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "item": {
    "id": "item_789",
    "productId": "prod_123",
    "productName": "Premium T-Shirt",
    "productSlug": "premium-t-shirt",
    "productImage": "https://...",
    "variantId": "var_456",
    "variant": {
      "size": "M",
      "color": "Blue",
      "sku": "TSHIRT-M-BLUE"
    },
    "quantity": 2,
    "price": 2999,
    "priceAtAdd": 2999,
    "stock": 48,
    "inStock": true,
    "maxQuantity": 10
  }
}
```

**Insufficient Stock Response:**
```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "success": false,
  "error": "Insufficient stock available",
  "maxAvailable": 3
}
```

#### Sync Cart

**Request:**
```http
POST /api/cart/sync
Content-Type: application/json

{
  "clientCart": [
    {
      "productId": "prod_123",
      "variantId": "var_456",
      "quantity": 2
    },
    {
      "productId": "prod_789",
      "quantity": 1
    }
  ]
}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "cart": {
    "id": "cart_abc",
    "items": [
      {
        "id": "item_1",
        "productId": "prod_123",
        "variantId": "var_456",
        "quantity": 3,
        "price": 2999,
        "priceAtAdd": 2999
      },
      {
        "id": "item_2",
        "productId": "prod_789",
        "quantity": 1,
        "price": 4999,
        "priceAtAdd": 4999
      }
    ]
  },
  "conflicts": [
    {
      "productId": "prod_123",
      "variantId": "var_456",
      "clientQuantity": 2,
      "serverQuantity": 1,
      "resolved": "merged"
    }
  ]
}
```

### Database Indexes

```sql
-- Cart indexes
CREATE INDEX idx_cart_user_id ON "Cart"("userId");
CREATE INDEX idx_cart_session_token ON "Cart"("sessionToken");
CREATE INDEX idx_cart_abandoned ON "Cart"("isAbandoned", "lastActivity");

-- CartItem indexes
CREATE INDEX idx_cart_item_cart_id ON "CartItem"("cartId");
CREATE INDEX idx_cart_item_product_id ON "CartItem"("productId");
CREATE UNIQUE INDEX idx_cart_item_unique ON "CartItem"("cartId", "productId", "variantId");
```

### Redis Key Patterns

```
cart:session:{sessionToken}     # Guest cart data
cart:user:{userId}               # User cart data
cart:lock:{cartId}               # Cart operation lock
stock:lock:{productId}:{variantId}  # Stock lock for checkout
cart:sync:queue:{userId}         # Queued sync operations
```
