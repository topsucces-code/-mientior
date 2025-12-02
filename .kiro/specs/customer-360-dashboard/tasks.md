# Implementation Plan

- [x] 1. Set up database schema and core types
  - Add Prisma schema models for CustomerNote, CustomerTag, CustomerTagAssignment
  - Add CustomerSegment, CustomerSegmentAssignment models
  - Add CustomerHealthScore and CustomerChurnRisk models
  - Add ChurnRiskLevel enum
  - Generate Prisma client types
  - Run database migration
  - _Requirements: 8.1, 11.1, 12.1, 13.1_

- [x] 2. Implement customer 360 data aggregation service
  - Create `src/lib/customer-360.ts` service
  - Implement getCustomer360View method
  - Implement getCustomerMetrics method
  - Implement calculateHealthScore method
  - Implement calculateChurnRisk method
  - Add data caching (30 seconds TTL)
  - _Requirements: 1.1, 3.1, 12.1, 13.1_

- [x] 2.1 Write property test for profile completeness
  - **Property 1: Profile data completeness**
  - **Validates: Requirements 1.1**

- [x] 2.2 Write property test for metrics accuracy
  - **Property 2: Metrics calculation accuracy**
  - **Validates: Requirements 3.1, 3.2**

- [x] 2.3 Write property test for health score range
  - **Property 4: Health score range validity**
  - **Validates: Requirements 12.1**

- [x] 2.4 Write unit tests for 360 service
  - Test metrics calculation
  - Test health score calculation
  - Test churn risk calculation
  - _Requirements: 3.1, 12.1, 13.1_

- [x] 3. Implement customer 360 API endpoints
  - Create GET /api/admin/customers/[id]/360
  - Create GET /api/admin/customers/[id]/orders
  - Create GET /api/admin/customers/[id]/loyalty
  - Create GET /api/admin/customers/[id]/marketing
  - Create GET /api/admin/customers/[id]/support
  - Create GET /api/admin/customers/[id]/timeline
  - Create GET /api/admin/customers/[id]/analytics
  - Add permission checks for all endpoints
  - _Requirements: 1.1, 2.1, 4.1, 5.1, 6.1, 7.1, 10.1, 19.1_

- [x] 3.1 Write property test for permission enforcement
  - **Property 5: Permission enforcement**
  - **Validates: Requirements 19.1, 19.2, 19.3**

- [x] 3.2 Write integration tests for API endpoints
  - Test 360 view endpoint
  - Test orders endpoint
  - Test loyalty endpoint
  - Test timeline endpoint
  - _Requirements: 1.1, 2.1, 4.1, 7.1_

- [x] 4. Implement customer notes system
  - Create POST /api/admin/customers/[id]/notes endpoint
  - Create GET /api/admin/customers/[id]/notes endpoint
  - Implement note creation with author attribution
  - Implement note listing with pagination
  - Add permission checks
  - _Requirements: 8.1, 8.2_

- [x] 4.1 Write property test for note attribution
  - **Property 7: Note attribution**
  - **Validates: Requirements 8.2**

- [x] 4.2 Write unit tests for notes
  - Test note creation
  - Test author attribution
  - Test permission checks
  - _Requirements: 8.1, 8.2, 19.4_

- [x] 5. Implement customer tagging system
  - Create POST /api/admin/customers/[id]/tags endpoint
  - Create DELETE /api/admin/customers/[id]/tags/[tagId] endpoint
  - Create GET /api/admin/tags endpoint for tag management
  - Create POST /api/admin/tags endpoint for tag creation
  - Implement tag assignment with uniqueness check
  - Implement tag removal
  - _Requirements: 8.3, 8.4, 8.5_

- [x] 5.1 Write property test for tag uniqueness
  - **Property 8: Tag uniqueness per customer**
  - **Validates: Requirements 8.3, 8.4**

- [x] 5.2 Write unit tests for tagging
  - Test tag assignment
  - Test duplicate prevention
  - Test tag removal
  - _Requirements: 8.3, 8.4, 8.5_

