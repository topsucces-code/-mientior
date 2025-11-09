# Mientior - Premium E-commerce Platform

Modern Next.js e-commerce store with Prisma database, Refine admin panel, Stripe payments, and full-stack TypeScript. Features product catalog, search, cart/checkout, user accounts, and admin CRUD.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Ant Design (admin)
- **Admin Panel:** Refine with @refinedev/antd, simple-rest data provider (/api endpoints)
- **Database:** Prisma ORM (PostgreSQL) - models for Product, Category, Order, User, Review, etc.
- **Auth:** Better Auth (sessions, RBAC)
- **Payments:** Stripe (Payment Intents, webhooks)
- **Other:** Redis (stock locks, caching), Resend (emails), Zod (validation)

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

## Admin Panel

Access at `/admin`. Resources: products, categories, orders, users. Uses Refine hooks (useTable/useForm) + Antd. Auth via Better Auth provider in layout.tsx. Custom data provider points to /api endpoints.

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
