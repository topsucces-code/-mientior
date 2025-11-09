---
type: "always_apply"
---

# **Stack Technologique Sophistiqué - Architecture E-Commerce Enterprise**

---

## **🎯 PHILOSOPHIE & PRINCIPES ARCHITECTURAUX**

### **Critères de Sélection**
- **Performance** : Time to Interactive < 3s, Core Web Vitals optimaux
- **Scalabilité** : Support 100k+ utilisateurs simultanés
- **SEO** : SSR/SSG pour indexation maximale
- **DX** : Developer Experience premium, TypeScript strict
- **Maintenance** : Code maintenable, documentation auto-générée
- **Coûts** : Optimisation infrastructure, serverless où pertinent

---

## **🏗️ ARCHITECTURE GLOBALE**

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│  Next.js 14+ (App Router) + React 18 + TypeScript          │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                      API/BACKEND LAYER                      │
│  Payload CMS 3.0 + Next.js API Routes + tRPC               │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                         │
│         PostgreSQL 16 + Prisma ORM + Redis Cache           │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                     │
│        Vercel (Frontend) + Railway/Render (Backend)        │
└─────────────────────────────────────────────────────────────┘
```

---

## **💻 FRONTEND STACK**

### **Framework Principal : Next.js 14+ (App Router)**

**Pourquoi Next.js ?**
- ✅ SSR/SSG/ISR natifs pour SEO optimal
- ✅ App Router pour architecture moderne
- ✅ Server Components réduisent bundle JS
- ✅ Image optimization automatique
- ✅ Route handlers pour API internes
- ✅ Middleware pour auth/redirections
- ✅ Écosystème React massif
- ✅ Vercel deployment en one-click

**Configuration Recommandée :**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['@payloadcms/db-postgres']
  },
  
  // Optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    domains: ['cdn.yourstore.com', 'images.unsplash.com'],
    minimumCacheTTL: 60,
  },
  
  // Performance
  swcMinify: true,
  reactStrictMode: true,
  poweredByHeader: false,
  
  // i18n (si multilingue)
  i18n: {
    locales: ['fr', 'en', 'es'],
    defaultLocale: 'fr',
  },
}

module.exports = nextConfig
```

---

### **UI Layer : React 18 + TypeScript 5.3+**

**Librairies UI Sophistiquées :**

#### **1. Composants de Base : shadcn/ui + Radix UI**
```bash
npx shadcn-ui@latest init
```

**Pourquoi shadcn/ui ?**
- ✅ Composants copiés dans votre projet (pas de dépendance)
- ✅ Customisation totale avec Tailwind
- ✅ Accessible (Radix UI primitives)
- ✅ TypeScript natif
- ✅ Animations Framer Motion intégrées

**Composants à installer :**
```bash
npx shadcn-ui@latest add button card dialog dropdown-menu 
npx shadcn-ui@latest add input select slider tabs toast
npx shadcn-ui@latest add accordion badge avatar carousel
npx shadcn-ui@latest add command navigation-menu popover
```

#### **2. Styling : Tailwind CSS 3.4+ + CSS Modules**

```bash
npm install -D tailwindcss postcss autoprefixer
npm install tailwind-merge clsx class-variance-authority
```

**tailwind.config.ts sophistiqué :**
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Votre palette Professional Trust
        brand: {
          primary: {
            50: '#eff6ff',
            100: '#dbeafe',
            500: '#3b82f6', // Bleu principal
            600: '#2563eb',
            700: '#1d4ed8',
          },
          secondary: {
            50: '#fff7ed',
            100: '#ffedd5',
            500: '#ff6b00', // Orange secondaire
            600: '#ea580c',
            700: '#c2410c',
          },
        },
        // Sémantique
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter Variable', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter Variable', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-slow': 'bounce 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      boxShadow: {
        'elevation-1': '0 1px 3px rgba(0,0,0,0.12)',
        'elevation-2': '0 4px 6px rgba(0,0,0,0.1)',
        'elevation-3': '0 10px 15px rgba(0,0,0,0.1)',
        'elevation-4': '0 20px 25px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
    require('tailwindcss-animate'),
  ],
}

