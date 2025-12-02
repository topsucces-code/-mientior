# Design Document

## Overview

The Immersive Product Page enhancement transforms the existing product detail page into a premium, engaging shopping experience. This design builds upon the current PDP implementation by adding high-resolution media capabilities (zoom, 360° views, video), enriched product information, customer review media, real-time stock updates, and estimated delivery calculations. The architecture emphasizes performance, accessibility, and mobile responsiveness while maintaining the existing design system and component structure.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Product Detail Page                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────────────┐  │
│  │  Media Gallery   │         │   Product Information    │  │
│  │  - Images        │         │   - Title & Price        │  │
│  │  - 360° Viewer   │         │   - Variants             │  │
│  │  - Video Player  │         │   - Stock Status         │  │
│  │  - AR Preview    │         │   - Delivery Estimate    │  │
│  │  - Zoom/Lightbox │         │   - Add to Cart          │  │
│  └──────────────────┘         └──────────────────────────┘  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Tabbed Content Section                      ││
│  │  ┌──────────┬──────────┬──────────┬──────┬──────────┐  ││
│  │  │Description│Specs     │Reviews   │Q&A   │Shipping  │  ││
│  │  └──────────┴──────────┴──────────┴──────┴──────────┘  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      Backend Services                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Stock Service│  │Delivery Calc │  │ Media Processing │  │
│  │ (Redis)      │  │ Service      │  │ Service          │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
ProductPage (Server Component)
├── ProductGallery (Client Component)
│   ├── ImageZoom
│   ├── Product360Viewer
│   ├── ProductVideoPlayer
│   ├── ARPreviewButton
│   └── Lightbox
├── ProductInfo (Client Component)
│   ├── VariantSelector
│   ├── StockIndicator (Real-time)
│   ├── DeliveryEstimator
│   └── SizeGuideModal
└── ProductTabs (Client Component)
    ├── DescriptionTab
    ├── SpecificationsTab
    ├── ReviewsTab (with media)
    ├── QATab
    └── ShippingTab
```

## Components and Interfaces

### 1. Enhanced Product Gallery

**Purpose:** Display product media with zoom, 360°, and video capabilities

**Component Structure:**
```typescript
interface EnhancedProductGalleryProps {
  images: ProductImage[]
  productName: string
  has360View?: boolean
  hasVideo?: boolean
  arModelUrl?: string
  userPhotos?: ReviewMedia[]
}

interface ProductImage {
  url: string
  alt: string
  type: 'image' | 'video' | '360'
  thumbnail?: string
  videoUrl?: string
  frames?: string[] // For 360° views
  order: number
}
```

**Key Features:**
- Progressive image loading with blur-up placeholders
- Zoom levels: 1x, 2x, 4x with pan functionality
- Keyboard navigation (arrow keys, escape)
- Touch gestures for mobile (pinch-to-zoom, swipe)
- Lightbox mode with full-screen viewing

**Implementation Notes:**
- Use Next.js Image component for optimization
- Implement lazy loading for 360° frames
- Use Embla Carousel for mobile swipe
- Store zoom state in component (no global state needed)

### 2. 360° Product Viewer

**Purpose:** Interactive product rotation viewer

**Component Structure:**
```typescript
interface Product360ViewerProps {
  frames: string[] // Array of image URLs for each rotation frame
  productName: string
  frameCount?: number // Default: frames.length
  autoRotate?: boolean
  rotationSpeed?: number
}

