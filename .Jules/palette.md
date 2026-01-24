## 2024-05-23 - Advanced Search Bar Accessibility
**Learning:** Search inputs with autocomplete suggestions should be implemented as a `combobox` pattern for full accessibility. Using `role="combobox"` on the input allows valid use of `aria-expanded` and `aria-activedescendant` to manage focus programmatically without moving actual focus from the input, enabling seamless typing and navigation.
**Action:** When implementing autocomplete, ensure the input has `role="combobox"`, controls the listbox via `aria-controls`, and manages active item state via `aria-activedescendant`.
