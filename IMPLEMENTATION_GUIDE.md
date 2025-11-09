# Complete Payload to Prisma Migration Guide

## Overview

This guide provides step-by-step instructions for completing the migration from Payload CMS to Prisma ORM. The core infrastructure has been established, and this document details all remaining implementation tasks.

## Completed Work ✅

### Database & Core APIs
- ✅ Prisma schema with all models (Product, Category, Order, User, Review, FAQ, etc.)
- ✅ Products REST API (GET, POST, PUT, DELETE)
- ✅ Categories REST API (GET, POST, PUT, DELETE)
- ✅ Orders REST API (GET)
- ✅ Users REST API (GET, PUT)
- ✅ Order creation API with stock management
- ✅ Stock lock utility updated
- ✅ User addresses API
- ✅ User wishlist sync API
- ✅ User recently viewed API
- ✅ Individual order API
- ✅ Prisma utility cleaned up

## Remaining Implementation

### Step 1: Database Migration

Run these commands to apply the schema:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Or create and run migration (production-ready)
npx prisma migrate dev --name payload_to_prisma_migration

# Verify schema
npx prisma studio
```

### Step 2: Complete Remaining API Routes

#### A. `/api/orders/track/[orderNumber]/route.ts`

Replace payload calls:

```typescript
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  const order = await prisma.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: {
                orderBy: { order: 'asc' },
                take: 1
              }
            }
          }
        }
      }
    }
  })

  // Transform and return
}
```

#### B. `/api/products/search/route.ts`

Replace payload query with Prisma:

```typescript
import { prisma } from '@/lib/prisma'

const where: any = {
  AND: []
}

// Text search
if (q) {
  where.OR = [
    { name: { contains: q, mode: 'insensitive' } },
    { description: { contains: q, mode: 'insensitive' } }
  ]
}

// Category filter
if (categoryId) {
  where.categoryId = categoryId
}

// Price range
if (minPrice !== undefined) {
  where.price = { ...where.price, gte: minPrice }
}
if (maxPrice !== undefined) {
  where.price = { ...where.price, lte: maxPrice }
}

// In stock filter
if (inStock) {
  where.stock = { gt: 0 }
}

// On sale filter
if (onSale) {
  where.onSale = true
}

const [products, totalCount] = await Promise.all([
  prisma.product.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortMap[sort] || { createdAt: 'desc' },
    include: {
      category: true,
      images: { orderBy: { order: 'asc' } },
      tags: { include: { tag: true } }
    }
  }),
  prisma.product.count({ where })
])
```

#### C. `/api/products/[slug]/reviews/route.ts`

This is complex with multiple operations:

**GET Reviews:**
```typescript
// 1. Get product
const product = await prisma.product.findUnique({
  where: { slug: params.slug }
})

// 2. Get reviews
const reviews = await prisma.review.findMany({
  where: {
    productId: product.id,
    status: 'APPROVED'
  },
  include: {
    user: {
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    }
  },
  orderBy,
  skip,
  take
})

// 3. Get rating distribution
const distribution = await prisma.review.groupBy({
  by: ['rating'],
  where: { productId: product.id, status: 'APPROVED' },
  _count: true
})
```

**POST Review:**
```typescript
// 1. Verify purchase
const order = await prisma.order.findFirst({
  where: {
    userId,
    paymentStatus: 'PAID',
    items: {
      some: {
        productId: product.id
      }
    }
  }
})

const verified = !!order

// 2. Create review
const review = await prisma.review.create({
  data: {
    productId: product.id,
    userId,
    userName: `${user.firstName} ${user.lastName}`.trim() || 'Anonymous',
    userAvatar: null,
    rating,
    title,
    comment,
    images: images || [],
    verified,
    status: 'PENDING'
  }
})

// 3. Update product rating
const { _avg, _count } = await prisma.review.aggregate({
  where: { productId: product.id, status: 'APPROVED' },
  _avg: { rating: true },
  _count: true
})

await prisma.product.update({
  where: { id: product.id },
  data: {
    rating: _avg.rating || 0,
    reviewCount: _count
  }
})
```

#### D. `/api/search/route.ts` & `/api/search/suggestions/route.ts`

```typescript
// Products
const products = await prisma.product.findMany({
  where: {
    OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ]
  },
  include: { category: true, images: true },
  take: limit
})

// Categories
const categories = await prisma.category.findMany({
  where: {
    name: { contains: q, mode: 'insensitive' }
  },
  take: 10
})

