# Mientior - Premium E-commerce Platform

Modern Next.js e-commerce store with Prisma database, Refine admin panel, Stripe payments, and full-stack TypeScript. Features product catalog, search, cart/checkout, user accounts, and admin CRUD.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Ant Design (admin)
- **Admin Panel:** Refine v5 with @refinedev/antd, simple-rest data provider, RBAC, audit logging, i18n
- **Database:** Prisma ORM (PostgreSQL) - 20+ models (Product, Category, Order, User, Vendor, Campaign, PromoCode, etc.)
- **Auth:** Better Auth (sessions, roles, permissions)
- **Payments:** Stripe (Payment Intents, webhooks)
- **Marketing:** Email campaigns, SMS, push notifications, promo codes
- **Other:** Redis (stock locks, caching), Resend (emails), Pusher (real-time), Zod (validation), Recharts (analytics)

## Quick Start

1. Clone repo: `git clone <repo> mientior && cd mientior`
2. Install: `npm install`
3. Env setup: Copy `.env.example` to `.env.local`; set `PRISMA_DATABASE_URL`, `BETTER_AUTH_*`, `STRIPE_*`, etc. (PostgreSQL required)
4. Database: `npx prisma db push` (initial), `npx prisma generate` (types)
5. Dev: `npm run dev` (starts Next.js + Refine at /admin)
6. Seed (optional): `npx prisma db seed` if script exists
7. Admin: Visit /admin, login via /auth/sign-in (Better Auth)

## Features

- **Frontend:** Responsive product pages, search/autocomplete, cart/checkout with Stripe, user dashboard (orders, wishlist), FAQ
- **Admin (Refine):** Full CRUD for Products (variants/images/tags), Categories (hierarchy), Orders (status updates), Users (loyalty management)
- **API:** REST endpoints (/api/products, /api/categories, etc.) with Refine-compatible pagination/filtering/sorting
- **Business Logic:** Atomic stock decrement (Redis locks), verified reviews (purchase check), promo codes, shipping options, loyalty tiers

## Structure

- `prisma/schema.prisma`: Database models & relations
- `src/lib/prisma.ts`: Prisma client singleton
- `src/app/api/*`: REST API routes (Prisma queries, auth guards)
- `src/app/admin/*`: Refine pages (list/create/edit/show for resources)
- `src/app/(app)/*`: Public pages (products, search, account, etc.)
- `src/types/index.ts`: Shared TS types (Product, Order, User)
- `src/components/*`: UI components (ProductCard, SearchBar, etc.)

## Database

Single Prisma schema manages all data. Run `prisma migrate dev --name <desc>` for changes; `prisma generate` for types. Better Auth uses separate users table/connection. Indexes on slugs, foreign keys, status for perf.

## Admin Dashboard

### Access & Authentication

Access the admin dashboard at `/admin`. Login with Better Auth credentials via `/auth/login`.

**Default Admin Account** (from seed script):
- Email: `admin@mientior.com`
- Role: `SUPER_ADMIN`
- Create via: `npm run db:seed` or `npx prisma db seed`

### Key Features

**✅ Professional Layout & Navigation**
- Collapsible sidebar with hierarchical menu structure
- Persistent sidebar state (localStorage)
- Breadcrumb navigation
- Global search (Cmd+K / Ctrl+K)
- Real-time notifications bell
- Language selector (FR/EN)
- User account dropdown with activity log

**✅ Role-Based Access Control (RBAC)**
- 5 roles: SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, VIEWER
- 22 granular permissions (products, orders, users, vendors, marketing, etc.)
- Permission-based UI rendering
- Audit logging for all actions

**✅ Core Resource Management**
1. **Dashboard**
   - KPI cards (revenue, orders, conversion rate, AOV)
   - Charts (Recharts): revenue trends, sales, traffic sources
   - Recent orders table with quick actions
   - Alerts & notifications (low stock, pending vendors, failed payments)
   - Real-time updates via Pusher

