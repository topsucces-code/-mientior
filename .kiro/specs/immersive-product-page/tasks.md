# Implementation Plan

- [x] 1. Database schema updates and migrations
  - Create migration for ProductImage extensions (videoUrl, frames, width, height fields)
  - Create ProductQuestion and ProductAnswer models
  - Create SizeGuide model with category relation
  - Update Product model with arModelUrl and processingDays fields
  - Run migration and verify schema changes
  - _Requirements: All requirements (data foundation)_

- [x] 1.1 Write property test for database schema
  - **Property 1: Image alt text completeness**
  - **Validates: Requirements 15.2**

- [x] 2. Enhanced image gallery with zoom and lightbox
  - [x] 2.1 Implement zoom functionality with 1x, 2x, 4x levels
    - Add zoom state management (zoomLevel, panPosition)
    - Implement mouse move handler for pan calculation
    - Add zoom controls UI with keyboard shortcuts
    - Handle zoom cursor indicators
    - _Requirements: 1.1, 1.3, 1.5_

  - [x] 2.2 Write property test for zoom level cycling
    - **Property 2: Zoom level cycling**
    - **Validates: Requirements 1.3**

  - [x] 2.3 Write property test for pan position calculation
    - **Property 4: Pan position calculation**
    - **Validates: Requirements 1.5**

  - [x] 2.4 Implement lightbox with full-screen image viewing
    - Create lightbox modal component
    - Add image navigation controls
    - Implement keyboard navigation (arrows, escape)
    - Add image counter display
    - _Requirements: 1.2, 1.4_

  - [x] 2.5 Write property test for lightbox image display
    - **Property 1: Lightbox opens with correct image**
    - **Validates: Requirements 1.2**

  - [x] 2.6 Write property test for keyboard navigation
    - **Property 3: Keyboard navigation wraps correctly**
    - **Validates: Requirements 1.4**

  - [x] 2.7 Add progressive image loading with placeholders
    - Implement blur-up placeholder technique
    - Add loading states and transitions
    - Optimize image sizes for different viewports
    - _Requirements: 1.6_

- [x] 3. 360° product viewer implementation
  - [x] 3.1 Create Product360Viewer component
    - Implement frame loading and caching
    - Add drag-to-rotate functionality
    - Calculate frame selection from drag distance
    - Display rotation angle and frame number
    - Add touch gesture support for mobile
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.2 Write property test for frame selection
    - **Property 6: Frame selection proportional to drag**
    - **Validates: Requirements 2.3**

  - [x] 3.3 Write property test for rotation angle display
    - **Property 7: Rotation angle display accuracy**
    - **Validates: Requirements 2.4**

  - [x] 3.4 Write property test for 360° badge visibility
    - **Property 5: 360° badge visibility**
    - **Validates: Requirements 2.1**

  - [x] 3.5 Implement 360° viewer controls and UI
    - Add play/pause auto-rotation
    - Create rotation speed controls
    - Add exit button to return to gallery
    - Display "360° View" badge on gallery
    - _Requirements: 2.5, 2.6_

- [x] 4. Video player integration
  - [x] 4.1 Create ProductVideoPlayer component
    - Implement HTML5 video player
    - Add standard controls (play, pause, volume, fullscreen)
    - Display poster image before playback
    - Handle video loading and errors
    - _Requirements: 3.2, 3.3_

  - [x] 4.2 Add video navigation and badges
    - Display "Video" badge on gallery
    - Implement navigation between multiple videos
    - Show related products after playback
    - Add video thumbnails with play icons
    - _Requirements: 3.1, 3.4, 3.5_

  - [x] 4.3 Write property test for video badge visibility
    - **Property 8: Video badge visibility**
    - **Validates: Requirements 3.1**

  - [x] 4.4 Write property test for video navigation
    - **Property 9: Video navigation availability**
    - **Validates: Requirements 3.5**