- [x] 6. Implement customer segmentation
  - Create segment calculation service
  - Implement automatic segment assignment
  - Implement manual segment assignment
  - Create GET /api/admin/segments endpoint
  - Create POST /api/admin/customers/[id]/segments endpoint
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 6.1 Write unit tests for segmentation
  - Test automatic assignment
  - Test manual assignment
  - Test segment removal
  - _Requirements: 11.1, 11.4, 11.5_

- [x] 7. Implement timeline event aggregation
  - Create timeline service to aggregate events
  - Implement event type filtering
  - Implement date range filtering
  - Implement pagination/infinite scroll
  - Add event formatting for display
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7.1 Write property test for timeline ordering
  - **Property 3: Timeline chronological ordering**
  - **Validates: Requirements 7.1, 7.3**

- [x] 7.2 Write unit tests for timeline
  - Test event aggregation
  - Test filtering
  - Test pagination
  - _Requirements: 7.1, 7.4, 7.5_

- [x] 8. Implement behavioral analytics
  - Create analytics calculation service
  - Implement category analysis
  - Implement session statistics
  - Implement device breakdown
  - Implement shopping time analysis
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 8.1 Write unit tests for analytics
  - Test category calculations
  - Test session stats
  - Test device breakdown
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 9. Implement customer search and filtering
  - Create GET /api/admin/customers/search endpoint
  - Implement search by name, email, phone, order number
  - Implement filtering by segment, tier, tag
  - Implement filtering by date ranges
  - Implement filtering by CLV and order count
  - Add result pagination
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 9.1 Write property test for search accuracy
  - **Property 10: Search result accuracy**
  - **Validates: Requirements 15.1**

- [x] 9.2 Write integration tests for search
  - Test search functionality
  - Test filtering combinations
  - Test pagination
  - _Requirements: 15.1, 15.2, 15.3_

- [x] 10. Implement customer comparison
  - Create GET /api/admin/customers/compare endpoint
  - Implement side-by-side metrics comparison
  - Implement segment overlap analysis
  - Support up to 3 customers
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 10.1 Write unit tests for comparison
  - Test metrics comparison
  - Test segment overlap
  - Test 3-customer limit
  - _Requirements: 16.1, 16.2, 16.3_

- [x] 11. Implement data export
  - Create GET /api/admin/customers/[id]/export endpoint
  - Implement PDF report generation with jsPDF
  - Implement CSV export with all data
  - Add export timestamp and admin identity
  - Log export actions for audit
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [x] 11.1 Write property test for export completeness
  - **Property 9: Export data completeness**
  - **Validates: Requirements 17.2, 17.3**

- [x] 11.2 Write integration tests for export
  - Test PDF generation
  - Test CSV generation
  - Test audit logging
  - _Requirements: 17.2, 17.3, 17.5_

- [x] 12. Implement real-time updates
  - Set up Pusher or Socket.io for real-time communication
  - Implement event broadcasting for order updates
  - Implement event broadcasting for loyalty updates
  - Implement event broadcasting for support ticket updates
  - Implement client-side event listeners
  - Add session synchronization across multiple admins
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [x] 12.1 Write property test for update propagation
  - **Property 6: Real-time update propagation**
  - **Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5**

- [x] 12.2 Write integration tests for real-time
  - Test order update broadcasting
  - Test loyalty update broadcasting
  - Test multi-session sync
  - _Requirements: 18.1, 18.2, 18.5_

- [x] 13. Build Customer 360 Dashboard UI in Refine
  - Create customer 360 page route in Refine
  - Build profile card component
  - Build metrics card component
  - Build health score card component
  - Build churn risk card component
  - Add responsive layout with Ant Design Grid
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 12.1, 13.1, 20.1_

