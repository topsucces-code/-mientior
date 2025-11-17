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
npm run db:seed            # Seed database with initial data (via tsx prisma/seed.ts)
npx prisma migrate dev     # Create and run migrations
npx prisma generate        # Generate Prisma Client types

# Testing
npm run email:dev          # Send test email via ./scripts/send-test-email.js

# Docker
docker-compose up -d       # Start PostgreSQL and Redis containers
./start-docker.sh          # Helper script to start Docker services
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
# Admin/CRUD Endpoints
/api/products           → Products REST API (GET/POST/PUT/DELETE)
/api/products/[id]      → Single product operations (GET/PUT/DELETE)
/api/products/search    → Product search with advanced filtering
/api/categories         → Categories REST API (GET/POST)
/api/categories/[id]    → Single category operations (GET/PUT/DELETE)
/api/orders             → Orders REST API (GET for admin list)
/api/orders/[id]        → Single order operations (GET/PUT)
/api/orders/create      → Create new order (customer checkout)
/api/orders/track/[orderNumber] → Track order status
/api/users              → Users REST API (GET)
/api/users/[id]         → Single user operations (GET/PUT)

# Search & Discovery
/api/search             → Global search endpoint (products, categories, etc.)
/api/search/trending    → Trending search terms
/api/search/suggestions → Search autocomplete suggestions
/api/search/visual      → Visual/image-based search

# User Features
/api/user/addresses     → User address management
/api/user/notifications → User notifications
/api/user/recently-viewed → Recently viewed products tracking
/api/user/wishlist/sync → Sync wishlist across devices

# Reviews
/api/reviews/products/[slug]/reviews → Product reviews (GET/POST)

# Checkout & Payments
/api/checkout/create-payment-intent → Create Stripe payment intent
/api/checkout/shipping-options → Get available shipping options
/api/checkout/validate-address → Validate shipping address
/api/webhooks/stripe    → Stripe webhook handler (checkout.session.completed, etc.)

# Promotions
/api/promo/validate     → Validate promo codes
/api/promo/banners      → Get promotional banners

# System
/api/auth/session       → Get current session
/api/revalidate         → On-demand ISR revalidation

# Admin UI
/admin                  → Refine Admin UI (products, categories, orders, users)
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
  - Methods: addItem, removeItem, updateQuantity, clearCart, getTotalItems, getTotalPrice
- `src/stores/wishlist.store.ts` - Wishlist management (localStorage persisted)
- `src/stores/notifications.store.ts` - User notifications state
- `src/stores/comparator.store.ts` - Product comparison feature
- `src/stores/preferences.store.ts` - User preferences (theme, language, currency, etc.)