interface ViewerState {
  currentFrame: number
  isDragging: boolean
  startX: number
  rotation: number
}
```

**Key Features:**
- Drag-to-rotate with momentum
- Auto-rotation option
- Frame preloading strategy
- Rotation angle indicator
- Mobile touch support

**Implementation Notes:**
- Preload first and last frames immediately
- Lazy load intermediate frames
- Use requestAnimationFrame for smooth rotation
- Calculate frame based on drag distance: `frame = Math.floor((dragDistance / containerWidth) * frameCount)`

### 3. Video Player Component

**Purpose:** Display product demonstration videos

**Component Structure:**
```typescript
interface ProductVideoPlayerProps {
  videoUrl: string
  posterUrl: string
  productName: string
  autoplay?: boolean
  controls?: boolean
}
```

**Key Features:**
- Native HTML5 video controls
- Poster image before playback
- Fullscreen support
- Play/pause/volume controls
- Mobile-optimized playback

**Implementation Notes:**
- Use HTML5 `<video>` element
- Lazy load video until user interaction
- Support multiple formats (MP4, WebM)
- Track video engagement analytics

### 4. AR Preview Component

**Purpose:** Launch AR viewer for compatible devices

**Component Structure:**
```typescript
interface ARPreviewButtonProps {
  modelUrl: string // USDZ for iOS, GLB for Android
  productName: string
}
```

**Key Features:**
- Device capability detection
- iOS Quick Look integration
- Android Scene Viewer integration
- Fallback for unsupported devices

**Implementation Notes:**
- Use `<a rel="ar">` for iOS
- Use `intent://` URL for Android
- Hide button if AR not supported
- Provide 3D model in USDZ and GLB formats

### 5. Real-Time Stock Indicator

**Purpose:** Display live stock availability

**Component Structure:**
```typescript
interface StockIndicatorProps {
  productId: string
  variantId?: string
  initialStock: number
  threshold?: number // Show count below this
  lowStockThreshold?: number // Warning threshold
}

interface StockUpdate {
  productId: string
  variantId?: string
  stock: number
  timestamp: number
}
```

**Key Features:**
- WebSocket connection for real-time updates
- Fallback to polling if WebSocket unavailable
- Visual indicators for stock levels
- Automatic variant stock switching

**Implementation Notes:**
- Use Pusher for real-time updates
- Subscribe to product-specific channel
- Update UI within 5 seconds of stock change
- Cache stock data in Redis with 30-second TTL

### 6. Delivery Estimator

**Purpose:** Calculate and display estimated delivery dates

**Component Structure:**
```typescript
interface DeliveryEstimatorProps {
  productId: string
  variantId?: string
  userLocation?: Location
  shippingOptions: ShippingOption[]
}

interface ShippingOption {
  id: string
  name: string
  price: number
  estimatedDays: number
  description: string
}

interface DeliveryEstimate {
  minDate: Date
  maxDate: Date
  shippingOption: ShippingOption
  processingDays: number
}
```

**Key Features:**
- Location-based calculation
- Multiple shipping method support
- Processing time inclusion
- Business days calculation
- Holiday awareness

**Implementation Notes:**
- Detect user location from IP or saved address
- Calculate: `deliveryDate = currentDate + processingDays + shippingDays`
- Exclude weekends and holidays
- Cache estimates by location + product combination

### 7. Size Guide Modal

**Purpose:** Interactive sizing information

**Component Structure:**
```typescript
interface SizeGuideModalProps {
  isOpen: boolean
  onClose: () => void
  category: string
  measurements?: SizeMeasurement[]
}

interface SizeMeasurement {
  size: string
  chest?: number
  waist?: number
  hips?: number
  length?: number
  unit: 'cm' | 'in'
}
```

**Key Features:**
- Category-specific sizing tables
- Unit conversion (cm/inches)
- Fit recommendations
- Size selection integration
- Measurement instructions

**Implementation Notes:**
- Store size guides in database by category
- Support multiple measurement systems
- Provide visual measurement guides
- Auto-select size in product when chosen from guide

### 8. Review Media Gallery

**Purpose:** Display customer photos and videos in reviews

**Component Structure:**
```typescript
interface ReviewWithMedia extends Review {
  images?: string[]
  videos?: string[]
  verified: boolean
}

interface ReviewMediaGalleryProps {
  reviews: ReviewWithMedia[]
  filters: ReviewFilters
  sortBy: 'recent' | 'helpful' | 'rating'
}

interface ReviewFilters {
  withPhotos: boolean
  withVideos: boolean
  verifiedOnly: boolean
  minRating?: number
}
```

