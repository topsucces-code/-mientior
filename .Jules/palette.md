## 2024-05-23 - Testing Environment Gaps
**Learning:** The project uses `vitest` but lacks standard testing libraries like `jsdom` and `dotenv` in dependencies, requiring manual setup for component testing. Also, `React` import is explicitly required for JSX in tests/components when running in this specific test environment, despite standard Next.js configuration usually handling this.
**Action:** Always verify `jsdom` and `dotenv` presence and explicitly import React in test files and components under test if referencing JSX.
