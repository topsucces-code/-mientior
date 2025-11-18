# Testing Setup Guide - Mientior E-Commerce

## Overview

This guide will help you set up automated and manual testing for the Mientior e-commerce platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Testing Stack](#testing-stack)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Running Tests](#running-tests)
6. [CI/CD Integration](#cicd-integration)

---

## Prerequisites

- Node.js >= 20
- PostgreSQL database (for integration tests)
- Redis instance (for session/cache tests)
- Test payment gateway credentials (Paystack/Flutterwave sandbox)

---

## Testing Stack

### Frontend Testing
- **Jest** - Test runner
- **React Testing Library** - Component testing
- **Playwright** or **Cypress** - E2E testing
- **MSW (Mock Service Worker)** - API mocking

### Backend Testing
- **Jest** - Test runner
- **Supertest** - HTTP assertion library
- **Prisma Test Environment** - Database isolation

### Performance Testing
- **Lighthouse CI** - Performance metrics
- **Artillery** - Load testing

---

## Installation

### 1. Install Testing Dependencies

```bash
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @playwright/test \
  jest \
  jest-environment-jsdom \
  supertest \
  msw \
  @types/jest \
  @types/supertest
```

### 2. Configure Jest

Create `jest.config.js`:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

Create `jest.setup.js`:

```javascript
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000'
```

### 3. Configure Playwright

```bash
npx playwright install
```

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

---

## Configuration

### 1. Test Database Setup

Create `.env.test`:

```bash
PRISMA_DATABASE_URL="postgresql://user:password@localhost:5432/mientior_test"
REDIS_URL="redis://localhost:6379/1"
BETTER_AUTH_SECRET="test-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Test Payment Gateway Keys
PAYSTACK_SECRET_KEY="sk_test_xxxxx"
FLUTTERWAVE_SECRET_KEY="FLWSECK_TEST-xxxxx"

# Disable external services in tests
NODE_ENV="test"
```

### 2. Database Test Isolation

Create `prisma/test-environment.js`:

```javascript
const { execSync } = require('child_process')
const NodeEnvironment = require('jest-environment-node').default

class PrismaTestEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup()
    
    // Generate unique database for this test
    const schema = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const databaseUrl = `postgresql://user:password@localhost:5432/${schema}`
    
    this.global.process.env.PRISMA_DATABASE_URL = databaseUrl
    
    // Create schema and run migrations
    execSync(`npx prisma migrate deploy`)
    execSync(`npx prisma db seed`)
  }

  async teardown() {
    // Drop test database
    const schema = this.global.process.env.PRISMA_DATABASE_URL.split('/').pop()
    execSync(`dropdb ${schema}`)
    
    await super.teardown()
  }
}

module.exports = PrismaTestEnvironment
```

---

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- src/components/cart/cart-item.test.tsx
```

### Integration Tests

```bash
# Run API integration tests
npm test -- --testPathPattern=api

# Run database integration tests
npm test -- --testPathPattern=integration
```

### E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test e2e/checkout.spec.ts

# Run with specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug
```

### Performance Tests

```bash
# Run Lighthouse CI
npm run lighthouse

# Run load tests with Artillery
artillery run artillery-config.yml
```

---

## Test Structure

```
mientior/
├── __tests__/              # Unit tests (colocated with source)
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── stores/
├── e2e/                    # E2E tests (Playwright)
│   ├── auth.spec.ts
│   ├── cart.spec.ts
│   ├── checkout.spec.ts
│   └── product.spec.ts
├── integration/            # API integration tests
│   ├── api/
│   │   ├── products.test.ts
│   │   ├── orders.test.ts
│   │   └── auth.test.ts
│   └── database/
│       └── prisma.test.ts
├── mocks/                  # MSW handlers
│   ├── handlers/
│   └── server.ts
└── test-plans/             # Manual test plans (this folder)
    ├── FRONTEND_TEST_PLAN.md
    ├── BACKEND_TEST_PLAN.md
    └── TESTING_SETUP_GUIDE.md
```

---

## Example Tests

### Component Test Example

```typescript
// __tests__/components/cart/cart-item.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { CartItem } from '@/components/cart/cart-item'

describe('CartItem', () => {
  const mockItem = {
    id: '1',
    name: 'Test Product',
    price: 99.99,
    quantity: 2,
    image: '/test.jpg'
  }

  it('renders cart item correctly', () => {
    render(<CartItem item={mockItem} />)
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
  })

  it('updates quantity on button click', () => {
    const onUpdateQty = jest.fn()
    render(<CartItem item={mockItem} onUpdateQty={onUpdateQty} />)
    
    const increaseBtn = screen.getByRole('button', { name: '+' })
    fireEvent.click(increaseBtn)
    
    expect(onUpdateQty).toHaveBeenCalledWith(mockItem.id, 3)
  })
})
```

### API Test Example

```typescript
// integration/api/products.test.ts
import request from 'supertest'
import { prisma } from '@/lib/prisma'