**Server State** (React Query):
- Configured in src/app/providers.tsx
- Use for data fetching with automatic caching
- Integrated with Refine for admin panel data management

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
   - `PRISMA_DATABASE_URL` - PostgreSQL connection string (main database for Prisma models)
   - `BETTER_AUTH_DATABASE_URL` - PostgreSQL connection string (Better Auth tables, can be same as PRISMA_DATABASE_URL)
   - `REDIS_URL` - Redis connection string
   - `BETTER_AUTH_SECRET` - Secret for Better Auth (use a strong random string)
   - `BETTER_AUTH_URL` - Auth URL (http://localhost:3000 in dev, production URL in prod)
   - `STRIPE_SECRET_KEY` - Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
   - `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
   - `RESEND_API_KEY` - Email sending API key
   - `REVALIDATION_SECRET` - For ISR revalidation API
   - `NEXT_PUBLIC_SERVER_URL` - Base URL for the application
   - Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` for OAuth
   - Optional: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` for media storage
   - Optional: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` for analytics

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
/src/app                      Next.js App Router pages and API routes
  ├── (app)/                  Main application routes (public-facing)
  │   ├── page.tsx            Homepage
  │   ├── products/           Product listing and detail pages
  │   ├── cart/               Shopping cart page
  │   ├── checkout/           Checkout flow
  │   ├── account/            User account dashboard
  │   ├── search/             Search results page
  │   └── faq/                FAQ page
  ├── admin/                  Refine admin panel pages
  │   ├── products/           Product CRUD (list, create, edit, show)
  │   ├── categories/         Category CRUD
  │   ├── orders/             Order management (list, show)
  │   └── users/              User management (list, show)
  └── api/                    REST API endpoints (all use Prisma)
      ├── products/           Product API routes
      ├── categories/         Category API routes
      ├── orders/             Order API routes
      ├── users/              User API routes
      ├── search/             Search API routes
      ├── checkout/           Checkout API routes
      ├── promo/              Promotion API routes
      ├── user/               User-specific API routes
      ├── reviews/            Review API routes
      └── webhooks/           Webhook handlers

/src/components               React components organized by feature
  ├── account/                Account-related components (dashboard, orders, sidebar)
  ├── cart/                   Cart components (cart-item, cart-summary)
  ├── category/               Category/listing components (filters, toolbar, grid)
  ├── checkout/               Checkout components (stepper, forms, summary)
  ├── gamification/           Gamification features (fortune-wheel, loyalty, challenges)
  ├── header/                 Header components (mega-menu, search, cart preview, user dropdown)
  ├── home/                   Homepage components (hero, featured, flash-deals)
  ├── layout/                 Layout components (header, footer, mobile-nav)
  ├── products/               Product components (card, gallery, info, tabs, recommendations)
  ├── search/                 Search components (results, filters)
  ├── support/                Support components (FAQ section)
  └── ui/                     Reusable UI components (shadcn/ui based)

/src/lib                      Core utilities and configurations
  ├── auth.ts                 Better Auth client configuration
  ├── auth-server.ts          Server-side auth helpers (getSession, requireAuth)
  ├── prisma.ts               Prisma client singleton
  ├── stripe.ts               Stripe integration
  ├── email.ts                Email service (Resend)
  ├── redis.ts                Redis caching helpers
  ├── stock-lock.ts           Distributed stock locking
  ├── utils.ts                Utility functions
  ├── constants.ts            App constants
  └── api-client.ts           API client utilities

/src/stores                   Zustand stores for client state
  ├── cart.store.ts           Shopping cart state
  ├── wishlist.store.ts       Wishlist state
  ├── notifications.store.ts  Notifications state
  ├── comparator.store.ts     Product comparison state
  └── preferences.store.ts    User preferences state

/src/hooks                    Custom React hooks
  ├── use-debounce.ts         Debounce hook for search/inputs
  ├── use-media-query.ts      Responsive media queries
  ├── use-local-storage.ts    LocalStorage state management
  ├── use-intersection-observer.ts  Scroll-triggered animations
  ├── use-toast.ts            Toast notifications
  ├── use-keyboard-navigation.ts  Keyboard accessibility
  ├── use-scroll-direction.ts Detect scroll direction
  ├── use-reduced-motion.ts   Accessibility for reduced motion
  ├── use-geolocation.ts      Geolocation detection
  └── use-rotating-messages.ts  Rotating message display

/src/types                    TypeScript type definitions
  ├── index.ts                Shared types (Product, Order, User, etc.)
  └── prisma.d.ts             Prisma type extensions

/prisma                       Database schema and migrations
  ├── schema.prisma           Prisma schema definition
  ├── seed.ts                 Database seeding script
  └── migrations/             Database migration files

/scripts                      Utility scripts
  └── send-test-email.js      Email testing script

/public                       Static assets
  └── images/                 Images and media files

Root configuration files:
  ├── docker-compose.yml      Docker services (PostgreSQL, Redis)
  ├── start-docker.sh         Docker startup helper
  ├── middleware.ts           Next.js middleware (auth protection)
  ├── next.config.mjs         Next.js configuration
  ├── tailwind.config.ts      Tailwind CSS configuration
  ├── tsconfig.json           TypeScript configuration
  ├── components.json         shadcn/ui configuration
  └── .env.example            Environment variables template
```

## Custom Hooks

The project includes several custom React hooks for common patterns:

### Performance Hooks
- **use-debounce.ts**: Debounce values for search inputs and filtering
  ```typescript
  const debouncedSearch = useDebounce(searchTerm, 300)
  ```

- **use-intersection-observer.ts**: Trigger animations or lazy loading on scroll
  ```typescript
  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.5 })
  ```

### Storage Hooks
- **use-local-storage.ts**: Persist state to localStorage with SSR safety
  ```typescript
  const [value, setValue] = useLocalStorage('key', defaultValue)
  ```

### UI/UX Hooks
- **use-media-query.ts**: Responsive design breakpoints
  ```typescript
  const isMobile = useMediaQuery('(max-width: 768px)')
  ```

- **use-toast.ts**: Toast notification system (shadcn/ui based)
  ```typescript
  const { toast } = useToast()
  toast({ title: 'Success', description: 'Item added to cart' })
  ```

- **use-scroll-direction.ts**: Detect scroll direction (up/down) for showing/hiding headers
  ```typescript
  const scrollDirection = useScrollDirection()
  ```

- **use-rotating-messages.ts**: Display rotating promotional messages
  ```typescript
  const currentMessage = useRotatingMessages(messages, intervalMs)
  ```

### Accessibility Hooks
- **use-keyboard-navigation.ts**: Enhanced keyboard navigation for interactive elements
  ```typescript
  const handleKeyDown = useKeyboardNavigation(options)
  ```

- **use-reduced-motion.ts**: Respect user's reduced motion preferences
  ```typescript
  const prefersReducedMotion = useReducedMotion()
  ```

### Feature Hooks
- **use-geolocation.ts**: Get user's location for shipping estimates
  ```typescript
  const { location, error, loading } = useGeolocation()
  ```

## Docker Setup

The project includes Docker Compose configuration for local development:

### Services
- **PostgreSQL**: Main database (port 5432)
- **Redis**: Caching and session storage (port 6379)

### Usage
```bash
# Start services
docker-compose up -d

