# Frontend Test Plan - Mientior E-Commerce

## 1. Authentication & User Management

### 1.1 User Registration & Login
- [ ] Test email/password registration
- [ ] Test Google OAuth login (if configured)
- [ ] Verify email validation
- [ ] Test password strength requirements
- [ ] Verify session creation and persistence
- [ ] Test "Remember me" functionality
- [ ] Test logout functionality
- [ ] Verify protected routes redirect to login

### 1.2 Session Management
- [ ] Verify Redis session caching (5 min)
- [ ] Test session expiry (7 days)
- [ ] Verify session refresh on activity
- [ ] Test concurrent sessions handling

## 2. Product Browsing & Discovery

### 2.1 Product Listing Page
- [ ] Verify products load correctly
- [ ] Test pagination functionality
- [ ] Verify product images display
- [ ] Test product card interactions
- [ ] Verify price display (regular & sale prices)
- [ ] Test badge display (featured, on sale, custom)
- [ ] Verify rating and review count display

### 2.2 Product Filtering & Sorting
- [ ] Test category filter
- [ ] Test price range filter
- [ ] Test color/size filters
- [ ] Test brand/vendor filter
- [ ] Test "In Stock" filter
- [ ] Verify sort by: price (low/high), newest, rating
- [ ] Test filter combination
- [ ] Verify filter persistence in URL

### 2.3 Product Detail Page (PDP)
- [ ] Verify all product images load
- [ ] Test image gallery navigation
- [ ] Test image zoom functionality
- [ ] Verify variant selection (size, color)
- [ ] Test quantity selector (min: 1, max: stock)
- [ ] Verify stock indicator accuracy
- [ ] Test "Add to Cart" button
- [ ] Test "Add to Wishlist" button
- [ ] Verify product tabs (Description, Specs, Reviews)
- [ ] Test reviews section pagination
- [ ] Verify related products display
- [ ] Test social share buttons

### 2.4 Search Functionality
- [ ] Test search bar autocomplete
- [ ] Verify search suggestions
- [ ] Test visual search (if implemented)
- [ ] Verify trending searches display
- [ ] Test search results page
- [ ] Verify "no results" state
- [ ] Test search filters

## 3. Shopping Cart

### 3.1 Cart Operations
- [ ] Test add to cart (from PDP)
- [ ] Test add to cart (from product listing)
- [ ] Verify cart preview dropdown
- [ ] Test quantity update in cart
- [ ] Test remove from cart
- [ ] Verify cart total calculation
- [ ] Test cart persistence (localStorage)
- [ ] Verify stock validation on add
- [ ] Test maximum quantity limits

### 3.2 Cart UI/UX
- [ ] Verify cart item display (image, name, price, qty)
- [ ] Test cart summary display
- [ ] Verify shipping calculator
- [ ] Test promo code input
- [ ] Verify free shipping progress bar
- [ ] Test "Continue Shopping" link
- [ ] Test "Proceed to Checkout" button
- [ ] Verify empty cart state

### 3.3 Cart Recommendations
- [ ] Test "Frequently Bought Together" display
- [ ] Test "Saved for Later" functionality
- [ ] Verify cart recommendations relevance

## 4. Checkout Flow

### 4.1 Shipping Information
- [ ] Test shipping form validation
- [ ] Verify address autocomplete
- [ ] Test saved addresses dropdown
- [ ] Verify "Save address" checkbox
- [ ] Test address validation API
- [ ] Verify required fields
- [ ] Test phone number formatting

### 4.2 Shipping Options
- [ ] Verify shipping options load
- [ ] Test shipping method selection
- [ ] Verify shipping cost calculation
- [ ] Test estimated delivery display
- [ ] Verify relay point selection (if applicable)

### 4.3 Payment Integration
- [ ] Test Paystack payment form
- [ ] Test Flutterwave payment form
- [ ] Verify payment method selection
- [ ] Test card number validation
- [ ] Test CVV validation
- [ ] Test expiry date validation
- [ ] Verify payment processing loader
- [ ] Test payment success redirect
- [ ] Test payment failure handling

### 4.4 Order Summary
- [ ] Verify order summary sidebar
- [ ] Test item list display
- [ ] Verify subtotal calculation
- [ ] Verify tax calculation
- [ ] Verify shipping cost display
- [ ] Test promo code discount
- [ ] Verify total calculation
- [ ] Test trust badges display

### 4.5 Order Confirmation
- [ ] Verify order confirmation page
- [ ] Test order number display
- [ ] Verify order details accuracy
- [ ] Test email confirmation sending
- [ ] Verify order tracking link
- [ ] Test "Continue Shopping" button

## 5. User Account

### 5.1 Account Dashboard
- [ ] Verify dashboard overview loads
- [ ] Test order history display
- [ ] Verify loyalty points display
- [ ] Test loyalty level badge
- [ ] Verify total spent display
- [ ] Test recently viewed products

### 5.2 Order Management
- [ ] Test order list pagination
- [ ] Verify order status display
- [ ] Test order detail view
- [ ] Verify order tracking functionality
- [ ] Test order cancellation (if pending)
- [ ] Verify invoice download

### 5.3 Address Management
- [ ] Test add new address
- [ ] Verify address list display
- [ ] Test edit address
- [ ] Test delete address
- [ ] Verify default address selection
- [ ] Test address validation

### 5.4 Profile Settings
- [ ] Test profile update form
- [ ] Verify email change (with verification)
- [ ] Test password change
- [ ] Verify profile picture upload
- [ ] Test notification preferences

## 6. Wishlist & Comparator

