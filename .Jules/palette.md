## 2026-01-25 - Grouping Visual Ratings
**Learning:** Inline SVG stars for ratings clutter screen readers with redundant "image" announcements. It's far better to hide the individual stars (`aria-hidden="true"`) and place a single descriptive `aria-label` on the container (e.g., "Rated 4.5 out of 5 stars").
**Action:** Always wrap visual rating components in a container with `role="img"` and a descriptive label, hiding the internal decorative elements.
