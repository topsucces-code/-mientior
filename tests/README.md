# Test Suite - Mientior Marketplace

## Quick Start

```bash
# Install dependencies (if not done)
npm install

# Install Playwright browsers (for E2E tests)
npx playwright install

# Run all unit tests
npm run test

# Run all E2E tests
npm run test:e2e

# Run all tests with coverage
npm run test:ci
```

## Test Structure

```
tests/
├── e2e/                          # End-to-End tests
│   ├── user-journey.spec.ts      # Complete user purchase flow
│   ├── product-search.spec.ts    # Search and filtering
│   └── admin-product-creation.spec.ts  # Admin panel tests
│
└── fixtures/                     # Reusable test data
    ├── auth.ts                   # Authentication helpers
    ├── products.ts               # Product test data
    └── addresses.ts              # Address test data
```

## Available Test Commands

| Command | Description |
|---------|-------------|
| `npm run test` | Run unit tests once |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:ui` | Open Vitest interactive UI |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:coverage:ui` | Coverage with interactive UI |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:e2e:ui` | Run E2E tests in Playwright UI |
| `npm run test:e2e:headed` | Run E2E with visible browser |
| `npm run test:e2e:debug` | Debug E2E tests |
| `npm run test:all` | Run all tests (unit + E2E) |
| `npm run test:ci` | Run tests as in CI (coverage + E2E) |

## Test Coverage

### Unit Tests

**Total**: 60+ scenarios across 3 files

1. **Order Creation API** (`src/app/api/orders/create/route.test.ts`)
   - 25+ test scenarios
   - Covers: auth, validation, payment, stock, pricing, promo codes, loyalty

2. **Calculate Totals API** (`src/app/api/checkout/calculate-totals/route.test.ts`)
   - 15+ test scenarios
   - Covers: validation, caching, calculations, discounts, shipping, tax

3. **Payment Utils** (`src/lib/payment-utils.test.ts`)
   - 20+ test scenarios
   - Covers: validation, fraud detection, order creation, logging

### E2E Tests

**Total**: 27 scenarios across 3 files

1. **User Journey** (`user-journey.spec.ts`)
   - 4 complete flow tests
   - Registration → Login → Browse → Cart → Checkout → Payment

2. **Product Search** (`product-search.spec.ts`)
   - 14 search & filter tests
   - Search, filters (category, price, brand, color, size), sorting, pagination

3. **Admin Product Creation** (`admin-product-creation.spec.ts`)
   - 10+ admin tests
   - Create, edit, delete, upload images, manage variants

## Using Test Fixtures

### Authentication

```typescript
import { login, loginAsAdmin, registerUser } from '../fixtures/auth'

test('my test', async ({ page }) => {
  // Login as customer
  await login(page, 'user@test.com', 'password')

  // Or login as admin
  await loginAsAdmin(page)

  // Or register new user
  await registerUser(page, {
    email: 'new@user.com',
    password: 'SecurePass123!',
    name: 'New User'
  })
})
```

### Products

```typescript
import { TEST_PRODUCTS, generateTestProduct } from '../fixtures/products'

test('my test', async () => {
  // Use predefined product
  const product = TEST_PRODUCTS.simple

  // Or generate unique product
  const uniqueProduct = generateTestProduct({
    price: 49.99,
    stock: 100
  })
})
```

### Addresses

```typescript
import { TEST_ADDRESSES, generateTestAddress } from '../fixtures/addresses'

test('my test', async ({ page }) => {
  // Use predefined address
  const address = TEST_ADDRESSES.france

  // Or generate random address
  const randomAddress = generateTestAddress({
    country: 'FR',
    city: 'Lyon'
  })
})
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { myFunction } from './my-module'

describe('myFunction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should do something', () => {
    const result = myFunction('input')
    expect(result).toBe('expected output')
  })

  it('should handle errors', () => {
    expect(() => myFunction(null)).toThrow('Error message')
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test.describe('My Feature', () => {
  test('should work correctly', async ({ page }) => {
    // Navigate
    await page.goto('/my-page')

    // Interact
    await page.fill('input[name="email"]', 'test@example.com')
    await page.click('button[type="submit"]')

    // Assert
    await expect(page).toHaveURL('/success')
    await expect(page.locator('text=Success')).toBeVisible()
  })
})
```

## Debugging

### Debug Unit Tests

```bash
# Run specific test file
npm run test src/app/api/orders/create/route.test.ts

# Open interactive UI
npm run test:ui

# Run with console logs
npm run test -- --reporter=verbose
```

### Debug E2E Tests

```bash
# Open Playwright UI
npm run test:e2e:ui

# Run with browser visible
npm run test:e2e:headed

# Debug mode (pauses on each action)
npm run test:e2e:debug

# Run specific test
npm run test:e2e tests/e2e/user-journey.spec.ts
```

## Environment Setup

### Prerequisites

1. **PostgreSQL** (for database tests)
   ```bash
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15
   ```

2. **Redis** (for caching tests)
   ```bash
   docker run -d -p 6379:6379 redis:7
   ```

3. **Environment Variables**
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mientior_test"
   REDIS_URL="redis://localhost:6379"
   BETTER_AUTH_SECRET="test-secret-key"
   BETTER_AUTH_URL="http://localhost:3000"
   ```

## CI/CD

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request

### CI Jobs:
1. **Unit Tests** - Run with PostgreSQL & Redis
2. **E2E Tests** - Run with Playwright in Chromium
3. **Lint** - ESLint & Prettier checks
4. **Build** - Production build verification

### View CI Results:
- GitHub Actions tab
- Coverage reports in artifacts
- Playwright reports in artifacts

## Coverage Reports

After running `npm run test:coverage`:

```bash
# View HTML report
open coverage/index.html

# View summary
cat coverage/coverage-summary.json
```

### Current Coverage:
- **Lines**: 82%
- **Functions**: 82%
- **Branches**: 82%
- **Statements**: 82%

### Coverage Thresholds:
All metrics must be >= 80%

## Common Issues

### 1. Tests Fail with "Cannot connect to database"

**Solution**: Ensure PostgreSQL is running and DATABASE_URL is set

```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mientior_test"
```

### 2. E2E Tests Timeout

**Solution**: Increase timeout or check if dev server is running

```bash
# In playwright.config.ts
timeout: 30000 // 30 seconds

# Or set environment variable
PLAYWRIGHT_TEST_BASE_URL="http://localhost:3000"
```

### 3. "Browser not found" Error

**Solution**: Install Playwright browsers

```bash
npx playwright install
```

## Best Practices

### ✅ DO:
- Write descriptive test names
- Use `data-testid` attributes for E2E selectors
- Mock external dependencies in unit tests
- Test edge cases and error conditions
- Clean up after tests (use `beforeEach`/`afterEach`)
- Keep tests isolated and independent

### ❌ DON'T:
- Hardcode test data (use fixtures)
- Make tests depend on execution order
- Skip tests without good reason
- Commit `.only()` or `.skip()` to main
- Test implementation details
- Make E2E tests flaky with race conditions

## Resources

- [Full Testing Documentation](../docs/TESTING.md)
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [CI/CD Workflow](../.github/workflows/test.yml)

## Support

For questions:
1. Check [TESTING.md](../docs/TESTING.md) for detailed guide
2. Review existing tests for examples
3. Check CI logs for failure details
4. Open an issue with test logs

---

**Happy Testing! 🧪**