**Key Features:**
- Photo/video thumbnails in reviews
- Lightbox for media viewing
- Filter by media presence
- Verified purchase badges
- Helpful voting system

**Implementation Notes:**
- Store review media URLs in JSON field
- Lazy load review images
- Support up to 5 images per review
- Compress and optimize uploaded media

### 9. Q&A Section

**Purpose:** Product questions and answers

**Component Structure:**
```typescript
interface QAItem {
  id: string
  question: string
  answer: string
  author?: {
    name: string
    verified: boolean
  }
  answers?: Answer[]
  helpful: number
  notHelpful: number
  askedAt: Date
  verified: boolean
}

interface Answer {
  id: string
  text: string
  author: {
    name: string
    isOfficial: boolean
  }
  createdAt: Date
  isOfficial: boolean
}
```

**Key Features:**
- Search functionality
- Question submission
- Helpful voting
- Official vendor responses
- Multiple answers per question

**Implementation Notes:**
- Store Q&A in separate database table
- Moderate questions before publishing
- Notify vendors of new questions
- Sort by helpfulness score

## Data Models

### Database Schema Extensions

```prisma
// Extend ProductImage model
model ProductImage {
  id        String   @id @default(cuid())
  url       String
  alt       String
  type      String   @default("IMAGE") // IMAGE, VIDEO, THREE_SIXTY
  order     Int      @default(0)
  productId String
  createdAt DateTime @default(now())
  thumbnail String?
  
  // New fields
  videoUrl  String?  // For VIDEO type
  frames    Json?    // Array of frame URLs for THREE_SIXTY
  width     Int?     // Original image width
  height    Int?     // Original image height
  
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@index([productId])
  @@map("product_images")
}

// New model for Product Q&A
model ProductQuestion {
  id         String   @id @default(cuid())
  productId  String
  userId     String?
  question   String
  status     String   @default("PENDING") // PENDING, APPROVED, REJECTED
  helpful    Int      @default(0)
  notHelpful Int      @default(0)
  verified   Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  answers    ProductAnswer[]
  
  @@index([productId])
  @@index([status])
  @@map("product_questions")
}

model ProductAnswer {
  id         String   @id @default(cuid())
  questionId String
  userId     String?
  vendorId   String?
  answer     String
  isOfficial Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  question   ProductQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  
  @@index([questionId])
  @@map("product_answers")
}

// New model for Size Guides
model SizeGuide {
  id          String   @id @default(cuid())
  categoryId  String
  measurements Json    // Array of size measurements
  instructions String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  category    Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  @@unique([categoryId])
  @@map("size_guides")
}

// Extend Product model
model Product {
  // ... existing fields ...
  
  // New fields
  arModelUrl     String?  // URL to AR model (USDZ/GLB)
  processingDays Int      @default(2) // Days to process order
  
  // New relations
  questions      ProductQuestion[]
}

// Extend Review model to support media
model Review {
  // ... existing fields ...
  images     Json?    // Array of image URLs
  videos     Json?    // Array of video URLs
  // ... rest of fields ...
}
```

### API Endpoints

```typescript
// Stock updates
GET  /api/products/[id]/stock
POST /api/products/[id]/stock/subscribe // WebSocket upgrade

// Delivery estimation
POST /api/delivery/estimate
Body: { productId, variantId?, location, shippingMethod }

// Q&A
GET  /api/products/[id]/questions
POST /api/products/[id]/questions
POST /api/products/[id]/questions/[questionId]/answers
POST /api/products/[id]/questions/[questionId]/vote

// Size guides
GET  /api/size-guides/[categoryId]

// Review media
POST /api/reviews/[id]/media/upload
GET  /api/reviews/[id]/media/[mediaId]

// 360° frames
GET  /api/products/[id]/360-frames
```

## Error Handling

### Client-Side Error Handling

