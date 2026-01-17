## 2025-05-18 - Search Experience Pattern
**Learning:** For debounced search inputs, the gap between user typing and result display creates uncertainty. A dedicated loading state (replacing the search icon with a spinner) provides essential immediate feedback. This must be paired with `aria-expanded` and `aria-controls` to properly communicate the interaction model to screen readers.
**Action:** Standardize all search inputs to include: 1) `role="search"` on form, 2) Visible loading spinner during fetch, 3) `aria-expanded` and `aria-controls` linking to results.