- [x] 13.1 Build order history section
  - Create order list component
  - Add order detail modal
  - Display order metrics
  - Add click navigation to order details
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 13.2 Build loyalty status section
  - Create loyalty card component
  - Display tier, points, and progress bar
  - Show expiring points warning
  - Display referral information
  - Show recent transactions
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 13.3 Build marketing engagement section
  - Create marketing card component
  - Display opt-in statuses
  - Show recent campaigns
  - Display engagement metrics
  - Show assigned segments
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 13.4 Build support ticket section
  - Create support tickets list component
  - Add ticket detail modal
  - Display ticket metrics
  - Highlight open tickets
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 13.5 Build activity timeline section
  - Create timeline component with vertical layout
  - Implement event type icons and colors
  - Add filtering controls
  - Implement infinite scroll
  - Add event detail expansion
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 13.6 Build notes and tags section
  - Create notes list component
  - Add note creation form
  - Create tags display component
  - Add tag assignment interface
  - Add tag removal functionality
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 13.7 Build behavioral analytics section
  - Create analytics charts with Recharts
  - Display category breakdown
  - Show session statistics
  - Display device breakdown
  - Show shopping time heatmap
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 14. Implement quick actions
  - Create quick actions toolbar
  - Add "Send Email" action with modal
  - Add "Create Support Ticket" action with modal
  - Add "Adjust Loyalty Points" action with modal
  - Add "Add Note" quick action
  - Update relevant sections after actions
  - Log actions in activity feed
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 14.1 Write integration tests for quick actions
  - Test email sending
  - Test ticket creation
  - Test points adjustment
  - Test note addition
  - _Requirements: 14.2, 14.3, 14.4_

- [x] 15. Implement customer search UI
  - Create customer search page in Refine
  - Add search input with debouncing
  - Add filter controls (segment, tier, tag, dates, CLV)
  - Display search results in table
  - Add result count display
  - Add click navigation to 360 view
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 15.1 Write E2E tests for search
  - Test search by email
  - Test filtering by segment
  - Test filtering by date range
  - _Requirements: 15.1, 15.2, 15.3_

- [x] 16. Implement customer comparison UI
  - Create comparison mode toggle
  - Add customer selection interface
  - Build side-by-side comparison view
  - Highlight metric differences
  - Show segment overlap
  - Add exit comparison button
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 16.1 Write E2E tests for comparison
  - Test selecting customers
  - Test comparison display
  - Test exiting comparison
  - _Requirements: 16.1, 16.2, 16.5_

- [x] 17. Implement export UI
  - Add export button to dashboard
  - Create export options modal (PDF/CSV)
  - Trigger export generation
  - Handle download
  - Show export progress
  - _Requirements: 17.1, 17.2, 17.3_

- [x] 17.1 Write E2E tests for export
  - Test PDF export
  - Test CSV export
  - Test download
  - _Requirements: 17.1, 17.2, 17.3_

- [x] 18. Implement mobile responsive design
  - Add responsive breakpoints
  - Implement collapsible sections for mobile
  - Optimize layout for small screens
  - Make buttons touch-friendly
  - Test on mobile devices
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [x] 18.1 Write responsive design tests
  - Test mobile layout
  - Test tablet layout
  - Test collapsible sections
  - _Requirements: 20.1, 20.2, 20.3_

- [x] 19. Implement permission-based access control
  - Add permission checks to all API endpoints
  - Mask sensitive data based on role
  - Hide restricted actions in UI
  - Display access denied messages
  - Add permission-based note visibility
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [x] 19.1 Write integration tests for permissions
  - Test view permissions
  - Test action permissions
  - Test data masking
  - _Requirements: 19.1, 19.2, 19.3_

- [x] 20. Implement performance optimizations
  - Add Redis caching for 360 view (30s TTL)
  - Implement lazy loading for timeline
  - Add debouncing for search
  - Optimize database queries with indexes
  - Add query result pagination
  - _Requirements: All (performance)_

- [x] 20.1 Write performance tests
  - Test dashboard load time (< 2s)
  - Test API response times (< 500ms)
  - Test real-time update latency (< 5s)
  - _Requirements: 18.1, 18.2, 18.3_

- [x] 21. Implement monitoring and analytics
  - Add dashboard load time tracking
  - Monitor API response times
  - Track real-time update latency
  - Monitor export generation times
  - Set up alerts for performance degradation
  - _Requirements: All (monitoring)_

- [x] 21.1 Write monitoring tests
  - Test metric collection
  - Test alert triggers
  - _Requirements: All (monitoring)_

- [x] 22. Final checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests
  - Run all integration tests
  - Run all E2E tests
  - Fix any failing tests
  - Ensure all tests pass, ask the user if questions arise