1. **Image Loading Failures**
   - Display placeholder image
   - Retry loading up to 3 times
   - Show error message if all retries fail
   - Log error to monitoring service

2. **Video Playback Errors**
   - Display error message with retry button
   - Fall back to poster image
   - Provide download link as alternative

3. **360° Viewer Failures**
   - Fall back to first frame as static image
   - Display error message
   - Disable rotation controls

4. **WebSocket Connection Failures**
   - Fall back to polling for stock updates
   - Display connection status indicator
   - Retry connection with exponential backoff

5. **AR Preview Failures**
   - Hide AR button if not supported
   - Display error message if model fails to load
   - Provide fallback to 360° view if available

### Server-Side Error Handling

1. **Stock Service Errors**
   - Return cached stock data if Redis unavailable
   - Fall back to database query
   - Log errors for monitoring

2. **Delivery Calculation Errors**
   - Return default estimates if calculation fails
   - Log errors with context
   - Display generic delivery timeframe

3. **Media Upload Errors**
   - Validate file types and sizes
   - Return specific error messages
   - Clean up partial uploads

4. **Q&A Submission Errors**
   - Validate input length and content
   - Rate limit submissions
   - Return validation errors to user

## Testing Strategy

### Unit Testing

**Framework:** Vitest with React Testing Library

**Test Coverage:**
- Component rendering with various props
- User interaction handlers (click, drag, keyboard)
- State management and updates
- Error boundary behavior
- Accessibility attributes

**Example Tests:**
```typescript
// ProductGallery.test.tsx
describe('ProductGallery', () => {
  it('should render all product images', () => {})
  it('should open lightbox on image click', () => {})
  it('should navigate with keyboard arrows', () => {})
  it('should display zoom controls on hover', () => {})
  it('should handle missing images gracefully', () => {})
})

// Product360Viewer.test.tsx
describe('Product360Viewer', () => {
  it('should load first frame immediately', () => {})
  it('should rotate on drag', () => {})
  it('should display current frame number', () => {})
  it('should handle touch gestures', () => {})
})

// StockIndicator.test.tsx
describe('StockIndicator', () => {
  it('should display stock count when low', () => {})
  it('should show out of stock message', () => {})
  it('should update on real-time changes', () => {})
})
```

### Property-Based Testing

**Framework:** fast-check

**Properties to Test:**
- Image zoom calculations
- 360° rotation frame selection
- Delivery date calculations
- Review sorting and filtering
- Stock threshold logic



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Lightbox opens with correct image
*For any* product image in the gallery, clicking it should open the lightbox displaying that exact image.
**Validates: Requirements 1.2**

### Property 2: Zoom level cycling
*For any* image in zoom mode, repeatedly activating zoom should cycle through levels 1x → 2x → 4x → 1x.
**Validates: Requirements 1.3**

### Property 3: Keyboard navigation wraps correctly
*For any* image gallery with N images, pressing right arrow on the last image should navigate to the first image, and pressing left arrow on the first image should navigate to the last image.
**Validates: Requirements 1.4**

### Property 4: Pan position calculation
*For any* mouse coordinates within a zoomed image, the pan position should be calculated proportionally to keep the mouse-pointed area centered.
**Validates: Requirements 1.5**

### Property 5: 360° badge visibility
*For any* product with 360° image data (frames array present), the "360° View" badge should be displayed in the gallery.
**Validates: Requirements 2.1**

### Property 6: Frame selection proportional to drag
*For any* drag distance D and frame count N, the selected frame should be `Math.floor((D / containerWidth) * N) % N`.
**Validates: Requirements 2.3**

### Property 7: Rotation angle display accuracy
*For any* current frame F in a 360° viewer with N total frames, the displayed rotation angle should be `(F / N) * 360` degrees.
**Validates: Requirements 2.4**

### Property 8: Video badge visibility
*For any* product with video content (videoUrl present), the "Video" badge should be displayed in the gallery.
**Validates: Requirements 3.1**