- [x] 5. AR preview functionality
  - [x] 5.1 Create ARPreviewButton component
    - Implement device capability detection
    - Add iOS Quick Look integration
    - Add Android Scene Viewer integration
    - Handle AR model loading
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 5.2 Write property test for AR button visibility
    - **Property 29: AR button visibility**
    - **Validates: Requirements 10.1**

  - [x] 5.3 Write property test for AR button hiding
    - **Property 30: AR button hiding on unsupported devices**
    - **Validates: Requirements 10.3**

  - [x] 5.4 Add AR session UI and instructions
    - Display placement instructions
    - Add manipulation controls
    - Handle AR exit and return to product page
    - _Requirements: 10.4, 10.5_

- [x] 6. Real-time stock indicator
  - [x] 6.1 Implement stock display logic
    - Create StockIndicator component
    - Add threshold-based display (show if < 10)
    - Implement low stock warning (< 5 units)
    - Handle out of stock state
    - _Requirements: 8.1, 8.3, 8.4_

  - [x] 6.2 Write property test for stock display threshold
    - **Property 24: Stock display threshold**
    - **Validates: Requirements 8.1**

  - [x] 6.3 Write property test for low stock warning
    - **Property 25: Low stock warning threshold**
    - **Validates: Requirements 8.4**

  - [x] 6.4 Add real-time stock updates with Pusher
    - Set up Pusher channel subscription
    - Handle stock update events
    - Update UI within 5 seconds
    - Implement fallback to polling
    - _Requirements: 8.2_

  - [x] 6.5 Implement variant stock synchronization
    - Update stock on variant selection
    - Handle variant-specific stock levels
    - Sync with add-to-cart button state
    - _Requirements: 8.5_

  - [x] 6.6 Write property test for variant stock sync
    - **Property 26: Variant stock synchronization**
    - **Validates: Requirements 8.5**

- [x] 7. Delivery estimation system
  - [x] 7.1 Create DeliveryEstimator component
    - Implement date calculation logic
    - Exclude weekends and holidays
    - Handle multiple shipping options
    - Display date ranges (min/max)
    - _Requirements: 9.1, 9.3, 9.4_

  - [x] 7.2 Write property test for delivery calculation
    - **Property 27: Delivery date calculation**
    - **Validates: Requirements 9.1, 9.4**

  - [x] 7.3 Write property test for multiple shipping options
    - **Property 28: Multiple shipping option estimates**
    - **Validates: Requirements 9.3**

  - [x] 7.2 Add location-based delivery estimates
    - Detect user location from IP or saved address
    - Personalize estimates by location
    - Handle default region fallback
    - Cache estimates by location + product
    - _Requirements: 9.2_

  - [x] 7.3 Implement backorder delivery handling
    - Display restock date for backordered items
    - Adjust delivery timeline accordingly
    - Show clear messaging for delays
    - _Requirements: 9.5_

  - [x] 7.4 Create delivery estimation API endpoint
    - POST /api/delivery/estimate
    - Accept productId, location, shippingMethod
    - Return min/max delivery dates
    - Cache results in Redis
    - _Requirements: 9.1, 9.4_

- [x] 8. Rich product descriptions and specifications
  - [x] 8.1 Enhance ProductTabs component
    - Ensure all 5 tabs are present (Description, Specs, Reviews, Q&A, Shipping)
    - Implement tab switching with keyboard support
    - Add proper ARIA labels
    - _Requirements: 4.1_

  - [x] 8.2 Implement specifications table rendering
    - Parse specifications JSON data
    - Render in structured table format
    - Display clear labels and values
    - Handle missing specifications
    - _Requirements: 4.3_

  - [x] 8.3 Write property test for specifications rendering
    - **Property 10: Specifications table rendering**
    - **Validates: Requirements 4.3**

  - [x] 8.4 Add measurement units display
    - Parse dimension data
    - Display with appropriate units (cm, kg, etc.)
    - Support unit conversions
    - _Requirements: 4.5_

  - [x] 8.5 Write property test for measurement units
    - **Property 11: Measurement units display**
    - **Validates: Requirements 4.5**

  - [x] 8.6 Enhance description formatting
    - Support markdown or rich text
    - Render headings, lists, emphasis
    - Highlight key features with visual indicators
    - _Requirements: 4.2, 4.4_

