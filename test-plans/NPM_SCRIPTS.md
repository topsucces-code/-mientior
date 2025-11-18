# NPM Scripts for Testing

Add these scripts to your `package.json` for easier test execution.

## Recommended Scripts to Add

```json
{
  "scripts": {
    // ... existing scripts ...
    
    // Testing
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathIgnorePatterns=e2e integration",
    "test:integration": "jest --testPathPattern=integration",
    "test:api": "jest --testPathPattern=api",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    
    // Playwright specific
    "playwright:install": "playwright install --with-deps",
    "playwright:report": "playwright show-report",
    "playwright:codegen": "playwright codegen http://localhost:3000",
    
    // Test database
    "db:test:setup": "dotenv -e .env.test -- prisma migrate deploy",
    "db:test:seed": "dotenv -e .env.test -- prisma db seed",
    "db:test:reset": "dotenv -e .env.test -- prisma migrate reset --force",
    
    // Performance testing
    "lighthouse": "lighthouse http://localhost:3000 --view",
    "lighthouse:ci": "lhci autorun",
    
    // Load testing
    "load:test": "artillery run artillery-config.yml",
    
    // All tests (CI)
    "test:ci": "npm run test:coverage && npm run test:e2e",
    
    // Pre-commit hooks
    "precommit": "npm run lint && npm run test:unit"
  }
}
```

## Usage Examples

### Unit Tests

```bash
# Run all unit tests
npm test

# Watch mode (for development)
npm run test:watch

# With coverage report
npm run test:coverage

# Run specific test file
npm test -- src/components/cart/cart-item.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should update quantity"
```

### Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run API tests only
npm run test:api

# Run with verbose output
npm run test:integration -- --verbose
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (visual)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through)
npm run test:e2e:debug

# Run specific test file
npm run test:e2e -- e2e/checkout.spec.ts

# Run on specific browser
npm run test:e2e -- --project=chromium

# Generate test code (record actions)
npm run playwright:codegen

# View last test report
npm run playwright:report
```

### Test Database

```bash
# Set up test database
npm run db:test:setup

# Seed test data
npm run db:test:seed

# Reset test database
npm run db:test:reset
```

### Performance & Load Testing

```bash
# Run Lighthouse audit
npm run lighthouse

# Run in CI mode
npm run lighthouse:ci

# Load testing with Artillery
npm run load:test
```

### CI/CD

```bash
# Run full test suite (like CI would)
npm run test:ci

# Pre-commit checks
npm run precommit
```

## Complete package.json Example

```json
{
  "name": "mientior-marketplace",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    // Development
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "format": "prettier --write \"**/*.{js,ts,tsx,json,md}\"",
    
    // Database
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "db:seed:admin": "tsx prisma/seed-admin.ts",
    
    // Testing - Unit & Integration
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathIgnorePatterns=e2e integration",
    "test:integration": "jest --testPathPattern=integration",
    "test:api": "jest --testPathPattern=api",
    
    // Testing - E2E
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "playwright:install": "playwright install --with-deps",
    "playwright:report": "playwright show-report",
    "playwright:codegen": "playwright codegen http://localhost:3000",
    
    // Testing - Database
    "db:test:setup": "dotenv -e .env.test -- prisma migrate deploy",
    "db:test:seed": "dotenv -e .env.test -- prisma db seed",
    "db:test:reset": "dotenv -e .env.test -- prisma migrate reset --force",
    
    // Testing - Performance
    "lighthouse": "lighthouse http://localhost:3000 --view",
    "lighthouse:ci": "lhci autorun",
    "load:test": "artillery run artillery-config.yml",
    
    // CI/CD
    "test:ci": "npm run lint && npm run test:coverage && npm run test:e2e",
    "precommit": "npm run lint && npm run test:unit",
    
    // Other
    "email:dev": "node ./scripts/send-test-email.js",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    // ... your existing dependencies
  },
  "devDependencies": {
    // ... existing dev dependencies ...
    
    // Testing dependencies
    "@playwright/test": "^1.40.0",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "@types/jest": "^29.5.11",
    "@types/supertest": "^6.0.2",
    "artillery": "^2.0.0",
    "dotenv-cli": "^7.3.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "jest-environment-node": "^29.7.0",
    "lighthouse": "^11.4.0",
    "@lhci/cli": "^0.13.0",
    "msw": "^2.0.11",
    "supertest": "^6.3.3"
  }
}
```

## Additional Dependencies to Install

```bash
# Core testing libraries
npm install --save-dev \
  @playwright/test \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest \
  jest-environment-jsdom \
  supertest

# Type definitions
npm install --save-dev \
  @types/jest \
  @types/supertest

# Performance testing
npm install --save-dev \
  lighthouse \
  @lhci/cli \
  artillery

# Utilities
npm install --save-dev \
  dotenv-cli \
  msw
```

## Git Hooks (Husky)

Optional: Add pre-commit hooks to run tests automatically

```bash
# Install Husky
npm install --save-dev husky

# Initialize
npx husky init

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run precommit"
```

Then create `.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint
npm run test:unit
```

## VS Code Tasks

Create `.vscode/tasks.json` for quick test running in VS Code:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Run Unit Tests",
      "type": "npm",
      "script": "test",
      "problemMatcher": [],
      "group": "test"
    },
    {
      "label": "Run E2E Tests",
      "type": "npm",
      "script": "test:e2e",
      "problemMatcher": [],
      "group": "test"
    },
    {
      "label": "Test with Coverage",
      "type": "npm",
      "script": "test:coverage",
      "problemMatcher": [],
      "group": "test"
    }
  ]
}
```

## Summary

After adding these scripts, your testing workflow becomes:

**Development**:
```bash
npm run test:watch  # Auto-run tests on file changes
```

**Before Commit**:
```bash
npm run precommit  # Lint + unit tests
```

**Before Deploy**:
```bash
npm run test:ci  # Full test suite
```

**Debugging**:
```bash
npm run test:e2e:debug  # Step through E2E tests
npm run playwright:codegen  # Generate new tests
```

Easy! 🚀