### Property 9: Video navigation availability
*For any* product with multiple videos (count > 1), navigation controls should be enabled and functional.
**Validates: Requirements 3.5**

### Property 10: Specifications table rendering
*For any* product with specifications data, all specification key-value pairs should be rendered in the table format.
**Validates: Requirements 4.3**

### Property 11: Measurement units display
*For any* product dimension or measurement, the value should be displayed with its corresponding unit (cm, kg, etc.).
**Validates: Requirements 4.5**

### Property 12: Size guide link visibility
*For any* product with size variants (variants array contains items with size property), the "Size Guide" link should be displayed.
**Validates: Requirements 5.1**

### Property 13: Size system conversions
*For any* size guide with measurements, conversions between metric and imperial systems should maintain mathematical accuracy (1 inch = 2.54 cm).
**Validates: Requirements 5.3**

### Property 14: Category-specific fit recommendations
*For any* product category with defined fit recommendations, those recommendations should be displayed in the size guide.
**Validates: Requirements 5.4**

### Property 15: Size selection synchronization
*For any* size selected in the size guide modal, the product variant selector should update to reflect that selection.
**Validates: Requirements 5.5**

### Property 16: Review component completeness
*For any* review, the display should include star rating, text content, and all attached media (if present).
**Validates: Requirements 6.1**

### Property 17: Review photo lightbox
*For any* review containing photos, clicking any photo thumbnail should open the lightbox with that photo.
**Validates: Requirements 6.2**

### Property 18: Review video thumbnails
*For any* review containing videos, video thumbnails should be displayed with play icon overlays.
**Validates: Requirements 6.3**

### Property 19: Review media navigation
*For any* review with multiple media items (photos + videos), lightbox navigation should allow cycling through all items.
**Validates: Requirements 6.4**

### Property 20: Verified review badge
*For any* review marked as verified purchase (verified = true), a verification badge should be displayed.
**Validates: Requirements 6.6**

### Property 21: Review filtering accuracy
*For any* filter criteria applied to a review set, only reviews matching all active filter conditions should be displayed.
**Validates: Requirements 7.2**

### Property 22: Photo filter correctness
*For any* review set filtered by "With Photos", all displayed reviews should have non-empty images array.
**Validates: Requirements 7.3**

### Property 23: Verified filter correctness
*For any* review set filtered by "Verified Purchase", all displayed reviews should have verified = true.
**Validates: Requirements 7.4**

### Property 24: Stock display threshold
*For any* product with stock quantity S, the quantity should be displayed if and only if S < 10.
**Validates: Requirements 8.1**

### Property 25: Low stock warning threshold
*For any* product with stock quantity S where 0 < S < 5, a low stock warning should be displayed.
**Validates: Requirements 8.4**

### Property 26: Variant stock synchronization
*For any* variant selection, the displayed stock quantity should match the selected variant's stock value.
**Validates: Requirements 8.5**

### Property 27: Delivery date calculation
*For any* product with processing days P and shipping days S, the estimated delivery date should be current date + P + S (excluding weekends).
**Validates: Requirements 9.1, 9.4**

### Property 28: Multiple shipping option estimates
*For any* product with N shipping options, N delivery estimates should be displayed, one for each option.
**Validates: Requirements 9.3**

### Property 29: AR button visibility
*For any* product with AR model URL present, the "AR Preview" button should be displayed.
**Validates: Requirements 10.1**

### Property 30: AR button hiding on unsupported devices
*For any* device without AR capability (no WebXR or AR Quick Look support), the AR button should be hidden.
**Validates: Requirements 10.3**

### Property 31: Q&A sorting by helpfulness
*For any* set of Q&A items, they should be sorted in descending order by (helpful - notHelpful) score.
**Validates: Requirements 11.1**

### Property 32: Q&A search filtering
*For any* search query Q and Q&A set, displayed items should have Q as a substring in either question or answer (case-insensitive).
**Validates: Requirements 11.2**

