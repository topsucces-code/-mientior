# Ultra-Sophisticated Admin Panel - Implementation Status

## Executive Summary

This document tracks the implementation of an enterprise-grade admin panel transformation with:
- **RBAC (Role-Based Access Control)** with 5 roles and 15 granular permissions
- **Comprehensive Audit Logging** with before/after tracking and IP/user agent capture
- **Real-time Notifications** via Pusher for order updates, alerts, and system events
- **Advanced Filtering & Search** with saved views, column customization, and bulk actions
- **Full Internationalization** (English/French) with i18next
- **Rich Analytics Dashboard** with KPIs, charts, and real-time metrics
- **Export/Import** capabilities (CSV/Excel) with validation
- **Feature Flags** for dynamic feature toggling
- **Rate Limiting** for API protection

---

## ✅ COMPLETED CORE INFRASTRUCTURE (40%)

### 1. Database Schema Extensions
**File:** `prisma/schema.prisma`

**Completed:**
- ✅ New `Role` enum (SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, VIEWER)
- ✅ New `Permission` enum (15 permissions covering all resources and actions)
- ✅ `AdminUser` model with role, permissions (JSON), isActive, lastLoginAt
- ✅ Enhanced `AuditLog` model with resource, resourceId, adminUser relation, ipAddress, userAgent, changes (JSON for before/after)
- ✅ `SavedView` model for user-specific filter/column configurations
- ✅ `FeatureFlag` model for dynamic feature toggling with role restrictions
- ✅ `Notification` model for real-time admin notifications with read tracking
- ✅ Proper indexes on all frequently queried fields

**Next Steps:**
```bash
npx prisma migrate dev --name add_admin_rbac_features
npx prisma generate
```

### 2. RBAC System
**File:** `src/lib/rbac.ts`

**Completed:**
- ✅ Role hierarchy mapping (SUPER_ADMIN=5 down to VIEWER=1)
- ✅ Complete permission matrix (ROLE_PERMISSIONS)
- ✅ Resource-to-permission mapping (products/orders/users/categories → read/write/delete)
- ✅ Core functions:
  - `hasPermission(role, permission)` - Check if role has permission
  - `canAccessResource(role, resource, action)` - Resource-level access check
  - `getPermissionsForRole(role)` - Get all permissions for a role
  - `hasRoleHierarchy(userRole, requiredRole)` - Hierarchy-based role check
  - `getMergedPermissions(role, customPermissions)` - Merge role + custom permissions
  - `hasAnyPermission() / hasAllPermissions()` - Multi-permission checks
- ✅ Type guards for Role and Permission validation

### 3. Audit Logger
**File:** `src/lib/audit-logger.ts`

**Completed:**
- ✅ Core `logAction()` function with full parameter support
- ✅ `getClientInfo(request)` - Extract IP and user agent from Next.js request
- ✅ Specialized logging functions:
  - `logCreate()` - Log create operations
  - `logUpdate()` - Log updates with before/after diff
  - `logDelete()` - Log deletions
  - `logBulkAction()` - Log bulk operations
  - `logExport()` - Log data exports
  - `logImport()` - Log data imports