export default config
```

#### **3. State Management : Zustand + React Query**

```bash
npm install zustand @tanstack/react-query
```

**Pourquoi ce combo ?**
- ✅ Zustand : État local/global léger, simple, TypeScript-first
- ✅ React Query : Cache serveur, mutations, invalidations auto
- ✅ Séparation claire : UI state (Zustand) vs Server state (React Query)

**Store Example (Zustand) :**
```typescript
// stores/cart.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  variant?: {
    size?: string
    color?: string
  }
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => set((state) => {
        const existingItem = state.items.find(i => i.id === item.id)
        if (existingItem) {
          return {
            items: state.items.map(i =>
              i.id === item.id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          }
        }
        return { items: [...state.items, item] }
      }),
      
      removeItem: (id) => set((state) => ({
        items: state.items.filter(item => item.id !== id),
      })),
      
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map(item =>
          item.id === id ? { ...item, quantity } : item
        ),
      })),
      
      clearCart: () => set({ items: [] }),
      
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )
      },
      
      getTotalItems: () => {
        return get().items.reduce(
          (total, item) => total + item.quantity,
          0
        )
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)
```

**React Query Configuration :**
```typescript
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        cacheTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

#### **4. Forms : React Hook Form + Zod**

```bash
npm install react-hook-form @hookform/resolvers zod
```

**Exemple formulaire sophistiqué :**
```typescript
// components/forms/checkout-form.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const checkoutSchema = z.object({
  email: z.string().email('Email invalide'),
  firstName: z.string().min(2, 'Minimum 2 caractères'),
  lastName: z.string().min(2, 'Minimum 2 caractères'),
  address: z.string().min(5, 'Adresse trop courte'),
  city: z.string().min(2, 'Ville invalide'),
  postalCode: z.string().regex(/^\d{5}$/, 'Code postal invalide'),
  phone: z.string().regex(/^(\+33|0)[1-9](\d{2}){4}$/, 'Téléphone invalide'),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

export function CheckoutForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  })

  const onSubmit = async (data: CheckoutFormData) => {
    // Handle submission
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Form fields */}
    </form>
  )
}
```

#### **5. Animations : Framer Motion**

```bash
npm install framer-motion
```

**Exemples animations sophistiquées :**
```typescript
// components/animated/fade-in.tsx
import { motion } from 'framer-motion'

export function FadeIn({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {children}
    </motion.div>
  )
}

// Stagger children animation
export function StaggerContainer({ children }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}
```

#### **6. Autres Librairies Frontend Essentielles**

```bash
# Icons
npm install lucide-react

# Dates
npm install date-fns

# Currency formatting
npm install currency.js

# Image zoom/gallery
npm install yet-another-react-lightbox

# Carousel/Slider
npm install embla-carousel-react

# Toast notifications
npm install sonner

# Loading states
npm install react-loading-skeleton

# Infinite scroll
npm install react-intersection-observer

# Copy to clipboard
npm install react-hot-toast

# QR Code generation
npm install qrcode.react

# Charts (analytics)
npm install recharts
```

---

## **🔧 BACKEND & CMS : PAYLOAD CMS 3.0**

### **Pourquoi Payload CMS ?**
- ✅ TypeScript-first, React Admin UI
- ✅ Headless CMS avec API REST/GraphQL auto-générées
- ✅ PostgreSQL support natif
- ✅ Auth/RBAC intégré
- ✅ Upload média avec transformations
- ✅ Hooks/Plugins extensibles
- ✅ Local development facile
- ✅ Self-hosted (contrôle total)

### **Installation & Configuration**

```bash
npx create-payload-app@latest
# Choisir: blank template, PostgreSQL, Next.js integration
```

**Structure Payload :**
```
/payload/
├── collections/
│   ├── Products.ts
│   ├── Categories.ts
│   ├── Orders.ts
│   ├── Users.ts
│   ├── Reviews.ts
│   └── Media.ts
├── globals/
│   ├── Settings.ts
│   └── Navigation.ts
├── blocks/
│   ├── Hero.ts
│   ├── ProductGrid.ts
│   └── Banner.ts
├── hooks/
│   ├── calculateOrderTotal.ts
│   └── sendOrderConfirmation.ts
└── payload.config.ts
```

