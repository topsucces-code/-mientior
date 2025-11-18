# Quick Start - Testing Guide

## 🚀 Get Started in 5 Minutes

### 1. Review Your Test Plans (2 min)

**Frontend Developers**:
```bash
# Open frontend test plan
cat test-plans/FRONTEND_TEST_PLAN.md
```

**Backend Developers**:
```bash
# Open backend test plan
cat test-plans/BACKEND_TEST_PLAN.md
```

### 2. Set Up Testing (3 min)

```bash
# Install testing dependencies
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @playwright/test \
  jest \
  supertest

# Copy environment file
cp .env.example .env.test

# Update .env.test with test database credentials
# PRISMA_DATABASE_URL="postgresql://user:password@localhost:5432/mientior_test"
```

### 3. Run Your First Test

```bash
# Start the development server
npm run dev

# In another terminal, run tests
npm test

# Or run E2E tests
npx playwright test
```

---

## 📚 Full Documentation

For detailed instructions, see:
- **Frontend Testing**: [FRONTEND_TEST_PLAN.md](./FRONTEND_TEST_PLAN.md)
- **Backend Testing**: [BACKEND_TEST_PLAN.md](./BACKEND_TEST_PLAN.md)
- **Setup Guide**: [TESTING_SETUP_GUIDE.md](./TESTING_SETUP_GUIDE.md)
- **Overview**: [README.md](./README.md)

---

## 🎯 Priority Tests to Run First

### P0 - Critical (Test Now!)

1. **Authentication**
   - Can users register?
   - Can users login?
   - Does session persist?

2. **Shopping Cart**
   - Can add products to cart?
   - Does quantity update work?
   - Is cart total correct?

3. **Checkout**
   - Can proceed to checkout?
   - Does Paystack payment work?
   - Do orders get created?

4. **Products**
   - Do products load?
   - Do images display?
   - Does filtering work?

### Test These Manually Right Now

**5 Minute Smoke Test**:
```bash
# Start app
npm run dev

# Then test:
1. Go to http://localhost:3000
2. Browse products
3. Add one to cart
4. Go to cart
5. Verify it's there
```

**Expected Result**: ✅ Product appears in cart with correct price

---

## 🐛 Found a Bug?

Create an issue with:
- **What happened** (actual behavior)
- **What should happen** (expected behavior)
- **Steps to reproduce**
- **Screenshot** (if applicable)

Example:
```markdown
## Bug: Cart total incorrect

**Expected**: Total should be $99.99
**Actual**: Total shows $999.90
**Steps**: Add 1x Product ($99.99) to cart
**Priority**: P1
```

---

## ✅ Quick Checklist

Before deploying:
- [ ] Can users register and login?
- [ ] Can users add products to cart?
- [ ] Does checkout flow work end-to-end?
- [ ] Do payment webhooks work (Paystack/Flutterwave)?
- [ ] Are orders created in database?
- [ ] Do confirmation emails send?

If all ✅, you're ready to go live! 🎉

---

## 🆘 Need Help?

1. Check [TESTING_SETUP_GUIDE.md](./TESTING_SETUP_GUIDE.md)
2. Review example tests in the guide
3. Ask your team lead

---

**Remember**: Test early, test often! 🧪
