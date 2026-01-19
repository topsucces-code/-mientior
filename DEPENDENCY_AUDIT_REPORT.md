# Dependency Audit Report
**Date:** 2025-12-20
**Project:** Mientior Marketplace
**Total Dependencies:** 1,205 production + 359 development = 1,564 total

---

## Executive Summary

This audit identified **13 security vulnerabilities** (2 critical, 6 high, 5 moderate), **significant outdated packages**, and **redundant dependencies**. Immediate action is required to address security issues, especially in authentication and payment libraries.

**Priority Actions:**
1. 🚨 Fix critical security vulnerabilities (better-auth, next, axios, form-data)
2. ⚠️ Remove redundant dependencies (bcrypt/bcryptjs duplication)
3. 📦 Update major outdated packages (Prisma 5→7, i18next, date-fns, etc.)
4. 🧹 Remove unused payment gateways to reduce attack surface

---

## 1. Security Vulnerabilities (13 Total)

### 🔴 CRITICAL (2 vulnerabilities)

#### axios (via flutterwave-react-v3)
- **Severity:** High/Critical (CVSS 7.5)
- **Issues:**
  - DoS attack through lack of data size check (GHSA-4hjh-wcwx-xvwj)
  - CSRF vulnerability (GHSA-wf5p-g6vw-rhxx)
  - SSRF and credential leakage (GHSA-jr5f-v2jv-69x6)
- **Current:** ≤0.30.1 (via flutterwave-react-v3)
- **Fix:** Downgrade flutterwave-react-v3 to 1.0.7 OR remove package entirely
- **Recommendation:** Remove flutterwave-react-v3 if not actively used

#### form-data (via request → paystack)
- **Severity:** Critical
- **Issue:** Unsafe random function for boundary generation (GHSA-fjxv-7rqg-78g4)
- **Current:** <2.5.4 (via deprecated 'request' package)
- **Fix:** ❌ No fix available - 'request' package is deprecated
- **Recommendation:** **Remove 'paystack' package** and migrate to @paystack/inline-js or direct API

---

### 🟠 HIGH (6 vulnerabilities)

#### better-auth
- **Severity:** High (CVSS 8.6)
- **Issues:**
  - Double-slash path normalization bypass (GHSA-x732-6j76-qmhm)
  - Multi-session sign-out cookie forgery (GHSA-wmjr-v86c-m9jj)
  - External request basePath modification DoS (GHSA-569q-mpph-wgww)
- **Current:** 1.4.7 (affected: <1.4.5)
- **Fix:** ✅ Already fixed in current version
- **Action:** Verify version with `npm list better-auth`

#### next
- **Severity:** High (CVSS 7.5)
- **Issues:**
  - Server Actions source code exposure (GHSA-w37m-7fhw-fmv9)
  - DoS with Server Components (GHSA-mwv6-3258-q52c)
- **Current:** 15.5.9
- **Affected:** 15.5.1-canary.0 to 15.5.7
- **Fix:** ✅ Already fixed in current version
- **Action:** Verify version with `npm list next`

#### node-forge (via flutterwave-node-v3)
- **Severity:** High (CVSS 8.6)
- **Issues:**
  - ASN.1 unbounded recursion (GHSA-554w-wpv2-vw27)
  - ASN.1 validator desynchronization (GHSA-5gfm-wpxj-wjgq)
  - ASN.1 OID integer truncation (GHSA-65ch-62r8-g69g)
- **Current:** ≤1.3.1 (via flutterwave-node-v3)
- **Fix:** ❌ No fix available
- **Recommendation:** **Remove flutterwave-node-v3** if not actively used

#### flutterwave-node-v3 & flutterwave-react-v3
- **Severity:** High (inherited from axios & node-forge)
- **Fix:** ❌ No fix available for node package
- **Recommendation:** **Remove both packages** if Flutterwave is not primary payment gateway

---

### 🟡 MODERATE (5 vulnerabilities)

#### @sentry/nextjs
- **Severity:** Moderate
- **Issue:** Sensitive headers leaked when sendDefaultPii is true (GHSA-6465-jgvq-jhgp)
- **Current:** 10.32.1
- **Affected:** 10.11.0 - 10.26.0
- **Fix:** ✅ Already fixed in current version
- **Action:** Verify configuration has sendDefaultPii set appropriately

#### tough-cookie (via request → paystack)
- **Severity:** Moderate (CVSS 6.5)
- **Issue:** Prototype pollution (GHSA-72xf-g2v4-qvf3)
- **Current:** <4.1.3 (via deprecated 'request' package)
- **Fix:** ❌ No fix available
- **Recommendation:** Remove 'paystack' package

