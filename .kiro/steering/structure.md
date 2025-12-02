# Project Structure

## Root Directory Layout

```
mientior/
├── src/                    # Application source code
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
├── scripts/                # Utility scripts
├── docs/                   # Documentation
├── .kiro/                  # Kiro configuration
└── .claude/                # Claude agent configurations
```

## Source Directory (`src/`)

### App Router Structure (`src/app/`)

Next.js 15 App Router with route groups:

```
src/app/
├── (app)/                  # Public and authenticated customer pages
│   ├── page.tsx           # Homepage
│   ├── layout.tsx         # Customer layout with header/footer
│   ├── products/          # Product listing and detail pages
│   ├── categories/        # Category browsing
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Multi-step checkout flow
│   ├── account/           # User dashboard (orders, profile)
│   ├── search/            # Global search results
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── forgot-password/   # Password reset request
│   ├── reset-password/    # Password reset form
│   ├── verify-email/      # Email verification
│   └── faq/               # FAQ page
├── admin/                 # Refine admin panel
│   ├── layout.tsx         # Admin layout with sidebar
│   ├── page.tsx           # Admin dashboard
│   ├── products/          # Product management (CRUD)
│   ├── categories/        # Category management (CRUD)
│   ├── orders/            # Order management
│   ├── users/             # User management
│   ├── vendors/           # Vendor management
│   ├── marketing/         # Campaigns and promo codes
│   ├── analytics/         # Analytics dashboard
│   └── settings/          # Admin settings
├── api/                   # API routes (REST endpoints)
│   ├── products/          # Product CRUD
│   ├── categories/        # Category CRUD
│   ├── orders/            # Order management
│   ├── checkout/          # Checkout and payment
│   ├── auth/              # Authentication endpoints
│   ├── user/              # User profile and preferences
│   ├── admin/             # Admin-specific endpoints
│   ├── webhooks/          # Payment gateway webhooks
│   └── search/            # Search functionality
├── layout.tsx             # Root layout
├── providers.tsx          # Global providers (React Query, etc.)
└── globals.css            # Global styles and Tailwind imports
```

### Components (`src/components/`)

Organized by feature/domain:

```
src/components/
├── ui/                    # shadcn/ui base components (27+)
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
├── layout/                # Layout components
│   ├── header.tsx
│   ├── footer.tsx
│   └── mobile-nav.tsx
├── home/                  # Homepage sections
│   ├── hero-section.tsx
│   ├── featured-products.tsx
│   └── categories-nav.tsx
├── products/              # Product-related components
│   ├── product-card.tsx
│   ├── product-gallery.tsx
│   ├── product-info.tsx
│   └── product-tabs.tsx
├── category/              # Category page components
│   ├── filters-sidebar.tsx
│   ├── products-grid.tsx
│   └── products-toolbar.tsx
├── cart/                  # Cart components
│   ├── cart-item.tsx
│   ├── cart-summary.tsx
│   └── cart-recommendations.tsx
├── checkout/              # Checkout flow components
│   ├── progress-stepper.tsx
│   ├── shipping-form.tsx
│   ├── payment-form.tsx
│   └── order-summary.tsx
├── account/               # User account components
│   ├── account-sidebar.tsx
│   ├── dashboard-overview.tsx
│   └── orders-list.tsx
├── auth/                  # Authentication components
│   ├── auth-form.tsx
│   ├── password-strength-indicator.tsx
│   ├── forgot-password-form.tsx
│   └── reset-password-form.tsx
├── admin/                 # Admin panel components
│   ├── admin-sidebar.tsx
│   ├── admin-header.tsx
│   ├── dashboard-stats.tsx
│   └── rich-text-editor.tsx
├── search/                # Search components
│   ├── search-bar.tsx
│   └── search-results.tsx
└── support/               # Support components
    └── faq-section.tsx
```

### Library Code (`src/lib/`)

Core utilities and configurations:

```
src/lib/
├── prisma.ts              # Prisma client singleton
├── redis.ts               # Redis client and helpers
├── auth.ts                # Better Auth configuration
├── auth-server.ts         # Server-side auth utilities
├── auth-client.ts         # Client-side auth utilities
├── auth-rate-limit.ts     # Rate limiting for auth
├── email.ts               # Email sending (Resend)
├── paystack.ts            # Paystack payment integration
├── flutterwave.ts         # Flutterwave payment integration
├── payment-utils.ts       # Payment helper functions
├── stock-lock.ts          # Distributed stock locking (Redis)
├── utils.ts               # General utilities (cn, formatPrice, etc.)
├── constants.ts           # App-wide constants
├── rbac.ts                # Role-based access control
├── permissions.ts         # Permission definitions
├── audit-logger.ts        # Audit log utilities
├── verification-token.ts  # Email verification tokens
├── password-validation.ts # Password strength validation
├── password-history.ts    # Password history tracking
└── login-metadata.ts      # Login tracking (IP, device, etc.)
```