**Configuration Payload CMS :**
```typescript
// payload.config.ts
import { buildConfig } from 'payload/config'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { slateEditor } from '@payloadcms/richtext-slate'
import { cloudinaryPlugin } from '@payloadcms/plugin-cloud-storage'
import path from 'path'

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL,
  admin: {
    user: 'users',
    meta: {
      titleSuffix: '- MonMarketplace Admin',
      favicon: '/favicon.ico',
    },
  },
  
  collections: [
    {
      slug: 'products',
      admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'price', 'stock', 'status'],
      },
      access: {
        read: () => true,
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'slug',
          type: 'text',
          unique: true,
          admin: {
            position: 'sidebar',
          },
          hooks: {
            beforeValidate: [
              ({ value, data }) => {
                if (!value && data?.name) {
                  return data.name
                    .toLowerCase()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-')
                }
                return value
              },
            ],
          },
        },
        {
          name: 'description',
          type: 'richText',
          required: true,
        },
        {
          name: 'price',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'compareAtPrice',
          type: 'number',
          min: 0,
        },
        {
          name: 'images',
          type: 'array',
          required: true,
          minRows: 1,
          maxRows: 10,
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
          ],
        },
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          required: true,
          hasMany: false,
        },
        {
          name: 'tags',
          type: 'relationship',
          relationTo: 'tags',
          hasMany: true,
        },
        {
          name: 'variants',
          type: 'array',
          fields: [
            {
              name: 'size',
              type: 'select',
              options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            },
            {
              name: 'color',
              type: 'text',
            },
            {
              name: 'sku',
              type: 'text',
              unique: true,
            },
            {
              name: 'stock',
              type: 'number',
              min: 0,
              defaultValue: 0,
            },
          ],
        },
        {
          name: 'stock',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 0,
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Brouillon', value: 'draft' },
            { label: 'Publié', value: 'published' },
            { label: 'Rupture', value: 'out-of-stock' },
          ],
          defaultValue: 'draft',
          required: true,
        },
        {
          name: 'featured',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'seo',
          type: 'group',
          fields: [
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'description',
              type: 'textarea',
            },
            {
              name: 'keywords',
              type: 'text',
            },
          ],
        },
      ],
      hooks: {
        afterChange: [
          async ({ doc, operation }) => {
            // Revalidate Next.js ISR cache
            if (operation === 'create' || operation === 'update') {
              try {
                await fetch(
                  `${process.env.NEXT_PUBLIC_SERVER_URL}/api/revalidate`,
                  {
                    method: 'POST',
                    body: JSON.stringify({
                      path: `/products/${doc.slug}`,
                    }),
                  }
                )
              } catch (error) {
                console.error('Revalidation error:', error)
              }
            }
          },
        ],
      },
    },
    // Autres collections...
  ],
  
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),
  
  editor: slateEditor({}),
  
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  
  plugins: [
    cloudinaryPlugin({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    }),
  ],
})
```

---

## **💾 DATABASE LAYER**

### **PostgreSQL 16 + Prisma ORM**

**Pourquoi PostgreSQL ?**
- ✅ ACID compliant (transactions critiques e-commerce)
- ✅ JSON support (flexibilité données)
- ✅ Full-text search intégré
- ✅ Performance excellente
- ✅ Scalabilité prouvée
- ✅ Extensions (PostGIS pour géoloc)

**Pourquoi Prisma ?**
- ✅ Type-safety TypeScript total
- ✅ Migrations gérées
- ✅ Studio UI pour debug
- ✅ Query builder intuitif
- ✅ Relations complexes simplifiées

```bash
npm install @prisma/client prisma
npx prisma init
```

**Schema Prisma E-Commerce :**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  firstName     String?
  lastName      String?
  phone         String?
  role          Role      @default(CUSTOMER)
  
  orders        Order[]
  reviews       Review[]
  wishlist      Wishlist?
  addresses     Address[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@map("users")
}

enum Role {
  CUSTOMER
  VENDOR
  ADMIN
}

