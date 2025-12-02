# Migration Checklist

## Phase 1: Infrastructure ✅ COMPLETE

- [x] Create `src/lib/env.ts` with Zod validation
- [x] Create `src/lib/logger.ts` with structured logging
- [x] Create `src/lib/api-response.ts` with standard formats
- [x] Create `src/lib/api-validation.ts` with request validation
- [x] Write tests for all utilities
- [x] Create migration documentation

## Phase 2: Critical Routes (Week 1)

### Authentication Routes (Priority: CRITICAL)
- [ ] `src/app/api/auth/login/route.ts`
- [ ] `src/app/api/auth/register/route.ts`
- [ ] `src/app/api/auth/forgot-password/route.ts`
- [ ] `src/app/api/auth/reset-password/route.ts`
- [ ] `src/app/api/auth/verify-email/route.ts`

### Payment Routes (Priority: CRITICAL)
- [ ] `src/app/api/checkout/initialize-payment/route.ts`
- [ ] `src/app/api/checkout/paystack/route.ts`
- [ ] `src/app/api/checkout/flutterwave/route.ts`
- [ ] `src/app/api/checkout/apple-pay/route.ts`
- [ ] `src/app/api/checkout/google-pay/route.ts`

### Cart Routes (Priority: HIGH)
- [ ] `src/app/api/cart/route.ts`
- [ ] `src/app/api/cart/[id]/route.ts`

## Phase 3: Core Routes (Week 2)

### Product Routes
- [ ] `src/app/api/products/route.ts`
- [ ] `src/app/api/products/[id]/route.ts`
- [ ] `src/app/api/products/search/route.ts`

### Order Routes
- [ ] `src/app/api/orders/route.ts`
- [ ] `src/app/api/orders/[id]/route.ts`

### User Routes
- [ ] `src/app/api/user/addresses/route.ts`
- [ ] `src/app/api/user/wishlist/route.ts`
- [ ] `src/app/api/user/sessions/route.ts`

## Phase 4: Admin Routes (Week 3)

### Admin Product Management
- [ ] `src/app/api/admin/products/route.ts`
- [ ] `src/app/api/admin/products/[id]/route.ts`

### Admin Order Management
- [ ] `src/app/api/admin/orders/route.ts`
- [ ] `src/app/api/admin/orders/[id]/route.ts`

### Admin User Management
- [ ] `src/app/api/admin/users/route.ts`
- [ ] `src/app/api/admin/users/[id]/route.ts`

## Phase 5: Supporting Routes (Week 4)

### Category Routes
- [ ] `src/app/api/categories/route.ts`
- [ ] `src/app/api/categories/[id]/route.ts`

### Search Routes
- [ ] `src/app/api/search/route.ts`
- [ ] `src/app/api/search/suggestions/route.ts`

### Newsletter Routes
- [ ] `src/app/api/newsletter/route.ts`

## Phase 6: Library Files

### Core Libraries
- [ ] `src/lib/email.ts` - Replace console.* and process.env
- [ ] `src/lib/paystack.ts` - Replace console.* and process.env
- [ ] `src/lib/flutterwave.ts` - Replace console.* and process.env
- [ ] `src/lib/auth-server.ts` - Replace console.*
- [ ] `src/lib/redis.ts` - Replace console.*

### Utility Libraries
- [ ] `src/lib/verification-token.ts`
- [ ] `src/lib/password-validation.ts`
- [ ] `src/lib/auth-rate-limit.ts`
- [ ] `src/lib/session-invalidation.ts`

## Migration Steps for Each File

For each file being migrated:

1. **Backup** - Create a backup or commit current state
2. **Import utilities**
   ```typescript
   import { env } from '@/lib/env'
   import { logger, createApiLogger } from '@/lib/logger'
   import { apiSuccess, apiError, ErrorCodes } from '@/lib/api-response'
   import { validateRequest } from '@/lib/api-validation'
   ```

3. **Replace process.env**
   - Find: `process.env.VARIABLE_NAME`
   - Replace: `env.VARIABLE_NAME`

4. **Replace console.***
   - Find: `console.log(...)` → Replace: `logger.info(...)`
   - Find: `console.error(...)` → Replace: `logger.error(...)`
   - Find: `console.warn(...)` → Replace: `logger.warn(...)`

5. **Add request logger**
   ```typescript
   const log = createApiLogger(request)
   ```

6. **Add validation**
   ```typescript
   const validation = await validateRequest(request, schema)
   if (!validation.success) return validation.response
   ```

7. **Replace responses**
   - Success: `NextResponse.json(data)` → `apiSuccess(data, meta)`
   - Error: `NextResponse.json({ error }, { status })` → `apiError(message, code, status)`

8. **Test** - Run tests and manual testing
9. **Commit** - Commit the migrated file

## Progress Tracking

### Overall Progress
- Phase 1: ✅ 100% (6/6 files)
- Phase 2: ⏳ 0% (0/10 files)
- Phase 3: ⏳ 0% (0/7 files)
- Phase 4: ⏳ 0% (0/6 files)
- Phase 5: ⏳ 0% (0/5 files)
- Phase 6: ⏳ 0% (0/10 files)

**Total Progress: 14% (6/44 files)**

### Estimated Time
- Phase 1: ✅ Complete (2 days)
- Phase 2: 5 days (2 files/day)
- Phase 3: 4 days (2 files/day)
- Phase 4: 3 days (2 files/day)
- Phase 5: 3 days (2 files/day)
- Phase 6: 5 days (2 files/day)

**Total Estimated Time: 22 days (~4.5 weeks)**

## Quality Checks

After each migration:
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] API responses follow standard format
- [ ] Logs are structured with context
- [ ] Environment variables are validated
- [ ] Error codes are standardized

## Rollback Plan

If issues are found after migration:
1. Revert the specific file from git
2. Document the issue
3. Fix the utility if needed
4. Re-attempt migration

## Success Criteria

Migration is complete when:
- [ ] All API routes use new utilities
- [ ] All library files use new utilities
- [ ] No direct `process.env` usage (except in env.ts)
- [ ] No `console.*` usage (except in logger.ts)
- [ ] All API responses follow standard format
- [ ] All tests pass
- [ ] Documentation is updated

## Notes

- Migrate one file at a time to minimize risk
- Test thoroughly after each migration
- Keep the team informed of progress
- Document any issues or learnings
- Update this checklist as you progress