// Tags/Brands
const tags = await prisma.tag.findMany({
  where: {
    name: { contains: q, mode: 'insensitive' }
  },
  take: 10
})
```

#### E. `/api/checkout/create-payment-intent/route.ts`

```typescript
for (const item of items) {
  const product = await prisma.product.findUnique({
    where: { id: item.productId },
    select: { price: true, stock: true }
  })

  if (!product) {
    throw new Error(`Product ${item.productId} not found`)
  }

  if (product.stock < item.quantity) {
    throw new Error(`Insufficient stock for product ${item.productId}`)
  }

  subtotal += product.price * item.quantity * 100 // Convert to cents
}
```

#### F. `/api/checkout/shipping-options/route.ts`

```typescript
for (const item of items) {
  const product = await prisma.product.findUnique({
    where: { id: item.productId },
    select: { price: true }
  })

  if (product) {
    subtotal += product.price * item.quantity
  }
}
```

### Step 3: Update Frontend Pages

#### A. `src/app/(app)/products/page.tsx`

```typescript
import { prisma } from '@/lib/prisma'

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'ACTIVE' },
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        images: { orderBy: { order: 'asc' } },
        variants: true,
        tags: { include: { tag: true } }
      }
    }),
    prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { products: true } }
      }
    })
  ])

  // Transform and pass to client component
  const transformedProducts = products.map(p => ({
    ...p,
    category: {
      ...p.category,
      productCount: 0 // Will be filled from categories
    },
    images: p.images.map(img => ({
      url: img.url,
      alt: img.alt,
      type: img.type === 'THREE_SIXTY' ? '360' : img.type.toLowerCase() as any
    })),
    tags: p.tags.map(pt => pt.tag)
  }))

  return <ProductsPageClient products={transformedProducts} categories={categories} />
}
```

#### B. `src/app/(app)/products/[slug]/page.tsx`

```typescript
import { prisma } from '@/lib/prisma'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: {
      name: true,
      description: true,
      seo: true,
      images: { take: 1 }
    }
  })

  return {
    title: product?.seo?.title || product?.name,
    description: product?.seo?.description || product?.description
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      images: { orderBy: { order: 'asc' } },
      variants: true,
      tags: { include: { tag: true } }
    }
  })

  if (!product) notFound()

  // Transform and render
}
```

#### C. `src/app/(app)/search/page.tsx`

Similar pattern to products search API

#### D. `src/app/(app)/account/page.tsx`

```typescript
const orders = await prisma.order.findMany({
  where: { userId: session.user.id },
  take: 10,
  orderBy: { createdAt: 'desc' },
  include: {
    items: {
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    }
  }
})
```

#### E. `src/app/(app)/faq/page.tsx`

```typescript
const faqs = await prisma.fAQ.findMany({
  take: 100,
  orderBy: { order: 'asc' }
})
```

### Step 4: Create Admin CRUD Pages

All admin pages use Refine hooks with Ant Design components.

#### Template: Product Create Page

```typescript
'use client'

import { useForm } from '@refinedev/antd'
import { Form, Input, InputNumber, Select, Upload, Switch, Button } from 'antd'

export default function ProductCreate() {
  const { formProps, saveButtonProps } = useForm({
    action: 'create',
    resource: 'products'
  })

  return (
    <Form {...formProps} layout="vertical">
      <Form.Item label="Name" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Slug" name="slug" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Price" name="price" rules={[{ required: true }]}>
        <InputNumber min={0} step={0.01} />
      </Form.Item>
      <Form.Item label="Stock" name="stock" rules={[{ required: true }]}>
        <InputNumber min={0} />
      </Form.Item>
      {/* Add more fields */}
      <Button {...saveButtonProps}>Save</Button>
    </Form>
  )
}
```

Required pages:
- `/admin/products/create/page.tsx`
- `/admin/products/edit/[id]/page.tsx`
- `/admin/categories/create/page.tsx`
- `/admin/categories/edit/[id]/page.tsx`
- `/admin/categories/show/[id]/page.tsx`
- `/admin/orders/show/[id]/page.tsx`
- `/admin/users/page.tsx`
- `/admin/users/show/[id]/page.tsx`

### Step 5: Configuration Updates

#### A. `package.json`

Remove Payload dependencies (if any exist):
```json
{
  "dependencies": {
    // Remove: "payload", "@payloadcms/*"
  },
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  }
}
```

#### B. `.env.example`

```env
# Database
PRISMA_DATABASE_URL="postgresql://user:pass@localhost:5432/dbname?schema=app"

# Better Auth
BETTER_AUTH_DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
BETTER_AUTH_SECRET="your-secret-here"

