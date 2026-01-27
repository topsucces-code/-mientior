## 2024-02-14 - Adding Loading States to Slot-Based Components
**Learning:** When using Radix UI's `Slot` component (via `asChild`), you cannot inject additional elements (like a loading spinner) alongside the child. `Slot` expects a single React element.
**Action:** When adding conditional UI elements to components with `asChild`, either suppress the extra elements when `asChild` is true, or wrap the logic to ensure only the child is passed to the `Slot`. For `Button`, we conditionally render the spinner only when `!asChild`.
