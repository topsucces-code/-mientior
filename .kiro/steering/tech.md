# Tech Stack

## Framework & Runtime

- **Next.js 15** with App Router (React Server Components)
- **React 19** with TypeScript 5.3
- **Node.js >= 20** required

## Database & ORM

- **PostgreSQL** as primary database
- **Prisma ORM 5.19** for database access
- **Redis** (ioredis) for caching, sessions, and distributed locks

## Authentication

- **Better Auth 1.0** for authentication
- Session-based auth with Redis caching
- OAuth support (Google configured)
- Email/password authentication

## Payment Processing

- **Paystack** (primary African payment gateway)
- **Flutterwave** (secondary African payment gateway)
- Stripe installed but not actively used
- Apple Pay, Google Pay, PayPal integration ready

## Admin Panel

- **Refine.dev 5.0** as admin framework
- **Ant Design 5.28** for admin UI components
- Simple REST data provider
- RBAC with 5 roles and 22 permissions

## UI & Styling

- **Tailwind CSS 3.4** with custom design system
- **shadcn/ui** components (Radix UI primitives)
- **Framer Motion** for animations
- Custom color palette: Orange (#FF6B00), Blue (#1E3A8A), Aurore (#FFC107)
- Typography: Inter (body), Poppins (headings)

## State Management

- **Zustand 4.5** for client state (cart, wishlist, preferences)
- **React Query 5.0** (@tanstack/react-query) for server state
- **SWR** for some data fetching

## Form Handling & Validation

- **React Hook Form 7.66** for forms
- **Zod 3.25** for schema validation
- **@hookform/resolvers** for integration

## Email & Notifications

- **Resend 1.0** for transactional emails
- **Pusher** for real-time notifications (admin panel)

## Testing

- **Vitest 4.0** as test runner
- **@vitest/ui** for test UI
- Fast-check for property-based testing

## Code Quality

- **ESLint** with Next.js and TypeScript configs
- **Prettier 3.3** with Tailwind plugin
- **TypeScript strict mode** enabled

## Build Tools

- **SWC** compiler (Next.js default)
- **PostCSS** with Autoprefixer
- **Sharp** for image optimization

## Common Commands

```bash
# Development
npm run dev                    # Start dev server (localhost:3000)

# Database
npm run db:push               # Push schema changes to database
npm run db:studio             # Open Prisma Studio GUI
npx prisma generate           # Generate Prisma Client types
npx prisma migrate dev        # Create and apply migration
npm run db:seed               # Seed database with sample data
npm run db:seed:admin         # Create admin user

# Build & Production
npm run build                 # Production build
npm start                     # Start production server

# Code Quality
npm run lint                  # Run ESLint
npm run format                # Format with Prettier

# Testing
npm test                      # Run tests once
npm run test:watch            # Run tests in watch mode
npm run test:ui               # Open Vitest UI
npm run test:security         # Run security tests

# Utilities
npm run security:check        # Check security headers
npm run security:headers      # Validate security headers
```

## Environment Setup

Required environment variables (see `.env.example`):

```bash
# Database
PRISMA_DATABASE_URL="postgresql://..."

# Redis
REDIS_URL="redis://..."

# Better Auth
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"

# Payment Gateways
PAYSTACK_SECRET_KEY="sk_..."
FLUTTERWAVE_SECRET_KEY="FLWSECK-..."
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_..."
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY="FLWPUBK-..."

# Email
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"

# Optional
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
INSTAGRAM_ACCESS_TOKEN="..."
PUSHER_APP_ID="..."
SENTRY_DSN="..."
```

## Path Aliases

TypeScript path aliases configured in `tsconfig.json`:

- `@/*` → `src/*`
- `@/components/*` → `src/components/*`
- `@/lib/*` → `src/lib/*`
- `@/app/*` → `src/app/*`
- `@/stores/*` → `src/stores/*`

## Key Libraries

- **clsx** + **tailwind-merge** → `cn()` utility for className merging
- **date-fns** → Date manipulation
- **currency.js** → Currency formatting
- **lucide-react** → Icon library
- **recharts** → Charts for admin dashboard
- **react-dropzone** → File uploads
- **exceljs** + **papaparse** → CSV/Excel import/export
- **@dnd-kit** → Drag and drop functionality
- **sonner** → Toast notifications
