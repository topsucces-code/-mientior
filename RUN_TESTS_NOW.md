# 🚀 Quick Start: Run TestSprite Tests NOW

## Pre-Flight Checklist (2 minutes)

Run these commands to verify everything is ready:

```bash
# 1. Check dev server (should return 200)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Expected: 200

# 2. Check database connection
npm run db:studio &
sleep 2
pkill -f "prisma studio"
# Expected: Prisma Studio opens briefly

# 3. Verify test data exists
echo "SELECT COUNT(*) FROM products;" | psql postgresql://mientior:mientior_password_2024@localhost:5432/mientior_db?schema=app
# Expected: count > 0

# 4. Check Redis (optional but recommended)
redis-cli ping 2>/dev/null
# Expected: PONG
```

## Option A: Run via Kiro (Easiest)

1. Make sure your dev server is running: `npm run dev`
2. In Kiro chat, type: **"Run TestSprite tests on the entire codebase"**
3. Wait 15-20 minutes for completion
4. Review report in `testsprite_tests/testsprite-mcp-test-report.md`

## Option B: Run via Command Line

```bash
# Ensure dev server is running
npm run dev &

# Wait for server to be ready
sleep 5

# Run TestSprite
npx @testsprite/testsprite-mcp@latest test \
  --url http://localhost:3000 \
  --type frontend \
  --scope codebase \
  --output ./testsprite_tests

# View results
cat testsprite_tests/testsprite-mcp-test-report.md
```

## Option C: Run Individual Tests

```bash
cd testsprite_tests

# Install Playwright if needed
pip install playwright
playwright install chromium

# Run specific test
python TC001_Homepage_Load_and_Element_Visibility.py

# Run all tests
for test in TC*.py; do
  echo "▶️  Running $test..."
  python "$test" || echo "❌ Failed: $test"
done
```

## Quick Fixes for Common Blockers

### If database is empty:

```bash
# Quick seed with essential data
cat > /tmp/quick-seed.sql << 'EOF'
INSERT INTO categories (id, name, slug, description, "isActive", "order", "createdAt", "updatedAt")
VALUES 
  ('cat-1', 'Électronique', 'electronique', 'Produits électroniques', true, 1, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO products (id, name, slug, description, price, stock, status, "categoryId", "approvalStatus", "createdAt", "updatedAt")
VALUES 
  ('prod-1', 'Exclusive Limited Edition Product', 'exclusive-limited-edition-product', 'Test product', 299.99, 50, 'ACTIVE', 'cat-1', 'APPROVED', NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
EOF

psql postgresql://mientior:mientior_password_2024@localhost:5432/mientior_db?schema=app < /tmp/quick-seed.sql
```

### If MCP won't connect:

```bash
# Reconnect TestSprite MCP
# In Kiro: Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Linux/Windows)
# Type: "MCP: Reconnect Server"
# Select: "TestSprite"
# Wait for "Connected" status
```

### If port 3000 is busy:

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Restart dev server
npm run dev
```

## What to Expect

### Test Duration
- **Full suite**: 15-20 minutes
- **Single test**: 30-60 seconds
- **With video recording**: +20% time

### Test Output
- ✅ **Pass**: Green checkmark, no errors
- ❌ **Fail**: Red X, error details in report
- ⚠️ **Skip**: Yellow warning, dependency missing

### Report Location
- **Main report**: `testsprite_tests/testsprite-mcp-test-report.md`
- **JSON data**: `testsprite_tests/tmp/test_results.json`
- **Videos**: Links in report (TestSprite dashboard)
- **Screenshots**: `testsprite_tests/tmp/screenshots/`

## After Tests Complete

1. **Review the report**:
   ```bash
   cat testsprite_tests/testsprite-mcp-test-report.md | less
   ```

2. **Check pass rate**:
   ```bash
   grep -E "Tests (Réussis|Échoués)" testsprite_tests/testsprite-mcp-test-report.md
   ```

3. **Identify critical issues**:
   ```bash
   grep "🔴" testsprite_tests/testsprite-mcp-test-report.md
   ```

4. **Fix and re-run**:
   - Fix critical issues first
   - Re-run failed tests only
   - Iterate until 80%+ pass rate

## Need Help?

- **MCP not working?** → See `TESTSPRITE_GUIDE.md` → "Troubleshooting"
- **Tests failing?** → Check previous report: `testsprite_tests/testsprite-mcp-test-report.md`
- **Database issues?** → Run: `npm run db:push && npm run db:seed`
- **Port conflicts?** → Run: `lsof -ti:3000 | xargs kill -9`

---

**Ready to test?** Run: `npm run dev` then ask Kiro to run TestSprite! 🚀