2. **Products**
   - Full CRUD with Refine hooks (useTable, useForm, useShow)
   - Advanced filters (status, category, price range, stock level, search)
   - Column selector with drag-and-drop reordering
   - Saved views (save/load filter configurations)
   - Bulk actions (export, status change, delete)
   - Comprehensive product form (planned):
     * Tabs: General, Media, Variants, SEO, Shipping
     * Rich text editor (Tiptap) for descriptions
     * Image gallery with drag-and-drop upload/reorder
     * Variant matrix generator (size x color combinations)
     * SEO optimization with preview

3. **Orders**
   - List view with status filters and customer search
   - Detailed order view:
     * Order timeline (pending → processing → shipped → delivered)
     * Customer information card
     * Payment details (method, transaction ID, refunds)
     * Shipping/billing addresses
     * Order items table
     * Status update actions (ship, cancel, refund)
     * Internal notes section
     * Audit log

4. **Customers**
   - Customer list with loyalty level filters
   - Segment tabs (All, VIP, New, Inactive, Cart Abandoners)
   - Customer profile page:
     * Statistics (orders, spent, AOV, lifetime value)
     * Orders history
     * Saved addresses
     * Wishlist
     * Reviews
     * Loyalty points management
     * Tags and notes

**✅ Multi-Vendor System**
- Vendor registration & approval workflow
- Vendor list with status filters (Pending, Active, Suspended, Banned)
- Vendor detail page:
  * Profile information & documents
  * Products & orders
  * Commission tracking
  * Payout history
  * Activity log
- Commission rate configuration
- API endpoints: `/api/vendors`, `/api/vendors/[id]`

**✅ Marketing Module**
1. **Campaigns**
   - Email, SMS, and Push notification campaigns
   - Campaign wizard: details → content → audience → schedule → review
   - Rich content editor with personalization tags
   - Segment-based targeting
   - Schedule or send immediately
   - Campaign stats (opens, clicks, conversions)
   - API endpoints: `/api/campaigns`, `/api/campaigns/[id]/send`

2. **Promo Codes**
   - Code types: Percentage, Fixed Amount, Free Shipping
   - Usage limits (total & per customer)
   - Validity period (validFrom/validTo)
   - Conditions (min order amount, max discount)
   - Usage tracking
   - API endpoints: `/api/promo-codes`

3. **Customer Segments** (planned)
   - Dynamic customer segmentation
   - Filter-based segment creation
   - Segment size calculation
   - Use in campaigns and promo codes

**✅ Analytics** (planned)
- Comprehensive analytics dashboard
- Conversion funnel visualization
- Traffic source breakdown
- Top products & categories reports
- Geographic sales map
- Export reports as PDF

**✅ Settings** (planned)
1. **General**: Site info, logo, contact details, localization, SEO defaults
2. **Payments**: Stripe, PayPal, Apple Pay, Google Pay configuration
3. **Shipping**: Zones, methods, rates, free shipping rules, carrier integrations
4. **Taxes**: Tax rates by region
5. **Admin Users**: Create/manage admin accounts with role assignment
6. **Audit Logs**: Complete audit trail with filters

**✅ Advanced Features**
- **Import/Export**: Bulk data operations for products, orders, customers (CSV/XLSX)
- **Saved Views**: Save and restore filter/column configurations
- **Bulk Actions**: Multi-select operations (delete, export, status change)
- **Column Selector**: Customize table columns per resource
- **Advanced Filters**: Complex filter builder with multiple conditions
- **Real-time Notifications**: Pusher integration for live updates
- **Internationalization**: Full i18n support (French/English)

### Admin Resources (Refine Configuration)

```typescript
resources: [
  { name: "products", list/create/edit/show },
  { name: "categories", list/create/edit/show },
  { name: "orders", list/show },
  { name: "users", list/show },
  { name: "vendors", list/create/edit/show },
  { name: "campaigns", list/create/edit/show },
  { name: "promo-codes", list/create/edit },
  { name: "segments", list/create/edit },
  { name: "media", list },
  { name: "audit-logs", list/show },
  { name: "admin-users", list/create/edit/show },
  { name: "roles", list/show },
  { name: "feature-flags", list },
]
```

### Admin Development Guide

**Adding a New Admin Page**