#### request (via paystack)
- **Severity:** Moderate (CVSS 6.1)
- **Issue:** SSRF vulnerability (GHSA-p8p7-x288-28g6)
- **Status:** ⚠️ Package is deprecated
- **Recommendation:** Remove 'paystack' package immediately

---

## 2. Outdated Packages (Major Updates Available)

### Critical Updates

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| **@prisma/client** | 5.22.0 | **7.2.0** | Major version jump - review migration guide |
| **prisma** | 5.22.0 | **7.2.0** | Must update with @prisma/client |
| **next** | 15.5.9 | **16.1.0** | Major version - test thoroughly |
| **zod** | 3.25.76 | **4.2.1** | Major version - breaking changes likely |
| **zustand** | 4.5.7 | **5.0.9** | Major version update |
| **tailwind-merge** | 2.6.0 | **3.4.0** | Major version update |
| **resend** | 1.1.0 | **6.6.0** | Major version - review API changes |
| **i18next** | 23.16.8 | **25.7.3** | 2 major versions behind |
| **react-i18next** | 14.1.3 | **16.5.0** | 2 major versions behind |
| **recharts** | 2.15.4 | **3.6.0** | Major version update |
| **date-fns** | 3.6.0 | **4.1.0** | Major version update |
| **antd** | 5.29.3 | **6.1.1** | Major version - Refine admin compatibility check needed |

### Moderate Updates

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| **framer-motion** | 10.18.0 | **12.23.26** | 2 major versions behind |
| **meilisearch** | 0.44.1 | **0.54.0** | 10 minor versions behind |
| **@dnd-kit/sortable** | 8.0.0 | **10.0.0** | 2 major versions |
| **stripe** | 19.3.1 | **20.1.0** | Major version update |
| **i18next-http-backend** | 2.7.3 | **3.0.2** | Major version update |
| **i18next-browser-languagedetector** | 7.2.2 | **8.2.0** | Major version update |
| **react-paystack** | 3.0.5 | **6.0.0** | 3 major versions behind |
| **sharp** | 0.33.5 | **0.34.5** | Minor update for image optimization |

---

## 3. Redundant & Unnecessary Dependencies

### 🔴 Critical Redundancy

#### bcrypt + bcryptjs (DUPLICATE)
- **Issue:** Both packages installed for same purpose
- **Current Usage:**
  - `bcrypt@6.0.0` (native, faster, more secure)
  - `bcryptjs@3.0.3` (pure JS, slower, fallback)
- **Files Using:** 12 files (auth routes, password validation, TOTP)
- **Recommendation:**
  - ✅ **Keep bcrypt only** (better performance, native)
  - ❌ **Remove bcryptjs**
  - Update all imports from 'bcryptjs' to 'bcrypt'
- **Savings:** ~500KB, reduced maintenance

### 🟡 Payment Gateway Bloat

#### Multiple Payment Providers (High Security Risk)
- **Installed:**
  - Stripe ✅ (primary, secure, actively maintained)
  - PayPal (@paypal/checkout-server-sdk)
  - Paystack (2 packages: paystack + react-paystack)
  - Flutterwave (2 packages: flutterwave-node-v3 + flutterwave-react-v3)

- **Issues:**
  1. **Paystack** uses deprecated 'request' package (CRITICAL security risk)
  2. **Flutterwave** has unfixed vulnerabilities in axios + node-forge
  3. Multiple payment SDKs increase attack surface
  4. Maintenance overhead for unused gateways

- **Recommendation:**
  - ✅ **Keep:** Stripe (primary)
  - ❓ **Evaluate:** PayPal (if actively used, otherwise remove)
  - ❌ **Remove:** Paystack (2 packages) - security issues
  - ❌ **Remove:** Flutterwave (2 packages) - security issues

- **Action Steps:**
  1. Check usage: `grep -r "paystack\|flutterwave\|paypal" src/`
  2. If unused, remove all non-Stripe payment packages
  3. Update payment-gateways.ts configuration

### 🟡 Diff Viewer Duplication

#### react-diff-viewer + react-diff-viewer-continued
- **Issue:** Two similar packages for same functionality
- **Current:**
  - react-diff-viewer@3.1.1 (original, possibly unmaintained)
  - react-diff-viewer-continued@3.4.0 (fork/continuation)
- **Usage:** Found in `src/app/admin/audit-logs/page.tsx`
- **Recommendation:**
  - ✅ **Keep:** react-diff-viewer-continued (actively maintained)
  - ❌ **Remove:** react-diff-viewer
  - Update import in audit-logs page

