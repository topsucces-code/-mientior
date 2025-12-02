# Implementation Plan

- [ ] 1. Set up database schema and migrations
- [ ] 1.1 Create Prisma schema for Cart and CartItem models
  - Add Cart model with userId, sessionToken, isAbandoned fields
  - Add CartItem model with cartId, productId, variantId, quantity, priceAtAdd fields
  - Add indexes for performance (userId, sessionToken, isAbandoned)
  - Add unique constraint on cartId + productId + variantId
  - _Requirements: 1.5, 1.6, 4.1, 4.2_

- [ ] 1.2 Generate and run database migration
  - Run `npx prisma migrate dev` to create migration
  - Verify migration creates tables and indexes correctly
  - Test rollback capability
  - _Requirements: 1.5, 1.6_

- [ ] 2. Implement core cart service layer
- [ ] 2.1 Create CartService with basic CRUD operations
  - Implement `getOrCreateCart(userId?, sessionToken?)` method
  - Implement `addItem(cartId, productId, variantId, quantity)` method
  - Implement `updateItemQuantity(itemId, quantity)` method
  - Implement `removeItem(itemId)` method
  - Implement `clearCart(cartId)` method
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2.2 Write property test for cart CRUD operations
  - **Property 14: Total quantity invariant**
  - **Validates: Requirements 6.1**

- [ ] 2.3 Implement cart totals calculation
  - Create `calculateTotals(cartId)` method
  - Fetch current product prices from database
  - Calculate subtotal, tax, shipping, discount
  - Return totals object
  - _Requirements: 5.1, 5.5_

- [ ] 2.4 Write property test for totals calculation
  - **Property 10: Current prices are always displayed**
  - **Validates: Requirements 5.1, 5.5**

- [ ] 2.5 Write property test for non-negative totals
  - **Property 15: Non-negative total invariant**
  - **Validates: Requirements 6.2**

- [ ] 3. Implement stock validation service
- [ ] 3.1 Create StockValidationService
  - Implement `validateStock(productId, variantId, quantity)` method
  - Query product/variant stock from database
  - Return validation result with available quantity
  - Handle edge cases (product not found, variant not found)
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 3.2 Write property test for stock validation
  - **Property 3: Stock validation prevents overselling**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ] 3.3 Implement stock change detection
  - Create `detectStockChanges(cartId)` method
  - Compare cart item quantities with current stock
  - Return list of affected items
  - _Requirements: 2.4_

- [ ] 3.4 Write property test for stock change detection
  - **Property 4: Stock change detection is accurate**
  - **Validates: Requirements 2.4**

- [ ] 3.5 Implement stock lock mechanism
  - Create `createStockLocks(cartId, expiresIn)` method using Redis
  - Create `releaseStockLocks(lockIds)` method
  - Set TTL on locks to auto-expire
  - Handle lock conflicts
  - _Requirements: 2.5_

- [ ] 3.6 Write property test for stock locks
  - **Property 5: Stock locks prevent concurrent overselling**
  - **Validates: Requirements 2.5**

- [ ] 4. Implement cart API endpoints
- [ ] 4.1 Create GET /api/cart endpoint
  - Get or create cart for current user/session
  - Fetch cart items with product details
  - Calculate and return totals
  - Handle authentication and session token
  - _Requirements: 1.4, 1.5, 1.6_

- [ ] 4.2 Create POST /api/cart/items endpoint
  - Validate request body (productId, variantId, quantity)
  - Call StockValidationService to check availability
  - Call CartService to add item
  - Return success response or error with maxAvailable
  - _Requirements: 1.1, 2.1, 2.2_

- [ ] 4.3 Create PATCH /api/cart/items/[itemId] endpoint
  - Validate request body (quantity)
  - Call StockValidationService to check availability
  - Call CartService to update quantity
  - Return success response or error
  - _Requirements: 1.2, 2.3_

- [ ] 4.4 Create DELETE /api/cart/items/[itemId] endpoint
  - Verify item belongs to user's cart
  - Call CartService to remove item
  - Return success response
  - _Requirements: 1.3_

