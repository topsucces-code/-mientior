# Backend API Test Plan - Mientior E-Commerce

## 1. Authentication APIs

### 1.1 Registration & Login
**Endpoint:** `POST /api/auth/register`
- [ ] Test successful registration with valid data
- [ ] Test duplicate email validation
- [ ] Test password strength validation
- [ ] Verify user creation in database
- [ ] Test email validation format

**Endpoint:** `POST /api/auth/login`
- [ ] Test successful login with correct credentials
- [ ] Test login with incorrect password
- [ ] Test login with non-existent email
- [ ] Verify session token generation
- [ ] Test rate limiting on failed attempts

**Endpoint:** `GET /api/auth/session`
- [ ] Test session retrieval with valid token
- [ ] Test session retrieval with invalid token
- [ ] Verify Redis cache hit
- [ ] Test session expiry (7 days)

**Endpoint:** `POST /api/auth/logout`
- [ ] Test successful logout
- [ ] Verify session invalidation
- [ ] Test Redis cache clear

## 2. Product APIs

### 2.1 Product Listing
**Endpoint:** `GET /api/products`
- [ ] Test basic product listing (default pagination)
- [ ] Test pagination (_start, _end params)
- [ ] Test sorting (_sort, _order params)
- [ ] Test filtering by status (ACTIVE, DRAFT, ARCHIVED)
- [ ] Test filtering by category
- [ ] Test filtering by price range
- [ ] Test filtering by featured flag
- [ ] Test filtering by onSale flag
- [ ] Verify X-Total-Count header
- [ ] Test with multiple filters combined
- [ ] Verify response includes relations (category, images, tags)

### 2.2 Product Details
**Endpoint:** `GET /api/products/[id]`
- [ ] Test retrieve product by ID
- [ ] Test with non-existent ID (404)
- [ ] Verify all relations loaded (category, images, variants, tags)
- [ ] Test with inactive product (should not return)

**Endpoint:** `GET /api/products/[slug]`
- [ ] Test retrieve product by slug
- [ ] Test with non-existent slug (404)
- [ ] Verify slug uniqueness

### 2.3 Product Creation
**Endpoint:** `POST /api/products`
- [ ] Test create product with minimum required fields
- [ ] Test with all optional fields
- [ ] Test with nested image creation
- [ ] Test with nested variant creation
- [ ] Test with tag connections
- [ ] Test slug auto-generation from name
- [ ] Test duplicate slug handling
- [ ] Verify default values (stock=0, rating=0)
- [ ] Test vendor assignment
- [ ] Test approval status (default=APPROVED)

### 2.4 Product Update
**Endpoint:** `PUT /api/products/[id]`
- [ ] Test update basic fields
- [ ] Test update with nested relations
- [ ] Test price update
- [ ] Test stock update
- [ ] Test category change
- [ ] Test add/remove tags
- [ ] Test add/remove images
- [ ] Test update variants
- [ ] Verify updatedAt timestamp

### 2.5 Product Deletion
**Endpoint:** `DELETE /api/products/[id]`
- [ ] Test soft delete (status=ARCHIVED)
- [ ] Test hard delete (if implemented)
- [ ] Verify cascade delete of images
- [ ] Verify cascade delete of variants
- [ ] Test delete with existing orders (should fail)

## 3. Category APIs

### 3.1 Category Listing
**Endpoint:** `GET /api/categories`
- [ ] Test list all categories
- [ ] Test filtering by isActive
- [ ] Test parent/child hierarchy loading
- [ ] Test sorting by order field
- [ ] Verify product count aggregation

### 3.2 Category CRUD
**Endpoint:** `POST /api/categories`
- [ ] Test create root category (no parent)
- [ ] Test create child category (with parentId)
- [ ] Test slug uniqueness
- [ ] Test order field

**Endpoint:** `PUT /api/categories/[id]`
- [ ] Test update category name
- [ ] Test change parent category
- [ ] Test update image
- [ ] Test reorder categories

**Endpoint:** `DELETE /api/categories/[id]`
- [ ] Test delete category without children
- [ ] Test delete category with children (should fail)
- [ ] Test delete category with products (should fail per Restrict)