1. Create API endpoint in `/src/app/api/[resource]/route.ts`:
   ```typescript
   // Support Refine query params: _start, _end, _sort, _order
   // Return X-Total-Count header for pagination
   export const GET = withPermission(Permission.RESOURCE_READ, async (req) => {
     const total = await prisma.resource.count();
     const items = await prisma.resource.findMany({ skip, take });
     return NextResponse.json(items, {
       headers: { 'X-Total-Count': total.toString() }
     });
   });
   ```

2. Create Refine page in `/src/app/admin/[resource]/page.tsx`:
   ```typescript
   'use client';
   import { useTable } from '@refinedev/antd';

   export default function ResourceList() {
     const { tableProps } = useTable({ resource: 'resource' });
     return <Table {...tableProps} />;
   }
   ```

3. Register resource in `/src/app/admin/layout.tsx`

4. Add menu item to `/src/components/admin/admin-sidebar.tsx`

5. Add permissions to `/src/lib/rbac.ts`

6. Add translations to `/public/locales/{en,fr}/admin.json`

**Adding a New Permission**

1. Add enum to `prisma/schema.prisma`: `enum Permission { ... NEW_PERMISSION }`
2. Run `npx prisma generate`
3. Update `ROLE_PERMISSIONS` in `src/lib/rbac.ts`
4. Add to `RESOURCE_PERMISSIONS` if resource-specific
5. Add description in `getPermissionDescription`

**Customizing Refine Resources**

- Use `useTable` for lists (pagination, sorting, filtering)
- Use `useForm` for create/edit (validation, submission)
- Use `useShow` for detail views
- Use `useUpdate` for inline updates
- Use `useDelete` for deletions
- All hooks integrate with Refine's data provider

### Admin Tech Stack

- **Framework**: Refine.dev v5 with Ant Design
- **UI Components**: Ant Design (tables, forms, modals, etc.)
- **Charts**: Recharts for analytics
- **Rich Text**: Tiptap (planned)
- **File Upload**: Ant Design Upload + custom handlers
- **Drag & Drop**: @dnd-kit (column reordering, image sorting)
- **State Management**: Refine hooks + React Query
- **Internationalization**: i18next
- **Real-time**: Pusher

## API