- [ ] 4.5 Write unit tests for cart API endpoints
  - Test successful add/update/remove operations
  - Test stock validation failures
  - Test authentication/authorization
  - Test error responses
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [ ] 5. Implement cart synchronization
- [ ] 5.1 Create CartSyncService
  - Implement `syncCart(cartId, clientItems)` method
  - Compare client items with server items
  - Detect conflicts (different quantities for same item)
  - Resolve conflicts (server wins for authenticated, merge for guest)
  - Return merged cart and conflict list
  - _Requirements: 1.4, 3.1, 3.2, 3.3_

- [ ] 5.2 Write property test for cart merge
  - **Property 1: Cart merge preserves all items**
  - **Validates: Requirements 1.4, 3.2, 3.3, 6.3**

- [ ] 5.3 Write property test for client-server convergence
  - **Property 16: Client-server convergence**
  - **Validates: Requirements 6.4**

- [ ] 5.4 Create POST /api/cart/sync endpoint
  - Accept clientCart array in request body
  - Call CartSyncService to perform sync
  - Return merged cart and conflicts
  - _Requirements: 1.4, 3.2, 3.3_

- [ ] 5.5 Implement cart merge on authentication
  - Detect when user logs in with guest cart
  - Call CartService.mergeCart(guestCartId, userCartId)
  - Handle duplicate items by combining quantities
  - Respect stock limits when merging
  - _Requirements: 3.2, 3.3_

- [ ] 5.6 Write property test for cart merge with duplicates
  - **Property 1: Cart merge preserves all items** (covers duplicates)
  - **Validates: Requirements 3.3**

- [ ] 6. Update client-side cart store
- [ ] 6.1 Add server sync methods to Zustand store
  - Add `syncWithServer()` method
  - Add `lastSyncedAt` state field
  - Add `syncPending` state field
  - Modify `addItem` to call API endpoint
  - Modify `updateQuantity` to call API endpoint
  - Modify `removeItem` to call API endpoint
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 6.2 Implement optimistic updates with rollback
  - Update local state immediately on operations
  - Call API endpoint in background
  - On success: mark as synced
  - On failure: rollback local state and show error
  - _Requirements: 7.1, 7.2_

- [ ] 6.3 Write property test for rollback on failure
  - **Property 18: Rollback on failure**
  - **Validates: Requirements 7.2**

- [ ] 6.4 Add cart sync on app load
  - Call `syncWithServer()` when app initializes
  - Merge server cart with localStorage cart
  - Handle conflicts appropriately
  - _Requirements: 1.4_

- [ ] 6.5 Implement operation queuing for offline mode
  - Create operation queue in store
  - Queue operations when offline
  - Sync queue when connectivity restored
  - Preserve operation order
  - _Requirements: 7.4, 7.5_

- [ ] 6.6 Write property test for operation ordering
  - **Property 19: Operation ordering is preserved**
  - **Validates: Requirements 7.4**

- [ ] 6.7 Write property test for offline queuing
  - **Property 20: Offline operations are queued**
  - **Validates: Requirements 7.5**

- [ ] 7. Implement cart validation endpoint
- [ ] 7.1 Create POST /api/cart/validate endpoint
  - Fetch cart items with current product data
  - Check each item for availability
  - Check for price changes
  - Check for stock sufficiency
  - Return validation result with issues list
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7.2 Write property test for price change detection
  - **Property 11: Price changes are highlighted**
  - **Validates: Requirements 5.2**

- [ ] 7.3 Write property test for unavailable product detection
  - **Property 12: Unavailable products prevent checkout**
  - **Validates: Requirements 5.3**

- [ ] 7.4 Write property test for alternative variant suggestion
  - **Property 13: Alternative variants are suggested**
  - **Validates: Requirements 5.4**

- [ ] 8. Implement abandoned cart tracking
- [ ] 8.1 Create AbandonedCartService
  - Implement `markAbandonedCarts(inactiveHours)` method
  - Query carts with lastActivity > threshold
  - Update isAbandoned flag and set abandonedAt timestamp
  - Return count of marked carts
  - _Requirements: 4.1, 4.2_

- [ ] 8.2 Write property test for abandoned cart data
  - **Property 6: Abandoned cart data is complete**
  - **Validates: Requirements 4.2**

- [ ] 8.3 Write property test for abandoned cart email association
  - **Property 7: Abandoned cart email association**
  - **Validates: Requirements 4.3**

- [ ] 8.4 Implement cart recovery tracking
  - Add `markAsRecovered(cartId)` method
  - Set recoveredAt timestamp when cart converts to order
  - _Requirements: 4.4_

