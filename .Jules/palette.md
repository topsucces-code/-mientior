## 2026-01-28 - Icon-Only Button Accessibility Pattern
**Learning:** Many icon-only buttons (like "Remove from saved") lack both `aria-label` and `Tooltip`, making them inaccessible to screen readers and potentially unclear to sighted users. While `aria-label` fixes the screen reader issue, visual tooltips are a missed opportunity for clarity.
**Action:** When auditing components, check all `size="icon"` buttons. Enforce a pattern of wrapping them in `Tooltip` and ensuring `aria-label` matches the tooltip text.
