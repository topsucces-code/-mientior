## 2024-05-23 - Radix Slot and Loading States
**Learning:** Radix UI `Slot` (used for `asChild`) expects a single child and merges props. Injecting a loading spinner alongside `children` when `asChild` is true causes runtime errors ("React.Children.only expected to receive a single React element child") and breaks the polymorphic behavior.
**Action:** When implementing `isLoading` in polymorphic components, conditionally render the spinner ONLY when `!asChild`. For `asChild`, rely on passing the `disabled` state to the child, but do not attempt to inject visual elements.

## 2024-05-23 - Button Spacing
**Learning:** The `Button` component uses `gap-2` in its flex container. Adding manual margins (e.g., `mr-2`) to icons inside buttons results in double spacing (16px instead of 8px).
**Action:** Do not add `mr-2` or similar spacing classes to icons inside `Button`. Rely on the parent's `gap` utility.
