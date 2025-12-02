# Implementation Plan

- [ ] 1. Set up database schema and core types
  - Add Prisma schema models for MarketingContact, MarketingConsent, MarketingEventLog, BackInStockSubscription, and MarketingCampaignCache
  - Generate Prisma client types
  - Run database migration
  - _Requirements: 1.1, 2.1, 17.1, 19.2_

- [ ] 2. Implement marketing client for external platform
  - Create `src/lib/marketing-client.ts` with Klaviyo/ActiveCampaign API integration
  - Implement contact operations (create, update, get, delete)
  - Implement event tracking operations (track, trackBatch)
  - Implement list/segment operations (add, remove, getMembers)
  - Implement campaign and flow metrics retrieval
  - Implement webhook signature verification
  - Add error handling for API failures
  - _Requirements: 1.1, 1.2, 2.5, 3.1, 12.1, 13.1_

- [ ] 2.1 Write integration tests for marketing client
  - Test contact CRUD operations
  - Test event tracking
  - Test list operations
  - Test webhook verification
  - _Requirements: 1.1, 2.5_

- [ ] 3. Implement event queue manager
  - Create `src/lib/marketing-queue.ts` using Redis for event storage
  - Implement enqueue, dequeue, and batch dequeue operations
  - Implement retry logic with exponential backoff
  - Implement queue monitoring methods
  - Add failed event tracking
  - _Requirements: 1.5, 2.5_

- [ ] 3.1 Write property test for retry backoff
  - **Property 5: Failed sync retries with backoff**
  - **Validates: Requirements 1.5**

- [ ] 3.2 Write unit tests for queue operations
  - Test event ordering
  - Test batch processing
  - Test retry count increments
  - Test max retries handling
  - _Requirements: 1.5, 2.5_

- [ ] 4. Implement contact sync manager
  - Create `src/lib/marketing-contact-sync.ts` for contact synchronization
  - Implement user-to-contact property mapping
  - Implement contact sync with external platform
  - Implement consent management
  - Implement reconciliation logic
  - _Requirements: 1.1, 1.2, 1.3, 17.1_

- [ ] 4.1 Write property test for contact creation
  - **Property 1: Contact creation includes required fields**
  - **Validates: Requirements 1.1**

- [ ] 4.2 Write property test for contact updates
  - **Property 2: Contact updates sync within time limit**
  - **Validates: Requirements 1.2**

- [ ] 4.3 Write property test for newsletter subscription
  - **Property 3: Newsletter subscription adds to segment**
  - **Validates: Requirements 1.3**

- [ ] 4.4 Write unit tests for contact sync
  - Test property mapping
  - Test sync failures
  - Test consent recording
  - _Requirements: 1.1, 1.2, 17.1_

- [ ] 5. Implement core marketing service
  - Create `src/lib/marketing.ts` with main service interface
  - Implement contact synchronization methods
  - Implement event tracking methods
  - Implement newsletter subscription/unsubscription
  - Implement back-in-stock subscription
  - Add transaction logging for all operations
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 19.2_

- [ ] 5.1 Write property test for unsubscribe
  - **Property 4: Unsubscribe stops all communications**
  - **Validates: Requirements 1.4**

- [ ] 5.2 Write property test for product view tracking
  - **Property 6: Product view events tracked**
  - **Validates: Requirements 2.1, 2.5**

- [ ] 5.3 Write property test for cart tracking
  - **Property 7: Cart events tracked**
  - **Validates: Requirements 2.2, 2.5**

- [ ] 5.4 Write property test for purchase tracking
  - **Property 8: Purchase events tracked**
  - **Validates: Requirements 2.3, 2.5**

- [ ] 5.5 Write unit tests for marketing service
  - Test event queueing
  - Test error handling
  - Test consent validation
  - _Requirements: 1.4, 2.5_

- [ ] 6. Implement contact registration sync
  - Create API integration for user registration
  - Sync new user data to marketing platform
  - Create contact with Bronze tier and welcome bonus
  - Queue contact creation event
  - Handle sync failures with retry
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 6.1 Write integration tests for registration sync
  - Test successful contact creation
  - Test duplicate prevention
  - Test sync retry on failure
  - _Requirements: 1.1, 1.4_