- [-] 9. Interactive size guide
  - [x] 9.1 Create SizeGuideModal component
    - Build modal UI with measurement tables
    - Display category-specific sizing
    - Support metric/imperial conversions
    - Add fit recommendations
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 9.2 Write property test for size guide link visibility
    - **Property 12: Size guide link visibility**
    - **Validates: Requirements 5.1**

  - [x] 9.3 Write property test for size conversions
    - **Property 13: Size system conversions**
    - **Validates: Requirements 5.3**

  - [x] 9.4 Write property test for fit recommendations
    - **Property 14: Category-specific fit recommendations**
    - **Validates: Requirements 5.4**

  - [x] 9.5 Implement size selection integration
    - Add "Size Guide" link next to size selector
    - Auto-select size in variant selector from guide
    - Sync selection between guide and product
    - _Requirements: 5.1, 5.5_

  - [x] 9.6 Write property test for size selection sync
    - **Property 15: Size selection synchronization**
    - **Validates: Requirements 5.5**

  - [x] 9.7 Create size guide API and database
    - Create /api/size-guides/[categoryId] endpoint
    - Store size guides in database by category
    - Support CRUD operations for admin
    - _Requirements: 5.2, 5.3_

- [x] 10. Customer reviews with media
  - [x] 10.1 Enhance Review model and display
    - Update Review model to support images/videos JSON
    - Display reviews with all components (rating, text, media)
    - Show verified purchase badges
    - Render review timestamps
    - _Requirements: 6.1, 6.6_

  - [x] 10.2 Write property test for review completeness
    - **Property 16: Review component completeness**
    - **Validates: Requirements 6.1**

  - [x] 10.3 Write property test for verified badge
    - **Property 20: Verified review badge**
    - **Validates: Requirements 6.6**

  - [x] 10.4 Implement review photo gallery
    - Display photo thumbnails in reviews
    - Open lightbox on thumbnail click
    - Navigate between multiple photos
    - Support up to 5 photos per review
    - _Requirements: 6.2, 6.4_

  - [x] 10.5 Write property test for photo lightbox
    - **Property 17: Review photo lightbox**
    - **Validates: Requirements 6.2**

  - [x] 10.6 Write property test for media navigation
    - **Property 19: Review media navigation**
    - **Validates: Requirements 6.4**

  - [x] 10.7 Add review video support
    - Display video thumbnails with play icons
    - Implement video playback in reviews
    - Handle video loading and errors
    - _Requirements: 6.3_

  - [x] 10.8 Write property test for video thumbnails
    - **Property 18: Review video thumbnails**
    - **Validates: Requirements 6.3**

  - [x] 10.9 Create review media upload API
    - POST /api/reviews/[id]/media/upload
    - Validate file types and sizes
    - Compress and optimize images
    - Store media URLs in review JSON
    - _Requirements: 6.2, 6.3_

- [x] 11. Review filtering and sorting
  - [x] 11.1 Implement review filters
    - Add filter UI (All, With Photos, Verified)
    - Apply filters to review list
    - Update count display
    - Handle empty filter results
    - _Requirements: 6.5, 7.2, 7.3, 7.4, 7.5_

  - [x] 11.2 Write property test for filter accuracy
    - **Property 21: Review filtering accuracy**
    - **Validates: Requirements 7.2**

  - [x] 11.3 Write property test for photo filter
    - **Property 22: Photo filter correctness**
    - **Validates: Requirements 7.3**

  - [x] 11.4 Write property test for verified filter
    - **Property 23: Verified filter correctness**
    - **Validates: Requirements 7.4**

  - [x] 11.5 Implement review sorting
    - Add sort dropdown (Recent, Helpful, Rating)
    - Sort reviews by selected criteria
    - Maintain sort when filters change
    - _Requirements: 7.1_

  - [x] 11.6 Add helpful voting system
    - Implement vote buttons (helpful/not helpful)
    - Track user votes in local state
    - Update vote counts
    - Prevent duplicate voting
    - _Requirements: Existing review functionality_