- [ ] 8.5 Write property test for cart recovery marking
  - **Property 8: Cart recovery marking is accurate**
  - **Validates: Requirements 4.4**

- [ ] 8.6 Create GET /api/cart/abandoned endpoint (admin only)
  - Accept query parameters (minValue, since, limit, offset)
  - Call AbandonedCartService to fetch carts
  - Sort by total value and last activity date
  - Return paginated results
  - _Requirements: 4.5_

- [ ] 8.7 Write property test for abandoned cart sorting
  - **Property 9: Abandoned cart sorting is correct**
  - **Validates: Requirements 4.5**

- [ ] 8.8 Create scheduled job to mark abandoned carts
  - Set up cron job or scheduled task
  - Run every hour to check for abandoned carts
  - Call AbandonedCartService.markAbandonedCarts(24)
  - Log results
  - _Requirements: 4.1_

- [ ] 9. Implement cart notifications
- [ ] 9.1 Add price change detection to cart view
  - Compare priceAtAdd with current price for each item
  - Display both prices if different
  - Show "Price dropped" or "Price increased" indicator
  - _Requirements: 5.2, 8.1_

- [ ] 9.2 Write property test for price reduction detection
  - **Property 21: Price reduction detection**
  - **Validates: Requirements 8.1**

- [ ] 9.3 Add low stock warnings to cart items
  - Check stock level for each cart item
  - Display warning if stock < 5 units
  - Show "Only X left in stock" message
  - _Requirements: 8.2_

- [ ] 9.4 Add unavailability notifications
  - Check product availability on cart view
  - Display prominent warning for unavailable items
  - Disable checkout if any items unavailable
  - _Requirements: 8.3_

- [ ] 9.5 Implement saved-for-later stock notifications
  - Check stock for saved items periodically
  - Detect when out-of-stock items come back
  - Display notification to user
  - _Requirements: 8.4_

- [ ] 9.6 Write property test for stock restoration detection
  - **Property 22: Stock restoration notification**
  - **Validates: Requirements 8.4**

- [ ] 10. Implement cart limits and restrictions
- [ ] 10.1 Add cart limits validation
  - Create configuration for max quantity per product
  - Create configuration for max cart value
  - Create configuration for max unique items
  - Validate limits in CartService.addItem
  - Return appropriate error messages
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 10.2 Write property test for cart limits enforcement
  - **Property 23: Cart limits are enforced**
  - **Validates: Requirements 9.1, 9.2, 9.3**

- [ ] 10.3 Implement purchase restrictions
  - Add restrictions field to Product model
  - Check restrictions in CartService.addItem
  - Validate age restrictions, quantity limits, etc.
  - _Requirements: 9.4_

- [ ] 10.4 Write property test for purchase restrictions
  - **Property 24: Purchase restrictions are enforced**
  - **Validates: Requirements 9.4**

- [ ] 10.5 Implement product incompatibility checks
  - Add incompatibleWith field to Product model
  - Check for incompatible items in cart before adding
  - Display warning and require confirmation
  - _Requirements: 9.5_

- [ ] 10.6 Write property test for incompatibility detection
  - **Property 25: Incompatibility detection**
  - **Validates: Requirements 9.5**

- [ ] 11. Implement error handling and retry logic
- [ ] 11.1 Add retry logic with exponential backoff
  - Wrap API calls in retry wrapper
  - Implement exponential backoff (100ms, 200ms, 400ms)
  - Retry up to 3 times for transient errors
  - Log retry attempts
  - _Requirements: 10.1_

- [ ] 11.2 Add localStorage fallback for sync failures
  - Detect when all retries fail
  - Preserve cart in localStorage
  - Display warning to user
  - Provide manual sync button
  - _Requirements: 10.2_

- [ ] 11.3 Implement cart recovery from localStorage
  - Load cart from localStorage on app start
  - Attempt to sync with server
  - Handle conflicts appropriately
  - _Requirements: 10.3_

- [ ] 11.4 Add comprehensive error logging
  - Log all errors with context (userId, cartId, operation)
  - Include stack traces for debugging
  - Send errors to monitoring service (Sentry)
  - Display user-friendly messages
  - _Requirements: 10.5_

- [ ] 12. Update UI components
- [ ] 12.1 Update CartItem component
  - Add price change indicator
  - Add low stock warning
  - Add unavailability badge
  - Show loading state during updates
  - _Requirements: 5.2, 8.2, 8.3_

