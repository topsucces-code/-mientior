# 🧪 TestSprite Testing Guide - Mientior Marketplace

## Overview

This guide helps you run comprehensive automated tests on the Mientior e-commerce platform using TestSprite.

## Prerequisites

### 1. Environment Setup

Ensure these are running:

```bash
# Check if dev server is running
curl -s http://localhost:3000 | grep -q "Mientior" && echo "✅ Dev server running" || echo "❌ Start dev server"

# Check if database is accessible
npm run db:studio &
sleep 2
pkill -f "prisma studio"
echo "✅ Database accessible"

# Check if Redis is running (for sessions/cache)
redis-cli ping 2>/dev/null && echo "✅ Redis running" || echo "⚠️ Redis not running (optional)"
```

### 2. Database Seeding

Before running tests, seed your database with test data:

```bash
# Option 1: Use Prisma seed (if working)
npm run db:seed

# Option 2: Manual SQL seed (if Prisma seed fails)
psql postgresql://mientior:mientior_password_2024@localhost:5432/mientior_db?schema=app < /tmp/quick-seed.sql
```

### 3. Test User Credentials

Create a verified test user for authentication tests:

```bash
npm run db:seed:admin
# Or manually create via Prisma Studio
```

## Running TestSprite Tests

### Method 1: Via MCP (Recommended)

If the MCP connection is working:

1. Ensure dev server is running: `npm run dev`
2. Use Kiro command palette or ask: "Run TestSprite tests on my project"
3. TestSprite will automatically:
   - Generate test plan from codebase
   - Execute tests against localhost:3000
   - Generate detailed report

### Method 2: Via CLI

```bash
# Install TestSprite globally (if needed)
npm install -g @testsprite/testsprite-mcp

# Run tests
npx @testsprite/testsprite-mcp test \
  --url http://localhost:3000 \
  --type frontend \
  --scope codebase \
  --output ./testsprite_tests
```

### Method 3: Manual Test Execution

If you want to run specific test files:

```bash
cd testsprite_tests

# Run a specific test
python TC001_Homepage_Load_and_Element_Visibility.py

# Run all tests
for test in TC*.py; do
  echo "Running $test..."
  python "$test"
done
```

## Test Coverage

Based on your existing test suite, TestSprite covers:

### ✅ Core E-Commerce Features
- **TC001**: Homepage load and navigation
- **TC002**: Product catalog filtering and pagination
- **TC003**: Product detail view and variants
- **TC005**: Shopping cart functionality
- **TC006**: Multi-step checkout flow

### ✅ Authentication & User Management
- **TC004**: User registration and login (Better Auth)
- **TC007**: User account dashboard
- **TC008**: Global search with autocomplete

### ✅ Admin Panel (Refine.dev)
- **TC009**: Product CRUD operations
- **TC010**: Cache invalidation and ISR
- **TC011**: Promo codes application
- **TC012**: Real-time notifications (Pusher)
- **TC015**: Audit logging

### ✅ Quality & Performance
- **TC013**: Accessibility compliance (WCAG 2.1 AA)
- **TC014**: API pagination and filtering
- **TC018**: Responsive UI (mobile/desktop)
- **TC020**: Security enforcement

### ✅ Advanced Features
- **TC016**: Wishlist management
- **TC017**: Product reviews and ratings
- **TC019**: Order creation and webhooks

## Common Issues & Solutions

### Issue 1: Image 400 Errors

**Problem**: Tests fail with "400 Bad Request" on placeholder images

**Solution**: 
```bash
# Check if SVG placeholders exist
ls -la public/placeholder-*.svg

# If missing, create them or update image references in components
```

### Issue 2: Category 404 Errors

**Problem**: `/categories/electronique` returns 404

**Solution**:
```bash
# Ensure category route exists
ls -la src/app/\(app\)/categories/\[slug\]/page.tsx

# Verify categories in database
npm run db:studio
# Check "categories" table has slug "electronique"
```

### Issue 3: React Hydration Errors

**Problem**: "Hydration failed" errors in console

**Solution**: Check these components:
- Remove `style={{caretColor: "transparent"}}` from inputs
- Avoid `Date.now()` or `Math.random()` in SSR
- Use `useEffect` for client-only code

### Issue 4: Authentication Required

**Problem**: Tests fail because routes require login

