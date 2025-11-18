# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mientior is an enterprise-grade e-commerce marketplace built with Next.js 15 App Router, Prisma ORM, and Refine admin panel. The application uses a single PostgreSQL database managed entirely by Prisma, with a Refine-powered admin interface for content management.

## Core Technologies

- **Next.js 15** (App Router) - Framework
- **Prisma** - ORM for all database operations
- **PostgreSQL** - Single database for all data
- **Refine** - Admin panel framework with Ant Design
- **Redis** - Caching and sessions via ioredis
- **Better Auth** - Authentication system
- **Stripe** - Payment processing
- **Resend** - Email service
- **Zustand** - Client state management
- **React Query** - Server state management
- **Tailwind CSS + shadcn/ui** - UI components

## Development Commands

```bash
# Development
npm run dev                # Start dev server (http://localhost:3000)

# Building
npm run build              # Production build
npm start                  # Start production server

# Code Quality
npm run lint               # Run ESLint on all TS/TSX/JS/JSX files
npm run format             # Format all files with Prettier

# Database
npm run db:push            # Push Prisma schema changes to database
npm run db:studio          # Open Prisma Studio (database GUI)
npx prisma migrate dev     # Create and run migrations
npx prisma generate        # Generate Prisma Client types

# Testing
npm run email:dev          # Send test email via ./scripts/send-test-email.js
```

## Architecture

### Database Architecture

**Single Database Approach**: This project uses ONE PostgreSQL database managed entirely by Prisma:
- All models defined in `prisma/schema.prisma`
- Access via `src/lib/prisma.ts` singleton client
- Models: Product, Category, Order, User, Review, Media, Tag, Analytics, AuditLog, FAQ, etc.
- Supports full relations, cascading deletes, and complex queries

When working with data:
- All data operations → Use Prisma Client via `import { prisma } from '@/lib/prisma'`
- Admin operations → Go through REST API endpoints that use Prisma underneath
- No CMS layer - direct database access with Prisma

### Authentication Flow

Better Auth handles authentication with dual configuration:
- **Database**: Uses PostgreSQL via `PRISMA_DATABASE_URL`
- **Session management**: Cookie-based with Redis caching (5 min cache, 7 day expiry)
- **Providers**: Email/password (no verification required) + Google OAuth (if configured)

Key auth functions (src/lib/auth.ts):
- `getSession()` - Get current session (returns null if unauthenticated)
- `requireAuth()` - Throws if not authenticated
- `auth.api.signInEmail()` - Email/password sign in
- `auth.api.signOut()` - Sign out

### Middleware Protection

middleware.ts protects routes:
- `/account/*` - Requires authentication
- `/checkout/*` - Requires authentication
- `/admin/*` - Protected by Refine auth provider
- `/api/*` - Some routes protected, others public

### API Routes Structure

```
/api/products           → Products REST API (GET/POST/PUT/DELETE)
/api/categories         → Categories REST API
/api/orders             → Orders REST API
/api/users              → Users REST API
/api/tags               → Tags REST API
/api/search             → Global search endpoint
/api/checkout/*         → Stripe checkout endpoints
/api/webhooks/stripe    → Stripe webhook handler
/api/revalidate         → On-demand ISR revalidation
/admin                  → Refine Admin UI
```

### Admin Panel (Refine)

The admin panel is built with Refine framework at `/admin`:

**Resources**:
- **Products**: Full CRUD with variants, images, tags, and categories
  - List: `/admin/products` (useTable with pagination, filters, sorting)
  - Create: `/admin/products/create` (useForm with nested relations)
  - Edit: `/admin/products/edit/[id]` (useForm with delete functionality)
  - Show: `/admin/products/show/[id]` (useShow with detailed view)

- **Categories**: Hierarchical category management
  - List: `/admin/categories` (tree view support)
  - Create: `/admin/categories/create` (parent selection)
  - Edit: `/admin/categories/edit/[id]` (with child check on delete)
  - Show: `/admin/categories/show/[id]` (shows children and product count)

- **Orders**: Order management and status updates
  - List: `/admin/orders` (with status filters)
  - Show: `/admin/orders/show/[id]` (detailed view with timeline, status updates)

- **Users**: User management and loyalty tracking
  - List: `/admin/users` (with loyalty level filters)
  - Show: `/admin/users/show/[id]` (profile, orders, loyalty management)

**Integration**:
- Data provider: Custom REST provider pointing to `/api/*` endpoints
- Auth provider: Integrated with Better Auth
- Uses Ant Design components throughout
- All operations use Refine hooks (useTable, useForm, useShow, useUpdate, useDelete)

### Prisma Models

Key models in `prisma/schema.prisma`:

**Product**:
- Core fields: name, slug, description, price, compareAtPrice, stock, status
- Relations: category (many-to-one), tags (many-to-many), images (one-to-many), variants (one-to-many)
- Supports: featured flag, onSale flag, badge text, rating/reviewCount
- Indexes on slug, categoryId, status for performance

**Category**:
- Hierarchical with self-referential parent/children relations
- Fields: name, slug, description, image, order, isActive
- Includes product count aggregation

**Order**:
- Fields: orderNumber, userId, status, paymentStatus, totals (subtotal, tax, shipping, discount, total)
- Relations: items (one-to-many), user (many-to-one)
- Embedded addresses (shipping, billing)
- Optional tracking and delivery estimates

**User** (Better Auth):
- Managed by Better Auth with custom extensions
- Additional fields: loyaltyPoints, loyaltyLevel, addresses, recentlyViewed, searchHistory
- Aggregated totals: totalOrders, totalSpent

### State Management

