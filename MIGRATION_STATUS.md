# Prisma Migration Status

## Completed Changes

### 1. Database Schema ✅
- **File**: `prisma/schema.prisma`
- **Status**: COMPLETE
- **Changes**: Added all required models (Product, Category, Order, OrderItem, User, Review, FAQ, Tag, ProductImage, ProductVariant, Media) with proper relations, indexes, and enums

### 2. Core REST API Endpoints ✅
- **File**: `src/app/api/products/route.ts` - COMPLETE (GET with pagination/filtering/sorting, POST for creation)
- **File**: `src/app/api/products/[id]/route.ts` - COMPLETE (GET, PUT, DELETE)
- **File**: `src/app/api/categories/route.ts` - COMPLETE (GET with pagination/filtering/sorting, POST)
- **File**: `src/app/api/categories/[id]/route.ts` - COMPLETE (GET, PUT, DELETE)
- **File**: `src/app/api/orders/route.ts` - COMPLETE (GET with pagination/filtering/sorting)
- **File**: `src/app/api/users/route.ts` - COMPLETE (GET with pagination/filtering/sorting)
- **File**: `src/app/api/users/[id]/route.ts` - COMPLETE (GET, PUT)

### 3. Utilities ✅
- **File**: `src/lib/prisma.ts` - COMPLETE (cleaned up, exports Prisma types)
- **File**: `src/lib/stock-lock.ts` - COMPLETE (`decrementStockAtomic` updated to use Prisma)

### 4. Order Creation ✅
- **File**: `src/app/api/orders/create/route.ts` - COMPLETE (uses Prisma for product fetching, order creation, user stats update)

## Remaining Changes Required

### High Priority API Routes

#### 1. `/api/orders/[id]/route.ts` ⚠️
**Current**: Uses `payload.findByID()`
**Required**:
```typescript
const order = await prisma.order.findUnique({
  where: { id: params.id },
  include: {
    items: {
      include: {
        product: true
      }
    }
  }
})
```

#### 2. `/api/orders/track/[orderNumber]/route.ts` ⚠️
**Current**: Uses `payload.find()` with orderNumber filter
**Required**:
```typescript
const order = await prisma.order.findUnique({
  where: { orderNumber: params.orderNumber },
  include: {
    items: {
      include: {
        product: true
      }
    }
  }
})
```

#### 3. `/api/products/search/route.ts` ⚠️
**Current**: Uses `payload.find()` with complex where clause
**Required**: Build Prisma where clause with OR/AND conditions
```typescript
const products = await prisma.product.findMany({
  where: {
    OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ],
    AND: [
      categoryId ? { categoryId } : {},
      minPrice ? { price: { gte: minPrice } } : {},
      maxPrice ? { price: { lte: maxPrice } } : {}
    ]
  },
  include: { category: true, images: true, tags: { include: { tag: true } } }
})
```

#### 4. `/api/products/[slug]/reviews/route.ts` ⚠️
**Current**: Uses multiple `payload.find()` calls
**Required**:
- Product lookup: `prisma.product.findUnique({ where: { slug } })`
- Reviews fetch: `prisma.review.findMany({ where: { productId }, include: { user: true } })`
- Review creation: `prisma.review.create({ data: { ... } })`
- Order verification: `prisma.order.findFirst({ where: { userId, items: { some: { productId } } } })`

#### 5. `/api/search/route.ts` ⚠️
**Current**: Uses `payload.find()` for products and tags
**Required**:
```typescript
const products = await prisma.product.findMany({
  where: {
    OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ]
  },
  include: { category: true, images: true }
})
```

#### 6. `/api/search/suggestions/route.ts` ⚠️
**Current**: Uses `payload.find()` for products and categories
**Required**: Same as above but with `select` for specific fields

#### 7. `/api/checkout/create-payment-intent/route.ts` ⚠️
**Current**: Uses `payload.findByID()` for product price verification
**Required**:
```typescript
const product = await prisma.product.findUnique({
  where: { id: item.productId },
  select: { price: true, stock: true }
})
```

#### 8. `/api/checkout/shipping-options/route.ts` ⚠️
**Current**: Uses `payload.findByID()` for product price
**Required**: Same as above

#### 9. `/api/user/addresses/route.ts` ⚠️
**Current**: Uses `payload.findByID()` and `payload.update()`
**Required**:
```typescript
// GET
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { addresses: true }
})

// PUT
await prisma.user.update({
  where: { id: userId },
  data: { addresses: updatedAddresses }
})
```

#### 10. `/api/user/wishlist/sync/route.ts` ⚠️
**Current**: Uses `payload.update()`
**Required**:
```typescript
await prisma.user.update({
  where: { id: userId },
  data: { wishlist: productIds }
})
```
Note: Schema needs `wishlist String[]` field in User model

#### 11. `/api/user/recently-viewed/route.ts` ⚠️
**Current**: Uses `payload.findByID()` and `payload.update()`
**Required**:
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { recentlyViewed: true }
})