- [ ] 12.2 Update CartSummary component
  - Show sync status indicator
  - Add manual sync button
  - Display validation errors before checkout
  - _Requirements: 7.2, 10.2_

- [ ] 12.3 Create cart validation modal
  - Display validation issues before checkout
  - Show price changes, stock issues, unavailable items
  - Allow user to fix issues or proceed
  - _Requirements: 5.2, 5.3, 5.4_

- [ ] 12.4 Add cart merge notification
  - Show toast when carts are merged on login
  - Display number of items merged
  - Highlight any conflicts resolved
  - _Requirements: 3.2, 3.3_

- [ ] 13. Implement concurrent update handling
- [ ] 13.1 Add optimistic locking to Cart model
  - Add version field to Cart schema
  - Increment version on every update
  - Check version before updates
  - Return conflict error if version mismatch
  - _Requirements: 6.5_

- [ ] 13.2 Write property test for concurrent updates
  - **Property 17: Last-write-wins consistency**
  - **Validates: Requirements 6.5**

- [ ] 13.3 Implement conflict resolution in client
  - Detect 409 Conflict responses
  - Fetch latest cart state
  - Retry operation with updated state
  - _Requirements: 6.5_

- [ ] 14. Add cart ownership validation
- [ ] 14.1 Implement cart ownership checks
  - Verify userId matches cart.userId for authenticated users
  - Verify sessionToken matches cart.sessionToken for guests
  - Return 403 Forbidden if ownership check fails
  - _Requirements: 1.5, 1.6_

- [ ] 14.2 Write property test for cart ownership
  - **Property 2: Cart ownership is correctly assigned**
  - **Validates: Requirements 1.5, 1.6**

- [ ] 14.3 Add rate limiting to cart endpoints
  - Implement rate limiting middleware
  - Limit to 60 requests per minute per user/session
  - Return 429 Too Many Requests if exceeded
  - _Requirements: Security_

- [ ] 15. Checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property-based tests and verify they pass
  - Fix any failing tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Add monitoring and observability
- [ ] 16.1 Add metrics tracking
  - Track cart operations per second
  - Track average cart value
  - Track cart abandonment rate
  - Track sync failure rate
  - Track stock validation failures
  - _Requirements: Monitoring_

- [ ] 16.2 Set up alerts
  - Alert on high sync failure rate (> 5%)
  - Alert on database connection issues
  - Alert on stock lock timeout rate (> 1%)
  - Alert on abandoned cart spike
  - _Requirements: Monitoring_

- [ ] 16.3 Add comprehensive logging
  - Log all cart operations with user/session ID
  - Log sync conflicts and resolutions
  - Log stock validation failures
  - Log error recovery attempts
  - _Requirements: 10.5, Monitoring_

- [ ] 17. Performance optimization
- [ ] 17.1 Add Redis caching for cart data
  - Cache cart data in Redis with 5-minute TTL
  - Invalidate cache on cart updates
  - Use cache-aside pattern
  - _Requirements: Performance_

- [ ] 17.2 Optimize database queries
  - Add database indexes for common queries
  - Use select to limit returned fields
  - Use include for efficient relation loading
  - Batch stock validation queries
  - _Requirements: Performance_

- [ ] 17.3 Implement debouncing for quantity updates
  - Debounce quantity updates by 500ms
  - Cancel pending updates when new update occurs
  - Show pending indicator during debounce
  - _Requirements: 7.3_

- [ ] 18. Documentation and migration
- [ ] 18.1 Write API documentation
  - Document all cart endpoints
  - Include request/response examples
  - Document error codes and messages
  - Add authentication requirements
  - _Requirements: Documentation_

- [ ] 18.2 Create migration guide
  - Document migration from client-only to server-synced
  - Provide rollback plan
  - Document breaking changes
  - _Requirements: Documentation_

- [ ] 18.3 Update user-facing documentation
  - Document new cart features
  - Explain multi-device sync
  - Explain abandoned cart recovery
  - _Requirements: Documentation_

- [ ] 19. Final checkpoint - Ensure all tests pass
  - Run full test suite
  - Verify all property-based tests pass with 100 iterations
  - Run integration tests
  - Run performance tests
  - Ensure all tests pass, ask the user if questions arise.
