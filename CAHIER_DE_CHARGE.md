# CAHIER DE CHARGE - MIENTIOR E-COMMERCE MARKETPLACE

**Date**: 18 novembre 2025
**Version**: 2.0 (Analyse complète du codebase)
**Statut**: 65% complété

---

## 📋 TABLE DES MATIÈRES

1. [Présentation du Projet](#présentation-du-projet)
2. [Architecture Technique](#architecture-technique)
3. [Pages et Routes](#pages-et-routes)
4. [API Endpoints](#api-endpoints)
5. [Base de Données](#base-de-données)
6. [Fonctionnalités Implémentées](#fonctionnalités-implémentées)
7. [Fonctionnalités Manquantes](#fonctionnalités-manquantes)
8. [Stack Technique](#stack-technique)
9. [Sécurité](#sécurité)
10. [Performance](#performance)
11. [Variables d'Environnement](#variables-denvironnement)

---

## PRÉSENTATION DU PROJET

### Vue d'ensemble

**Mientior** est une plateforme e-commerce marketplace de niveau entreprise construite avec les technologies modernes :

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript 5.3, Tailwind CSS 3.4
- **Admin Panel**: Refine 5.0 + Ant Design 5.28
- **Backend**: Prisma ORM 6.19 + PostgreSQL
- **Authentication**: Better Auth 1.0
- **Paiements**: Paystack + Flutterwave (+ Stripe installé mais non utilisé)
- **Cache**: Redis (ioredis 5.3)
- **Email**: Resend 1.0
- **State Management**: Zustand 4.5 + React Query 5.0

### Statut actuel (Novembre 2025)

**Score global: 65/100**

| Domaine | Score | Statut |
|---------|-------|--------|
| Core Commerce | 85% | ✅ Production-Ready |
| Admin Panel | 60% | 🟡 CRUD manquants |
| Authentication | 30% | 🔴 Aucune UI |
| Payment Gateway | 90% | ✅ Excellent |
| Database Design | 95% | ✅ Professionnel |
| Code Quality | 75% | 🟡 Bon mais sans tests |

### Objectifs métier

1. **Vente en ligne performante** avec parcours d'achat fluide
2. **Gestion centralisée** via panel admin Refine
3. **Expérience utilisateur premium** (UX moderne, responsive)
4. **Fidélisation client** (système de points de fidélité 4 tiers)
5. **Support multi-vendor** (marketplace ready)
6. **Optimisation conversions** (gamification, promos, reviews)

### Objectifs techniques

1. **Performance**: Lighthouse > 90
2. **SEO**: SSR, métadonnées dynamiques, structured data
3. **Sécurité**: Better Auth, PCI compliant (Paystack/Flutterwave), rate limiting
4. **Scalabilité**: Architecture modulaire, Redis caching, database optimization
5. **Maintenabilité**: TypeScript strict, code documenté, tests

---

## ARCHITECTURE TECHNIQUE

### Structure du projet

```
mientior/
├── src/
│   ├── app/
│   │   ├── (app)/          # Public & authenticated pages
│   │   │   ├── page.tsx    # Homepage
│   │   │   ├── products/   # Product listing & detail
│   │   │   ├── cart/       # Shopping cart
│   │   │   ├── checkout/   # Checkout flow (3 steps)
│   │   │   ├── account/    # User dashboard
│   │   │   ├── search/     # Global search
│   │   │   └── faq/        # FAQ page
│   │   ├── admin/          # Refine admin panel
│   │   │   ├── products/   # Product management (CRUD)
│   │   │   ├── categories/ # Category management (CRUD)
│   │   │   ├── orders/     # Order management (Read-only)
│   │   │   ├── users/      # User management
│   │   │   ├── vendors/    # Vendor management (List/Show only)
│   │   │   └── marketing/  # Campaigns & promo codes
│   │   └── api/            # REST API endpoints (75 routes)
│   ├── components/         # React components (80+, ~12,344 lignes)
│   │   ├── layout/         # Header, Footer, Mobile Nav
│   │   ├── home/           # Homepage sections
│   │   ├── products/       # Product card, gallery, tabs
│   │   ├── checkout/       # Checkout forms, stepper
│   │   └── ui/             # shadcn/ui components (27+)
│   ├── lib/                # Core utilities
│   │   ├── auth.ts         # Better Auth config
│   │   ├── prisma.ts       # Prisma client
│   │   ├── redis.ts        # Redis helper
│   │   ├── stripe.ts       # Stripe (placeholder)
│   │   └── email.ts        # Resend integration
│   ├── stores/             # Zustand stores (5)
│   │   ├── cart.store.ts   # Cart (216 lignes, localStorage)
│   │   ├── wishlist.store.ts
│   │   ├── preferences.store.ts
│   │   ├── notifications.store.ts
│   │   └── comparator.store.ts
│   ├── hooks/              # Custom React hooks (10+)
│   └── types/              # TypeScript definitions
├── prisma/
│   └── schema.prisma       # Database schema (26 models)
├── public/
└── package.json            # 134 dependencies
```

### Flux de données

```
┌──────────────┐
│   Browser    │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Next.js 15 App Router (SSR/RSC)    │
│  - Server Components (fetch data)   │
│  - Client Components (interactivity)│
└──────┬───────────────────────────────┘
       │
       ├──► Zustand Stores (Client State)
       │    └─ cart, wishlist, preferences
       │
       ├──► React Query (Server State Cache)
       │
       ▼
┌──────────────────────────────────────┐
│   API Routes (/api/*)                │
│   - 75 endpoints fonctionnels        │
│   - RESTful architecture             │
└──────┬───────────────────────────────┘
       │
       ├──► Prisma ORM
       │    └─ PostgreSQL (26 models)
       │
       ├──► Redis Cache
       │    └─ Sessions, cart locks, cache
       │
       ├──► Paystack/Flutterwave APIs
       │    └─ Payment processing
       │
       └──► Resend
            └─ Transactional emails
```

---

## PAGES ET ROUTES

### Pages Publiques (9 pages)

| Route | Fichier | Statut | Description |
|-------|---------|--------|-------------|
| `/` | `(app)/page.tsx` | ✅ Complet | Homepage avec hero, categories, flash deals, featured products |
| `/products` | `(app)/products/page.tsx` | ✅ Complet | Product listing avec filtres, tri, pagination |
| `/products/[slug]` | `(app)/products/[slug]/page.tsx` | ✅ Complet | Product detail page (PDP) avec variants, reviews |
| `/categories/[slug]` | `(app)/categories/[slug]/page.tsx` | ✅ Complet | Category browsing page |
| `/cart` | `(app)/cart/page.tsx` | ✅ Complet | Shopping cart |
| `/search` | `(app)/search/page.tsx` | ✅ Complet | Global search results |
| `/faq` | `(app)/faq/page.tsx` | ✅ Complet | FAQ page |
| `/design-showcase` | `(app)/design-showcase/page.tsx` | ✅ Complet | Design system showcase |

### Pages Authentifiées (3 pages)

| Route | Fichier | Statut | Description |
|-------|---------|--------|-------------|
| `/account` | `(app)/account/page.tsx` | 🟡 Partiel | User dashboard (données mock) |
| `/checkout` | `(app)/checkout/page.tsx` | ✅ Complet | Multi-step checkout |
| `/checkout/confirmation/[orderId]` | `(app)/checkout/confirmation/[orderId]/page.tsx` | ✅ Complet | Order confirmation |

### Pages Manquantes ❌

- `/login` - **BLOQUEUR CRITIQUE**
- `/register` - **BLOQUEUR CRITIQUE**
- `/forgot-password` - **BLOQUEUR CRITIQUE**
- `/reset-password` - **BLOQUEUR CRITIQUE**
- `/wishlist` - Dedicated wishlist page
- `/products/compare` - Product comparison
- `/track-order` - Order tracking standalone

### Admin Panel (20 resources)

#### Ressources Complètes (CRUD complet) ✅

| Resource | List | Create | Edit | Show | Delete |
|----------|------|--------|------|------|--------|
| Products | ✅ | ✅ | ✅ | ✅ | ✅ |
| Categories | ✅ | ✅ | ✅ | ✅ | ✅ |
| Orders | ✅ | ❌ | ✅ | ✅ | ❌ |
| Users | ✅ | ❌ | ❌ | ✅ | ❌ |
| Audit Logs | ✅ | - | - | ✅ | - |

#### Ressources Partielles 🟡

| Resource | List | Create | Edit | Show | Delete | Manquant |
|----------|------|--------|------|------|--------|----------|
| Vendors | ✅ | ❌ | ❌ | ✅ | ❌ | Create/Edit/Delete |
| Campaigns | ✅ | ✅ | ❌ | ❌ | ❌ | Edit/Show/Send |
| Promo Codes | ✅ | ❌ | ❌ | ❌ | ❌ | Create/Edit/Show |
| Admin Users | ✅ | ❌ | ❌ | ❌ | ❌ | All CRUD |
| Roles | ✅ | ❌ | ❌ | ❌ | ❌ | All CRUD |
| Feature Flags | ✅ | ❌ | ❌ | ❌ | ❌ | Toggle functionality |

#### Ressources Manquantes ❌

- **Media Library** - Aucune page
- **Customer Segments** - Aucune page
- **Email Templates** - Aucune page
- **Analytics Funnels** - API existe, pas de UI

---

## API ENDPOINTS

### Inventaire (75 endpoints fonctionnels)

#### Products API ✅

```
GET    /api/products              # List with pagination/filters
POST   /api/products              # Create product
GET    /api/products/[id]         # Get product by ID
PUT    /api/products/[id]         # Update product
DELETE /api/products/[id]         # Delete product
GET    /api/products/search       # Search products
GET    /api/products/[id]/bundle  # Bundle products lookup
GET    /api/public/products       # Public product listing
```

#### Categories API ✅

```
GET    /api/categories            # List categories (hierarchical)
POST   /api/categories            # Create category
GET    /api/categories/[id]       # Get category by ID
PUT    /api/categories/[id]       # Update category
DELETE /api/categories/[id]       # Delete category
```

#### Orders API ✅

```
GET    /api/orders                # List orders with filters
POST   /api/orders/create         # Create order after payment
POST   /api/orders/initialize     # Initialize provisional order
POST   /api/orders/[id]/complete  # Complete order
GET    /api/orders/[id]           # Get order by ID
PUT    /api/orders/[id]           # Update order status
DELETE /api/orders/[id]           # Delete order (admin only)
GET    /api/orders/track/[orderNumber]  # Track order
```

#### Checkout & Payment API ✅

```
POST   /api/checkout/initialize-payment    # Init Paystack/Flutterwave
POST   /api/checkout/apply-coupon          # Apply promo code
GET    /api/checkout/shipping-options      # Calculate shipping (MOCK DATA)
POST   /api/checkout/validate-address      # Validate French addresses
GET    /api/checkout/cities                # French cities autocomplete
GET    /api/checkout/relay-points          # Relay point locations
POST   /api/checkout/apple-pay/*           # Apple Pay integration
POST   /api/checkout/google-pay/*          # Google Pay integration
POST   /api/checkout/paypal/*              # PayPal integration
```

#### Webhooks ✅

```
POST   /api/webhooks/paystack              # Paystack webhook (signature validation)
POST   /api/webhooks/flutterwave           # Flutterwave webhook
```

#### Users API ✅

```
GET    /api/users                          # List users
POST   /api/users                          # Create user
GET    /api/users/[id]                     # Get user by ID
PUT    /api/users/[id]                     # Update user
DELETE /api/users/[id]                     # Delete user
GET    /api/user/addresses                 # Get user addresses
POST   /api/user/addresses                 # Add address
POST   /api/user/notifications             # User notifications
POST   /api/user/wishlist/sync             # Sync wishlist
POST   /api/user/recently-viewed           # Track recently viewed
```

#### Admin API ✅

```
GET    /api/admin/dashboard/stats          # Dashboard statistics
GET    /api/admin/dashboard/charts         # Chart data
GET    /api/admin/dashboard/alerts         # Low stock alerts
GET    /api/admin/audit-logs               # Audit trail
GET    /api/admin/export                   # Data export (CSV/Excel)
POST   /api/admin/import                   # Bulk import
GET    /api/admin/feature-flags            # Feature flags list
POST   /api/admin/feature-flags            # Create feature flag
GET    /api/admin/roles                    # Roles list
POST   /api/admin/roles                    # Create role
GET    /api/admin/saved-views              # Saved admin views
POST   /api/admin/saved-views              # Create saved view
GET    /api/admin/notifications            # Admin notifications
POST   /api/admin/check-permission         # Permission validation
```

#### Vendors API 🟡

```
GET    /api/vendors                        # List vendors
POST   /api/vendors                        # Create vendor
GET    /api/vendors/[id]                   # Get vendor
PUT    /api/vendors/[id]                   # Update vendor
DELETE /api/vendors/[id]                   # Delete vendor
```

#### Marketing API 🟡

```
GET    /api/campaigns                      # List campaigns
POST   /api/campaigns                      # Create campaign
POST   /api/campaigns/[id]/send            # Send campaign (INCOMPLETE)
GET    /api/promo-codes                    # List promo codes
POST   /api/promo-codes                    # Create promo code
POST   /api/promo/validate                 # Validate promo (PARTIAL)
GET    /api/promo/banners                  # Promo banners
```

#### Search & Discovery ✅

```
GET    /api/search                         # Global search
GET    /api/search/suggestions             # Autocomplete
GET    /api/search/trending                # Trending searches
POST   /api/search/visual                  # Visual search (PLACEHOLDER)
```

#### Miscellaneous ✅

```
GET    /api/tags                           # Product tags
POST   /api/tags                           # Create tag
GET    /api/reviews/products/[slug]/reviews  # Product reviews
POST   /api/cart/recommendations           # Cart recommendations
POST   /api/newsletter                     # Newsletter subscription
GET    /api/instagram                      # Instagram feed
POST   /api/revalidate                     # ISR cache revalidation
GET    /api/auth/session                   # Session check
```

---

## BASE DE DONNÉES

### Schéma Prisma (26 modèles)

#### E-commerce Core

**Product** (Produit principal)
```prisma
model Product {
  id                String            @id @default(cuid())
  name              String
  slug              String            @unique
  description       String?           @db.Text
  specifications    Json?             // Specs techniques
  price             Int               // Prix en centimes
  compareAtPrice    Int?              // Prix barré
  cost              Int?              // Coût d'achat
  stock             Int               @default(0)
  lowStockThreshold Int               @default(10)
  sku               String?           @unique
  barcode           String?
  weight            Float?            // En kg
  dimensions        Json?             // {length, width, height}
  status            ProductStatus     @default(DRAFT)
  featured          Boolean           @default(false)
  onSale            Boolean           @default(false)
  badge             String?           // "New", "Hot", "Limited"
  rating            Float             @default(0)
  reviewCount       Int               @default(0)
  categoryId        String?
  vendorId          String?
  approvalStatus    ApprovalStatus    @default(PENDING)

  // Relations
  category          Category?         @relation(fields: [categoryId])
  vendor            Vendor?           @relation(fields: [vendorId])
  images            ProductImage[]
  variants          ProductVariant[]
  tags              Tag[]             @relation("ProductTags")
  reviews           Review[]
  orderItems        OrderItem[]

  metadata          Json?             // Custom fields
  seoTitle          String?
  seoDescription    String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@index([slug])
  @@index([categoryId])
  @@index([vendorId])
  @@index([status])
  @@index([featured])
}

enum ProductStatus {
  DRAFT
  ACTIVE
  ARCHIVED
  OUT_OF_STOCK
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}
```

**Category** (Catégories hiérarchiques)
```prisma
model Category {
  id          String       @id @default(cuid())
  name        String
  slug        String       @unique
  description String?      @db.Text
  image       String?
  icon        String?
  order       Int          @default(0)
  isActive    Boolean      @default(true)
  parentId    String?

  // Self-referential relation
  parent      Category?    @relation("CategoryTree", fields: [parentId])
  children    Category[]   @relation("CategoryTree")
  products    Product[]

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([slug])
  @@index([parentId])
}
```

**ProductVariant** (Variants: couleur, taille, etc.)
```prisma
model ProductVariant {
  id          String   @id @default(cuid())
  productId   String
  sku         String   @unique
  name        String   // "Bleu - L"
  size        String?
  color       String?
  colorHex    String?  // #FF5733
  stock       Int      @default(0)
  price       Int?     // Prix différentiel (null = même prix que produit)
  image       String?

  product     Product  @relation(fields: [productId])
  orderItems  OrderItem[]

  @@index([productId])
}
```

**ProductImage**
```prisma
model ProductImage {
  id        String  @id @default(cuid())
  productId String
  url       String
  alt       String?
  order     Int     @default(0)
  type      String  @default("IMAGE") // IMAGE, VIDEO, 360

  product   Product @relation(fields: [productId])

  @@index([productId])
}
```

**Tag**
```prisma
model Tag {
  id        String    @id @default(cuid())
  name      String    @unique
  slug      String    @unique
  products  Product[] @relation("ProductTags")
}
```

**Review** (Avis produits)
```prisma
model Review {
  id             String       @id @default(cuid())
  productId      String
  userId         String
  rating         Int          // 1-5
  title          String?
  comment        String?      @db.Text
  images         String[]     // URLs
  status         ReviewStatus @default(PENDING)
  helpful        Int          @default(0)
  notHelpful     Int          @default(0)
  verified       Boolean      @default(false) // Achat vérifié
  merchantReply  String?      @db.Text

  product        Product      @relation(fields: [productId])
  user           User         @relation(fields: [userId])

  createdAt      DateTime     @default(now())

  @@index([productId])
  @@index([userId])
  @@index([status])
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}
```

#### Order Management

**Order**
```prisma
model Order {
  id                  String        @id @default(cuid())
  orderNumber         String        @unique
  userId              String?
  status              OrderStatus   @default(PENDING)
  paymentStatus       PaymentStatus @default(PENDING)
  paymentGateway      PaymentGateway?
  paymentReference    String?

  // Montants (en centimes)
  subtotal            Int
  tax                 Int
  shipping            Int
  discount            Int           @default(0)
  total               Int

  // Adresses
  shippingAddress     Json          // {name, address, city, postalCode, country, phone}
  billingAddress      Json?

  // Livraison
  shippingMethod      String?
  trackingNumber      String?
  estimatedDeliveryMin DateTime?
  estimatedDeliveryMax DateTime?
  deliveredAt         DateTime?

  // Vendor (marketplace)
  vendorId            String?
  vendorCommission    Int?          // Commission en centimes

  // Relations
  items               OrderItem[]
  user                User?         @relation(fields: [userId])
  vendor              Vendor?       @relation(fields: [vendorId])

  notes               String?       @db.Text
  metadata            Json?

  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  @@index([userId])
  @@index([orderNumber])
  @@index([status])
  @@index([vendorId])
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum PaymentGateway {
  PAYSTACK
  FLUTTERWAVE
  STRIPE
  PAYPAL
}
```

**OrderItem**
```prisma
model OrderItem {
  id        String          @id @default(cuid())
  orderId   String
  productId String
  variantId String?

  // Snapshot au moment de l'achat
  productName   String
  productImage  String?
  productSku    String?
  variantName   String?

  price         Int           // Prix unitaire
  quantity      Int
  total         Int           // price * quantity

  order         Order         @relation(fields: [orderId])
  product       Product       @relation(fields: [productId])
  variant       ProductVariant? @relation(fields: [variantId])

  @@index([orderId])
  @@index([productId])
}
```

**PromoCode** (Codes promo)
```prisma
model PromoCode {
  id                String         @id @default(cuid())
  code              String         @unique
  type              PromoCodeType  // PERCENTAGE, FIXED, FREE_SHIPPING
  value             Int            // Percentage (0-100) ou montant en centimes
  scope             String         @default("CART") // CART, SHIPPING, CATEGORY, PRODUCT

  // Restrictions
  minOrderValue     Int?
  maxUsage          Int?           // Limite globale
  maxUsagePerUser   Int?           @default(1)
  validFrom         DateTime?
  validUntil        DateTime?
  active            Boolean        @default(true)

  // Tracking
  timesUsed         Int            @default(0)
  totalDiscount     Int            @default(0)

  usages            PromoCodeUsage[]

  createdAt         DateTime       @default(now())

  @@index([code])
}

enum PromoCodeType {
  PERCENTAGE
  FIXED
  FREE_SHIPPING
}
```

**PromoCodeUsage**
```prisma
model PromoCodeUsage {
  id          String    @id @default(cuid())
  promoCodeId String
  userId      String
  orderId     String?
  discount    Int       // Montant de la réduction

  promoCode   PromoCode @relation(fields: [promoCodeId])
  user        User      @relation(fields: [userId])

  usedAt      DateTime  @default(now())

  @@index([promoCodeId])
  @@index([userId])
}
```

#### User Management

**User** (Better Auth + Extensions)
```prisma
model User {
  id                String              @id @default(cuid())
  email             String              @unique
  firstName         String?
  lastName          String?
  phone             String?
  emailVerified     Boolean             @default(false)

  // Loyalty Program
  loyaltyPoints     Int                 @default(0)
  loyaltyLevel      LoyaltyLevel        @default(BRONZE)

  // Stats
  totalOrders       Int                 @default(0)
  totalSpent        Int                 @default(0)

  // Preferences
  addresses         SavedAddress[]
  wishlist          Json?               // Array of productIds
  recentlyViewed    Json?               // Array of productIds
  searchHistory     String[]

  // Relations
  orders            Order[]
  reviews           Review[]
  promoUsages       PromoCodeUsage[]

  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([email])
}

enum LoyaltyLevel {
  BRONZE
  SILVER
  GOLD
  PLATINUM
}
```

**SavedAddress**
```prisma
model SavedAddress {
  id         String   @id @default(cuid())
  userId     String
  name       String   // "Domicile", "Bureau"
  address    String
  city       String
  postalCode String
  country    String   @default("France")
  phone      String?
  isDefault  Boolean  @default(false)

  user       User     @relation(fields: [userId])

  @@index([userId])
}
```

#### Admin & Vendor

**AdminUser** (Admin users avec roles)
```prisma
model AdminUser {
  id          String       @id @default(cuid())
  userId      String       @unique
  role        Role         @default(MODERATOR)
  permissions Permission[]

  createdAt   DateTime     @default(now())

  @@index([userId])
}

enum Role {
  SUPER_ADMIN
  ADMIN
  MODERATOR
  SUPPORT
}

enum Permission {
  MANAGE_PRODUCTS
  MANAGE_ORDERS
  MANAGE_USERS
  MANAGE_SETTINGS
  VIEW_ANALYTICS
  MANAGE_CAMPAIGNS
  MANAGE_PROMO_CODES
  MANAGE_VENDORS
  MANAGE_CONTENT
  MANAGE_ADMINS
  VIEW_AUDIT_LOGS
}
```

**Vendor** (Multi-vendor marketplace)
```prisma
model Vendor {
  id              String        @id @default(cuid())
  userId          String?
  name            String
  email           String        @unique
  description     String?       @db.Text
  logo            String?
  commission      Float         @default(15.0) // Percentage
  status          VendorStatus  @default(PENDING)

  // Relations
  products        Product[]
  orders          Order[]
  payouts         VendorPayout[]

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([email])
  @@index([status])
}

enum VendorStatus {
  PENDING
  ACTIVE
  SUSPENDED
  INACTIVE
}
```

**VendorPayout**
```prisma
model VendorPayout {
  id        String       @id @default(cuid())
  vendorId  String
  amount    Int          // En centimes
  status    PayoutStatus @default(PENDING)
  reference String?
  paidAt    DateTime?

  vendor    Vendor       @relation(fields: [vendorId])

  createdAt DateTime     @default(now())

  @@index([vendorId])
  @@index([status])
}

enum PayoutStatus {
  PENDING
  PROCESSING
  PAID
  FAILED
}
```

#### Marketing

**Campaign** (Email/SMS campaigns)
```prisma
model Campaign {
  id            String          @id @default(cuid())
  name          String
  type          CampaignType    // EMAIL, SMS, PUSH
  subject       String?
  content       String          @db.Text
  status        CampaignStatus  @default(DRAFT)
  scheduledAt   DateTime?
  sentAt        DateTime?

  // Segmentation
  segmentId     String?

  // Stats
  sent          Int             @default(0)
  opened        Int             @default(0)
  clicked       Int             @default(0)
  converted     Int             @default(0)

  segment       CustomerSegment? @relation(fields: [segmentId])

  createdAt     DateTime        @default(now())

  @@index([status])
}

enum CampaignType {
  EMAIL
  SMS
  PUSH
}

enum CampaignStatus {
  DRAFT
  SCHEDULED
  SENDING
  SENT
  FAILED
}
```

**CustomerSegment** (Segmentation client)
```prisma
model CustomerSegment {
  id          String     @id @default(cuid())
  name        String
  description String?
  filters     Json       // {loyaltyLevel: 'GOLD', totalSpent: {gt: 50000}}

  campaigns   Campaign[]

  createdAt   DateTime   @default(now())
}
```

**NewsletterSubscription**
```prisma
model NewsletterSubscription {
  id            String   @id @default(cuid())
  email         String   @unique
  firstName     String?
  source        String?  // "CHECKOUT", "POPUP", "FOOTER"
  subscribedAt  DateTime @default(now())

  @@index([email])
}
```

#### Content & Support

**FAQ**
```prisma
model FAQ {
  id       String  @id @default(cuid())
  question String
  answer   String  @db.Text
  order    Int     @default(0)
  active   Boolean @default(true)

  @@index([active])
}
```

**Media** (Centralized asset management)
```prisma
model Media {
  id         String   @id @default(cuid())
  filename   String
  url        String
  type       String   // IMAGE, VIDEO, DOCUMENT
  size       Int      // En bytes
  mimeType   String
  uploadedBy String?
  tags       String[]

  createdAt  DateTime @default(now())

  @@index([type])
  @@index([uploadedBy])
}
```

#### System

**Analytics** (Page view tracking)
```prisma
model Analytics {
  id        String   @id @default(cuid())
  event     String   // "page_view", "product_view", "add_to_cart"
  page      String?
  data      Json?
  userId    String?
  sessionId String?

  createdAt DateTime @default(now())

  @@index([event])
  @@index([userId])
}
```

**AuditLog** (Admin action trail)
```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  action    String   // "CREATE_PRODUCT", "UPDATE_ORDER"
  resource  String   // "Product", "Order"
  resourceId String?
  changes   Json?    // Before/After
  ipAddress String?
  userAgent String?

  createdAt DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```

**SavedView** (Admin filter presets)
```prisma
model SavedView {
  id        String   @id @default(cuid())
  userId    String
  name      String
  resource  String   // "products", "orders"
  filters   Json     // Saved filter state

  createdAt DateTime @default(now())

  @@index([userId])
  @@index([resource])
}
```

**FeatureFlag** (Feature toggles)
```prisma
model FeatureFlag {
  id          String   @id @default(cuid())
  key         String   @unique
  description String?
  enabled     Boolean  @default(false)
  rollout     Int      @default(100) // Percentage (0-100)
  targetRoles Role[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([key])
}
```

**Notification** (Admin notifications)
```prisma
model Notification {
  id      String  @id @default(cuid())
  userId  String
  type    String  // "LOW_STOCK", "NEW_ORDER", "NEW_REVIEW"
  title   String
  message String
  read    Boolean @default(false)
  data    Json?

  createdAt DateTime @default(now())

  @@index([userId])
  @@index([read])
}
```

---

## FONCTIONNALITÉS IMPLÉMENTÉES

### Frontend Public ✅

**Homepage** (Production-Ready)
- Hero section avec carousel
- Social proof bar (sticky)
- Categories navigation (8-column grid)
- Flash deals avec countdown timer
- Curated collections
- Main product grid avec infinite scroll
- Trending products carousel
- Category showcase
- Trust badges
- Testimonials carousel
- Instagram feed integration
- Newsletter subscription

**Product Features** (Production-Ready)
- Product listing avec filtres/sorting
- Product detail page avec variants
- Image gallery (image/video/360° support)
- Quick view modal
- Add to cart/wishlist
- Product recommendations
- Frequently bought together
- Product reviews display
- Stock availability indicator
- Badge system (new, trending, sale)

**Cart & Wishlist** (Production-Ready)
- Persistent cart (Zustand + localStorage)
- Cart preview dropdown
- Save for later functionality
- Wishlist management
- Free shipping progress (threshold: €50)
- Coupon code application
- Tax calculation (20% TVA)

**Checkout Flow** (Production-Ready)
- Multi-step checkout (3 étapes)
- Address autocomplete (French postal codes)
- Saved address management
- Shipping method selection
- Payment gateway selection (Paystack/Flutterwave)
- Express checkout (Apple Pay, Google Pay, PayPal) - APIs ready
- Order confirmation page
- Payment callback handling

**User Account** (Partially implemented 🟡)
- Dashboard overview (données mock)
- Order history placeholder
- Loyalty points tracking (Bronze/Silver/Gold/Platinum)
- Profile management placeholder
- Address book placeholder
- Recently viewed products

### Admin Panel (Refine) ✅/🟡

**Fully Working:**
- Dashboard avec stats, charts, alerts
- Product management (full CRUD avec images, variants, tags)
- Category management (hierarchical CRUD)
- Order management (list, view, status updates)
- User management (view customers, loyalty tracking)
- Vendor management (list, view only)
- Audit logs (all admin actions tracked)
- Real-time notifications (Pusher)
- Data export (CSV/Excel)
- Bulk import
- Global search (Cmd+K)
- Saved views for filters
- Permission-based access
- Multi-language support (i18n ready)

**Partially Implemented:**
- Campaign management (create only, no edit/send) 🟡
- Promo code management (list only, no CRUD) 🟡
- Feature flags (list only, no toggle) 🟡
- Admin user management (list only, no CRUD) 🟡
- Role management (list only, no CRUD) 🟡

**Missing:**
- Media library management ❌
- Customer segmentation ❌
- Email template editor ❌
- Analytics funnel visualization ❌
- Vendor commission tracking UI ❌

### Authentication System 🔴

**Backend Configured** (Better Auth):
- Database: PostgreSQL via Prisma ✅
- Session: Cookie + Redis cache (5min cache, 7-day expiry) ✅
- Providers: Email/password + Google OAuth ✅

**Frontend Missing** ❌:
- No login page
- No register page
- No forgot password flow
- No password reset flow
- Admin auth bypassed in dev mode (SKIP_AUTH=true)

### Payment Integration ✅

**Paystack** (Fully Functional):
- Transaction initialization ✅
- Payment verification ✅
- Webhook with signature validation ✅
- Stock decrement on success ✅
- Order creation with idempotency ✅

**Flutterwave** (Fully Functional):
- Payment initialization ✅
- Transaction verification ✅
- Webhook handling ✅
- Multiple payment methods ✅

**Express Checkout** (APIs Ready, needs credentials):
- Apple Pay ⚙️
- Google Pay ⚙️
- PayPal ⚙️

**Missing:**
- Stripe implementation (installed but not used) ❌
- Refund functionality ❌
- Payment retry mechanism ❌

---

## FONCTIONNALITÉS MANQUANTES

### Critiques (Bloqueurs MVP) 🔴

1. **Pages d'authentification** - Aucune UI
   - `/login`
   - `/register`
   - `/forgot-password`
   - `/reset-password`

2. **Admin CRUD manquants**
   - Vendors (create/edit/delete)
   - Campaigns (edit/show/send)
   - Promo codes (create/edit/show)
   - Admin users (all CRUD)
   - Media library (all pages)

3. **Testing** - Aucun test
   - Pas de Jest/Vitest
   - Pas de Playwright/Cypress
   - Code coverage: 0%

4. **Sécurité**
   - Pas de rate limiting
   - CSRF disabled en dev
   - Admin auth bypassed (SKIP_AUTH=true)

### Importantes (Post-MVP) 🟡

5. **User Account Features**
   - Orders history (API OK, UI placeholder)
   - Address management (API OK, UI placeholder)
   - Profile settings (API OK, UI placeholder)
   - Password change
   - Account deletion (GDPR)

6. **Review System**
   - Review submission form
   - Review moderation (admin)
   - Merchant response
   - Helpful votes

7. **Shipping Integration**
   - Real carrier API (currently mock data)
   - Relay point selection (API exists, needs integration)
   - Order tracking (trackingNumber field exists but not populated)
   - Delivery estimates

8. **Promo Code Logic**
   - Full validation (currently partial)
   - Scope handling (CART/SHIPPING/CATEGORY/PRODUCT)
   - First order discount automation
   - Loyalty points redemption

### Nice-to-Have ⚪

9. **Advanced Features**
   - Loyalty program gamification (badges, daily rewards)
   - Multi-language (i18n installed but not configured)
   - Visual search (API exists but placeholder)
   - Abandoned cart recovery
   - Email marketing automation
   - Customer support ticketing

---

## STACK TECHNIQUE

### Framework & Core (Vérifié Nov 2025)

```json
{
  "next": "15.0.0",
  "react": "19.0.0",
  "typescript": "5.3.4",
  "prisma": "6.19.0",
  "@prisma/client": "6.19.0"
}
```

### Admin Panel

```json
{
  "@refinedev/core": "5.0.5",
  "@refinedev/antd": "6.0.3",
  "@refinedev/nextjs-router": "7.0.4",
  "@refinedev/simple-rest": "6.0.1",
  "antd": "5.28.0"
}
```

### Authentication

```json
{
  "better-auth": "1.0.0"
}
```

### Payment Gateways

```json
{
  "paystack": "^2.0.0",
  "flutterwave-node-v3": "^1.0.0",
  "@paypal/checkout-server-sdk": "^1.0.0",
  "stripe": "19.3.1"
}
```

### State Management

```json
{
  "zustand": "4.5.0",
  "@tanstack/react-query": "5.0.0",
  "swr": "2.2.0"
}
```

### UI Components

```json
{
  "tailwindcss": "3.4.0",
  "framer-motion": "10.12.0",
  "lucide-react": "0.553.0"
}
```

**shadcn/ui components**: 27+ Radix UI based components

### Form Handling

```json
{
  "react-hook-form": "7.66.0",
  "@hookform/resolvers": "5.2.2",
  "zod": "3.25.76"
}
```

### Caching & Real-time

```json
{
  "ioredis": "5.3.2",
  "pusher": "5.2.0",
  "pusher-js": "8.4.0"
}
```

### Email & Analytics

```json
{
  "resend": "1.0.0",
  "posthog-js": "1.0.0",
  "@vercel/analytics": "1.0.0"
}
```

### Rich Text Editor

```json
{
  "@tiptap/react": "3.10.5"
}
```

### Utilities

```json
{
  "date-fns": "3.0.0",
  "currency.js": "2.0.4",
  "clsx": "2.1.0",
  "class-variance-authority": "0.7.1",
  "tailwind-merge": "2.2.0"
}
```

### File Handling

```json
{
  "react-dropzone": "14.3.8",
  "react-easy-crop": "5.5.3",
  "browser-image-compression": "2.0.2",
  "sharp": "0.33.0"
}
```

### Internationalization

```json
{
  "i18next": "23.7.0",
  "react-i18next": "14.0.0"
}
```

**Total: 134 dependencies**

---

## SÉCURITÉ

### Risques Critiques 🔴

1. **Admin Auth Bypassed** (SKIP_AUTH=true en dev)
   - Solution: Créer auth provider réel
   - Désactiver SKIP_AUTH en production

2. **Pas de Rate Limiting**
   - Vulnérabilité: API endpoints non protégés
   - Solution: Implémenter `@upstash/ratelimit`

3. **CSRF Disabled**
   - Activé uniquement en production
   - Solution: Activer CSRF_ENABLED=true

4. **Aucun test de sécurité**
   - Pas de tests de pénétration
   - Pas de scan de vulnérabilités

### Bonnes Pratiques Implémentées ✅

1. **Webhook Signature Validation**
   - Paystack: HMAC SHA-512 ✅
   - Flutterwave: Signature verification ✅

2. **Input Validation**
   - Zod validation sur forms ✅
   - Prisma type safety ✅

3. **Password Hashing**
   - Better Auth gère le hashing ✅

4. **Session Management**
   - Cookie-based avec Redis cache ✅
   - 7-day expiry, 5min cache TTL ✅

### À Implémenter 🔧

1. **Rate Limiting**
   - `/api/auth/*` - 5 req/min par IP
   - `/api/orders/create` - 10 req/hour par user

2. **CSRF Tokens**
   - Générer dans forms
   - Valider dans API POST/PUT/DELETE

3. **Input Sanitization**
   - XSS protection (DOMPurify)
   - SQL injection (Prisma protège déjà)

4. **Security Headers**
   - Content-Security-Policy
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff

---

## PERFORMANCE

### Optimisations Implémentées ✅

1. **ISR (Incremental Static Regeneration)**
   - Homepage: revalidate 300s ✅
   - Product pages: On-demand revalidation ✅

2. **Database Indexing**
   - Indexes sur foreign keys ✅
   - Indexes sur champs fréquemment filtrés ✅

3. **Image Optimization**
   - Next.js Image component ✅
   - Sharp pour transformations ✅

4. **Redis Caching**
   - Session cache ✅
   - Cart stock locks ✅

5. **Code Splitting**
   - Dynamic imports pour composants lourds ✅

### À Optimiser 🔧

1. **Bundle Size**
   - Analyser avec @next/bundle-analyzer
   - Code splitting agressif
   - Tree shaking

2. **API Response Caching**
   - Cache products (TTL 5min)
   - Cache categories (TTL 1h)
   - Cache invalidation on update

3. **Database Queries**
   - Identifier N+1 queries
   - Use `select` pour limiter champs
   - Pagination partout

4. **Image Lazy Loading**
   - Below-fold images
   - Responsive images avec srcset

5. **CDN**
   - Cloudflare Images pour assets
   - Edge caching

### Métriques Cibles

| Métrique | Cible | Actuel | Statut |
|----------|-------|--------|--------|
| Lighthouse Performance | > 90 | ? | 🔧 À mesurer |
| LCP (Largest Contentful Paint) | < 2.5s | ? | 🔧 À mesurer |
| FID (First Input Delay) | < 100ms | ? | 🔧 À mesurer |
| CLS (Cumulative Layout Shift) | < 0.1 | ? | 🔧 À mesurer |
| Bundle Size (JS) | < 200KB | ? | 🔧 À mesurer |

---

## VARIABLES D'ENVIRONNEMENT

### Critiques (Required) 🔴

```bash
# Database
PRISMA_DATABASE_URL="postgresql://user:password@localhost:5432/mientior"

# Cache
REDIS_URL="redis://localhost:6379"

# Auth
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"

# Payment Gateways
PAYSTACK_SECRET_KEY="sk_test_..."
PAYSTACK_WEBHOOK_SECRET="..."
FLUTTERWAVE_SECRET_KEY="FLWSECK_TEST-..."
FLUTTERWAVE_WEBHOOK_SECRET="..."

# Email
RESEND_API_KEY="re_..."
```

### Optionnelles (Recommended) 🟡

```bash
# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Stripe (si utilisé)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# PayPal
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."

# Apple Pay
APPLE_PAY_MERCHANT_ID="..."

# Google Pay
GOOGLE_PAY_MERCHANT_ID="..."

# Analytics
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"

# Real-time
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="eu"
NEXT_PUBLIC_PUSHER_KEY="..."
NEXT_PUBLIC_PUSHER_CLUSTER="eu"

# Instagram Feed
INSTAGRAM_ACCESS_TOKEN="..."

# Sentry (error tracking)
SENTRY_DSN="..."
```

### Development Only ⚙️

```bash
# Skip auth in dev (⚠️ DANGER en production)
SKIP_AUTH="true"

# Allow guest checkout
ALLOW_GUEST_CHECKOUT="true"

# Admin credentials
ADMIN_DEFAULT_EMAIL="admin@mientior.com"
ADMIN_DEFAULT_PASSWORD="..."

# Disable CSRF in dev
CSRF_ENABLED="false"
```

### Total: 48 variables d'environnement possibles

---

## PROCHAINES ÉTAPES CRITIQUES

### Phase 1 - MVP (3-4 semaines) 🔴

**Sprint 1.1: Authentification (5-7j)**
- Créer pages login/register/forgot-password/reset-password
- Intégrer Better Auth UI
- Mettre à jour middleware
- Ajouter logout

**Sprint 1.2: Sécuriser Admin (3-4j)**
- Créer auth provider Refine réel
- Protéger routes admin
- Retirer SKIP_AUTH en production
- Audit logs complets

**Sprint 1.3: Admin CRUD (7-10j)**
- Vendor CRUD pages
- Campaign edit/send pages
- Promo code CRUD pages
- Media library
- Media picker component

**Sprint 1.4: Testing & Sécurité (5-7j)**
- Setup Jest + React Testing Library
- Tests unitaires critiques (>70% coverage)
- Tests E2E Playwright
- Rate limiting
- CSRF protection
- Security headers

### Phase 2 - UX (3-4 semaines) 🟡

**Sprint 2.1: Compte Utilisateur (5j)**
**Sprint 2.2: Système d'Avis (5-7j)**
**Sprint 2.3: Livraison & Suivi (5j)**
**Sprint 2.4: Codes Promo (3-4j)**

### Phase 3 - Optimisations (2-3 semaines) 🟢

**Sprint 3.1: Performance & SEO (7j)**
**Sprint 3.2: Upload Images (4-5j)**
**Sprint 3.3: Monitoring (3-4j)**

### Phase 4 - Avancé (3-4 semaines) ⚪

**Sprint 4.1: Gamification (5j)**
**Sprint 4.2: Multi-langue (5-7j)**
**Sprint 4.3: Marketplace (7j)**

---

**Document maintenu par**: Claude Code
**Dernière mise à jour**: 18 novembre 2025
**Version**: 2.0 (Analyse complète du codebase)
**Prochaine révision**: Après Sprint 1.4