### State Management (`src/stores/`)

Zustand stores for client state:

```
src/stores/
├── cart.store.ts          # Shopping cart (localStorage persistence)
├── wishlist.store.ts      # Wishlist management
├── preferences.store.ts   # User preferences (theme, language)
├── notifications.store.ts # In-app notifications
└── comparator.store.ts    # Product comparison
```

### Custom Hooks (`src/hooks/`)

Reusable React hooks:

```
src/hooks/
├── use-auth.ts            # Authentication hook
├── use-cart-analytics.ts  # Cart event tracking
├── use-debounce.ts        # Debounce values
├── use-media-query.ts     # Responsive breakpoints
├── use-local-storage.ts   # localStorage wrapper
├── use-toast.ts           # Toast notifications
└── use-intersection-observer.ts  # Lazy loading
```

### Type Definitions (`src/types/`)

TypeScript type definitions:

```
src/types/
├── index.ts               # Main type exports
├── prisma.d.ts            # Prisma type extensions
├── paystack.d.ts          # Paystack type definitions
└── flutterwave-node-v3.d.ts  # Flutterwave types
```

## Database (`prisma/`)

```
prisma/
├── schema.prisma          # Database schema (26 models)
├── migrations/            # Migration history
│   └── [timestamp]_[name]/
│       └── migration.sql
├── seed.ts                # Database seeding script
└── seed-admin.ts          # Admin user creation
```

## Public Assets (`public/`)

```
public/
├── images/                # Static images
├── icons/                 # SVG icons (payment gateways)
├── locales/               # i18n translation files
│   ├── en/
│   │   ├── common.json
│   │   └── admin.json
│   └── fr/
│       ├── common.json
│       └── admin.json
└── robots.txt
```

## Naming Conventions

### Files

- **Components**: PascalCase with `.tsx` extension (e.g., `ProductCard.tsx`)
- **Utilities**: kebab-case with `.ts` extension (e.g., `auth-server.ts`)
- **Pages**: kebab-case with `.tsx` extension (e.g., `forgot-password/page.tsx`)
- **API routes**: kebab-case with `route.ts` (e.g., `api/products/route.ts`)
- **Tests**: Same name as file with `.test.ts` suffix (e.g., `auth-server.test.ts`)

### Code

- **Components**: PascalCase (e.g., `ProductCard`)
- **Functions**: camelCase (e.g., `formatPrice`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `FREE_SHIPPING_THRESHOLD`)
- **Types/Interfaces**: PascalCase (e.g., `Product`, `OrderStatus`)
- **Enums**: PascalCase (e.g., `ProductStatus`)

## Import Order Convention

Follow this order for imports:

1. React and Next.js imports
2. Third-party libraries
3. Internal utilities (`@/lib/*`)
4. Internal components (`@/components/*`)
5. Internal types (`@/types/*`)
6. Internal stores (`@/stores/*`)
7. Relative imports
8. CSS imports

Example:
```typescript
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Product } from '@/types'
import { useCartStore } from '@/stores/cart.store'

import './styles.css'
```

## API Route Structure

API routes follow RESTful conventions:

- `GET /api/resource` - List resources
- `POST /api/resource` - Create resource
- `GET /api/resource/[id]` - Get single resource
- `PUT /api/resource/[id]` - Update resource
- `DELETE /api/resource/[id]` - Delete resource

All API routes return JSON and use standard HTTP status codes.

## Component Patterns

### Server Components (Default)

Use for data fetching and static content:

```typescript
// No 'use client' directive
export default async function ProductPage({ params }: Props) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug }
  })
  return <ProductDetail product={product} />
}
```

### Client Components

Use for interactivity, hooks, and browser APIs:

```typescript
'use client'

export function AddToCartButton({ productId }: Props) {
  const addItem = useCartStore(state => state.addItem)
  return <Button onClick={() => addItem(productId)}>Add to Cart</Button>
}
```

## Database Access Patterns

- Always use Prisma Client from `@/lib/prisma`
- Use transactions for multi-step operations
- Include relations with `include` when needed
- Use `select` to limit returned fields for performance
- Add indexes for frequently queried fields

## Authentication Patterns

- Use `getSession()` from `@/lib/auth-server` in Server Components
- Use `useAuth()` hook in Client Components
- Protect API routes with auth middleware
- Check permissions with RBAC utilities from `@/lib/rbac`