### Property 33: Q&A vote count updates
*For any* vote action on a Q&A item, the corresponding vote count (helpful or notHelpful) should increment by 1.
**Validates: Requirements 11.4**

### Property 34: Official response badge
*For any* Q&A answer marked as official (isOfficial = true), a verification badge should be displayed.
**Validates: Requirements 11.5**

### Property 35: Shipping methods completeness
*For any* product with N shipping methods configured, all N methods should be displayed with their costs and delivery times.
**Validates: Requirements 12.1**

### Property 36: Free shipping threshold display
*For any* shipping configuration with a free shipping threshold T, the value T should be displayed to users.
**Validates: Requirements 12.2**

### Property 37: International shipping indication
*For any* product with international shipping enabled, supported countries and additional costs should be displayed.
**Validates: Requirements 12.4**

### Property 38: Location-based shipping personalization
*For any* user location L, displayed shipping information should reflect options and costs specific to location L.
**Validates: Requirements 12.5**

### Property 39: Focus indicators presence
*For any* interactive element (button, link, input), a visible focus indicator should be present when focused.
**Validates: Requirements 15.1**

### Property 40: Image alt text completeness
*For any* product image, the alt attribute should be non-empty and descriptive.
**Validates: Requirements 15.2**

### Property 41: Zoom control accessibility
*For any* zoom control, keyboard shortcuts (+ for zoom in, - for zoom out) and ARIA labels should be present.
**Validates: Requirements 15.4**

### Property 42: Color information alternatives
*For any* information conveyed by color (stock status, ratings), a text alternative should also be present.
**Validates: Requirements 15.5**

## Testing Strategy

### Unit Testing Approach

**Framework:** Vitest with React Testing Library

**Coverage Goals:**
- Component rendering: 90%+
- User interactions: 85%+
- Error handling: 80%+
- Accessibility: 100% of WCAG 2.1 AA requirements

**Key Test Suites:**

1. **ProductGallery Tests**
   - Render with various image counts
   - Lightbox open/close
   - Keyboard navigation
   - Zoom functionality
   - Touch gesture handling
   - Error states (missing images)

2. **Product360Viewer Tests**
   - Frame loading sequence
   - Drag-to-rotate calculations
   - Frame selection accuracy
   - Touch gesture support
   - Error handling (missing frames)

3. **StockIndicator Tests**
   - Display logic for various stock levels
   - Real-time update handling
   - Variant stock switching
   - Out of stock state
   - Low stock warnings

4. **DeliveryEstimator Tests**
   - Date calculation accuracy
   - Business day exclusion
   - Multiple shipping options
   - Location-based estimates
   - Backorder handling

5. **ReviewMediaGallery Tests**
   - Review rendering with media
   - Filter application
   - Sort functionality
   - Lightbox navigation
   - Verified badge display

### Property-Based Testing Approach

**Framework:** fast-check

**Configuration:** Minimum 100 iterations per property test

**Property Test Suites:**

1. **Image Navigation Properties**
```typescript
// Property: Keyboard navigation wraps correctly
fc.assert(
  fc.property(
    fc.array(fc.string(), { minLength: 1, maxLength: 20 }), // image URLs
    fc.integer({ min: 0, max: 19 }), // starting index
    (images, startIndex) => {
      const actualStart = startIndex % images.length
      const nextIndex = (actualStart + 1) % images.length
      const prevIndex = (actualStart - 1 + images.length) % images.length
      
      // Test navigation logic
      expect(navigateNext(actualStart, images.length)).toBe(nextIndex)
      expect(navigatePrev(actualStart, images.length)).toBe(prevIndex)
    }
  ),
  { numRuns: 100 }
)
```