### 🟡 i18n Package Overlap

#### i18next + next-intl
- **Issue:** Two internationalization solutions
- **Current:**
  - i18next ecosystem (i18next, react-i18next, i18next-browser-languagedetector, i18next-http-backend)
  - next-intl@4.6.1
- **Recommendation:**
  - Choose ONE solution based on usage
  - If using Next.js App Router → **next-intl** is recommended
  - If using Pages Router → **i18next** ecosystem
  - Remove the unused solution

---

## 4. Unnecessary or Questionable Dependencies

### Testing Packages (May Be Over-Specified)

#### @testing-library/react-hooks
- **Status:** ⚠️ Package is deprecated
- **Reason:** Functionality merged into @testing-library/react
- **Recommendation:** Remove and use built-in hooks testing from @testing-library/react

### Dev Dependencies as Production Dependencies

Review these packages that might belong in devDependencies:

| Package | Current Location | Recommended |
|---------|------------------|-------------|
| @types/jspdf | dependencies | devDependencies |
| cli-table3 | dependencies (if only in scripts) | devDependencies |
| minimist | dependencies (if only in scripts) | devDependencies |

---

## 5. Recommended Actions

### Phase 1: IMMEDIATE (Security Fixes)

```bash
# 1. Update packages with security fixes
npm update @sentry/nextjs better-auth next

# 2. Remove vulnerable payment packages (if not actively used)
npm uninstall paystack flutterwave-node-v3 flutterwave-react-v3

# 3. Remove bcryptjs (keep bcrypt only)
npm uninstall bcryptjs
# Then update all imports in code from 'bcryptjs' to 'bcrypt'

# 4. Remove duplicate diff viewer
npm uninstall react-diff-viewer
# Update src/app/admin/audit-logs/page.tsx import

# 5. Remove deprecated testing package
npm uninstall @testing-library/react-hooks
```

### Phase 2: SHORT-TERM (1-2 weeks)

```bash
# 1. Update Prisma (requires migration review)
npm install @prisma/client@latest prisma@latest
npx prisma migrate dev
npm run build  # Test thoroughly

# 2. Update other critical packages
npm install stripe@latest meilisearch@latest

# 3. Update date/time utilities
npm install date-fns@latest

# 4. Update UI animation
npm install framer-motion@latest

# 5. Consolidate i18n solution
# Option A: Keep next-intl, remove i18next
npm uninstall i18next react-i18next i18next-browser-languagedetector i18next-http-backend

# Option B: Keep i18next, remove next-intl
npm uninstall next-intl
```

### Phase 3: MEDIUM-TERM (1-2 months)

```bash
# Update major framework versions (test extensively)
npm install next@latest antd@latest

# Update state management
npm install zustand@latest

# Update validation
npm install zod@latest

# Update utility libraries
npm install tailwind-merge@latest
```

### Phase 4: LONG-TERM (Ongoing)

1. **Establish dependency update policy:**
   - Security updates: Weekly review
   - Minor updates: Monthly review
   - Major updates: Quarterly review with testing

2. **Add automated tools:**
   ```bash
   # Add Dependabot or Renovate Bot to GitHub repo
   # Configure npm audit to run in CI/CD
   npm audit --audit-level=moderate
   ```

3. **Bundle size monitoring:**
   ```bash
   npm install -D @next/bundle-analyzer
   # Configure in next.config.js
   ```

---

## 6. Risk Assessment

### High Risk (Address Immediately)

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| Vulnerable payment packages | Security breach, data theft | Low | 🔴 CRITICAL |
| bcrypt/bcryptjs duplication | Confusion, potential bugs | Low | 🔴 HIGH |
| Deprecated 'request' package | Security vulnerabilities | Medium | 🔴 HIGH |

### Medium Risk (Address Soon)

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| Outdated Prisma (5→7) | Missing features, bugs | High | 🟡 MEDIUM |
| Outdated i18next | Missing features | Medium | 🟡 MEDIUM |
| Multiple i18n solutions | Bundle bloat, confusion | Medium | 🟡 MEDIUM |

### Low Risk (Monitor)

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| Minor version updates | Missing features | Low | 🟢 LOW |
| UI library updates | New features | Medium | 🟢 LOW |

---

## 7. Package Size Analysis

### Largest Dependencies (Estimated)