**Solution**:
```typescript
// In testsprite_tests/config.py or test setup
TEST_USER = {
  "email": "test@example.com",
  "password": "TestPassword123!"
}

// Ensure this user exists and is verified in database
```

### Issue 5: Empty Database

**Problem**: No products/categories found during tests

**Solution**:
```bash
# Re-seed database
npm run db:push  # Apply schema
npm run db:seed  # Seed data

# Verify data exists
npm run db:studio
```

## Interpreting Test Results

### Test Report Location

After running tests, find reports at:
- **Markdown Report**: `testsprite_tests/testsprite-mcp-test-report.md`
- **JSON Results**: `testsprite_tests/tmp/test_results.json`
- **Video Recordings**: Links in the report (TestSprite dashboard)

### Success Criteria

A test passes when:
- ✅ All assertions pass
- ✅ No critical errors (500, 404 on expected routes)
- ✅ Page loads within timeout (default 30s)
- ✅ Expected elements are visible and interactive

### Failure Analysis

When tests fail, check:
1. **Console errors** in the report
2. **Network errors** (API failures)
3. **Element not found** (selector issues)
4. **Timeout errors** (performance issues)

## Best Practices

### Before Running Tests

1. ✅ Start dev server: `npm run dev`
2. ✅ Seed database: `npm run db:seed`
3. ✅ Clear browser cache (TestSprite uses headless Chrome)
4. ✅ Check no other process on port 3000

### During Test Execution

- Don't interact with the dev server
- Let tests run completely (15-20 minutes)
- Monitor console for errors
- Check database isn't locked

### After Tests

1. Review the generated report
2. Fix critical issues first (🔴)
3. Address high-priority issues (🟡)
4. Re-run failed tests individually
5. Update test data if needed

## Test Maintenance

### Updating Tests

When you change features:

```bash
# Regenerate test plan
npx @testsprite/testsprite-mcp generate-plan \
  --url http://localhost:3000 \
  --output ./testsprite_tests

# Review and commit new test files
git add testsprite_tests/
git commit -m "Update TestSprite tests for [feature]"
```

### Adding Custom Tests

Create new test files following the pattern:

```python
# testsprite_tests/TC021_Custom_Feature.py
from playwright.sync_api import Page, expect

def test_custom_feature(page: Page):
    """Test description"""
    page.goto("http://localhost:3000/custom-route")
    expect(page.locator("h1")).to_contain_text("Expected Text")
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: TestSprite E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup database
        run: |
          npm run db:push
          npm run db:seed
      
      - name: Start dev server
        run: npm run dev &
        
      - name: Wait for server
        run: npx wait-on http://localhost:3000
      
      - name: Run TestSprite
        run: npx @testsprite/testsprite-mcp test --url http://localhost:3000
        env:
          TESTSPRITE_API_KEY: ${{ secrets.TESTSPRITE_API_KEY }}
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: testsprite-results
          path: testsprite_tests/
```

## Troubleshooting

### MCP Connection Issues

If TestSprite MCP won't connect:

```bash
# Check MCP configuration
cat ~/.kiro/settings/mcp.json

# Verify TestSprite is installed
npx @testsprite/testsprite-mcp --version

# Reconnect MCP server
# In Kiro: Cmd+Shift+P → "MCP: Reconnect Server" → Select "TestSprite"
```

### Port Already in Use

```bash
# Find process on port 3000
lsof -i :3000

# Kill it if needed
kill -9 <PID>

# Restart dev server
npm run dev
```

### Database Connection Errors

```bash
# Test database connection
psql postgresql://mientior:mientior_password_2024@localhost:5432/mientior_db

# Reset database if needed
npm run db:push --force-reset
npm run db:seed
```

## Support & Resources

- **TestSprite Dashboard**: https://www.testsprite.com/dashboard
- **TestSprite Docs**: https://docs.testsprite.com
- **Mientior Docs**: See `docs/` folder
- **Test Plan**: `testsprite_tests/testsprite_frontend_test_plan.json`

## Next Steps

1. Fix issues from previous test report (see `testsprite-mcp-test-report.md`)
2. Run fresh tests after fixes
3. Achieve 80%+ test pass rate
4. Integrate into CI/CD pipeline
5. Schedule regular test runs (daily/weekly)

---

**Last Updated**: November 20, 2025
**Maintainer**: Mientior Development Team
