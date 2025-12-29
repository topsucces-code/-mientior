# Palette's Journal - Critical Learnings

## 2024-05-22 - Missing ARIA labels in icon-only buttons
**Learning:** The project uses Shadcn UI Button component which supports `size="icon"`. However, the component itself doesn't enforce or warn about missing `aria-label` when `size="icon"` is used. This is a common pattern where accessibility relies on the consumer.
**Action:** When using `size="icon"`, always check for `aria-label`. Consider adding a lint rule or a prop check in the future, but for now, I will manually add them.