| Package | Size | Type | Notes |
|---------|------|------|-------|
| next | ~30MB | Core | Framework - necessary |
| @sentry/nextjs | ~15MB | Monitoring | Review if actively used |
| prisma | ~12MB | Core | ORM - necessary |
| antd | ~10MB | UI | Admin panel - necessary |
| @tiptap/* (all) | ~8MB | Editor | Review necessity |
| chart.js + recharts | ~6MB | Charts | Two chart libraries - consolidate? |

### Potential Savings

| Action | Estimated Savings |
|--------|------------------|
| Remove Paystack packages | ~2MB |
| Remove Flutterwave packages | ~3MB |
| Remove bcryptjs | ~500KB |
| Remove duplicate diff viewer | ~300KB |
| Remove unused payment gateways | ~5MB total |
| Consolidate i18n (remove one) | ~4MB |
| **Total Potential Savings** | **~15MB** |

---

## 8. Testing Strategy After Updates

### Required Testing

1. **Authentication flows:**
   - Login/logout
   - Registration
   - Password reset
   - 2FA verification

2. **Payment processing:**
   - Stripe checkout
   - Webhook handling
   - Order creation

3. **Database operations:**
   - CRUD operations
   - Migrations
   - Prisma Client queries

4. **Admin panel:**
   - Refine CRUD operations
   - Ant Design components
   - Forms and validation

5. **Search functionality:**
   - MeiliSearch integration
   - Full-text search
   - Faceted filters

### Test Commands

```bash
# Run security tests
npm run test:security

# Run all unit tests
npm test

# Run E2E tests
npm run test:e2e

# Build and verify
npm run build
npm start

# Check for runtime errors
# Manual testing in dev mode
npm run dev
```

---

## 9. Monitoring Recommendations

### Add These Tools

1. **Snyk** - Continuous security monitoring
   ```bash
   npm install -g snyk
   snyk test
   snyk monitor
   ```

2. **npm-check-updates** - Easier update management
   ```bash
   npm install -g npm-check-updates
   ncu  # Check for updates
   ncu -u  # Update package.json
   ```

3. **Bundle size tracking**
   ```bash
   npm install -D @next/bundle-analyzer
   npm run build  # Check bundle report
   ```

4. **GitHub Dependabot** - Automated dependency PRs
   - Enable in repository settings
   - Configure `.github/dependabot.yml`

---

## 10. Summary of Recommendations

### ✅ DO (Immediate)

1. ✅ Remove vulnerable packages: paystack, flutterwave-*
2. ✅ Remove bcryptjs (keep bcrypt)
3. ✅ Remove react-diff-viewer (keep -continued)
4. ✅ Update @sentry/nextjs, better-auth, next
5. ✅ Verify better-auth and next versions

### ⚠️ DO (Short-term)

1. ⚠️ Update Prisma 5→7 (with migration testing)
2. ⚠️ Consolidate i18n solution (choose one)
3. ⚠️ Update stripe, meilisearch, date-fns
4. ⚠️ Move dev-only packages to devDependencies
5. ⚠️ Test all payment flows after cleanup

### 📋 CONSIDER (Long-term)

1. 📋 Evaluate if @sentry/nextjs is being used (remove if not)
2. 📋 Consolidate chart libraries (chart.js vs recharts)
3. 📋 Review Tiptap usage (large package, is rich text editor needed?)
4. 📋 Plan for Next.js 16 migration
5. 📋 Establish regular dependency review schedule

### ❌ DON'T DO

1. ❌ Don't update Next.js to v16 yet (wait for stable release)
2. ❌ Don't update antd to v6 until Refine compatibility confirmed
3. ❌ Don't rush major version updates without testing
4. ❌ Don't remove payment gateways without confirming non-usage

---

## 11. Estimated Impact

### Security Improvements
- ✅ Eliminate 13 known vulnerabilities
- ✅ Remove deprecated packages (request, @testing-library/react-hooks)
- ✅ Reduce attack surface by removing unused payment gateways

### Performance Improvements
- 📉 Reduce bundle size by ~15MB
- 📉 Faster npm install times
- 📉 Better tree-shaking with updated packages

### Maintenance Improvements
- 🧹 Fewer packages to maintain
- 🧹 Clearer dependency purpose
- 🧹 Easier to reason about codebase

### Development Experience
- ✨ Access to new features in updated packages
- ✨ Better TypeScript support
- ✨ Improved developer tooling

---

## 12. Next Steps

1. **Review this report** with the team
2. **Prioritize actions** based on risk assessment
3. **Create backup** before making changes
4. **Execute Phase 1** (immediate security fixes)
5. **Test thoroughly** after each phase
6. **Document decisions** in project documentation
7. **Set up monitoring** for ongoing dependency health

---

**Questions or concerns?** Please review this report and schedule a team discussion to address any concerns before implementing changes.
