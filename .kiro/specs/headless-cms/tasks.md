# Implementation Plan

- [ ] 1. Set up CMS database schema and core models
- [ ] 1.1 Create Prisma schema for CMS tables
  - Add CmsContentType, CmsContent, CmsContentVersion models
  - Add CmsContentTranslation model
  - Add CmsMedia and CmsMediaFolder models
  - Add CmsTemplate model
  - Add CmsContentWorkflow model
  - Add CmsContentAnalytics model
  - Add CmsPreviewLink model
  - Add enums: ContentStatus, WorkflowStatus, BlockType
  - Update User model with CMS relations
  - _Requirements: 1.1, 2.1, 3.1, 5.1, 6.1, 7.1, 9.1, 11.1, 13.1, 14.1_

- [ ] 1.2 Run database migration
  - Generate Prisma migration
  - Apply migration to development database
  - Verify all tables and indexes created
  - _Requirements: All_

- [ ] 1.3 Write property test for content data persistence
  - **Property 1: Content data persistence**
  - **Validates: Requirements 1.1, 2.1, 3.1, 7.1, 13.1**

- [ ] 2. Implement content management system
- [ ] 2.1 Create ContentService with CRUD operations
  - Implement createContent method
  - Implement updateContent method
  - Implement getContent method with enrichment
  - Implement deleteContent method (soft delete)
  - Implement publishContent method
  - Implement unpublishContent method
  - Implement duplicateForTranslation method
  - Implement getPublishedBySlug method
  - _Requirements: 1.1, 2.1, 2.5, 5.2, 5.4, 5.5_

- [ ] 2.2 Create API endpoints for content management
  - POST /api/cms/content - Create content
  - GET /api/cms/content - List content with filtering
  - GET /api/cms/content/[id] - Get single content
  - PATCH /api/cms/content/[id] - Update content
  - DELETE /api/cms/content/[id] - Delete content
  - POST /api/cms/content/[id]/publish - Publish content
  - POST /api/cms/content/[id]/unpublish - Unpublish content
  - Add request validation with Zod
  - Add error handling
  - _Requirements: 1.1, 2.1, 2.5_

- [ ] 2.3 Write property test for content block type support
  - **Property 2: Content block type support**
  - **Validates: Requirements 1.2, 2.2**

- [ ] 2.4 Write property test for block reordering
  - **Property 4: Block reordering persistence**
  - **Validates: Requirements 2.3, 4.4**

- [ ] 3. Implement version control system
- [ ] 3.1 Create VersionService
  - Implement createVersion method
  - Implement getVersionHistory method
  - Implement compareVersions method
  - Implement restoreVersion method
  - Implement automatic version creation on content update
  - _Requirements: 1.4, 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 3.2 Create version API endpoints
  - GET /api/cms/content/[id]/versions - Get version history
  - GET /api/cms/content/[id]/versions/[versionNumber] - Get specific version
  - POST /api/cms/content/[id]/versions/compare - Compare versions
  - POST /api/cms/content/[id]/versions/[versionNumber]/restore - Restore version
  - _Requirements: 11.2, 11.3, 11.4_

- [ ] 3.3 Write property test for version creation on save
  - **Property 3: Version creation on save**
  - **Validates: Requirements 1.4, 4.5, 11.1, 11.5**

- [ ] 3.4 Write property test for version history ordering
  - **Property 27: Version history ordering**
  - **Validates: Requirements 11.2**

- [ ] 3.5 Write property test for version comparison
  - **Property 28: Version comparison accuracy**
  - **Validates: Requirements 11.3**

- [ ] 3.6 Write property test for version restoration
  - **Property 29: Version restoration round-trip**
  - **Validates: Requirements 11.4**

- [ ] 4. Implement media management system
- [ ] 4.1 Set up S3-compatible storage
  - Configure AWS S3 or MinIO
  - Set up bucket with proper permissions
  - Configure CDN for media delivery
  - Add environment variables for storage config
  - _Requirements: 7.1_

- [ ] 4.2 Create MediaService
  - Implement uploadMedia method with file validation
  - Implement generateImageVariants method using Sharp
  - Implement searchMedia method
  - Implement getMediaUsage method
  - Implement deleteMedia method (with usage check)
  - Implement moveToFolder method
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 4.3 Create media API endpoints
  - POST /api/cms/media - Upload media (multipart)
  - GET /api/cms/media - List and search media
  - GET /api/cms/media/[id] - Get media details
  - PATCH /api/cms/media/[id] - Update media metadata
  - DELETE /api/cms/media/[id] - Delete media
  - GET /api/cms/media/[id]/usage - Get usage information
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ] 4.4 Write property test for image variant generation
  - **Property 9: Image variant generation**
  - **Validates: Requirements 3.5**