await prisma.user.update({
  where: { id: userId },
  data: { recentlyViewed: updated }
})
```

### Frontend Pages

#### 1. `src/app/(app)/products/page.tsx` ⚠️
**Current**: Uses `payload.find()` for products and categories
**Required**:
```typescript
const [products, categories] = await Promise.all([
  prisma.product.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: { category: true, images: true, variants: true, tags: { include: { tag: true } } }
  }),
  prisma.category.findMany({
    take: 100,
    include: { _count: { select: { products: true } } }
  })
])
```

#### 2. `src/app/(app)/products/[slug]/page.tsx` ⚠️
**Current**: Uses `payload.find()` with slug
**Required**:
```typescript
const product = await prisma.product.findUnique({
  where: { slug },
  include: { category: true, images: true, variants: true, tags: { include: { tag: true } } }
})
```

#### 3. `src/app/(app)/search/page.tsx` ⚠️
**Current**: Uses `payload.find()` for products and categories
**Required**: Same pattern as products search API

#### 4. `src/app/(app)/account/page.tsx` ⚠️
**Current**: Uses `payload.find()` for orders
**Required**:
```typescript
const orders = await prisma.order.findMany({
  where: { userId },
  take: 10,
  orderBy: { createdAt: 'desc' },
  include: { items: { include: { product: true } } }
})
```

#### 5. `src/app/(app)/faq/page.tsx` ⚠️
**Current**: Uses `payload.find()` for FAQs
**Required**:
```typescript
const faqs = await prisma.fAQ.findMany({
  take: 100,
  orderBy: { order: 'asc' }
})
```

### Admin Panel Pages (Refine)

#### 1. `src/app/admin/products/create/page.tsx` 📝 NEW FILE
Use Refine's `useForm` hook from `@refinedev/antd` with Ant Design components.
Form will POST to `/api/products`.

#### 2. `src/app/admin/products/edit/[id]/page.tsx` 📝 NEW FILE
Use Refine's `useForm` hook with id parameter.
Form will PUT to `/api/products/[id]`.

#### 3. `src/app/admin/categories/create/page.tsx` 📝 NEW FILE
Similar to products create.

#### 4. `src/app/admin/categories/edit/[id]/page.tsx` 📝 NEW FILE
Similar to products edit.

#### 5. `src/app/admin/categories/show/[id]/page.tsx` 📝 NEW FILE
Use Refine's `useShow` hook to display category details.

#### 6. `src/app/admin/orders/show/[id]/page.tsx` 📝 NEW FILE
Use Refine's `useShow` and `useUpdate` hooks for order management.

#### 7. `src/app/admin/users/page.tsx` 📝 NEW FILE
Use Refine's `useTable` hook to list users.

#### 8. `src/app/admin/users/show/[id]/page.tsx` 📝 NEW FILE
Use Refine's `useShow` hook to display user details.

### Schema Updates Required

#### User Model
Add missing field:
```prisma
model User {
  // ... existing fields
  wishlist String[] @default([]) // For wishlist functionality
}
```

### Configuration & Documentation

#### 1. `package.json` ⚠️
- Remove Payload CMS dependencies (if any):
  - `payload`
  - `@payloadcms/*`
- Add Prisma scripts:
  ```json
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
  ```

#### 2. `.env.example` ⚠️
Update to reflect Prisma-only architecture:
```env
# Database (Prisma)
PRISMA_DATABASE_URL="postgresql://user:pass@localhost:5432/dbname?schema=app"

# Better Auth
BETTER_AUTH_DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
BETTER_AUTH_SECRET="your-secret-key"

# Remove PAYLOAD_SECRET if present
```

#### 3. `README.md` ⚠️
Update documentation:
- Mention Refine for admin panel instead of Payload
- Update tech stack section
- Add Prisma setup instructions
- Document new admin panel features

#### 4. `tsconfig.json` ⚠️
Remove `payload.config.ts` from include array if present.

#### 5. Delete `src/payload/payload-types.ts` if exists

## Migration Commands

After all code changes:

```bash
# 1. Generate Prisma client with new schema
npm run prisma:generate

# 2. Push schema to database
npm run db:push

# 3. (Optional) Open Prisma Studio to verify
npm run db:studio

# 4. Test the application
npm run dev
```

## Testing Checklist

- [ ] Admin panel: List products, categories, orders, users
- [ ] Admin panel: Create/edit/delete products and categories
- [ ] Frontend: Browse products with filters
- [ ] Frontend: View product details
- [ ] Frontend: Add to cart and checkout
- [ ] Frontend: Create order after payment
- [ ] Frontend: View orders in account page
- [ ] API: Product search works
- [ ] API: Reviews can be created and fetched
- [ ] API: User addresses and wishlist sync

## Notes

- All Prisma queries use proper includes for relations
- All responses are transformed to match frontend TypeScript types
- Refine admin uses X-Total-Count header for pagination
- Stock management uses Redis locks to prevent race conditions
- Order amounts are stored in euros (Float) but calculated in cents during checkout