2. **360° Rotation Properties**
```typescript
// Property: Frame selection proportional to drag
fc.assert(
  fc.property(
    fc.integer({ min: 10, max: 100 }), // frame count
    fc.integer({ min: 0, max: 1000 }), // drag distance
    fc.integer({ min: 100, max: 2000 }), // container width
    (frameCount, dragDistance, containerWidth) => {
      const expectedFrame = Math.floor((dragDistance / containerWidth) * frameCount) % frameCount
      const actualFrame = calculateFrame(dragDistance, containerWidth, frameCount)
      
      expect(actualFrame).toBe(expectedFrame)
      expect(actualFrame).toBeGreaterThanOrEqual(0)
      expect(actualFrame).toBeLessThan(frameCount)
    }
  ),
  { numRuns: 100 }
)
```

3. **Delivery Calculation Properties**
```typescript
// Property: Delivery date calculation
fc.assert(
  fc.property(
    fc.date(), // current date
    fc.integer({ min: 1, max: 5 }), // processing days
    fc.integer({ min: 1, max: 10 }), // shipping days
    (currentDate, processingDays, shippingDays) => {
      const deliveryDate = calculateDeliveryDate(currentDate, processingDays, shippingDays)
      
      // Delivery date should be in the future
      expect(deliveryDate.getTime()).toBeGreaterThan(currentDate.getTime())
      
      // Should account for processing + shipping
      const businessDays = countBusinessDays(currentDate, deliveryDate)
      expect(businessDays).toBeGreaterThanOrEqual(processingDays + shippingDays)
    }
  ),
  { numRuns: 100 }
)
```

4. **Review Filtering Properties**
```typescript
// Property: Filter accuracy
fc.assert(
  fc.property(
    fc.array(reviewGenerator()), // random reviews
    fc.record({
      withPhotos: fc.boolean(),
      verified: fc.boolean(),
      minRating: fc.option(fc.integer({ min: 1, max: 5 }))
    }),
    (reviews, filters) => {
      const filtered = applyReviewFilters(reviews, filters)
      
      // All filtered reviews should match criteria
      filtered.forEach(review => {
        if (filters.withPhotos) {
          expect(review.images).toBeDefined()
          expect(review.images.length).toBeGreaterThan(0)
        }
        if (filters.verified) {
          expect(review.verified).toBe(true)
        }
        if (filters.minRating) {
          expect(review.rating).toBeGreaterThanOrEqual(filters.minRating)
        }
      })
    }
  ),
  { numRuns: 100 }
)
```

5. **Stock Display Properties**
```typescript
// Property: Stock display threshold
fc.assert(
  fc.property(
    fc.integer({ min: 0, max: 100 }), // stock quantity
    (stock) => {
      const shouldDisplay = stock < 10
      const isDisplayed = shouldShowStockCount(stock)
      
      expect(isDisplayed).toBe(shouldDisplay)
      
      // Low stock warning
      if (stock > 0 && stock < 5) {
        expect(shouldShowLowStockWarning(stock)).toBe(true)
      }
    }
  ),
  { numRuns: 100 }
)
```

### Integration Testing

**Scope:** End-to-end user flows

**Key Scenarios:**
1. Browse product → View 360° → Zoom image → Add to cart
2. Read reviews → Filter by photos → View review images → Vote helpful
3. Check stock → Select variant → View delivery estimate → Proceed to checkout
4. Ask question → Search Q&A → Vote on answer
5. View size guide → Select size → Add to cart

**Tools:**
- Playwright for E2E tests
- Mock API responses for consistent testing
- Visual regression testing for UI consistency

### Performance Testing

**Metrics:**
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

**Tools:**
- Lighthouse CI for automated performance audits
- WebPageTest for real-world performance testing
- Chrome DevTools for profiling

### Accessibility Testing

**Standards:** WCAG 2.1 Level AA compliance

**Tools:**
- axe-core for automated accessibility testing
- NVDA/JAWS for screen reader testing
- Keyboard-only navigation testing
- Color contrast verification

**Key Checks:**
- All images have descriptive alt text
- All interactive elements are keyboard accessible
- Focus indicators are visible
- ARIA labels are present and accurate
- Color is not the only means of conveying information