- [x] 12. Product Q&A section
  - [x] 12.1 Create Q&A database models and API
    - Implement ProductQuestion and ProductAnswer models
    - Create GET /api/products/[id]/questions endpoint
    - Create POST /api/products/[id]/questions endpoint
    - Create POST /api/products/[id]/questions/[id]/answers endpoint
    - Add moderation status handling
    - _Requirements: 11.1, 11.3_

  - [x] 12.2 Build Q&A display component
    - Display questions with answers
    - Show official vendor responses with badges
    - Display helpful vote counts
    - Format timestamps
    - _Requirements: 11.1, 11.5_

  - [x] 12.3 Write property test for Q&A sorting
    - **Property 31: Q&A sorting by helpfulness**
    - **Validates: Requirements 11.1**

  - [x] 12.4 Write property test for official badge
    - **Property 34: Official response badge**
    - **Validates: Requirements 11.5**

  - [x] 12.5 Implement Q&A search functionality
    - Add search input with debouncing
    - Filter questions/answers by query
    - Highlight search matches
    - Handle empty search results
    - _Requirements: 11.2_

  - [x] 12.6 Write property test for Q&A search
    - **Property 32: Q&A search filtering**
    - **Validates: Requirements 11.2**

  - [x] 12.7 Add Q&A voting system
    - Implement helpful/not helpful voting
    - Update vote counts
    - Re-sort list after voting
    - Track user votes
    - _Requirements: 11.4_

  - [x] 12.8 Write property test for vote updates
    - **Property 33: Q&A vote count updates**
    - **Validates: Requirements 11.4**

  - [x] 12.9 Create question submission modal
    - Build AskQuestionModal component
    - Validate question length (min 10 chars)
    - Submit to API for moderation
    - Show success confirmation
    - _Requirements: 11.3_

- [x] 13. Shipping and returns information
  - [x] 13.1 Enhance shipping tab display
    - Display all shipping methods with costs
    - Show delivery time estimates
    - Highlight free shipping threshold
    - Format shipping information clearly
    - _Requirements: 12.1, 12.2_

  - [x] 13.2 Write property test for shipping methods display
    - **Property 35: Shipping methods completeness**
    - **Validates: Requirements 12.1**

  - [x] 13.3 Write property test for free shipping threshold
    - **Property 36: Free shipping threshold display**
    - **Validates: Requirements 12.2**

  - [x] 13.4 Add returns information section
    - Display return window and policy
    - Show return process steps
    - Add conditions and restrictions
    - Provide return initiation link
    - _Requirements: 12.3_

  - [x] 13.5 Implement international shipping display
    - Show supported countries
    - Display additional costs
    - Add country-specific information
    - _Requirements: 12.4_

  - [x] 13.6 Write property test for international shipping
    - **Property 37: International shipping indication**
    - **Validates: Requirements 12.4**

  - [x] 13.7 Add location-based shipping personalization
    - Detect user location
    - Filter shipping options by location
    - Display location-specific costs
    - Show personalized delivery estimates
    - _Requirements: 12.5_

  - [x] 13.8 Write property test for location personalization
    - **Property 38: Location-based shipping personalization**
    - **Validates: Requirements 12.5**

- [x] 14. Mobile responsiveness and touch optimization
  - [x] 14.1 Implement mobile image carousel
    - Use Embla Carousel for touch swipe
    - Add pagination dots
    - Support pinch-to-zoom gestures
    - Optimize for touch interactions
    - _Requirements: 13.1, 13.2_

  - [x] 14.2 Optimize 360° viewer for mobile
    - Enable touch-drag rotation
    - Adjust controls for touch
    - Optimize frame loading for mobile
    - _Requirements: 13.3_

  - [x] 14.3 Ensure mobile video playback
    - Use native video controls
    - Support fullscreen mode
    - Handle mobile bandwidth
    - _Requirements: 13.4_

  - [x] 14.4 Implement responsive image loading
    - Load appropriately sized images per device
    - Use srcset and sizes attributes
    - Implement lazy loading
    - _Requirements: 13.5_

