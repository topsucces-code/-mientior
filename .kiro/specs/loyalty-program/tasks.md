# Implementation Plan

- [ ] 1. Set up database schema and core types
  - Add Prisma schema models for LoyaltyMember, PointsTransaction, RewardRedemption, and LoyaltyEvent
  - Generate Prisma client types
  - Run database migration
  - _Requirements: 1.1, 1.2, 2.1, 7.1, 10.1, 11.1, 13.1, 14.1_

- [ ] 2. Implement points calculator utility
  - Create `src/lib/loyalty-calculator.ts` with tier multipliers and thresholds
  - Implement purchase points calculation (excluding taxes and shipping)
  - Implement engagement points methods (review, social share, newsletter, birthday)
  - Implement referral points methods
  - Implement tier threshold and progression logic
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 9.3, 9.4, 9.5_

- [ ] 2.1 Write property test for tier multipliers
  - **Property 4: Tier multipliers applied correctly**
  - **Validates: Requirements 2.2**

- [ ] 2.2 Write property test for purchase points calculation
  - **Property 3: Purchase points exclude taxes and shipping**
  - **Validates: Requirements 2.1**

- [ ] 2.3 Write unit tests for calculator edge cases
  - Test zero order total
  - Test negative balance prevention
  - Test tier threshold boundaries
  - _Requirements: 2.1, 2.2, 2.5, 4.1, 4.2, 4.3_

- [ ] 3. Implement external loyalty platform client
  - Create `src/lib/loyalty-client.ts` with LoyaltyLion/Smile.io API integration
  - Implement member operations (create, get, update)
  - Implement points operations (add, subtract, get balance)
  - Implement rewards operations (list, redeem)
  - Implement webhook signature verification
  - Add error handling for API failures
  - _Requirements: 1.1, 1.2, 2.3, 7.2, 7.3, 14.1, 14.2_

- [ ] 3.1 Write integration tests for external API client
  - Test member creation and retrieval
  - Test points operations
  - Test rewards operations
  - Test webhook verification
  - _Requirements: 14.1, 14.2_

- [ ] 4. Implement event queue manager
  - Create `src/lib/loyalty-queue.ts` using Redis for event storage
  - Implement enqueue, dequeue, and peek operations
  - Implement retry logic with exponential backoff
  - Implement queue monitoring methods
  - Add failed event tracking
  - _Requirements: 14.2, 14.5_

- [ ] 4.1 Write property test for retry backoff
  - **Property 28: API failure queueing and retry**
  - **Validates: Requirements 14.2**

- [ ] 4.2 Write unit tests for queue operations
  - Test event ordering
  - Test retry count increments
  - Test max retries handling
  - _Requirements: 14.2_

- [ ] 5. Implement core loyalty service
  - Create `src/lib/loyalty.ts` with main service interface
  - Implement member enrollment with Bronze tier and referral code generation
  - Implement points awarding and deduction with balance updates
  - Implement points balance retrieval with fallback to local cache
  - Implement points history retrieval with filtering
  - Add transaction logging for all operations
  - _Requirements: 1.1, 1.2, 1.3, 2.3, 2.4, 2.5, 10.1, 10.2, 10.3_

- [ ] 5.1 Write property test for enrollment
  - **Property 1: Member enrollment creates Bronze tier with referral code**
  - **Validates: Requirements 1.1, 1.2**

- [ ] 5.2 Write property test for welcome bonus
  - **Property 2: Welcome bonus awarded on enrollment**
  - **Validates: Requirements 1.3**

- [ ] 5.3 Write property test for refund deduction
  - **Property 5: Refund deducts corresponding points**
  - **Validates: Requirements 2.4**

- [ ] 5.4 Write unit tests for loyalty service
  - Test enrollment failure retry
  - Test negative balance prevention
  - Test points history filtering
  - _Requirements: 1.4, 2.5, 10.3_

- [ ] 6. Implement rewards manager
  - Create `src/lib/loyalty-rewards.ts` for reward catalog and redemption
  - Implement reward catalog retrieval with tier filtering
  - Implement reward affordability checking
  - Implement reward code generation with uniqueness guarantee
  - Implement redemption validation (points, stock, tier)
  - Implement atomic redemption with rollback on failure
  - Implement reward code validation and usage tracking
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.5, 8.1, 8.2, 8.3_

