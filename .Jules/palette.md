## 2024-05-22 - Frontend Verification with better-auth
**Learning:** Frontend verification via `next dev` is blocked by `Module not found: Can't resolve 'better-auth/react'` errors during compilation, even if the code works in production or tests. This limits the ability to run "live" frontend verification scripts.
**Action:** Rely on robust unit tests (using `jsdom`) for UI components when live preview is unstable.

## 2024-05-22 - Vitest Environment Setup
**Learning:** The `vitest.setup.ts` file explicitly imports `dotenv`, but it was not present in the package dependencies. It must be installed (`pnpm add -D dotenv`) to run tests.
**Action:** Ensure `dotenv` is installed when setting up the test environment.
