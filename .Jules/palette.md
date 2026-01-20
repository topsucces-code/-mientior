## 2026-01-20 - Standardizing Currency and Accessibility in Cart Components
**Learning:** Found inconsistency in currency formatting (hardcoded `$` vs `formatCurrency` utility) and missing ARIA labels on icon-only buttons in `SavedForLater`.
**Action:** Always verify currency formatting uses `@/lib/currency` and ensure all icon-only buttons (especially destructive ones like delete) have descriptive `aria-label`s.