- [ ] 6.1 Write property test for tier filtering
  - **Property 10: Tier-exclusive rewards filtered correctly**
  - **Validates: Requirements 6.3**

- [ ] 6.2 Write property test for affordability
  - **Property 9: Reward affordability correctly indicated**
  - **Validates: Requirements 6.2**

- [ ] 6.3 Write property test for redemption atomicity
  - **Property 12: Redemption deducts points atomically**
  - **Validates: Requirements 7.2, 7.3**

- [ ] 6.4 Write property test for code uniqueness
  - **Property 13: Unique reward codes generated**
  - **Validates: Requirements 7.3**

- [ ] 6.5 Write property test for failed redemption restoration
  - **Property 14: Failed redemption restores points**
  - **Validates: Requirements 7.5**

- [ ] 6.6 Write property test for out-of-stock prevention
  - **Property 11: Out-of-stock rewards prevent redemption**
  - **Validates: Requirements 6.5**

- [ ] 6.7 Write unit tests for rewards manager
  - Test reward code format validation
  - Test expired code rejection
  - Test single-use enforcement
  - _Requirements: 8.2, 8.3_

- [ ] 7. Implement member enrollment API endpoint
  - Create `POST /api/loyalty/enroll` endpoint
  - Integrate with loyalty service for member creation
  - Queue enrollment event for external platform sync
  - Handle enrollment failures with retry scheduling
  - Return member profile with tier and referral code
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 7.1 Write API integration tests for enrollment
  - Test successful enrollment
  - Test duplicate enrollment prevention
  - Test enrollment retry on failure
  - _Requirements: 1.1, 1.4_

- [ ] 8. Implement points earning on purchases
  - Create order completion webhook handler or event listener
  - Calculate points based on order subtotal and member tier
  - Award points and create transaction record
  - Queue points event for external platform sync
  - Send points earned notification
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 8.1 Write property test for tier upgrade benefits
  - **Property 7: Tier upgrades apply benefits immediately**
  - **Validates: Requirements 4.5**

- [ ] 8.2 Write integration tests for purchase points
  - Test points calculation for various order amounts
  - Test tier multiplier application
  - Test transaction creation
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 9. Implement order refund handling
  - Create refund webhook handler or event listener
  - Deduct previously awarded points from member balance
  - Prevent negative balance (set to zero if needed)
  - Create refund transaction record
  - Queue refund event for external platform sync
  - _Requirements: 2.4, 2.5_

- [ ] 9.1 Write unit tests for refund handling
  - Test points deduction
  - Test negative balance prevention
  - Test refund transaction creation
  - _Requirements: 2.4, 2.5_

- [ ] 10. Implement engagement points earning
  - Create API endpoints for engagement actions (review, social share, newsletter)
  - Implement duplicate action detection (24-hour window)
  - Award appropriate points for each action type
  - Create transaction records
  - Queue engagement events for external platform sync
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 10.1 Write property test for duplicate prevention
  - **Property 6: Duplicate engagement actions prevented**
  - **Validates: Requirements 3.5**

- [ ] 10.2 Write unit tests for engagement points
  - Test each engagement action type
  - Test duplicate detection within 24 hours
  - Test points awarding
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 11. Implement tier progression logic
  - Add tier upgrade check after points are awarded
  - Implement tier threshold detection
  - Update member tier when thresholds are crossed
  - Send tier upgrade congratulatory email
  - Apply new tier benefits immediately
  - Queue tier upgrade event for external platform sync
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 11.1 Write unit tests for tier progression
  - Test threshold detection
  - Test tier upgrade
  - Test email sending
  - Test immediate benefit application
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 12. Implement tier benefits application
  - Create checkout integration for tier discount application
  - Implement discount calculation based on member tier
  - Implement free shipping logic for Gold and Platinum tiers
  - Implement early access to sales for Platinum tier
  - Display savings amount on order confirmation
  - Ensure highest discount is applied when multiple available
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 12.1 Write property test for discount selection
  - **Property 8: Highest discount applied when multiple available**
  - **Validates: Requirements 5.5**

