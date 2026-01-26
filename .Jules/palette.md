## 2024-05-23 - Inline Star Rating Accessibility Pattern
**Learning:** Core components like `ProductCard` often implement inline star ratings (using `lucide-react` icons) to achieve specific styles (e.g., Temu-style), bypassing the accessible `StarRating` reusable component. This leaves ratings inaccessible to screen readers.
**Action:** When auditing components, specifically look for inline loops of icons (like `Star`) and wrap them in a container with `role="img"` and a descriptive `aria-label`, while hiding the individual icons with `aria-hidden="true"`.