# Redis
REDIS_URL="redis://localhost:6379"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Resend
RESEND_API_KEY="re_..."

# App
NEXT_PUBLIC_SERVER_URL="http://localhost:3000"
REVALIDATION_SECRET="your-secret-here"

# Remove: PAYLOAD_SECRET
```

#### C. `README.md`

Update tech stack section:
```markdown
## Tech Stack

- **Next.js 15** - React framework with App Router
- **Prisma** - Type-safe ORM for database access
- **PostgreSQL** - Primary database
- **Refine** - Admin panel framework
- **Better Auth** - Authentication
- **Stripe** - Payments
- **Redis** - Caching and locks
- **Resend** - Email delivery
```

Add setup section:
```markdown
## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in values
3. Generate Prisma client: `npm run prisma:generate`
4. Push database schema: `npm run db:push`
5. Run development server: `npm run dev`
6. Access admin panel at `/admin`
```

#### D. Delete Files

- `src/payload/payload-types.ts` (if exists)
- Any `payload.config.ts` file
- Update `tsconfig.json` to remove payload.config from includes

### Step 6: Testing Checklist

Run through these scenarios:

**Admin Panel:**
- [ ] List all products with pagination
- [ ] Create new product with images and variants
- [ ] Edit existing product
- [ ] Delete product (verify soft delete for products with orders)
- [ ] List categories with product counts
- [ ] Create/edit/delete categories
- [ ] View orders with details
- [ ] List users with stats

**Frontend:**
- [ ] Browse products page with filters
- [ ] View product details with images and variants
- [ ] Add to cart
- [ ] Checkout flow creates Stripe session
- [ ] Complete payment creates order
- [ ] Order appears in account page
- [ ] Search products and categories
- [ ] Leave product review (after purchase)
- [ ] Save addresses
- [ ] Sync wishlist

**API:**
- [ ] Product search with filters works
- [ ] Review creation with purchase verification
- [ ] Stock management prevents overselling
- [ ] User stats update after orders

### Step 7: Data Migration (If Needed)

If you have existing Payload data to migrate:

```typescript
// scripts/migrate-data.ts
import { PrismaClient } from '@prisma/client'
// Import old Payload data

const prisma = new PrismaClient()

async function migrate() {
  // Example: Migrate products
  for (const oldProduct of oldProducts) {
    await prisma.product.create({
      data: {
        name: oldProduct.name,
        slug: oldProduct.slug,
        // ... map all fields
        category: {
          connect: { id: categoryIdMap[oldProduct.category] }
        },
        images: {
          create: oldProduct.images.map((img, i) => ({
            url: img.url,
            alt: img.alt,
            type: 'IMAGE',
            order: i
          }))
        }
      }
    })
  }
}

migrate().then(() => console.log('Done'))
```

Run: `npx tsx scripts/migrate-data.ts`

## Common Issues & Solutions

### Issue: Prisma Client Not Found
**Solution:** Run `npx prisma generate`

### Issue: Database Schema Mismatch
**Solution:** Run `npx prisma db push` or `npx prisma migrate dev`

### Issue: Type Errors in API Routes
**Solution:** Ensure Prisma client is generated and imported correctly

### Issue: Admin Panel Not Showing Data
**Solution:** Check that API routes return `X-Total-Count` header

### Issue: Order Creation Fails
**Solution:** Verify Product model has all required fields (productName, productImage in OrderItem)

## Performance Optimization

After migration:

1. **Add Database Indexes** (already in schema):
   - Product: slug, categoryId, status, createdAt
   - Order: orderNumber, userId, status, createdAt
   - Category: slug, isActive

2. **Implement Redis Caching** for frequently accessed data:
   ```typescript
   import { redis, getCachedData } from '@/lib/redis'

   const products = await getCachedData(
     'featured-products',
     () => prisma.product.findMany({ where: { featured: true } }),
     300 // 5 minutes
   )
   ```

3. **Use Prisma Select** to fetch only needed fields:
   ```typescript
   const products = await prisma.product.findMany({
     select: {
       id: true,
       name: true,
       price: true,
       images: {
         select: { url: true },
         take: 1
       }
     }
   })
   ```

## Next Steps

1. Run database migration
2. Complete remaining API routes
3. Update frontend pages
4. Create admin CRUD pages
5. Test all functionality
6. Deploy to production

For questions, refer to:
- Prisma Docs: https://www.prisma.io/docs
- Refine Docs: https://refine.dev/docs
- Next.js Docs: https://nextjs.org/docs