- [ ] 12.2 Write unit tests for tier benefits
  - Test discount calculation for each tier
  - Test free shipping logic
  - Test multiple discount handling
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [ ] 13. Implement rewards catalog API
  - Create `GET /api/loyalty/rewards` endpoint
  - Fetch rewards from external platform
  - Filter rewards by member tier
  - Indicate affordability based on member points balance
  - Display remaining quantity for limited rewards
  - Mark out-of-stock rewards as unavailable
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 13.1 Write integration tests for rewards catalog
  - Test reward retrieval
  - Test tier filtering
  - Test affordability indication
  - Test stock display
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 14. Implement reward redemption API
  - Create `POST /api/loyalty/redeem` endpoint
  - Validate sufficient points balance
  - Validate reward availability and stock
  - Validate tier requirements
  - Deduct points atomically with code generation
  - Generate unique reward code
  - Send reward code via email
  - Restore points on failure
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 14.1 Write property test for code single-use
  - **Property 15: Reward code single-use enforcement**
  - **Validates: Requirements 8.2**

- [ ] 14.2 Write integration tests for redemption
  - Test successful redemption
  - Test insufficient points rejection
  - Test out-of-stock rejection
  - Test points restoration on failure
  - _Requirements: 7.1, 7.2, 7.5_

- [ ] 15. Implement reward code application at checkout
  - Create checkout integration for reward code validation
  - Validate reward code (exists, not expired, not used)
  - Apply discount or benefit from reward code
  - Mark code as used after successful order
  - Display error message for invalid/expired codes
  - Restore code on order cancellation
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 15.1 Write property test for expired code rejection
  - **Property 16: Expired codes rejected**
  - **Validates: Requirements 8.3**

- [ ] 15.2 Write property test for cancelled order restoration
  - **Property 17: Cancelled order restores code**
  - **Validates: Requirements 8.5**

- [ ] 15.3 Write unit tests for code application
  - Test valid code application
  - Test invalid code rejection
  - Test expired code rejection
  - Test used code rejection
  - Test code restoration on cancellation
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 16. Implement referral program
  - Add referral code to member enrollment
  - Create referral tracking on user registration
  - Validate referral codes (exists, not self-referral)
  - Link new member to referrer
  - Award referrer points on referred member's first purchase
  - Award referred member bonus points on first purchase
  - Track referral count and award ambassador badge at 10 referrals
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 16.1 Write property test for referral tracking
  - **Property 18: Referral links tracked**
  - **Validates: Requirements 9.2**

- [ ] 16.2 Write unit tests for referral program
  - Test referral code validation
  - Test self-referral prevention
  - Test referrer reward
  - Test referred member reward
  - Test ambassador badge award
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 17. Implement points history API
  - Create `GET /api/loyalty/history` endpoint
  - Retrieve all transactions for member in reverse chronological order
  - Display date, action type, points amount, and running balance
  - Implement filtering by date range and transaction type
  - Separate pending points from available balance
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [ ] 17.1 Write property test for chronological ordering
  - **Property 19: Transaction history chronological ordering**
  - **Validates: Requirements 10.1**

- [ ] 17.2 Write property test for display completeness
  - **Property 20: Transaction display completeness**
  - **Validates: Requirements 10.2**

- [ ] 17.3 Write property test for filtering correctness
  - **Property 21: History filtering correctness**
  - **Validates: Requirements 10.3**

- [ ] 17.4 Write unit tests for history API
  - Test transaction retrieval
  - Test date range filtering
  - Test transaction type filtering
  - Test pending points separation
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [ ] 18. Implement points history CSV export
  - Create `GET /api/loyalty/history/export` endpoint
  - Generate CSV file with all transaction data
  - Include all required fields (date, type, points, balance)
  - Return CSV file for download
  - _Requirements: 10.4_

- [ ] 18.1 Write property test for CSV completeness
  - **Property 22: CSV export completeness**
  - **Validates: Requirements 10.4**

- [ ] 18.2 Write unit tests for CSV export
  - Test CSV generation
  - Test field completeness
  - Test CSV parsing
  - _Requirements: 10.4_

- [ ] 19. Implement points expiry management
  - Set expiry date (12 months) when points are earned
  - Create background job to process expired points daily
  - Deduct expired points from member balance
  - Create expiry transaction records
  - Implement FIFO points redemption (oldest first)
  - _Requirements: 11.1, 11.3, 11.5_

- [ ] 19.1 Write property test for expiry date setting
  - **Property 23: Points expiry date set correctly**
  - **Validates: Requirements 11.1**

- [ ] 19.2 Write property test for FIFO redemption
  - **Property 24: FIFO points redemption**
  - **Validates: Requirements 11.5**