- [ ] 4.5 Write property test for media search
  - **Property 19: Media search correctness**
  - **Validates: Requirements 7.2**

- [ ] 4.6 Write property test for media usage tracking
  - **Property 20: Media usage tracking**
  - **Validates: Requirements 7.3**

- [ ] 4.7 Write property test for media deletion protection
  - **Property 21: Media deletion protection**
  - **Validates: Requirements 7.5**

- [ ] 5. Implement multi-locale content management
- [ ] 5.1 Add locale support to content operations
  - Implement locale filtering in queries
  - Implement locale-based content retrieval
  - Add locale validation
  - _Requirements: 5.1, 5.5_

- [ ] 5.2 Implement translation linking
  - Create translation relationship on duplication
  - Implement getTranslations method
  - Implement getMissingTranslations method
  - _Requirements: 5.2, 5.3_

- [ ] 5.3 Write property test for locale assignment
  - **Property 11: Locale assignment**
  - **Validates: Requirements 5.1**

- [ ] 5.4 Write property test for translation independence
  - **Property 12: Translation independence**
  - **Validates: Requirements 5.2, 5.4**

- [ ] 5.5 Write property test for translation availability tracking
  - **Property 13: Translation availability tracking**
  - **Validates: Requirements 5.3**

- [ ] 5.6 Write property test for locale-based content delivery
  - **Property 14: Locale-based content delivery**
  - **Validates: Requirements 5.5**

- [ ] 6. Implement scheduled publication system
- [ ] 6.1 Set up background job queue
  - Configure Bull queue with Redis
  - Create scheduled publication job processor
  - Create scheduled expiration job processor
  - Add job progress tracking
  - Add job error handling
  - _Requirements: 6.2, 6.3_

- [ ] 6.2 Create ScheduleService
  - Implement processScheduledPublications method
  - Implement processScheduledExpirations method
  - Implement getScheduledContent method
  - Implement cancelSchedule method
  - Add cron job for processing schedules
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 6.3 Add scheduling to content API
  - Update publish endpoint to support scheduling
  - Add schedule cancellation endpoint
  - Add scheduled content query endpoint
  - _Requirements: 6.1, 6.4, 6.5_

- [ ] 6.4 Write property test for schedule storage
  - **Property 15: Schedule storage and retrieval**
  - **Validates: Requirements 6.1**

- [ ] 6.5 Write property test for scheduled status transitions
  - **Property 16: Scheduled status transitions**
  - **Validates: Requirements 6.2, 6.3**

- [ ] 6.6 Write property test for scheduled content query
  - **Property 17: Scheduled content query**
  - **Validates: Requirements 6.4**

- [ ] 6.7 Write property test for schedule cancellation
  - **Property 18: Schedule cancellation**
  - **Validates: Requirements 6.5**

- [ ] 7. Implement SEO metadata management
- [ ] 7.1 Add SEO fields to content model
  - Add seoTitle, seoDescription, seoKeywords fields
  - Implement SEO metadata validation
  - Implement slug generation and validation
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 7.2 Create SEO utilities
  - Implement slug generation from title
  - Implement slug uniqueness check
  - Implement SEO metadata validation
  - Implement character count validation
  - _Requirements: 8.2, 8.3, 8.4_

- [ ] 7.3 Write property test for SEO metadata validation
  - **Property 22: SEO metadata validation**
  - **Validates: Requirements 8.3**

- [ ] 7.4 Write property test for slug uniqueness
  - **Property 23: Slug uniqueness enforcement**
  - **Validates: Requirements 8.4**

- [ ] 8. Implement workflow system
- [ ] 8.1 Create WorkflowService
  - Implement submitForReview method
  - Implement approveContent method
  - Implement rejectContent method
  - Implement getPendingReviews method
  - Implement workflow state machine
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 8.2 Create workflow API endpoints
  - POST /api/cms/content/[id]/workflow/submit - Submit for review
  - POST /api/cms/content/[id]/workflow/approve - Approve content
  - POST /api/cms/content/[id]/workflow/reject - Reject content
  - GET /api/cms/workflow/pending - Get pending reviews
  - _Requirements: 9.1, 9.3, 9.4_

- [ ] 8.3 Write property test for workflow state transitions
  - **Property 24: Workflow state transitions**
  - **Validates: Requirements 9.1, 9.3, 9.4, 9.5**

- [ ] 9. Implement preview system
- [ ] 9.1 Create preview link generation
  - Implement generatePreviewLink method
  - Implement token generation with expiration
  - Implement preview link storage
  - _Requirements: 10.1, 10.4_

- [ ] 9.2 Create preview API endpoints
  - POST /api/cms/content/[id]/preview - Generate preview link
  - GET /api/cms/preview/[token] - Access preview content
  - Add expiration validation
  - _Requirements: 10.1, 10.4, 10.5_