- [ ] 7. Implement contact profile update sync
  - Create webhook/listener for user profile updates
  - Map updated fields to contact properties
  - Sync changes to marketing platform within 5 minutes
  - Queue update events
  - _Requirements: 1.2_

- [ ] 7.1 Write integration tests for profile sync
  - Test property updates
  - Test sync timing
  - Test partial updates
  - _Requirements: 1.2_

- [ ] 8. Implement newsletter subscription
  - Create API endpoint for newsletter opt-in
  - Add contact to newsletter segment
  - Record consent with timestamp and source
  - Send confirmation email
  - _Requirements: 1.3, 17.1_

- [ ] 8.1 Write property test for consent recording
  - **Property 30: Consent timestamp recorded**
  - **Validates: Requirements 17.1**

- [ ] 8.2 Write unit tests for newsletter subscription
  - Test opt-in flow
  - Test consent recording
  - Test segment addition
  - _Requirements: 1.3, 17.1_

- [ ] 9. Implement unsubscribe functionality
  - Create API endpoint for unsubscribe
  - Add contact to suppression list
  - Stop all marketing communications
  - Process within 24 hours
  - Record unsubscribe reason
  - _Requirements: 1.4, 17.2_

- [ ] 9.1 Write property test for unsubscribe processing
  - **Property 31: Unsubscribe processed timely**
  - **Validates: Requirements 17.2**

- [ ] 9.2 Write property test for unsubscribe link
  - **Property 32: Unsubscribe link in emails**
  - **Validates: Requirements 17.3**

- [ ] 9.3 Write unit tests for unsubscribe
  - Test suppression list addition
  - Test communication stop
  - Test reason recording
  - _Requirements: 1.4, 17.2_

- [ ] 10. Implement product view tracking
  - Create event tracking for product views
  - Record product ID, category, and timestamp
  - Queue event for external platform
  - Send within 30 seconds
  - _Requirements: 2.1, 2.5_

- [ ] 10.1 Write integration tests for product tracking
  - Test event creation
  - Test event queueing
  - Test timing requirements
  - _Requirements: 2.1, 2.5_

- [ ] 11. Implement cart event tracking
  - Create event tracking for add to cart
  - Record item details (product, quantity, price)
  - Queue event for external platform
  - Send within 30 seconds
  - _Requirements: 2.2, 2.5_

- [ ] 11.1 Write integration tests for cart tracking
  - Test add to cart events
  - Test item details capture
  - Test timing requirements
  - _Requirements: 2.2, 2.5_

- [ ] 12. Implement purchase event tracking
  - Create event tracking for completed orders
  - Record order details (items, total, date)
  - Queue event for external platform
  - Send within 30 seconds
  - Trigger post-purchase flow enrollment
  - _Requirements: 2.3, 2.5, 8.1_

- [ ] 12.1 Write property test for post-purchase enrollment
  - **Property 19: Post-purchase enrollment**
  - **Validates: Requirements 8.1**

- [ ] 12.2 Write integration tests for purchase tracking
  - Test order event creation
  - Test flow enrollment
  - Test timing requirements
  - _Requirements: 2.3, 2.5, 8.1_

- [ ] 13. Implement cart abandonment detection
  - Create background job to detect abandoned carts
  - Check for carts inactive for 1 hour
  - Record cart abandoned event
  - Enroll in cart recovery flow
  - _Requirements: 2.4, 7.1_

- [ ] 13.1 Write property test for cart abandonment
  - **Property 9: Cart abandonment detected**
  - **Validates: Requirements 2.4**

- [ ] 13.2 Write property test for cart recovery enrollment
  - **Property 17: Cart recovery enrollment timing**
  - **Validates: Requirements 7.1**

- [ ] 13.3 Write unit tests for abandonment detection
  - Test timing logic
  - Test flow enrollment
  - Test event recording
  - _Requirements: 2.4, 7.1_

- [ ] 14. Implement customer segmentation
  - Create API endpoints for segment management
  - Implement segment filtering by properties
  - Implement segment filtering by behavior
  - Update segment membership on attribute changes
  - Display segment contact count and growth
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 14.1 Write property test for segment updates
  - **Property 10: Segment membership updates**
  - **Validates: Requirements 3.3**