## 4. Order APIs

### 4.1 Order Creation
**Endpoint:** `POST /api/orders/create`
- [ ] Test create order with cart items
- [ ] Verify order number generation
- [ ] Test stock deduction
- [ ] Test promo code application
- [ ] Test shipping cost calculation
- [ ] Test tax calculation
- [ ] Verify total calculation
- [ ] Test address validation
- [ ] Test minimum order amount (if applicable)
- [ ] Verify default status (PENDING)

**Endpoint:** `POST /api/orders/initialize`
- [ ] Test order initialization
- [ ] Verify stock locking
- [ ] Test concurrent order prevention
- [ ] Verify Redis stock lock

### 4.2 Order Retrieval
**Endpoint:** `GET /api/orders`
- [ ] Test list user's orders (auth required)
- [ ] Test pagination
- [ ] Test filtering by status
- [ ] Test filtering by date range
- [ ] Verify includes order items
- [ ] Test admin view (all orders)

**Endpoint:** `GET /api/orders/[id]`
- [ ] Test retrieve order by ID
- [ ] Verify user can only access own orders
- [ ] Test admin access to any order
- [ ] Verify all relations loaded (items, user, vendor)

**Endpoint:** `GET /api/orders/track/[orderNumber]`
- [ ] Test order tracking with valid number
- [ ] Test with invalid order number
- [ ] Verify tracking status history
- [ ] Test estimated delivery dates

### 4.3 Order Updates
**Endpoint:** `PUT /api/orders/[id]`
- [ ] Test status update (PENDING → PROCESSING → SHIPPED → DELIVERED)
- [ ] Test payment status update
- [ ] Test cancellation (only if PENDING)
- [ ] Verify audit log creation
- [ ] Test stock restoration on cancellation

**Endpoint:** `POST /api/orders/[id]/complete`
- [ ] Test order completion
- [ ] Verify loyalty points award
- [ ] Test totalOrders increment
- [ ] Test totalSpent update
- [ ] Verify email notification trigger

## 5. User APIs

### 5.1 User Management
**Endpoint:** `GET /api/users`
- [ ] Test list users (admin only)
- [ ] Test pagination
- [ ] Test filtering by loyalty level
- [ ] Test search by email/name
- [ ] Verify aggregated data (totalOrders, totalSpent)

**Endpoint:** `GET /api/users/[id]`
- [ ] Test retrieve user details
- [ ] Test user can access own profile
- [ ] Test admin access to any user
- [ ] Verify includes orders and reviews

**Endpoint:** `PUT /api/users/[id]`
- [ ] Test profile update
- [ ] Test email change (requires verification)
- [ ] Test loyalty points update (admin only)
- [ ] Test loyalty level change

### 5.2 Address Management
**Endpoint:** `GET /api/user/addresses`
- [ ] Test list user addresses
- [ ] Verify authentication required
- [ ] Test default address flag

**Endpoint:** `POST /api/user/addresses`
- [ ] Test add new address
- [ ] Test set as default
- [ ] Test address validation

**Endpoint:** `PUT /api/user/addresses/[id]`
- [ ] Test update address
- [ ] Test change default address

**Endpoint:** `DELETE /api/user/addresses/[id]`
- [ ] Test delete address
- [ ] Test cannot delete default (must set new default first)

### 5.3 User Activity
**Endpoint:** `POST /api/user/recently-viewed`
- [ ] Test add product to recently viewed
- [ ] Test limit to 20 items
- [ ] Verify JSON storage

**Endpoint:** `POST /api/user/wishlist/sync`
- [ ] Test sync wishlist from localStorage
- [ ] Test merge with existing wishlist
- [ ] Verify JSON storage

## 6. Checkout APIs

### 6.1 Address Validation
**Endpoint:** `POST /api/checkout/validate-address`
- [ ] Test valid address
- [ ] Test invalid address format
- [ ] Test address normalization
- [ ] Verify postal code format

### 6.2 Shipping Options
**Endpoint:** `GET /api/checkout/shipping-options`
- [ ] Test get available shipping methods
- [ ] Test location-based shipping
- [ ] Verify shipping cost calculation
- [ ] Test estimated delivery calculation