model Product {
  id                String      @id @default(cuid())
  name              String
  slug              String      @unique
  description       String      @db.Text
  price             Decimal     @db.Decimal(10, 2)
  compareAtPrice    Decimal?    @db.Decimal(10, 2)
  costPrice         Decimal?    @db.Decimal(10, 2)
  
  sku               String?     @unique
  stock             Int         @default(0)
  lowStockThreshold Int         @default(10)
  
  status            ProductStatus @default(DRAFT)
  featured          Boolean     @default(false)
  
  categoryId        String
  category          Category    @relation(fields: [categoryId], references: [id])
  
  images            ProductImage[]
  variants          ProductVariant[]
  reviews           Review[]
  orderItems        OrderItem[]
  
  tags              ProductTag[]
  
  // SEO
  metaTitle         String?
  metaDescription   String?
  
  // Analytics
  views             Int         @default(0)
  sales             Int         @default(0)
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  @@index([categoryId])
  @@index([slug])
  @@map("products")
}

enum ProductStatus {
  DRAFT
  PUBLISHED
  OUT_OF_STOCK
  ARCHIVED
}

model Category {
  id          String      @id @default(cuid())
  name        String
  slug        String      @unique
  description String?
  image       String?
  
  parentId    String?
  parent      Category?   @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[]  @relation("CategoryHierarchy")
  
  products    Product[]
  
  order       Int         @default(0)
  isActive    Boolean     @default(true)
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  @@map("categories")
}

model Order {
  id                String        @id @default(cuid())
  orderNumber       String        @unique
  
  userId            String
  user              User          @relation(fields: [userId], references: [id])
  
  items             OrderItem[]
  
  status            OrderStatus   @default(PENDING)
  paymentStatus     PaymentStatus @default(PENDING)
  
  subtotal          Decimal       @db.Decimal(10, 2)
  shippingCost      Decimal       @db.Decimal(10, 2)
  tax               Decimal       @db.Decimal(10, 2)
  discount          Decimal       @db.Decimal(10, 2) @default(0)
  total             Decimal       @db.Decimal(10, 2)
  
  shippingAddress   Address       @relation("ShippingAddress", fields: [shippingAddressId], references: [id])
  shippingAddressId String
  
  billingAddress    Address       @relation("BillingAddress", fields: [billingAddressId], references: [id])
  billingAddressId  String
  
  paymentMethod     String
  paymentIntentId   String?
  
  trackingNumber    String?
  carrier           String?
  
  notes             String?       @db.Text
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  @@index([userId])
  @@index([orderNumber])
  @@map("orders")
}

enum OrderStatus {
  PENDING
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

model OrderItem {
  id          String   @id @default(cuid())
  
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  
  variantId   String?
  variant     ProductVariant? @relation(fields: [variantId], references: [id])
  
  quantity    Int
  price       Decimal  @db.Decimal(10, 2)
  
  createdAt   DateTime @default(now())
  
  @@index([orderId])
  @@index([productId])
  @@map("order_items")
}

model Address {
  id          String  @id @default(cuid())
  
  userId      String
  user        User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  firstName   String
  lastName    String
  company     String?
  address1    String
  address2    String?
  city        String
  state       String?
  postalCode  String
  country     String  @default("FR")
  phone       String?
  
  isDefault   Boolean @default(false)
  
  shippingOrders  Order[] @relation("ShippingAddress")
  billingOrders   Order[] @relation("BillingAddress")
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([userId])
  @@map("addresses")
}

// ... Autres modèles (Review, Wishlist, ProductVariant, etc.)
```

**Migrations :**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### **Redis Cache**

```bash
npm install ioredis
```

**Configuration :**
```typescript
// lib/redis.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600 // 1 hour default
): Promise<T> {
  const cached = await redis.get(key)
  
  if (cached) {
    return JSON.parse(cached)
  }
  
  const data = await fetcher()
  await redis.setex(key, ttl, JSON.stringify(data))
  
  return data
}