- [ ] 14.2 Write unit tests for segmentation
  - Test filter evaluation
  - Test membership updates
  - Test count calculations
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 15. Implement segment export
  - Create API endpoint for segment export
  - Generate CSV with all contact data
  - Include all segment members
  - Return file for download
  - _Requirements: 3.5_

- [ ] 15.1 Write unit tests for segment export
  - Test CSV generation
  - Test data completeness
  - Test file format
  - _Requirements: 3.5_

- [ ] 16. Implement campaign manager
  - Create `src/lib/marketing-campaigns.ts` for campaign management
  - Implement campaign retrieval from external platform
  - Implement campaign metrics calculation
  - Implement flow retrieval and metrics
  - Implement dashboard metrics aggregation
  - Cache campaign data locally
  - _Requirements: 12.1, 12.2, 12.3, 13.1, 13.2, 20.1, 20.2_

- [ ] 16.1 Write property test for metrics calculation
  - **Property 26: Campaign metrics calculated correctly**
  - **Validates: Requirements 12.2**

- [ ] 16.2 Write unit tests for campaign manager
  - Test metrics calculation
  - Test caching logic
  - Test data aggregation
  - _Requirements: 12.1, 12.2, 13.1_

- [ ] 17. Implement campaign analytics API
  - Create API endpoints for campaign analytics
  - Display sent, delivered, opened, clicked counts
  - Calculate open rate, click rate, conversion rate
  - Show revenue generated and ROI
  - Display engagement over time chart
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 17.1 Write integration tests for analytics API
  - Test metrics retrieval
  - Test rate calculations
  - Test chart data generation
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 18. Implement campaign comparison
  - Create API endpoint for campaign comparison
  - Allow side-by-side metric comparison
  - Display performance differences
  - Highlight best performers
  - _Requirements: 12.5_

- [ ] 18.1 Write unit tests for campaign comparison
  - Test comparison logic
  - Test metric differences
  - Test ranking
  - _Requirements: 12.5_

- [ ] 19. Implement flow analytics API
  - Create API endpoints for flow analytics
  - Display enrollment count and completion rate
  - Show performance metrics for each message
  - Calculate revenue generated by flow
  - Display funnel visualization
  - Support date range and segment filtering
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 19.1 Write integration tests for flow analytics
  - Test metrics retrieval
  - Test funnel calculation
  - Test filtering
  - _Requirements: 13.1, 13.2, 13.5_

- [ ] 20. Implement automated flow management
  - Create flow enrollment logic
  - Implement flow trigger detection
  - Implement flow exit conditions
  - Prevent duplicate enrollment
  - Track flow message delivery
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 20.1 Write property test for flow enrollment
  - **Property 12: Flow enrollment on trigger**
  - **Validates: Requirements 5.1**

- [ ] 20.2 Write property test for duplicate prevention
  - **Property 13: Duplicate enrollment prevented**
  - **Validates: Requirements 5.4**

- [ ] 20.3 Write property test for flow exit
  - **Property 14: Flow exit on condition**
  - **Validates: Requirements 5.3**

- [ ] 20.4 Write unit tests for flow management
  - Test trigger detection
  - Test enrollment logic
  - Test exit conditions
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 21. Implement welcome series flow
  - Configure welcome flow in external platform
  - Enroll new users on registration
  - Send first email immediately
  - Schedule follow-up emails (day 2, day 5)
  - Exit flow on first purchase
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 21.1 Write property test for welcome enrollment
  - **Property 15: Welcome flow enrollment**
  - **Validates: Requirements 6.1**

- [ ] 21.2 Write property test for welcome exit
  - **Property 16: Welcome flow exit on purchase**
  - **Validates: Requirements 6.5**