### 6.3 Payment Initialization
**Endpoint:** `POST /api/checkout/initialize-payment`
- [ ] Test Paystack payment initialization
- [ ] Test Flutterwave payment initialization
- [ ] Verify payment reference generation
- [ ] Test amount validation
- [ ] Verify metadata storage

## 7. Payment Webhooks

### 7.1 Paystack Webhook
**Endpoint:** `POST /api/webhooks/paystack`
- [ ] Test charge.success event
- [ ] Test signature verification
- [ ] Verify order payment status update
- [ ] Test duplicate webhook prevention
- [ ] Test invalid signature rejection

### 7.2 Flutterwave Webhook
**Endpoint:** `POST /api/webhooks/flutterwave`
- [ ] Test successful payment event
- [ ] Test signature verification
- [ ] Verify order status update
- [ ] Test transaction verification
- [ ] Test duplicate prevention

## 8. Search APIs

### 8.1 Product Search
**Endpoint:** `GET /api/search`
- [ ] Test full-text search
- [ ] Test search suggestions
- [ ] Test search filters
- [ ] Verify relevance scoring
- [ ] Test fuzzy matching

**Endpoint:** `GET /api/search/suggestions`
- [ ] Test autocomplete suggestions
- [ ] Test search history
- [ ] Verify suggestion ranking

**Endpoint:** `GET /api/search/trending`
- [ ] Test trending searches retrieval
- [ ] Verify Redis cache
- [ ] Test TTL (time-to-live)

**Endpoint:** `POST /api/search/visual`
- [ ] Test image upload
- [ ] Test visual similarity search
- [ ] Verify image processing

## 9. Review APIs

**Endpoint:** `GET /api/reviews/products/[slug]/reviews`
- [ ] Test get product reviews
- [ ] Test pagination
- [ ] Test filtering by rating
- [ ] Test sorting (newest, helpful)
- [ ] Verify only approved reviews shown

**Endpoint:** `POST /api/reviews`
- [ ] Test create review (auth required)
- [ ] Test one review per user per product
- [ ] Test rating validation (1-5)
- [ ] Verify default status (PENDING)
- [ ] Test verified purchase check

**Endpoint:** `PUT /api/reviews/[id]`
- [ ] Test update own review
- [ ] Test cannot edit after approval
- [ ] Test admin moderation (approve/reject)

## 10. Promo Code APIs

**Endpoint:** `POST /api/promo/validate`
- [ ] Test valid promo code
- [ ] Test expired promo code
- [ ] Test usage limit reached
- [ ] Test minimum order amount
- [ ] Test user usage limit
- [ ] Verify discount calculation

**Endpoint:** `GET /api/promo/banners`
- [ ] Test active promotions retrieval
- [ ] Test date-based filtering
- [ ] Verify Redis caching

## 11. Admin APIs

### 11.1 Dashboard
**Endpoint:** `GET /api/admin/dashboard`
- [ ] Test dashboard stats (auth + role required)
- [ ] Verify total sales
- [ ] Test order count by status
- [ ] Verify top products
- [ ] Test recent orders

### 11.2 Saved Views
**Endpoint:** `POST /api/admin/saved-views`
- [ ] Test create saved view
- [ ] Test set as default
- [ ] Verify JSON filter storage

**Endpoint:** `GET /api/admin/saved-views`
- [ ] Test list user's saved views
- [ ] Test filter by resource

**Endpoint:** `DELETE /api/admin/saved-views/[id]`
- [ ] Test delete saved view
- [ ] Test cannot delete default (must set new default)

### 11.3 Notifications
**Endpoint:** `GET /api/admin/notifications`
- [ ] Test get admin notifications
- [ ] Test pagination
- [ ] Test filter by read status

**Endpoint:** `PUT /api/admin/notifications/[id]`
- [ ] Test mark as read
- [ ] Test mark all as read

## 12. Vendor APIs

**Endpoint:** `GET /api/vendors`
- [ ] Test list vendors
- [ ] Test filter by status (PENDING, ACTIVE, SUSPENDED)
- [ ] Test admin access only