# Or use the helper script
./start-docker.sh

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Reset volumes (WARNING: deletes all data)
docker-compose down -v
```

### Configuration
Edit `docker-compose.yml` to customize:
- Database credentials
- Port mappings
- Volume persistence
- Resource limits

The services are configured to persist data in Docker volumes, so your data survives container restarts.

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

## Admin Panel Notes

### Data Provider Configuration
The Refine admin panel uses a simple-rest data provider that points to `/api` endpoints:
```typescript
dataProvider(dataProvider("http://localhost:3000/api"))
```

**Important**: In production, update the base URL to use an environment variable:
```typescript
dataProvider(process.env.NEXT_PUBLIC_SERVER_URL + "/api")
```

### Authentication
Currently, the admin panel does not have a separate authentication system. To add admin authentication:

1. Create an admin role in the User model or Better Auth configuration
2. Add an auth provider to the Refine configuration
3. Implement login/logout pages at `/admin/login`
4. Protect admin routes in `middleware.ts` or admin layout

### Resource Configuration
Resources are registered in `src/app/admin/layout.tsx`. Each resource should:
- Have corresponding API endpoints at `/api/[resource]`
- Follow Refine's data provider format
- Include proper meta labels for UI display
- Define available operations (list, create, edit, show)

## Best Practices

### Database Operations
- **Always use Prisma Client**: Never write raw SQL queries unless absolutely necessary
- **Use transactions**: For operations that modify multiple tables
  ```typescript
  await prisma.$transaction([
    prisma.product.update({ ... }),
    prisma.analytics.create({ ... })
  ])
  ```
- **Include relations selectively**: Only include what you need to reduce query size
- **Add indexes**: For frequently queried fields (already added for common fields)

### API Development
- **Validate inputs**: Use Zod schemas for request validation
- **Handle errors gracefully**: Return appropriate HTTP status codes
- **Use TypeScript**: Leverage Prisma types for type safety
- **Implement pagination**: Always paginate list endpoints
- **Add proper headers**: Include `X-Total-Count` for Refine compatibility

### Authentication
- **Server-side only**: Use `getSession()` from `src/lib/auth-server.ts` in Server Components/API routes
- **Client-side**: Import from `src/lib/auth.ts` for client components
- **Never use in middleware**: Use the headers() API as shown in middleware.ts
- **Check session early**: Call `requireAuth()` at the start of protected routes

### State Management
- **Prefer server state**: Use React Query/SWR for server data instead of client state
- **Persist carefully**: Only persist to localStorage what's necessary (cart, preferences)
- **Clear on logout**: Reset all stores when user logs out
- **Sync across tabs**: Consider using storage events for multi-tab sync

### Performance
- **Use Redis caching**: For frequently accessed, rarely changed data
- **Implement ISR**: For product pages and category pages
- **Optimize images**: Use Next.js Image component with proper sizing
- **Code splitting**: Import heavy components dynamically
- **Debounce searches**: Use useDebounce hook for search inputs

### Security
- **Validate on server**: Never trust client-side validation alone
- **Sanitize inputs**: Prevent XSS and SQL injection
- **Rate limit**: Add rate limiting to API endpoints (especially auth/checkout)
- **Verify webhooks**: Always verify Stripe webhook signatures
- **Protect admin routes**: Implement proper admin authentication
- **Use environment variables**: Never hardcode secrets

## Troubleshooting

### Common Issues

**Database connection errors**
- Verify `PRISMA_DATABASE_URL` and `BETTER_AUTH_DATABASE_URL` are set correctly
- Ensure PostgreSQL is running (check with `docker-compose ps`)
- Run `npx prisma generate` to regenerate Prisma Client

**Redis connection errors**
- Verify `REDIS_URL` is set correctly
- Ensure Redis is running (check with `docker-compose ps`)
- Check if Redis is accepting connections: `redis-cli ping`

**Auth not working**
- Verify `BETTER_AUTH_SECRET` is set and matches across restarts
- Check `BETTER_AUTH_URL` matches your current URL
- Clear browser cookies and try again
- Check that Better Auth tables exist in database

**Refine admin errors**
- Ensure all API endpoints return proper Refine format
- Check that `X-Total-Count` header is set for list endpoints
- Verify the data provider URL is correct
- Check browser console for detailed error messages

**Build errors**
- Run `npm install` to ensure all dependencies are installed
- Clear `.next` folder and rebuild: `rm -rf .next && npm run build`
- Check TypeScript errors: `npx tsc --noEmit`
- Ensure Node.js version is >= 20

**Type errors**
- Run `npx prisma generate` after schema changes
- Restart TypeScript server in your editor
- Check for mismatched types between Prisma schema and code

### Getting Help

- Check the project's README.md and other documentation files
- Review the Prisma schema for database structure
- Look at existing API routes for implementation patterns
- Check the Refine documentation: https://refine.dev
- Review Better Auth docs: https://better-auth.com