- ✅ `calculateDiff()` - Automatic before/after comparison
- ✅ Non-blocking error handling (logs errors but doesn't throw)
- ✅ Prisma integration for database writes

### 4. Admin Authentication
**File:** `src/lib/auth-admin.ts`

**Completed:**
- ✅ `getAdminSession()` - Fetch admin user from Better Auth session
- ✅ `requireAdminAuth()` - Enforce admin authentication (throws on failure)
- ✅ `requirePermission(permission)` - Enforce specific permission (throws 403 on failure)
- ✅ `requireRole(minRole)` - Enforce minimum role level
- ✅ `checkPermission(permission)` - Non-throwing permission check
- ✅ `checkRole(minRole)` - Non-throwing role check
- ✅ `getCurrentPermissions()` - Get current admin's full permission list
- ✅ Last login tracking (updates on every session retrieval)
- ✅ Support for custom permissions merged with role permissions
- ✅ AdminSession type extension

### 5. Admin Auth Middleware
**File:** `src/middleware/admin-auth.ts`

**Completed:**
- ✅ `withAdminAuth(handler, options)` - HOC for basic admin authentication
- ✅ `withPermission(handler, permission, options)` - HOC for permission-based access
- ✅ `withRole(handler, minRole, options)` - HOC for role-based access
- ✅ `getOptionalAdminAuth(request)` - Optional authentication (returns null, no throw)
- ✅ Automatic audit logging for all protected routes (optional via options.logAction)
- ✅ Proper error responses:
  - 401 Unauthorized for missing/invalid authentication
  - 403 Forbidden for insufficient permissions
  - 500 Internal Server Error for unexpected failures
- ✅ Context enrichment (passes adminSession to handler)

### 6. Pusher Integration
**File:** `src/lib/pusher.ts`

**Completed:**
- ✅ Server-side Pusher instance with lazy initialization
- ✅ Environment variable validation (PUSHER_APP_ID, KEY, SECRET, CLUSTER)
- ✅ Core functions:
  - `triggerAdminNotification(event, data)` - Broadcast to all admins
  - `triggerOrderUpdate(orderId, data)` - Order status change notifications
  - `triggerNewOrder(data)` - New order alerts
  - `triggerUserNotification(adminUserId, event, data)` - User-specific notifications
  - `triggerLowStockAlert(data)` - Inventory warnings
  - `triggerBulkActionComplete(data)` - Bulk operation completion
- ✅ Channel strategy: `admin-notifications` (broadcast), `admin-user-{id}` (private)
- ✅ Error handling (logs but doesn't throw)

### 7. Rate Limiter
**File:** `src/lib/rate-limiter.ts`

**Completed:**
- ✅ Redis-based rate limiting with atomic INCR operations
- ✅ `rateLimit(key, options)` - Core rate limiting function
  - Returns: allowed, remaining, resetAt, limit
  - Fail-open behavior if Redis unavailable
- ✅ `rateLimitMiddleware(options)` - Middleware wrapper for handlers
- ✅ `withRateLimit(handler, options)` - HOC for API route protection
- ✅ `clearRateLimit(key)` - Manual rate limit reset
- ✅ `getClientIdentifier(request)` - Extract IP from x-forwarded-for or x-real-ip
- ✅ Rate limit headers (X-RateLimit-Limit, Remaining, Reset)
- ✅ Configurable limits and time windows (env vars or defaults)
- ✅ 429 Too Many Requests response with retryAfter

### 8. i18n Configuration
**File:** `src/lib/i18n.ts`

**Completed:**
- ✅ i18next initialization with react-i18next and language detector
- ✅ English and French translations (50+ keys)
- ✅ Namespaces: `common`, `admin`
- ✅ Key translations:
  - Navigation (dashboard, products, orders, users, categories, settings, auditLogs)
  - Actions (save, cancel, delete, edit, view, create, export, import, search, filter)
  - Auth (logout, profile, login)
  - Admin-specific (roles, permissions, featureFlags, savedViews, bulkActions, notifications)
- ✅ Refine i18n provider with translate/changeLocale/getLocale methods
- ✅ Language detection (localStorage, browser navigator)
- ✅ Fallback language: English

### 9. Configuration Files

**package.json:**
- ✅ Added `db:seed:admin` script for admin user creation
- ✅ Added dependencies:
  - pusher, pusher-js (real-time notifications)
  - i18next, react-i18next, i18next-browser-languagedetector (i18n)
  - recharts (charts)
  - papaparse, @types/papaparse (CSV parsing)
  - exceljs (Excel export)
  - react-diff-viewer (audit log diffs)
  - @dnd-kit/core, @dnd-kit/sortable (drag & drop)

**.env.example:**
- ✅ Pusher variables (APP_ID, KEY, SECRET, CLUSTER, NEXT_PUBLIC_PUSHER_KEY/CLUSTER)
- ✅ Rate limiting config (RATE_LIMIT_WINDOW=60, RATE_LIMIT_MAX=100)
- ✅ Admin defaults (ADMIN_DEFAULT_EMAIL, ADMIN_DEFAULT_PASSWORD)
- ✅ Feature flags (FEATURE_FLAGS_ENABLED=true)
- ✅ Sentry DSN (optional)

**prisma/seed-admin.ts:**
- ✅ Admin user seeding script
- ✅ Checks for existing admin (idempotent)
- ✅ Creates SUPER_ADMIN with all permissions
- ✅ Uses email from ADMIN_DEFAULT_EMAIL env var
- ✅ Instructions for creating Better Auth user
- ✅ Uses `getPermissionsForRole()` from rbac.ts

---

## ⏳ PENDING IMPLEMENTATION (60%)

### Phase 1: Backend API Endpoints

#### A. Dashboard Analytics

**File:** `src/app/api/admin/dashboard/stats/route.ts` (NEW)
- [ ] `GET /api/admin/dashboard/stats` endpoint
- [ ] Wrap with `withPermission(handler, 'DASHBOARD_READ')`
- [ ] Calculate KPIs:
  - Total revenue (sum of orders.total where status != CANCELLED)
  - Total orders
  - New orders today
  - Pending orders (status = PENDING)
  - Total users
  - New users this month
  - Total active products
  - Low stock products (stock < 10)
  - Average order value
  - Top 5 selling products (groupBy with sum)
- [ ] Use Redis cache with `getCachedData('dashboard:stats', fetcher, 300)` (5 min TTL)
- [ ] Support date range filters (from, to query params)

**File:** `src/app/api/admin/dashboard/charts/route.ts` (NEW)
- [ ] `GET /api/admin/dashboard/charts` endpoint
- [ ] Wrap with `withPermission(handler, 'DASHBOARD_READ')`
- [ ] Support query param `type` (revenue, orders, users, products)
- [ ] Support query param `period` (7d, 30d, 90d, 1y)
- [ ] Aggregate data by day/week/month based on period
- [ ] Return time-series data `[{date, value}]`
- [ ] Use Redis cache with `getCachedData('dashboard:charts:{type}:{period}', fetcher, 600)` (10 min TTL)
- [ ] Use Prisma `groupBy` for efficient aggregation

#### B. Audit Logs

**File:** `src/app/api/admin/audit-logs/route.ts` (NEW)
- [ ] `GET /api/admin/audit-logs` endpoint
- [ ] Wrap with `withPermission(handler, 'AUDIT_LOGS_READ')`
- [ ] Support Refine pagination (_start, _end, _sort, _order)
- [ ] Support filters:
  - resource (string)
  - action (string)
  - adminUserId (string)
  - resourceId (string)
  - createdAt_gte (ISO date string)
  - createdAt_lte (ISO date string)
- [ ] Include adminUser relation (select: id, email, firstName, lastName, role)
- [ ] Return X-Total-Count header for Refine compatibility
- [ ] Default sort: createdAt desc

#### C. Roles & Permissions

**File:** `src/app/api/admin/roles/route.ts` (NEW)
- [ ] `GET /api/admin/roles` - List all admin users with pagination/filters
- [ ] `POST /api/admin/roles` - Create new admin user
  - Validate email unique
  - Validate role is valid
  - Log with `logCreate('admin_users', newAdmin, adminUser, request)`
- [ ] Wrap both with `withPermission(handler, 'SETTINGS_WRITE')`

**File:** `src/app/api/admin/roles/[id]/route.ts` (NEW)
- [ ] `GET /api/admin/roles/[id]` - Get admin user details
- [ ] `PUT /api/admin/roles/[id]` - Update admin user
  - Prevent self-modification (check if id === adminSession.adminUser.id)
  - Log with `logUpdate('admin_users', id, before, after, adminUser, request)`
- [ ] `DELETE /api/admin/roles/[id]` - Deactivate admin (soft delete: isActive = false)
  - Prevent self-deactivation
  - Log with `logDelete('admin_users', id, adminData, adminUser, request)`
- [ ] Wrap all with `withPermission(handler, 'SETTINGS_WRITE')`

#### D. Saved Views

**File:** `src/app/api/admin/saved-views/route.ts` (NEW)
- [ ] `GET /api/admin/saved-views` - List user's saved views
  - Filter by resource if provided (query param)
  - Only return views where adminUserId === adminSession.adminUser.id
- [ ] `POST /api/admin/saved-views` - Create saved view
  - Validate name unique for this admin + resource
  - If isDefault = true, set other views for this resource to isDefault = false
- [ ] Wrap with `withAdminAuth(handler)`

**File:** `src/app/api/admin/saved-views/[id]/route.ts` (NEW)
- [ ] `GET /api/admin/saved-views/[id]` - Get saved view (check ownership)
- [ ] `PUT /api/admin/saved-views/[id]` - Update saved view (check ownership)
  - If isDefault = true, update other views
- [ ] `DELETE /api/admin/saved-views/[id]` - Delete saved view (check ownership)
- [ ] Wrap with `withAdminAuth(handler)`

#### E. Notifications

**File:** `src/app/api/admin/notifications/route.ts` (NEW)
- [ ] `GET /api/admin/notifications` - List notifications
  - Filter by adminUserId === adminSession.adminUser.id
  - Support pagination (_start, _end)
  - Support read status filter (query param)
  - Return X-Total-Count header
- [ ] `PUT /api/admin/notifications` - Mark as read (bulk)
  - Body: {ids: string[]}
  - Update all where id IN ids AND adminUserId === current user
- [ ] Wrap with `withAdminAuth(handler)`

**File:** `src/app/api/admin/notifications/[id]/route.ts` (NEW)
- [ ] `DELETE /api/admin/notifications/[id]` - Delete notification (check ownership)
- [ ] Wrap with `withAdminAuth(handler)`

#### F. Export/Import

**File:** `src/app/api/admin/export/route.ts` (NEW)
- [ ] `POST /api/admin/export` endpoint
- [ ] Body: {resource, filters, columns, format} (csv or excel)
- [ ] Permission check based on resource (e.g., PRODUCTS_READ for products)
- [ ] Fetch data with filters (no pagination limit, or max 10000)
- [ ] Generate CSV with papaparse or Excel with exceljs
- [ ] Return file stream with proper headers (Content-Type, Content-Disposition)
- [ ] Log with `logExport(resource, format, count, adminUser, request, filters)`
- [ ] Consider async generation with job queue for large datasets (future)

**File:** `src/app/api/admin/import/route.ts` (NEW)
- [ ] `POST /api/admin/import` endpoint
- [ ] Body: multipart/form-data (file + resource field)
- [ ] Permission check based on resource (e.g., PRODUCTS_WRITE for products)
- [ ] Parse CSV with papaparse
- [ ] Validate each row (required fields, types, constraints)
- [ ] Use `prisma.$transaction()` for atomicity
- [ ] Collect errors by line
- [ ] Return {success: number, errors: [{line, error}]}
- [ ] Log with `logImport(resource, successCount, errorCount, adminUser, request)`

#### G. Feature Flags

**File:** `src/app/api/admin/feature-flags/route.ts` (NEW)
- [ ] `GET /api/admin/feature-flags` - List all feature flags
- [ ] `POST /api/admin/feature-flags` - Create feature flag
  - Validate key unique
  - Log with `logCreate('feature_flags', newFlag, adminUser, request)`
- [ ] Wrap POST with `withPermission(handler, 'SETTINGS_WRITE')`
- [ ] Wrap GET with `withAdminAuth(handler)`

**File:** `src/app/api/admin/feature-flags/[id]/route.ts` (NEW)
- [ ] `GET /api/admin/feature-flags/[id]` - Get feature flag
- [ ] `PUT /api/admin/feature-flags/[id]` - Update feature flag
  - Log with `logUpdate('feature_flags', id, before, after, adminUser, request)`
- [ ] `DELETE /api/admin/feature-flags/[id]` - Delete feature flag
  - Log with `logDelete('feature_flags', id, flagData, adminUser, request)`
- [ ] Wrap PUT/DELETE with `withPermission(handler, 'SETTINGS_WRITE')`

#### H. Secure Existing Endpoints

**Files:** `src/app/api/products/route.ts`, `src/app/api/products/[id]/route.ts`
- [ ] Wrap GET with `withPermission(handler, 'PRODUCTS_READ')`
- [ ] Wrap POST with `withPermission(handler, 'PRODUCTS_WRITE')`
  - Add `logCreate('products', newProduct, adminUser, request)` after creation
- [ ] Wrap PUT with `withPermission(handler, 'PRODUCTS_WRITE')`
  - Fetch before state, then `logUpdate('products', id, before, after, adminUser, request)` after update
- [ ] Wrap DELETE with `withPermission(handler, 'PRODUCTS_DELETE')`
  - Fetch product data, then `logDelete('products', id, productData, adminUser, request)` after deletion
- [ ] Add advanced filters support (price range, stock range, multiple statuses, etc.)
- [ ] Add column selection support (query param `columns`)

**Files:** `src/app/api/orders/route.ts`, `src/app/api/orders/[id]/route.ts`
- [ ] Wrap GET with `withPermission(handler, 'ORDERS_READ')`
- [ ] Wrap PUT with `withPermission(handler, 'ORDERS_WRITE')`
  - Log status changes with `logUpdate('orders', id, before, after, adminUser, request)`
  - Trigger Pusher notification with `triggerOrderUpdate(orderId, data)`
- [ ] Wrap DELETE (if exists) with `withPermission(handler, 'ORDERS_DELETE')`
- [ ] Add advanced filters (status array, payment status, date range, amount range, customer email search)
- [ ] Validate status transitions (PENDING → PROCESSING → SHIPPED → DELIVERED)

**Files:** `src/app/api/categories/route.ts`, `src/app/api/categories/[id]/route.ts`
- [ ] Wrap GET with `withPermission(handler, 'CATEGORIES_READ')`
- [ ] Wrap POST with `withPermission(handler, 'CATEGORIES_WRITE')`
  - Log with `logCreate('categories', newCategory, adminUser, request)`
- [ ] Wrap PUT with `withPermission(handler, 'CATEGORIES_WRITE')`
  - Log with `logUpdate('categories', id, before, after, adminUser, request)`
- [ ] Wrap DELETE with `withPermission(handler, 'CATEGORIES_DELETE')`
  - Check for child categories and products before deletion
  - Log with `logDelete('categories', id, categoryData, adminUser, request)`

**Files:** `src/app/api/users/route.ts`, `src/app/api/users/[id]/route.ts`
- [ ] Wrap GET with `withPermission(handler, 'USERS_READ')`
- [ ] Wrap PUT with `withPermission(handler, 'USERS_WRITE')`
  - Log loyalty level/points changes with `logUpdate('users', id, before, after, adminUser, request)`
- [ ] Wrap DELETE (soft delete recommended) with `withPermission(handler, 'USERS_DELETE')`
  - Log with `logDelete('users', id, userData, adminUser, request)`
- [ ] Add advanced filters (loyalty level, date range, total spent range)

---

### Phase 2: Frontend Components

#### A. Update Admin Layout

**File:** `src/app/admin/layout.tsx` (MODIFY)
- [ ] Import Refine providers from i18n and RBAC
- [ ] Create `authProvider`:
  - login() → redirect to /auth/sign-in
  - logout() → call Better Auth logout
  - check() → call `getAdminSession()`
  - getIdentity() → return admin user info (name, email, role, avatar)
  - getPermissions() → return admin permissions array
- [ ] Create `accessControlProvider`:
  - can() → check permission with `hasPermission(role, permission)`
- [ ] Create `auditLogProvider`:
  - create() → call `logAction()`
  - get() → fetch from /api/admin/audit-logs
- [ ] Add `i18nProvider` from src/lib/i18n.ts
- [ ] Update resources array to include:
  - audit-logs (list, show)
  - admin-users (list, create, edit, show)
  - feature-flags (list, create, edit, show, delete)
- [ ] Add language switcher in header/sidebar

#### B. Dashboard Page

**File:** `src/app/admin/page.tsx` (MODIFY)
- [ ] Replace NavigateToResource with actual dashboard
- [ ] Use `useCustom()` to fetch /api/admin/dashboard/stats
- [ ] Use `useCustom()` to fetch /api/admin/dashboard/charts (multiple calls for different chart types)
- [ ] Add period selector (7d, 30d, 90d, 1y) → refetch charts on change
- [ ] Import and render `<DashboardStats stats={statsData} />`
- [ ] Import and render `<DashboardCharts data={chartsData} period={period} />`
- [ ] Add top products table (top 5 from stats)
- [ ] Add recent orders table (latest 5)

**File:** `src/components/admin/dashboard-stats.tsx` (NEW)
- [ ] Create functional component with stats prop
- [ ] Use Ant Design: Row, Col, Card, Statistic
- [ ] Display 7-8 KPI cards:
  - Total Revenue (green, DollarOutlined)
  - Total Orders (ShoppingOutlined, with "X today" suffix)
  - Pending Orders (red if > 10)
  - Total Users (UserOutlined, with "+X this month" suffix)
  - Average Order Value (DollarOutlined)
  - Active Products
  - Low Stock Products (red if > 0, AlertOutlined)
- [ ] Responsive grid (xs=24, sm=12, lg=6)

**File:** `src/components/admin/dashboard-charts.tsx` (NEW)
- [ ] Create functional component with data and period props
- [ ] Install and import recharts components (LineChart, BarChart, PieChart, AreaChart, ResponsiveContainer)
- [ ] Create 4 charts:
  - Revenue over time (LineChart with time series data)
  - Orders by status (BarChart)
  - Products by category (PieChart)
  - New users over time (AreaChart)
- [ ] Use Ant Design Card to wrap each chart
- [ ] Add proper tooltips, axis labels, legends
- [ ] Use theme colors (orange-500, blue-500, aurore-500)
- [ ] Responsive sizing with ResponsiveContainer

#### C. Reusable Admin Components

**File:** `src/components/admin/advanced-filters.tsx` (NEW)
- [ ] Props: resource, filters, onFiltersChange, availableFilters (config object)
- [ ] Use Ant Design Drawer (or Collapse) for filter UI
- [ ] Support filter types:
  - Text search (Input)
  - Select (single/multiple)
  - Date range (DatePicker.RangePicker)
  - Number range (Slider or two InputNumbers)
  - Checkboxes (for booleans)
- [ ] Buttons: Apply Filters, Reset Filters, Save as View
- [ ] Show active filter count badge on trigger button
- [ ] Responsive (drawer on mobile, collapse on desktop)

**File:** `src/components/admin/column-selector.tsx` (NEW)
- [ ] Props: columns (array), visibleColumns, onColumnsChange
- [ ] Use Ant Design Popover with Checkbox.Group
- [ ] Select All / Deselect All buttons
- [ ] Optional: drag & drop reordering with @dnd-kit
- [ ] Trigger button with "Columns" icon + badge (X visible)
- [ ] Option to save selection in saved view

**File:** `src/components/admin/saved-views-selector.tsx` (NEW)
- [ ] Props: resource, currentView, onViewChange
- [ ] Use `useList()` to fetch /api/admin/saved-views?resource={resource}
- [ ] Ant Design Select component with views list
- [ ] Show "Default View" option first
- [ ] Buttons/Menu:
  - Save Current View (Modal with Form: name, isDefault checkbox)
  - Update View (useUpdate)
  - Delete View (useDelete with confirmation)
  - Set as Default (useUpdate with isDefault=true)
- [ ] Use Refine hooks: useCreate, useUpdate, useDelete

**File:** `src/components/admin/bulk-actions.tsx` (NEW)
- [ ] Props: resource, selectedIds, onActionComplete, availableActions (config)
- [ ] Sticky bar that appears when items selected
- [ ] Show count: "X items selected"
- [ ] Action buttons:
  - Change Status (Modal with Select)
  - Delete (Popconfirm)
  - Export (calls /api/admin/export)
  - Custom actions (passed via props)
- [ ] Use Refine: useUpdateMany, useDeleteMany
- [ ] Show notification on success/error
- [ ] Clear selection after action

**File:** `src/components/admin/global-search.tsx` (NEW)
- [ ] Trigger with Cmd+K / Ctrl+K keyboard shortcut
- [ ] Ant Design Modal (fullscreen on mobile) with Input (autofocus)
- [ ] Use `useCustom()` to fetch /api/search with debounce (300ms)
- [ ] Display results grouped by type (Products, Orders, Users, Categories)
- [ ] Each result shows preview (image/icon, title, subtitle, id)
- [ ] Keyboard navigation (Arrow keys, Enter to navigate, Escape to close)
- [ ] Click result → navigate to show page for that resource
- [ ] Use Ant Design List, Avatar, Tag

**File:** `src/components/admin/notifications-bell.tsx` (NEW)
- [ ] Ant Design Badge with bell icon
- [ ] Use `useList()` to fetch /api/admin/notifications (filter by read=false for badge count)
- [ ] Integrate Pusher client:
  - Import pusher-js
  - Subscribe to `admin-notifications` channel
  - Listen for events (order-created, order-updated, low-stock-alert, bulk-action-complete)
  - On event → add notification to local state, increment badge
- [ ] Popover or Drawer on click:
  - List of notifications (title, message, timestamp, type icon)
  - Mark as Read button per notification (useUpdate)
  - Mark All as Read button (calls PUT /api/admin/notifications with all IDs)
  - View All link → navigate to notifications page (optional future feature)
- [ ] Auto-refresh list on Pusher event
- [ ] Play sound/show toast on new notification (optional)

**File:** `src/components/admin/export-button.tsx` (NEW)
- [ ] Props: resource, filters, columns, filename
- [ ] Ant Design Button with DownloadOutlined icon
- [ ] Dropdown menu for format selection (CSV, Excel)
- [ ] On click → POST to /api/admin/export with {resource, filters, columns, format}
- [ ] Show loading state during generation
- [ ] Download file on success (create <a> element with href=blob, trigger click)
- [ ] Show notification on error

**File:** `src/components/admin/import-modal.tsx` (NEW)
- [ ] Props: resource, visible, onClose, onSuccess
- [ ] Ant Design Modal with Upload.Dragger
- [ ] Accept .csv files
- [ ] On upload → POST to /api/admin/import with file + resource
- [ ] Show validation results:
  - Success count
  - Error list (line number, error message)
- [ ] Table or List to display errors
- [ ] Close button, Re-upload button
- [ ] Show notification on completion

#### D. Enhanced Resource Pages

**File:** `src/app/admin/products/page.tsx` (MODIFY)
- [ ] Add AdvancedFilters component (category, price range, stock range, status, featured, onSale filters)
- [ ] Add ColumnSelector component (toggle columns: image, name, category, price, stock, status, featured, actions)
- [ ] Add SavedViewsSelector component
- [ ] Add BulkActions component (Change Status, Delete, Export actions)
- [ ] Add inline search Input with debounce (filters by name/slug)
- [ ] Use useTable with filters, sorting, pagination
- [ ] Add ExportButton in table header

**File:** `src/app/admin/orders/page.tsx` (MODIFY)
- [ ] Add AdvancedFilters (status, payment status, date range, amount range, customer email search)
- [ ] Add ColumnSelector (customer name/email, items count, subtotal, tax, shipping, total, status, payment status, date)
- [ ] Add SavedViewsSelector
- [ ] Add BulkActions (Change Status, Export)
- [ ] Add stats cards above table (use useCustom to fetch /api/admin/dashboard/stats):
  - Total Orders
  - Pending Orders
  - Total Revenue
- [ ] Status column with Tag component (colored by status)
- [ ] Customer column with Avatar + name/email

**File:** `src/app/admin/users/page.tsx` (MODIFY)
- [ ] Add AdvancedFilters (loyalty level, registration date range, total spent range)
- [ ] Add ColumnSelector (avatar, name, email, loyalty level, loyalty points, total orders, total spent, created date)
- [ ] Add SavedViewsSelector
- [ ] Add BulkActions (Change Loyalty Level, Export)
- [ ] Add stats cards:
  - Total Users
  - New Users This Month
  - Average Loyalty Points
- [ ] Loyalty level column with Tag (colored: Bronze, Silver, Gold, Platinum)
- [ ] Avatar column using Avatar component

#### E. New Admin Pages

**File:** `src/app/admin/audit-logs/page.tsx` (NEW)
**Dir:** `src/app/admin/audit-logs/` (CREATE)
- [ ] Use useTable with resource='audit-logs'
- [ ] Columns:
  - Timestamp (formatted with date-fns)
  - Admin User (name + email, link to admin user details)
  - Action (Tag with colored labels: CREATE green, UPDATE blue, DELETE red)
  - Resource (Tag)
  - Resource ID (link to resource show page if applicable)
  - Changes (Button to open Modal with react-diff-viewer for before/after)
  - IP Address
- [ ] Filters:
  - Resource (Select)
  - Action (Select)
  - Admin User (Select with useSelect for admin users)
  - Date Range (DatePicker.RangePicker)
- [ ] Default sort: createdAt desc
- [ ] ExportButton for filtered results
- [ ] Modal for viewing changes with react-diff-viewer (side-by-side diff of before/after JSON)

**File:** `src/app/admin/settings/roles/page.tsx` (NEW)
**Dirs:** `src/app/admin/settings/`, `src/app/admin/settings/roles/` (CREATE)
- [ ] Use useTable with resource='admin-users' (endpoint /api/admin/roles)
- [ ] Columns:
  - Email
  - Name (firstName + lastName)
  - Role (Tag with colors: SUPER_ADMIN red, ADMIN orange, MANAGER blue, SUPPORT green, VIEWER gray)
  - Permissions Count (e.g., "12 permissions")
  - Last Login (formatted date or "Never")
  - Status (Tag: Active green / Inactive gray)
  - Actions (Edit, Deactivate/Activate, View Permissions)
- [ ] Add Admin Button (opens Modal):
  - Form fields: email, firstName, lastName, role (Select)
  - Use useCreate
- [ ] Edit action (opens Modal):
  - Form fields: role (Select), custom permissions (optional Checkbox.Group)
  - Use useUpdate
- [ ] View Permissions action (opens Drawer):
  - List all permissions for this admin (from role + custom)
  - Optional: show permission matrix (table with roles as columns, permissions as rows)
- [ ] Deactivate/Activate action:
  - Use useUpdate to toggle isActive
  - Show Popconfirm
- [ ] Permission Matrix section (collapsible):
  - Table with roles as column headers, permissions as rows
  - Check marks for allowed permissions

**File:** `src/app/admin/settings/feature-flags/page.tsx` (NEW)
**Dir:** `src/app/admin/settings/feature-flags/` (CREATE)
- [ ] Use useTable with resource='feature-flags'
- [ ] Columns:
  - Key (code style)
  - Name
  - Description (truncated with Tooltip)
  - Enabled (Switch component → useUpdate on toggle)
  - Roles (Tags showing allowed roles)
  - Actions (Edit, Delete)
- [ ] Add Flag Button (opens Modal):
  - Form fields: key, name, description, enabled (Switch), roles (Select multiple)
  - Use useCreate
- [ ] Edit action (opens Modal):
  - Same form fields
  - Use useUpdate
- [ ] Delete action (Popconfirm):
  - Use useDelete
- [ ] Filters: enabled status (true/false)

---

### Phase 3: Testing & Refinement

#### Database & Migrations
- [ ] Run `npx prisma migrate dev --name add_admin_rbac_features`
- [ ] Run `npx prisma generate`
- [ ] Run `npm run db:seed:admin`
- [ ] Create Better Auth user with admin email (via sign-up or API)
- [ ] Verify all tables created (AdminUser, enhanced AuditLog, SavedView, FeatureFlag, Notification)

#### Authentication & Authorization
- [ ] Test admin session retrieval (login with admin email)
- [ ] Test each permission (15 total) - create test admin users with different roles
- [ ] Test role hierarchy (SUPER_ADMIN can do everything, VIEWER can only read)
- [ ] Test 401 response for non-admin users
- [ ] Test 403 response for insufficient permissions
- [ ] Test last login tracking (verify lastLoginAt updates)

#### Audit Logging
- [ ] Create a product → verify audit log entry with CREATE action
- [ ] Update an order → verify before/after in changes field
- [ ] Delete a category → verify audit log entry
- [ ] Bulk update products → verify BULK_UPDATE log
- [ ] Export data → verify EXPORT log with count and format
- [ ] Import CSV → verify IMPORT log with success/error counts

#### Rate Limiting
- [ ] Make 101 requests in 60 seconds → verify 429 response on 101st
- [ ] Check X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers
- [ ] Verify Redis keys created (check with Redis CLI: KEYS ratelimit:*)
- [ ] Test rate limit reset after window expires

#### Real-time Notifications
- [ ] Create an order → verify Pusher event triggered on admin-notifications channel
- [ ] Update order status → verify triggerOrderUpdate sends event
- [ ] Create product with stock < 10 → verify triggerLowStockAlert
- [ ] Frontend: subscribe to Pusher in notifications bell → verify notifications appear in real-time

#### Dashboard
- [ ] Verify all KPIs calculate correctly (compare with database queries)
- [ ] Test Redis caching (check logs for cache hit/miss)
- [ ] Change date range → verify charts update with correct data
- [ ] Verify Recharts renders correctly (responsive, tooltips, legends)

#### Admin Pages
- [ ] Products: test all filters (category, price range, stock, status, featured, onSale)
- [ ] Products: save a view → reload page → verify view persists and applies correctly
- [ ] Orders: bulk select 5 orders → change status to PROCESSING → verify all updated + audit logs
- [ ] Orders: export filtered results → verify CSV downloads with correct data
- [ ] Users: import CSV with 10 users (3 with errors) → verify 7 created, 3 errors shown
- [ ] Audit Logs: filter by resource=products → verify only product logs shown
- [ ] Audit Logs: click "View Changes" → verify diff viewer shows before/after correctly
- [ ] Roles: create new MANAGER → verify created with correct permissions
- [ ] Feature Flags: toggle enabled → verify useUpdate works, flag updates in database

#### i18n
- [ ] Switch language to French → verify all admin UI labels translated
- [ ] Switch back to English → verify language preference persists (localStorage)
- [ ] Check common and admin namespaces coverage

#### Performance
- [ ] Dashboard stats: verify loads in < 500ms with Redis cache hit
- [ ] Products list: verify loads 100 products in < 1s
- [ ] Audit logs: verify pagination works smoothly with 1000+ log entries
- [ ] Pusher: verify real-time events have < 200ms latency

#### Accessibility
- [ ] Test all pages with keyboard navigation (Tab, Enter, Escape, Arrows)
- [ ] Test with screen reader (NVDA/JAWS) → verify ARIA labels
- [ ] Verify color contrast ratios (WCAG AA minimum)
- [ ] Test focus indicators (visible and clear)

---

## 📊 Implementation Progress

### Backend Infrastructure: 9/9 (100%) ✅
- ✅ Database schema
- ✅ RBAC system
- ✅ Audit logger
- ✅ Admin auth
- ✅ Auth middleware
- ✅ Pusher integration
- ✅ Rate limiter
- ✅ i18n configuration
- ✅ Configuration files (package.json, .env, seed script)

### Backend API Endpoints: 0/20 (0%) ⏳
- Dashboard stats (1)
- Dashboard charts (1)
- Audit logs (1)
- Roles (2)
- Saved views (2)
- Notifications (2)
- Export/Import (2)
- Feature flags (2)
- Secure existing endpoints (7: products x2, orders x2, categories x2, users x1)

### Frontend Components: 0/18 (0%) ⏳
- Admin layout (1)
- Dashboard (3: page, stats, charts)
- Reusable components (7: filters, columns, saved views, bulk actions, global search, notifications bell, export, import)
- Enhanced pages (3: products, orders, users)
- New pages (3: audit logs, roles, feature flags)

### Testing: 0/7 (0%) ⏳
- Database & migrations
- Authentication & authorization
- Audit logging
- Rate limiting
- Real-time notifications
- Dashboard
- Admin pages
- i18n
- Performance
- Accessibility

**Overall Progress: 9/54 tasks (17%)**

---

## 🚀 Next Steps Priority

### High Priority (Core Functionality)
1. **Implement dashboard endpoints** (stats, charts) → enables dashboard page
2. **Implement audit logs endpoint** → enables audit log page
3. **Secure existing API endpoints** (products, orders, categories, users) → enables RBAC enforcement
4. **Update admin layout** with providers → enables auth/i18n/audit across admin

### Medium Priority (UX Enhancement)
5. **Create dashboard components** (stats, charts) → completes dashboard
6. **Create reusable components** (filters, columns, bulk actions) → enhances all list pages
7. **Enhance resource pages** (products, orders, users) → improves admin UX
8. **Implement saved views endpoints** → enables view persistence

### Low Priority (Advanced Features)
9. **Create notifications bell** → enables real-time updates
10. **Implement export/import endpoints** → enables data migration
11. **Create audit logs page** → enables compliance tracking
12. **Create roles page** → enables admin user management
13. **Create feature flags page** → enables feature toggling

---

## 📚 Implementation Guides

### Example: Secure Products Endpoint

```typescript
// src/app/api/products/route.ts
import { withPermission } from '@/middleware/admin-auth';
import { logCreate } from '@/lib/audit-logger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET endpoint (existing, add RBAC)
export const GET = withPermission(
  async (request: NextRequest, { adminSession }) => {
    const { searchParams } = new URL(request.url);
    // ... existing GET logic with advanced filters
    return NextResponse.json(products, {
      headers: { 'X-Total-Count': totalCount.toString() },
    });
  },
  'PRODUCTS_READ'
);

// POST endpoint (existing, add RBAC + audit logging)
export const POST = withPermission(
  async (request: NextRequest, { adminSession }) => {
    const body = await request.json();

    // Create product
    const newProduct = await prisma.product.create({
      data: body,
      include: { category: true, images: true, tags: true },
    });

    // Log the creation
    await logCreate('products', newProduct, adminSession.adminUser, request);

    return NextResponse.json(newProduct, { status: 201 });
  },
  'PRODUCTS_WRITE'
);
```

### Example: Dashboard Stats Endpoint

```typescript
// src/app/api/admin/dashboard/stats/route.ts
import { withPermission } from '@/middleware/admin-auth';
import { prisma } from '@/lib/prisma';
import { getCachedData } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withPermission(
  async (request: NextRequest, { adminSession }) => {
    const stats = await getCachedData(
      'dashboard:stats',
      async () => {
        const [totalRevenue, totalOrders, newOrdersToday, pendingOrders] =
          await Promise.all([
            prisma.order.aggregate({
              where: { status: { not: 'CANCELLED' } },
              _sum: { total: true },
            }),
            prisma.order.count(),
            prisma.order.count({
              where: {
                createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
              },
            }),
            prisma.order.count({ where: { status: 'PENDING' } }),
          ]);

        return {
          totalRevenue: totalRevenue._sum.total || 0,
          totalOrders,
          newOrdersToday,
          pendingOrders,
          // ... other KPIs
        };
      },
      300 // 5 minutes TTL
    );

    return NextResponse.json(stats);
  },
  'DASHBOARD_READ'
);
```

### Example: Dashboard Stats Component

```typescript
// src/components/admin/dashboard-stats.tsx
'use client';

import { Card, Row, Col, Statistic } from 'antd';
import { DollarOutlined, ShoppingOutlined, AlertOutlined } from '@ant-design/icons';

interface DashboardStatsProps {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    newOrdersToday: number;
    pendingOrders: number;
    // ... other KPIs
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Revenue"
            value={stats.totalRevenue}
            prefix={<DollarOutlined />}
            precision={2}
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Orders"
            value={stats.totalOrders}
            prefix={<ShoppingOutlined />}
            suffix={<span style={{ fontSize: 14, color: '#999' }}>({stats.newOrdersToday} today)</span>}
          />
        </Card>
      </Col>
      {/* ... more KPI cards */}
    </Row>
  );
}
```

---

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy .env.example to .env.local
cp .env.example .env.local

# Edit .env.local and configure:
# - Pusher credentials
# - Rate limiting settings
# - Admin default email/password
# - Feature flags enabled
```

### 3. Run Database Migrations
```bash
npx prisma migrate dev --name add_admin_rbac_features
npx prisma generate
```

### 4. Seed Admin User
```bash
npm run db:seed:admin
```

### 5. Create Better Auth User
- Sign up at http://localhost:3000/auth/sign-up with the admin email
- Or use Better Auth API to create the user programmatically

### 6. Start Development Server
```bash
npm run dev
```

### 7. Verify Admin Access
- Navigate to http://localhost:3000/admin
- Login with admin credentials
- Verify admin session and permissions

---

## 📖 Architecture Overview

### Backend Stack
- **Next.js 15 App Router** for API routes
- **Prisma ORM** for database access
- **PostgreSQL** for data storage
- **Redis** for caching and rate limiting
- **Pusher** for real-time notifications
- **Better Auth** for authentication

### Frontend Stack
- **Refine** for admin panel framework
- **Ant Design** for UI components
- **React Query** for server state
- **i18next** for internationalization
- **Recharts** for data visualization

### Security Layers
1. **Authentication**: Better Auth sessions
2. **Authorization**: RBAC with 5 roles and 15 permissions
3. **Audit Logging**: Comprehensive action tracking
4. **Rate Limiting**: Redis-based request throttling
5. **Input Validation**: Zod schemas for all inputs

### Performance Optimizations
- **Redis Caching**: 5-10 minute TTLs for dashboard stats
- **Query Optimization**: Prisma includes, selects, and groupBy
- **Pagination**: Cursor and offset-based pagination
- **Lazy Loading**: React.lazy for component code-splitting
- **Image Optimization**: Next.js Image component with sharp

---

## 📞 Support & Resources

### Documentation
- **Prisma**: https://www.prisma.io/docs
- **Refine**: https://refine.dev/docs
- **Ant Design**: https://ant.design/components
- **Pusher**: https://pusher.com/docs
- **i18next**: https://www.i18next.com/
- **Recharts**: https://recharts.org/

### Project-Specific Docs
- **CLAUDE.md**: Project conventions and architecture
- **README.md**: General project setup and overview
- **ADMIN_GUIDE.md** (TBD): Admin user guide

---

**Last Updated:** 2025-11-09
**Status:** Core Infrastructure Complete (40%), API & Frontend Pending (60%)
**Estimated Completion:** 20-30 hours remaining