**Endpoint:** `POST /api/vendors`
- [ ] Test vendor registration
- [ ] Verify default status (PENDING)
- [ ] Test document upload

**Endpoint:** `PUT /api/vendors/[id]`
- [ ] Test vendor approval (admin)
- [ ] Test update commission rate
- [ ] Test status change

## 13. Campaign APIs

**Endpoint:** `GET /api/campaigns`
- [ ] Test list campaigns (admin only)
- [ ] Test filter by type (EMAIL, SMS, PUSH)
- [ ] Test filter by status

**Endpoint:** `POST /api/campaigns`
- [ ] Test create campaign
- [ ] Test segment filter validation
- [ ] Test schedule campaign

## 14. Newsletter API

**Endpoint:** `POST /api/newsletter`
- [ ] Test email subscription
- [ ] Test duplicate email handling
- [ ] Verify email validation
- [ ] Test unsubscribe link generation

## 15. Revalidation API

**Endpoint:** `POST /api/revalidate`
- [ ] Test path revalidation
- [ ] Test tag revalidation
- [ ] Verify secret header authentication
- [ ] Test unauthorized access rejection

## 16. Performance & Security Tests

### 16.1 Rate Limiting
- [ ] Test rate limit on /api/auth/login (5 req/min)
- [ ] Test rate limit on /api/search (20 req/min)
- [ ] Test rate limit on /api/orders/create (10 req/hour)
- [ ] Verify 429 status code on limit exceeded

### 16.2 Caching
- [ ] Verify Redis cache hits on product listing
- [ ] Test cache invalidation on product update
- [ ] Verify cache TTL expiration
- [ ] Test cache key generation

### 16.3 Security
- [ ] Test SQL injection prevention (Prisma)
- [ ] Test XSS prevention
- [ ] Verify CORS configuration
- [ ] Test authentication bypass attempts
- [ ] Verify sensitive data not exposed
- [ ] Test file upload restrictions
- [ ] Verify rate limiting per IP

### 16.4 Audit Logging
- [ ] Verify audit log creation on admin actions
- [ ] Test log includes: action, resource, user, IP
- [ ] Verify changes JSON captured
- [ ] Test log retention

## 17. Database Tests

### 17.1 Data Integrity
- [ ] Test cascade delete behavior
- [ ] Verify foreign key constraints
- [ ] Test unique constraints (email, slug)
- [ ] Verify enum validation

### 17.2 Transactions
- [ ] Test order creation transaction rollback on failure
- [ ] Verify stock lock/unlock atomicity
- [ ] Test concurrent updates prevention

### 17.3 Indexes
- [ ] Verify indexed queries performance
- [ ] Test composite index usage
- [ ] Monitor slow queries

## 18. Integration Tests

### 18.1 Payment Flow
- [ ] Test end-to-end Paystack payment
- [ ] Test end-to-end Flutterwave payment
- [ ] Verify webhook to order status flow
- [ ] Test payment failure handling

### 18.2 Order Fulfillment
- [ ] Test complete order flow (create → pay → ship → deliver)
- [ ] Verify stock updates at each stage
- [ ] Test loyalty points award on completion
- [ ] Verify email notifications

### 18.3 Vendor Flow
- [ ] Test product approval workflow
- [ ] Verify commission calculation
- [ ] Test payout generation

## Test Execution Guidelines

**Testing Tools:**
- Postman/Insomnia for manual API testing
- Jest + Supertest for automated tests
- Artillery for load testing

**Test Data:**
- Use separate test database
- Seed with sample data
- Use test API keys for payment gateways

**Authentication:**
- Test with different user roles (SUPER_ADMIN, ADMIN, VIEWER, USER)
- Test with expired/invalid tokens
- Test without authentication

**Response Validation:**
- Verify HTTP status codes
- Validate response schema
- Check error message format
- Verify response headers (X-Total-Count, Content-Type)

**Performance Benchmarks:**
- API response time < 200ms (cached)
- API response time < 500ms (uncached)
- Database queries < 100ms
- Redis cache hit ratio > 80%