- [ ] 9.3 Write property test for preview link generation
  - **Property 25: Preview link generation**
  - **Validates: Requirements 10.1, 10.4**

- [ ] 9.4 Write property test for preview link expiration
  - **Property 26: Preview link expiration**
  - **Validates: Requirements 10.5**

- [ ] 10. Implement template system
- [ ] 10.1 Create TemplateService
  - Implement createTemplate method
  - Implement createFromTemplate method
  - Implement getTemplatesByType method
  - Implement updateTemplate method
  - Implement deleteTemplate method
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 10.2 Create template API endpoints
  - POST /api/cms/templates - Create template
  - GET /api/cms/templates - List templates
  - GET /api/cms/templates/[id] - Get template
  - PATCH /api/cms/templates/[id] - Update template
  - DELETE /api/cms/templates/[id] - Delete template
  - _Requirements: 13.1, 13.5_

- [ ] 10.3 Write property test for template instantiation
  - **Property 34: Template instantiation**
  - **Validates: Requirements 13.2**

- [ ] 10.4 Write property test for template independence
  - **Property 35: Template independence**
  - **Validates: Requirements 13.3, 13.4**

- [ ] 11. Implement public content delivery API
- [ ] 11.1 Create public API endpoints
  - GET /api/content/[slug] - Get published content by slug
  - GET /api/content/type/[contentType] - Get content by type
  - GET /api/banners - Get active banners
  - Add locale support
  - Add caching headers
  - _Requirements: 2.5, 12.1, 12.2, 12.3, 12.4_

- [ ] 11.2 Implement content caching
  - Cache published content in Redis
  - Implement cache invalidation on updates
  - Add cache warming for popular content
  - _Requirements: 12.5_

- [ ] 11.3 Write property test for content slug accessibility
  - **Property 6: Content slug accessibility**
  - **Validates: Requirements 2.5**

- [ ] 11.4 Write property test for API content retrieval
  - **Property 30: API content retrieval**
  - **Validates: Requirements 12.1, 12.3**

- [ ] 11.5 Write property test for API status filtering
  - **Property 31: API status filtering**
  - **Validates: Requirements 12.4**

- [ ] 11.6 Write property test for API query filtering
  - **Property 32: API query filtering**
  - **Validates: Requirements 12.2**

- [ ] 12. Implement cache invalidation webhooks
- [ ] 12.1 Create webhook system
  - Implement webhook configuration storage
  - Implement webhook delivery with retry
  - Implement webhook signature generation
  - Add webhook logging
  - _Requirements: 12.5_

- [ ] 12.2 Add webhook triggers
  - Trigger on content publication
  - Trigger on content update
  - Trigger on content deletion
  - _Requirements: 12.5_

- [ ] 12.3 Write property test for webhook delivery
  - **Property 33: Cache invalidation webhook delivery**
  - **Validates: Requirements 12.5**

- [ ] 13. Implement analytics tracking
- [ ] 13.1 Create AnalyticsService
  - Implement trackPageView method
  - Implement trackInteraction method
  - Implement getContentAnalytics method
  - Implement compareAnalytics method
  - Implement syncWithExternalAnalytics method
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 13.2 Create analytics API endpoints
  - GET /api/cms/content/[id]/analytics - Get content analytics
  - GET /api/cms/analytics/compare - Compare analytics
  - POST /api/cms/analytics/track - Track event (internal)
  - _Requirements: 14.3, 14.4_

- [ ] 13.3 Integrate with PostHog
  - Configure PostHog client
  - Forward events to PostHog
  - Implement event batching
  - _Requirements: 14.5_

- [ ] 13.4 Write property test for analytics event tracking
  - **Property 36: Analytics event tracking**
  - **Validates: Requirements 14.1, 14.2**

- [ ] 13.5 Write property test for analytics data retrieval
  - **Property 37: Analytics data retrieval**
  - **Validates: Requirements 14.3, 14.4**

- [ ] 13.6 Write property test for analytics integration
  - **Property 38: Analytics integration**
  - **Validates: Requirements 14.5**

- [ ] 14. Implement banner-specific features
- [ ] 14.1 Add banner display logic
  - Implement priority-based ordering
  - Implement expiration filtering
  - Implement position filtering
  - _Requirements: 3.2, 3.3, 3.4_

- [ ] 14.2 Write property test for banner priority ordering
  - **Property 7: Banner priority ordering**
  - **Validates: Requirements 3.3**

- [ ] 14.3 Write property test for banner expiration
  - **Property 8: Banner expiration filtering**
  - **Validates: Requirements 3.4**

- [ ] 15. Build admin UI components
- [ ] 15.1 Create content editor interface
  - Build block-based editor with drag-and-drop
  - Integrate TipTap rich text editor
  - Add media picker
  - Add SEO metadata form
  - Add preview button
  - Add version history sidebar
  - Integrate with Refine.dev
  - _Requirements: 1.1, 1.3, 1.5, 8.1, 11.2_