- [ ] 21.3 Write integration tests for welcome flow
  - Test enrollment timing
  - Test email scheduling
  - Test exit conditions
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 22. Implement cart recovery flow
  - Configure cart recovery flow in external platform
  - Enroll users with abandoned carts after 1 hour
  - Send reminder emails with cart contents
  - Include discount codes (10% at 24h, 15% at 48h)
  - Exit flow on purchase completion
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 22.1 Write property test for cart recovery exit
  - **Property 18: Cart recovery exit on purchase**
  - **Validates: Requirements 7.5**

- [ ] 22.2 Write integration tests for cart recovery
  - Test enrollment timing
  - Test email content
  - Test discount codes
  - Test exit conditions
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 23. Implement post-purchase flow
  - Configure post-purchase flow in external platform
  - Enroll users on purchase completion
  - Send order confirmation immediately
  - Send shipping update (day 3)
  - Send review request (day 7)
  - Send replenishment reminder (day 30)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 23.1 Write integration tests for post-purchase flow
  - Test enrollment
  - Test email scheduling
  - Test email content
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 24. Implement win-back flow
  - Configure win-back flow in external platform
  - Enroll users inactive for 90 days
  - Send "we miss you" email with recommendations
  - Send special offer (20% at day 7, 25% at day 14)
  - Exit flow on purchase
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 24.1 Write property test for win-back enrollment
  - **Property 20: Win-back enrollment timing**
  - **Validates: Requirements 9.1**

- [ ] 24.2 Write integration tests for win-back flow
  - Test enrollment timing
  - Test email content
  - Test discount codes
  - Test exit conditions
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 25. Implement SMS campaigns
  - Create API endpoints for SMS campaigns
  - Validate SMS opt-in before sending
  - Include opt-out link in every SMS
  - Track delivery and click-through rates
  - Handle SMS opt-out immediately
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 25.1 Write property test for SMS opt-in validation
  - **Property 21: SMS opt-in validation**
  - **Validates: Requirements 10.1**

- [ ] 25.2 Write property test for SMS opt-out link
  - **Property 22: SMS opt-out link included**
  - **Validates: Requirements 10.2**

- [ ] 25.3 Write property test for SMS opt-out immediate
  - **Property 23: SMS opt-out immediate**
  - **Validates: Requirements 10.3**

- [ ] 25.4 Write unit tests for SMS campaigns
  - Test opt-in validation
  - Test opt-out processing
  - Test delivery tracking
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 26. Implement push notifications
  - Create API endpoints for push notifications
  - Register device tokens on permission grant
  - Support rich media (images, actions)
  - Target only users with permission
  - Track clicks and deep links
  - Remove tokens on permission revoke
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 26.1 Write property test for push permission
  - **Property 24: Push permission required**
  - **Validates: Requirements 11.3**

- [ ] 26.2 Write property test for token removal
  - **Property 25: Push token removal on revoke**
  - **Validates: Requirements 11.5**

- [ ] 26.3 Write unit tests for push notifications
  - Test token registration
  - Test permission validation
  - Test click tracking
  - Test token removal
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 27. Implement A/B testing
  - Create API endpoints for A/B test management
  - Support testing subject lines, content, send times
  - Implement random variant assignment
  - Calculate statistical significance
  - Auto-send winning variant to remaining contacts
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 27.1 Write property test for random assignment
  - **Property 27: A/B test random assignment**
  - **Validates: Requirements 14.3**

- [ ] 27.2 Write property test for winner selection
  - **Property 28: A/B test winner selection**
  - **Validates: Requirements 14.4**

- [ ] 27.3 Write unit tests for A/B testing
  - Test variant assignment
  - Test significance calculation
  - Test winner selection
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 28. Implement template management
  - Create API endpoints for template CRUD
  - Provide visual editor integration
  - Support dynamic content blocks
  - Validate HTML and flag issues
  - Allow section overrides
  - Display preview thumbnails
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 28.1 Write unit tests for template management
  - Test CRUD operations
  - Test HTML validation
  - Test override logic
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [ ] 29. Implement message personalization
  - Support contact property insertion
  - Support conditional content blocks
  - Support product recommendations
  - Implement fallback values for missing data
  - Provide preview for different profiles
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 29.1 Write property test for personalization fallback
  - **Property 29: Personalization fallback**
  - **Validates: Requirements 16.4**

