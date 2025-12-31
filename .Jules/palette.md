## 2024-05-23 - Radix UI Slot Limitation
**Learning:** The `asChild` prop in Radix UI components (implemented via `Slot`) strictly requires a single child element. Adding sibling elements like loading spinners when `asChild` is true causes runtime errors.
**Action:** When adding structural elements to polymorphic components, explicitly check `!asChild` before rendering additional nodes, or wrap the entire structure safely (though wrapping breaks the slot contract). For `isLoading` specifically, disable the interaction but skip the visual spinner if `asChild` is active.