- [ ] 19.3 Write unit tests for expiry management
  - Test expiry date calculation
  - Test expired points deduction
  - Test FIFO ordering
  - _Requirements: 11.1, 11.3, 11.5_

- [ ] 20. Implement points expiry notifications
  - Create background job to check points expiring within 30 days
  - Send reminder email to members with expiring points
  - Display expiry date of oldest points in dashboard
  - _Requirements: 11.2, 11.4_

- [ ] 20.1 Write unit tests for expiry notifications
  - Test 30-day reminder trigger
  - Test email sending
  - Test expiry date display
  - _Requirements: 11.2, 11.4_

- [ ] 21. Implement loyalty dashboard widget
  - Create React component for loyalty widget
  - Display current tier and points balance
  - Show progress toward next tier with visual progress bar
  - Show points expiring in next 30 days
  - Display summary of active tier benefits
  - Link to full loyalty program page
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 21.1 Write property test for tier progress calculation
  - **Property 25: Tier progress calculation accuracy**
  - **Validates: Requirements 12.2**

- [ ] 21.2 Write unit tests for dashboard widget
  - Test tier display
  - Test progress bar calculation
  - Test expiring points display
  - Test benefits summary
  - _Requirements: 12.1, 12.2, 12.3, 12.5_

- [ ] 22. Implement loyalty program page
  - Create full loyalty program page with detailed information
  - Display member profile (tier, points, referral code)
  - Show rewards catalog with redemption interface
  - Display points history with filtering
  - Show referral sharing options
  - Display tier benefits and progression information
  - _Requirements: 1.5, 6.1, 10.1, 12.4_

- [ ] 22.1 Write E2E tests for loyalty program page
  - Test page rendering
  - Test rewards browsing
  - Test redemption flow
  - Test history viewing
  - _Requirements: 1.5, 6.1, 10.1_

- [ ] 23. Implement admin loyalty management interface
  - Create admin panel section for loyalty program
  - Display program statistics and member counts
  - Implement member search with complete profile display
  - Implement manual points adjustment with reason logging
  - Implement reward creation and configuration
  - Implement reward deactivation
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 23.1 Write property test for manual adjustment logging
  - **Property 26: Manual adjustment logging**
  - **Validates: Requirements 13.3**

- [ ] 23.2 Write property test for deactivated rewards
  - **Property 27: Deactivated rewards block new redemptions**
  - **Validates: Requirements 13.5**

- [ ] 23.3 Write unit tests for admin interface
  - Test member search
  - Test points adjustment
  - Test reward creation
  - Test reward deactivation
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 24. Implement API sync and reconciliation
  - Create background job for daily reconciliation at 2 AM
  - Compare local and external platform data
  - Log discrepancies and alert administrators
  - Implement rate limit throttling for API requests
  - Queue events when API is unavailable
  - _Requirements: 14.2, 14.3, 14.4, 14.5_

- [ ] 24.1 Write property test for rate limiting
  - **Property 29: Rate limit throttling**
  - **Validates: Requirements 14.5**

- [ ] 24.2 Write integration tests for sync
  - Test daily reconciliation
  - Test discrepancy detection
  - Test rate limit handling
  - Test event queueing
  - _Requirements: 14.2, 14.3, 14.4, 14.5_

- [ ] 25. Implement webhook handlers
  - Create webhook endpoint for external platform events
  - Verify webhook signatures
  - Handle tier upgrade events from external platform
  - Handle points balance updates from external platform
  - Handle reward redemption confirmations
  - Update local database based on webhook events
  - _Requirements: 14.1_

- [ ] 25.1 Write integration tests for webhooks
  - Test signature verification
  - Test event handling
  - Test database updates
  - _Requirements: 14.1_

- [ ] 26. Implement monitoring and alerting
  - Add logging for all loyalty operations
  - Implement queue size monitoring
  - Implement sync failure rate monitoring
  - Implement points balance discrepancy alerts
  - Implement API response time monitoring
  - Implement failed event age monitoring
  - _Requirements: 14.2, 14.4_

- [ ] 26.1 Write unit tests for monitoring
  - Test alert triggers
  - Test logging
  - Test metric collection
  - _Requirements: 14.2, 14.4_

- [ ] 27. Final checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests
  - Run all integration tests
  - Fix any failing tests
  - Ensure all tests pass, ask the user if questions arise