- [x] 15. Performance optimizations
  - [x] 15.1 Implement progressive image loading
    - Add blur-up placeholders
    - Use Next.js Image optimization
    - Implement lazy loading
    - Preload critical images
    - _Requirements: 14.1, 14.2_

  - [x] 15.2 Optimize 360° frame loading
    - Preload first and last frames
    - Lazy load intermediate frames
    - Implement frame caching
    - Use requestAnimationFrame for smooth rotation
    - _Requirements: 14.3_

  - [x] 15.3 Optimize video loading
    - Load metadata only initially
    - Defer full video download until playback
    - Implement video preloading strategy
    - _Requirements: 14.4_

  - [x] 15.4 Add image preloading for navigation
    - Preload adjacent images in gallery
    - Implement intelligent prefetching
    - Cache loaded images
    - _Requirements: 14.5_

  - [x] 15.5 Implement caching strategies
    - Cache delivery estimates in Redis
    - Cache stock data with 30s TTL
    - Cache size guides by category
    - Use SWR for client-side caching
    - _Requirements: Performance goals_

- [x] 16. Accessibility enhancements
  - [x] 16.1 Add keyboard navigation support
    - Implement arrow key navigation
    - Add escape key for modals
    - Support tab navigation
    - Add keyboard shortcuts for zoom
    - _Requirements: 15.1, 15.4_

  - [x] 16.2 Write property test for focus indicators
    - **Property 39: Focus indicators presence**
    - **Validates: Requirements 15.1**

  - [x] 16.3 Write property test for zoom accessibility
    - **Property 41: Zoom control accessibility**
    - **Validates: Requirements 15.4**

  - [x] 16.4 Ensure screen reader support
    - Add descriptive alt text to all images
    - Implement ARIA labels for controls
    - Add ARIA live regions for updates
    - Test with NVDA/JAWS
    - _Requirements: 15.2, 15.3_

  - [x] 16.5 Write property test for alt text
    - **Property 40: Image alt text completeness**
    - **Validates: Requirements 15.2**

  - [x] 16.6 Add color-blind friendly alternatives
    - Provide text alternatives for color-coded info
    - Use patterns in addition to colors
    - Ensure sufficient color contrast
    - _Requirements: 15.5_

  - [x] 16.7 Write property test for color alternatives
    - **Property 42: Color information alternatives**
    - **Validates: Requirements 15.5**

- [x] 17. Admin panel integration
  - [x] 17.1 Add 360° image upload interface
    - Create multi-file upload for 360° frames
    - Generate thumbnails automatically
    - Set frame order
    - Preview 360° view
    - _Requirements: 2.1, 2.2_

  - [x] 17.2 Add video upload interface
    - Support video file upload
    - Generate video thumbnails
    - Set video metadata
    - Preview video playback
    - _Requirements: 3.1, 3.2_

  - [x] 17.3 Add AR model upload
    - Support USDZ and GLB file formats
    - Validate model files
    - Preview AR model
    - _Requirements: 10.1_

  - [x] 17.4 Create size guide management
    - CRUD interface for size guides
    - Category-specific guide creation
    - Measurement table editor
    - Fit recommendation editor
    - _Requirements: 5.2, 5.3_

  - [x] 17.5 Add Q&A moderation interface
    - List pending questions
    - Approve/reject questions
    - Add official vendor responses
    - Manage Q&A visibility
    - _Requirements: 11.3_

- [-] 18. Final checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests
  - Run integration tests
  - Run accessibility tests
  - Run performance tests
  - Fix any failing tests
  - Ensure all tests pass, ask the user if questions arise.