- [ ] 15.2 Create content list interface
  - Build filterable table view
  - Add status indicators
  - Add quick actions
  - Add bulk operations
  - Add search functionality
  - _Requirements: 1.1_

- [ ] 15.3 Create media library interface
  - Build grid view with thumbnails
  - Add upload with drag-and-drop
  - Add folder organization
  - Add tag management
  - Add search and filter
  - Add usage tracking display
  - _Requirements: 7.1, 7.2, 7.4_

- [ ] 15.4 Create template manager interface
  - Build template list view
  - Add template editor
  - Add template preview
  - Add duplicate template functionality
  - _Requirements: 13.1, 13.5_

- [ ] 15.5 Create analytics dashboard
  - Build performance metrics display
  - Add trend charts
  - Add comparative analytics
  - Add export reports functionality
  - _Requirements: 14.3, 14.4_

- [ ] 15.6 Create workflow dashboard
  - Build pending reviews list
  - Add approval queue
  - Add workflow history view
  - Add performance metrics
  - _Requirements: 9.1, 9.2_

- [ ] 16. Implement homepage content management
- [ ] 16.1 Create homepage content type
  - Define homepage sections structure
  - Implement product selection
  - Implement promotional block configuration
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 16.2 Write property test for product selection
  - **Property 10: Product selection linkage**
  - **Validates: Requirements 4.2**

- [ ] 17. Add caching and optimization
- [ ] 17.1 Implement Redis caching
  - Cache published content
  - Cache media metadata
  - Cache templates
  - Add cache invalidation on updates
  - _Requirements: All (performance)_

- [ ] 17.2 Optimize database queries
  - Add database indexes
  - Optimize content queries with joins
  - Implement query result caching
  - Add pagination to all list endpoints
  - _Requirements: All (performance)_

- [ ] 17.3 Implement media CDN delivery
  - Configure CloudFront or CDN
  - Generate signed URLs for private media
  - Implement lazy loading for media lists
  - Add progressive image loading
  - _Requirements: 7.1_

- [ ] 18. Add monitoring and logging
- [ ] 18.1 Implement audit logging
  - Log all content modifications
  - Log all workflow state changes
  - Log all publication events
  - Log all media uploads
  - _Requirements: 9.5_

- [ ] 18.2 Add metrics and alerts
  - Track content creation rate
  - Track publication rate
  - Track media upload volume
  - Track API response times
  - Set up alerts for failures
  - _Requirements: All (observability)_

- [ ] 19. Write integration tests
- [ ] 19.1 Test complete content creation and publication workflow
  - Create content, add blocks, publish, verify on public API
  - _Requirements: 1.1, 1.2, 2.5_

- [ ] 19.2 Test multi-locale content management
  - Create content in multiple locales, verify independence
  - _Requirements: 5.1, 5.2, 5.4_

- [ ] 19.3 Test media upload and usage tracking
  - Upload media, use in content, verify usage tracking
  - _Requirements: 7.1, 7.3_

- [ ] 19.4 Test template-based content creation
  - Create template, instantiate content, verify independence
  - _Requirements: 13.1, 13.2, 13.3_

- [ ] 19.5 Test workflow approval process
  - Submit content, approve, publish
  - _Requirements: 9.1, 9.3_

- [ ] 19.6 Test scheduled publication
  - Schedule content, wait for publication time, verify status change
  - _Requirements: 6.1, 6.2_

- [ ] 20. Performance testing and optimization
- [ ] 20.1 Test content query performance
  - Measure with 100, 1000, 10000 content entries
  - Target: < 200ms for paginated queries
  - _Requirements: All (performance)_

- [ ] 20.2 Test media upload performance
  - Test with 1MB, 10MB, 50MB files
  - Target: 10MB image in < 5 seconds
  - _Requirements: 7.1_

- [ ] 20.3 Test version history performance
  - Test with 10, 100, 1000 versions
  - Target: < 500ms for version list
  - _Requirements: 11.2_

- [ ] 20.4 Test search performance
  - Test with 1000, 10000 content entries
  - Target: < 1 second for search results
  - _Requirements: 7.2_

- [ ] 21. Documentation and migration
- [ ] 21.1 Write API documentation
  - Document all endpoints with examples
  - Add Postman collection
  - Add OpenAPI/Swagger spec
  - _Requirements: All_

- [ ] 21.2 Write user documentation
  - Create user guide for content editors
  - Create guide for publishers
  - Create guide for administrators
  - Add video tutorials
  - _Requirements: All_

- [ ] 21.3 Create migration scripts
  - Script to create default content types
  - Script to create sample templates
  - Script to migrate existing homepage content
  - _Requirements: All_

- [ ] 22. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