### 6.1 Wishlist
- [ ] Test add to wishlist (from PDP)
- [ ] Test add to wishlist (from listing)
- [ ] Verify wishlist dropdown
- [ ] Test remove from wishlist
- [ ] Verify wishlist page
- [ ] Test wishlist sync (if logged in)
- [ ] Verify wishlist persistence

### 6.2 Product Comparison
- [ ] Test add to comparison
- [ ] Verify comparison dropdown
- [ ] Test comparison page (max 4 products)
- [ ] Verify side-by-side comparison
- [ ] Test remove from comparison
- [ ] Verify comparison persistence

## 7. Gamification & Loyalty

### 7.1 Loyalty Program
- [ ] Verify loyalty points calculation
- [ ] Test level progression (Bronze → Platinum)
- [ ] Verify loyalty benefits display
- [ ] Test points redemption
- [ ] Verify challenges display

### 7.2 Gamification Features
- [ ] Test fortune wheel spin
- [ ] Verify spin eligibility
- [ ] Test reward redemption
- [ ] Verify achievement badges
- [ ] Test referral program (if implemented)

## 8. Reviews & Ratings

### 8.1 Review Submission
- [ ] Test review form (logged in users)
- [ ] Verify star rating selection
- [ ] Test review text validation
- [ ] Verify image upload (optional)
- [ ] Test review submission
- [ ] Verify review pending status

### 8.2 Review Display
- [ ] Verify review list display
- [ ] Test review pagination
- [ ] Verify verified purchase badge
- [ ] Test helpful/not helpful voting
- [ ] Verify review sorting (newest, helpful)
- [ ] Test review filtering by rating

## 9. Homepage Features

### 9.1 Hero Section
- [ ] Verify hero carousel auto-play
- [ ] Test manual carousel navigation
- [ ] Verify CTA buttons functionality
- [ ] Test responsive images

### 9.2 Product Sections
- [ ] Test flash deals countdown timer
- [ ] Verify featured products carousel
- [ ] Test curated collections display
- [ ] Verify trending products carousel
- [ ] Test product quick view modal

### 9.3 Additional Sections
- [ ] Verify categories navigation
- [ ] Test social proof bar
- [ ] Verify trust badges display
- [ ] Test Instagram feed (if configured)
- [ ] Verify newsletter subscription form

## 10. Navigation & Header

### 10.1 Main Navigation
- [ ] Test mega menu functionality
- [ ] Verify category navigation
- [ ] Test mobile navigation drawer
- [ ] Verify sticky header behavior
- [ ] Test scroll-to-top button

### 10.2 Header Components
- [ ] Test search bar expand/collapse
- [ ] Verify cart preview dropdown
- [ ] Test wishlist dropdown
- [ ] Verify user account dropdown
- [ ] Test notifications dropdown
- [ ] Verify language/currency selector
- [ ] Test promotional banner display

### 10.3 Mobile Responsiveness
- [ ] Verify hamburger menu
- [ ] Test mobile search
- [ ] Verify mobile cart
- [ ] Test mobile sticky bar
- [ ] Verify touch gestures

## 11. Performance & Optimization

### 11.1 Page Load Performance
- [ ] Test initial page load time (<3s)
- [ ] Verify lazy loading images
- [ ] Test infinite scroll performance
- [ ] Verify code splitting
- [ ] Test ISR cache hits

### 11.2 Network Optimization
- [ ] Verify API response caching (Redis)
- [ ] Test optimistic UI updates
- [ ] Verify debounced search
- [ ] Test request deduplication

## 12. Accessibility (A11y)

### 12.1 Keyboard Navigation
- [ ] Test tab navigation
- [ ] Verify focus indicators
- [ ] Test skip to content link
- [ ] Verify keyboard shortcuts

### 12.2 Screen Reader Support
- [ ] Test ARIA labels
- [ ] Verify semantic HTML
- [ ] Test form labels
- [ ] Verify error announcements

### 12.3 Visual Accessibility
- [ ] Test color contrast ratios
- [ ] Verify text resizing (up to 200%)
- [ ] Test reduced motion preferences
- [ ] Verify alt text on images

## 13. Internationalization (i18n)

### 13.1 Language Support
- [ ] Test language switching
- [ ] Verify translation accuracy
- [ ] Test RTL languages (if supported)
- [ ] Verify date/time localization

### 13.2 Currency & Formatting
- [ ] Test currency conversion
- [ ] Verify number formatting
- [ ] Test price display in selected currency
- [ ] Verify currency symbol placement

## 14. Error Handling & Edge Cases

### 14.1 Error States
- [ ] Test 404 page
- [ ] Verify 500 error page
- [ ] Test network error handling
- [ ] Verify timeout handling
- [ ] Test rate limit messages

### 14.2 Empty States
- [ ] Test empty cart state
- [ ] Verify empty wishlist state
- [ ] Test no search results
- [ ] Verify empty order history
- [ ] Test out of stock display

### 14.3 Validation
- [ ] Test form validation errors
- [ ] Verify inline error messages
- [ ] Test toast notifications
- [ ] Verify success messages

## 15. Cross-Browser Testing

### 15.1 Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### 15.2 Mobile Browsers
- [ ] iOS Safari
- [ ] Chrome Mobile
- [ ] Samsung Internet

### 15.3 Device Testing
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## Test Execution Notes

**Priority Levels:**
- P0: Critical (blocks core functionality)
- P1: High (major feature issues)
- P2: Medium (minor issues)
- P3: Low (cosmetic issues)

**Test Environment:**
- Development: http://localhost:3000
- Staging: [staging URL]
- Production: [production URL]

**Test Data:**
- Use test accounts with different loyalty levels
- Test with various product types and variants
- Use test payment credentials for Paystack/Flutterwave

**Reporting:**
- Log bugs in issue tracker
- Include screenshots/videos
- Note browser and device details
- Assign priority level