- [ ] 29.2 Write unit tests for personalization
  - Test property insertion
  - Test conditional content
  - Test fallback values
  - _Requirements: 16.1, 16.2, 16.3, 16.4_

- [ ] 30. Implement suppression list management
  - Create suppression list for unsubscribed contacts
  - Enforce suppression list in all campaigns
  - Prevent sending to suppressed contacts
  - Maintain suppression audit trail
  - _Requirements: 4.5, 17.2_

- [ ] 30.1 Write property test for suppression enforcement
  - **Property 11: Suppression list respected**
  - **Validates: Requirements 4.5**

- [ ] 30.2 Write unit tests for suppression
  - Test list management
  - Test enforcement
  - Test audit trail
  - _Requirements: 4.5, 17.2_

- [ ] 31. Implement GDPR compliance
  - Record consent with timestamp and source
  - Process unsubscribe within 24 hours
  - Include unsubscribe link in all emails
  - Implement data deletion on request
  - Maintain complete consent audit trail
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 31.1 Write unit tests for GDPR compliance
  - Test consent recording
  - Test unsubscribe processing
  - Test data deletion
  - Test audit trail
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 32. Implement e-commerce data integration
  - Sync order data to marketing platform
  - Calculate lifetime value and AOV
  - Support segmentation by purchase behavior
  - Track product views for recommendations
  - Update product availability
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 32.1 Write integration tests for e-commerce sync
  - Test order data sync
  - Test metric calculations
  - Test product tracking
  - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [ ] 33. Implement back-in-stock notifications
  - Display "notify me" option on out-of-stock products
  - Add users to product waitlist
  - Send notifications within 1 hour of restock
  - Include product details and purchase link
  - Remove users from waitlist after purchase
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 33.1 Write property test for notification timing
  - **Property 33: Back-in-stock notification timing**
  - **Validates: Requirements 19.3**

- [ ] 33.2 Write property test for waitlist removal
  - **Property 34: Waitlist removal on purchase**
  - **Validates: Requirements 19.5**

- [ ] 33.3 Write integration tests for back-in-stock
  - Test waitlist management
  - Test notification sending
  - Test timing requirements
  - Test purchase tracking
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 34. Implement admin dashboard
  - Create admin dashboard page
  - Display key metrics (contacts, flows, campaigns)
  - Show revenue generated in last 30 days
  - Display top-performing campaigns and flows
  - Show contact growth trend chart
  - Provide quick links to create campaigns/flows
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 34.1 Write integration tests for dashboard
  - Test metrics calculation
  - Test chart data generation
  - Test quick links
  - _Requirements: 20.1, 20.2, 20.3, 20.4_

- [ ] 35. Implement webhook handlers
  - Create webhook endpoint for external platform events
  - Verify webhook signatures
  - Handle campaign sent events
  - Handle email opened/clicked events
  - Handle unsubscribe events
  - Update local database based on webhooks
  - _Requirements: 1.5, 2.5_

- [ ] 35.1 Write integration tests for webhooks
  - Test signature verification
  - Test event handling
  - Test database updates
  - _Requirements: 1.5, 2.5_

- [ ] 36. Implement monitoring and alerting
  - Add logging for all marketing operations
  - Implement queue size monitoring
  - Implement sync failure rate monitoring
  - Implement event processing lag monitoring
  - Implement unsubscribe rate monitoring
  - Set up alerts for anomalies
  - _Requirements: 1.5, 2.5_

- [ ] 36.1 Write unit tests for monitoring
  - Test alert triggers
  - Test logging
  - Test metric collection
  - _Requirements: 1.5, 2.5_

- [ ] 37. Implement background jobs
  - Create daily contact sync reconciliation job
  - Create cart abandonment detection job (runs hourly)
  - Create points expiry reminder job
  - Create campaign metrics cache refresh job
  - _Requirements: 2.4, 12.1, 13.1_

- [ ] 37.1 Write unit tests for background jobs
  - Test job scheduling
  - Test job execution
  - Test error handling
  - _Requirements: 2.4, 12.1_

- [ ] 38. Final checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests
  - Run all integration tests
  - Fix any failing tests
  - Ensure all tests pass, ask the user if questions arise