- Products: GET/POST/PUT/DELETE /api/products (supports _start/_end/_sort/_order, filters: status, name_like, categoryId)
- Categories: Similar CRUD /api/categories (parentId for hierarchy)
- Orders: GET /api/orders (admin list), GET/PUT /api/orders/[id] (detail/update status)
- Users: GET /api/users (list with aggregations), GET/PUT /api/users/[id] (profile/loyalty)
- Other: /api/search (global), /api/checkout/* (Stripe), /api/orders/create (customer)

## Scripts

- `dev`: Start dev server
- `build`: Production build
- `start`: Production server
- `prisma:studio`: DB browser
- `prisma:migrate`: Run migrations
- `lint`: Code quality
- `type-check`: TS check

## Environment Variables

List from .env.example with explanations:
- `PRISMA_DATABASE_URL`: PostgreSQL connection for main DB
- `REDIS_URL`: Redis connection string
- `BETTER_AUTH_SECRET`: Secret for Better Auth
- `BETTER_AUTH_URL`: Auth URL (http://localhost:3000 in dev)
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `RESEND_API_KEY`: Email sending API key
- `REVALIDATION_SECRET`: For ISR revalidation API
- Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` for OAuth

## Deployment

Vercel/Render: Auto-migrations via hooks; set env vars. Ensure Prisma URL writable.

## Contributing

Follow TS/Prisma conventions; add tests; update types/README.

## Implementation Status

### ✅ Completed

- Core infrastructure (Next.js 15, Prisma, Refine, Better Auth, Redis, Stripe)
- All API routes (products, categories, orders, users, search, checkout)
- Prisma models (Products, Categories, Orders, Users, Reviews, Media, Tags, Analytics)
- Homepage (Hero, SocialProofBar, CategoriesNav, FlashDeals, CuratedCollection, FeaturedProducts)
- Product Detail Page (Gallery, ProductInfo with variant selection, ProductTabs, Recommendations)
- Category/Listing Page (FiltersSidebar, ProductsToolbar, ProductsGrid)
- Cart Page (CartItem, CartSummary)
- Checkout Page (ProgressStepper, ShippingForm, ShippingOptions, PaymentForm, OrderSummary)
- Account Page (AccountSidebar, DashboardOverview, OrdersList)
- Search Page (SearchResults with multi-type tabs)
- FAQ Page (FAQSection with search, categories, voting)
- Cart/Wishlist stores (Zustand with persistence)
- Business logic (server-side cart validation, distributed stock locks, promo codes, verified reviews)

### 🚧 In Progress

- Product reviews submission UI (API complete, frontend form pending)
- Order tracking timeline UI (API complete, visualization pending)
- Gamification (Fortune Wheel, Loyalty Program, Challenges - components exist, integration pending)
- Live chat widget
- Quick view modal
- Product comparison
- Blog/articles section

## Database Models (Prisma)

```
Products      → Catalog with variants, images, categories, tags, SEO
Categories    → Hierarchical category tree
Orders        → Order history with items, addresses, tracking
OrderItems    → Individual items in orders with variant relations
Users         → Authentication, addresses, loyalty data, recently viewed
Media         → Image uploads with optimization
Tags          → Product tags for organization
ProductTags   → Many-to-many relation between products and tags
ProductImages → Product image gallery
ProductVariants → Size, color, SKU, stock for each variant
Reviews       → Product reviews with moderation, verified purchases
FAQ           → Frequently asked questions with categories
Analytics     → Page view tracking
AuditLog      → Action audit trail
```

## Architecture

### Database Access

All database operations use Prisma Client:
- Import: `import { prisma } from '@/lib/prisma'`
- Query: `await prisma.product.findMany()`
- Mutations: `await prisma.product.create({ data: {...} })`
- Relations: Prisma handles joins automatically via `include`

### Authentication

Better Auth with dual configuration:
- Cookie-based sessions
- Redis caching (5min cache, 7-day expiry)
- Email/password + Google OAuth (if configured)
- Helpers: `getSession()`, `requireAuth()`

### Middleware

Protects routes in `middleware.ts`:
- `/account/*` → requires auth
- `/checkout/*` → requires auth
- `/admin/*` → bypassed (Refine handles routing)
- `/api/*` → bypassed

### Admin Panel

- `/admin` → Refine Admin UI with Ant Design
  - `/admin/products` → Product management (list, create, edit, show)
  - `/admin/categories` → Category management (list, create, edit, show)
  - `/admin/orders` → Order management (list, show, update status)
  - `/admin/users` → User management (list, show)

## Design System

### Colors
- **Orange** (`#FF6B00`): Primary brand, CTAs
- **Blue** (`#1E3A8A`): Trust, professionalism
- **Aurore** (`#FFC107`): Highlights, badges

### Typography
- **Sans** (Inter): Body text, UI
- **Display** (Poppins): Headings, branding

### Spacing
8px-based system with custom tokens (u4, u8, u12, u16, u24, u32, u48, u64, u96, u128)

### Animations
- Keyframes: fade-in, scale-in, shimmer, pulse-subtle, ripple
- Duration: fast (200ms), normal (300ms), slow (400ms)

## Component Library

### Layout
- **Header**: 3-layer navigation with glassmorphism
- **Footer**: Multi-section with newsletter
- **MobileNav**: Bottom bar with swipe gestures

### UI
- **ProductCard**: Hover effects, quick actions
- **SearchBar**: Autocomplete, recent history
- **CartPreview**: Dropdown with animations
- **StarRating**: Accessible with gradient fill
- **RippleButton**: Material-design ripple

### Home
- **HeroSection**: Cinematic carousel with parallax
- **FeaturedProducts**: Grid with staggered animations

## Performance

- Image optimization (Next.js Image, lazy loading)
- Code splitting (route-based)
- Intersection Observer (scroll-triggered animations)
- Debouncing (search 300ms, scroll 100ms throttle)
- Redis caching (API responses, sessions)
- ISR (on-demand revalidation)

## Accessibility

- Skip-to-content link
- ARIA labels
- Semantic HTML
- Keyboard navigation
- Focus management
- Reduced motion support
- WCAG AA color contrast

## License

Proprietary - All rights reserved