export { redis }
```

**Use Cases Redis :**
- Session storage
- Product cache
- Search results cache
- Rate limiting
- Real-time cart sync
- Popular products cache

---

## **🔐 AUTHENTIFICATION & SÉCURITÉ**

### **NextAuth.js v5 (Auth.js)**

```bash
npm install next-auth@beta
npm install @auth/prisma-adapter bcryptjs
npm install -D @types/bcryptjs
```

**Configuration :**
```typescript
// auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials)
        
        if (!validatedFields.success) return null
        
        const { email, password } = validatedFields.data
        
        const user = await prisma.user.findUnique({
          where: { email },
        })
        
        if (!user || !user.passwordHash) return null
        
        const isValid = await bcrypt.compare(password, user.passwordHash)
        
        if (!isValid) return null
        
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
      }
      return session
    },
  },
})
```

---

## **💳 PAIEMENT : STRIPE**

```bash
npm install stripe @stripe/stripe-js
```

**Configuration Backend :**
```typescript
// lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})
```

**API Route Checkout :**
```typescript
// app/api/checkout/route.ts
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { items } = await req.json()
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: items.map((item: any) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          images: [item.image],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
  })
  
  return NextResponse.json({ url: session.url })
}
```

---

## **📧 EMAILS : RESEND + REACT EMAIL**

```bash
npm install resend react-email
```

**Template Email :**
```typescript
// emails/order-confirmation.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export default function OrderConfirmationEmail({ order }: any) {
  return (
    <Html>
      <Head />
      <Preview>Confirmation de commande #{order.orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Merci pour votre commande!</Heading>
          <Text style={text}>
            Votre commande #{order.orderNumber} a été confirmée.
          </Text>
          {/* Order details */}
        </Container>
      </Body>
    </Html>
  )
}
```

---

## **📊 ANALYTICS & MONITORING**

### **Vercel Analytics + PostHog**

```bash
npm install @vercel/analytics posthog-js
```

### **Error Tracking : Sentry**

```bash
npm install @sentry/nextjs
```

---

## **🚀 DÉPLOIEMENT & INFRASTRUCTURE**

### **Option 1 : Vercel (Recommandé pour Frontend)**

```bash
vercel deploy
```

**Avantages :**
- Zero-config Next.js
- Edge Functions global
- Instant rollback
- Analytics intégré
- Preview deployments

### **Option 2 : Backend séparé (Railway/Render)**

**Railway pour Payload + PostgreSQL :**
- Déploiement Git automatique
- PostgreSQL managed
- Redis add-on
- Logs & metrics
- SSL auto

---

## **📦 PACKAGE.JSON COMPLET INSTALL LES DERNIERE VERSION**

```json
{
  "name": "marketplace-sophistique",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "email": "email dev"
  },
  "dependencies": {
    "@auth/prisma-adapter": "^1.0.0",
    "@payloadcms/db-postgres": "^3.0.0",
    "@prisma/client": "^5.7.0",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@stripe/stripe-js": "^2.2.0",
    "@tanstack/react-query": "^5.12.0",
    "@vercel/analytics": "^1.1.1",
    "bcryptjs": "^2.4.3",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "currency.js": "^2.0.4",
    "date-fns": "^2.30.0",
    "embla-carousel-react": "^8.0.0",
    "framer-motion": "^10.16.16",
    "ioredis": "^5.3.2",
    "lucide-react": "^0.294.0",
    "next": "14.0.4",
    "next-auth": "5.0.0-beta.4",
    "payload": "^3.0.0",
    "posthog-js": "^1.96.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-email": "^2.0.0",
    "react-hook-form": "^7.48.2",
    "recharts": "^2.10.3",
    "resend": "^2.1.0",
    "sonner": "^1.2.3",
    "stripe": "^14.7.0",
    "tailwind-merge": "^2.1.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.22.4",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@tailwindcss/forms": "^0.5.7",
    "@tailwindcss/typography": "^0.5.10",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.10.5",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.0.4",
    "postcss": "^8.4.32",
    "prisma": "^5.7.0",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.3.3"
  }
}
```

---

Cette stack moderne, performante et scalable vous permettra de construire un marketplace e-commerce sophistiqué de niveau enterprise, avec une excellente DX et UX. 🚀