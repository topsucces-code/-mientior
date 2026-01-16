## 2024-05-23 - Button Loading State & Slot Composition
**Learning:** When using Radix UI `Slot` (via `asChild` prop in Shadcn UI), you cannot inject additional elements (like a loading spinner) alongside the child. The `Slot` expects a single child to merge props into.
**Action:** When adding structural elements like loaders to polymorphic components, explicitly check `!asChild` or wrap the return to only render the structure when `asChild` is false.