describe('Products API', () => {
  beforeEach(async () => {
    await prisma.product.deleteMany()
  })

  describe('GET /api/products', () => {
    it('returns paginated products', async () => {
      // Seed test data
      await prisma.product.createMany({
        data: [
          { name: 'Product 1', slug: 'product-1', price: 10 },
          { name: 'Product 2', slug: 'product-2', price: 20 },
        ]
      })

      const response = await request('http://localhost:3000')
        .get('/api/products?_start=0&_end=10')
        .expect(200)

      expect(response.body).toHaveLength(2)
      expect(response.headers['x-total-count']).toBe('2')
    })

    it('filters products by category', async () => {
      const category = await prisma.category.create({
        data: { name: 'Electronics', slug: 'electronics' }
      })

      await prisma.product.create({
        data: {
          name: 'Laptop',
          slug: 'laptop',
          price: 999,
          categoryId: category.id
        }
      })

      const response = await request('http://localhost:3000')
        .get(`/api/products?categoryId=${category.id}`)
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0].name).toBe('Laptop')
    })
  })

  describe('POST /api/products', () => {
    it('creates a new product', async () => {
      const category = await prisma.category.create({
        data: { name: 'Books', slug: 'books' }
      })

      const productData = {
        name: 'Test Book',
        slug: 'test-book',
        price: 29.99,
        categoryId: category.id,
        stock: 10
      }

      const response = await request('http://localhost:3000')
        .post('/api/products')
        .send(productData)
        .expect(201)

      expect(response.body.name).toBe('Test Book')
      expect(response.body.price).toBe(29.99)
    })
  })
})
```

### E2E Test Example

```typescript
// e2e/checkout.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')
  })

  test('complete checkout with Paystack', async ({ page }) => {
    // Add product to cart
    await page.goto('/products/test-product')
    await page.click('button:has-text("Add to Cart")')
    
    // Go to cart
    await page.click('[aria-label="Cart"]')
    await expect(page.locator('.cart-item')).toBeVisible()
    
    // Proceed to checkout
    await page.click('text=Proceed to Checkout')
    
    // Fill shipping form
    await page.fill('[name="firstName"]', 'John')
    await page.fill('[name="lastName"]', 'Doe')
    await page.fill('[name="address"]', '123 Test St')
    await page.fill('[name="city"]', 'Test City')
    await page.fill('[name="postalCode"]', '12345')
    await page.fill('[name="phone"]', '+1234567890')
    
    // Select shipping method
    await page.click('text=Standard Shipping')
    
    // Click next to payment
    await page.click('text=Continue to Payment')
    
    // Select Paystack
    await page.click('text=Pay with Paystack')
    
    // Fill payment form (test mode)
    // Note: In real tests, use Paystack test cards
    await page.fill('[name="cardNumber"]', '4084084084084081')
    await page.fill('[name="cvv"]', '408')
    await page.fill('[name="expiryDate"]', '12/25')
    
    // Submit payment
    await page.click('button:has-text("Pay Now")')
    
    // Verify order confirmation
    await expect(page).toHaveURL(/\/checkout\/confirmation/)
    await expect(page.locator('h1:has-text("Order Confirmed")')).toBeVisible()
    
    // Verify order number displayed
    const orderNumber = await page.locator('[data-testid="order-number"]').textContent()
    expect(orderNumber).toMatch(/^ORD-\d+/)
  })
})
```

---

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup database
        run: npx prisma migrate deploy
        env:
          PRISMA_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npx playwright test
        env:
          PRISMA_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test Coverage Goals

- **Unit Tests**: > 80% coverage
- **Integration Tests**: Critical API endpoints
- **E2E Tests**: Core user flows (auth, cart, checkout)
- **Performance**: Lighthouse score > 90

---

## Best Practices

1. **Write tests before fixing bugs** (TDD for bug fixes)
2. **Keep tests isolated** (no shared state)
3. **Use descriptive test names** (what, when, expected)
4. **Mock external dependencies** (payment gateways, email)
5. **Test user behavior, not implementation**
6. **Run tests in CI/CD pipeline**
7. **Monitor test execution time** (optimize slow tests)
8. **Use test data factories** (avoid hardcoding)

---

## Troubleshooting

### Common Issues

**Issue**: Tests fail due to database connection
**Solution**: Ensure PostgreSQL is running and DATABASE_URL is correct

**Issue**: Playwright tests timeout
**Solution**: Increase timeout in playwright.config.ts or use `test.setTimeout(30000)`

**Issue**: Redis connection errors
**Solution**: Verify Redis is running and REDIS_URL is accessible

**Issue**: API tests fail with 401
**Solution**: Ensure test user is created and auth token is valid

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Next.js Testing](https://nextjs.org/docs/testing)

---

## Next Steps

1. Set up testing infrastructure (install dependencies)
2. Write unit tests for critical components
3. Create integration tests for main API endpoints
4. Implement E2E tests for checkout flow
5. Set up CI/CD pipeline
6. Monitor test coverage and improve