**Client State** (Zustand with persistence):
- `src/stores/cart.store.ts` - Shopping cart (localStorage persisted)
- `src/stores/wishlist.store.ts` - Wishlist

**Server State** (React Query):
- Configured in src/app/providers.tsx
- Use for data fetching with automatic caching

### Caching Strategy

Redis caching helper (src/lib/redis.ts):
```typescript
getCachedData(key: string, fetcher: () => Promise<any>, ttl = 60)
invalidateCache(pattern: string)
```

ISR revalidation via `/api/revalidate`:
- Can be triggered programmatically after data mutations
- Revalidates by path or by cache tag
- Secured with `REVALIDATION_SECRET` header

### Payment Flow

Stripe integration (src/lib/stripe.ts):
1. Create checkout session via `createCheckoutSession()`
2. Redirect user to Stripe Checkout
3. Webhook handler receives events at `/api/webhooks/stripe`
4. Process `checkout.session.completed` to create orders via Prisma
5. Update order status on `payment_intent.succeeded`

### Email System

Resend integration (src/lib/email.ts):
- Test emails via `npm run email:dev`
- Configure templates and sending logic in src/lib/email.ts

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Required variables:
   - `PRISMA_DATABASE_URL` - PostgreSQL connection string
   - `REDIS_URL` - Redis connection string
   - `BETTER_AUTH_SECRET` - Secret for Better Auth
   - `BETTER_AUTH_URL` - Auth URL (http://localhost:3000 in dev)
   - `STRIPE_SECRET_KEY` - Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
   - `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
   - `RESEND_API_KEY` - Email sending API key
   - `REVALIDATION_SECRET` - For ISR revalidation API
   - Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` for OAuth

## Common Development Patterns

### Adding a new Prisma model:
1. Update `prisma/schema.prisma` with the new model
2. Run `npx prisma migrate dev --name add_model_name` to create migration
3. Run `npx prisma generate` to update Prisma Client types
4. Import types from `@prisma/client`

### Creating a new API endpoint:
1. Create route in `src/app/api/[resource]/route.ts`
2. Use Next.js 15 App Router conventions (GET, POST, PUT, DELETE exports)
3. Import Prisma client: `import { prisma } from '@/lib/prisma'`
4. For protected routes, call `requireAuth()` from `src/lib/auth.ts`
5. Return data with proper headers (X-Total-Count for Refine compatibility)

### Adding a new admin resource:
1. Create API endpoints in `/api/[resource]` that support Refine's data provider format
2. Create Refine pages in `src/app/admin/[resource]/`:
   - `page.tsx` - List view (useTable)
   - `create/page.tsx` - Create form (useForm)
   - `edit/[id]/page.tsx` - Edit form (useForm)
   - `show/[id]/page.tsx` - Detail view (useShow)
3. Register resource in Refine configuration at `src/app/admin/layout.tsx`

### Working with forms:
- Use react-hook-form + @hookform/resolvers/zod for validation
- UI components from src/components/ui/ (shadcn/ui based)
- Admin forms use Ant Design components with Refine hooks

### Querying data with Prisma:
```typescript
// Find many with relations
const products = await prisma.product.findMany({
  include: {
    category: true,
    tags: true,
    images: true,
    variants: true,
  },
  where: { status: 'ACTIVE' },
  orderBy: { createdAt: 'desc' },
})

// Create with nested relations
const product = await prisma.product.create({
  data: {
    name: 'Product Name',
    slug: 'product-name',
    price: 99.99,
    category: { connect: { id: categoryId } },
    tags: { connect: [{ id: tag1Id }, { id: tag2Id }] },
    images: {
      create: [
        { url: 'image.jpg', alt: 'Product', type: 'IMAGE' }
      ]
    },
  },
  include: { category: true, tags: true, images: true }
})
```

### Triggering cache invalidation:
- Call `invalidateCache('pattern')` from src/lib/redis.ts
- Or POST to `/api/revalidate` with secret header for ISR

## Important Notes

- **This is a scaffolded project**: Many components contain placeholder logic marked with comments
- **Security**: Never commit real API keys or secrets - use `.env.local` (gitignored)
- **Node version**: Requires Node.js >= 20 (specified in package.json engines)
- **Type safety**: Project uses TypeScript strict mode
- **Image optimization**: sharp is included for Next.js image optimization
- **Analytics**: PostHog integration configured (optional, needs keys)

## Project Structure

```
/src/app              Next.js App Router pages and API routes
/src/app/(app)        Main application routes (public-facing)
/src/app/admin        Refine admin panel pages
/src/app/api          REST API endpoints (all use Prisma)
/src/components       React components (layout, home, ui)
/src/lib              Core utilities (auth, prisma, stripe, email, redis)
/src/stores           Zustand stores for client state
/src/hooks            Custom React hooks
/src/types            TypeScript type definitions
/prisma               Prisma schema and migrations
```

## API Endpoint Conventions (for Refine compatibility)

All admin API endpoints should follow these conventions:

1. **GET /api/[resource]** - List with pagination/filtering/sorting
   - Query params: `_start`, `_end`, `_sort`, `_order`, field filters
   - Response headers: `X-Total-Count` for total records
   - Example: `GET /api/products?_start=0&_end=10&_sort=name&_order=asc&status=ACTIVE`

2. **GET /api/[resource]/[id]** - Get single record
   - Include relations as needed
   - Example: `GET /api/products/123`

3. **POST /api/[resource]** - Create new record
   - Body: JSON data with nested creates/connects for relations
   - Return: Created record with relations

4. **PUT /api/[resource]/[id]** - Update record
   - Body: Partial data with nested updates
   - Return: Updated record with relations

5. **DELETE /api/[resource]/[id]** - Delete record
   - Return: Deleted record or success message
