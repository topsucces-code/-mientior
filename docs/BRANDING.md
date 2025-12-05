# L'Opulence Organique - Guide de Branding

## Concept
**"L'Opulence Organique"** (Luxe Naturel) - Parfait pour des produits artisanaux de haute facture, le bien-être de luxe, ou des produits durables haut de gamme.

---

## Palette de Couleurs

### Couleur Primaire - Vert Émeraude Profond
*Richesse, héritage, nature précieuse*

| Nuance | Hex | Usage |
|--------|-----|-------|
| emerald-50 | `#ECFDF5` | Backgrounds très légers |
| emerald-100 | `#D1FAE5` | Backgrounds légers |
| emerald-200 | `#A7F3D0` | Borders, accents légers |
| emerald-300 | `#6EE7B7` | Hover states |
| emerald-400 | `#34D399` | Accents secondaires |
| **emerald-500** | `#047857` | **Couleur principale** |
| emerald-600 | `#065F46` | Hover sur boutons |
| emerald-700 | `#064E3B` | États actifs |
| emerald-800 | `#022C22` | Texte sur fond clair |
| emerald-900 | `#014737` | Texte très foncé |

### Couleur Secondaire - Beige Doré / Taupe
*Chaleur, élégance, confort*

| Nuance | Hex | Usage |
|--------|-----|-------|
| taupe-50 | `#FAF8F5` | Backgrounds page |
| taupe-100 | `#F5F0E8` | Cards, sections |
| taupe-200 | `#E8DFD0` | Borders |
| taupe-300 | `#D4C4A8` | Borders hover |
| taupe-400 | `#C4A77D` | Icônes secondaires |
| **taupe-500** | `#A68B5B` | **Couleur principale** |
| taupe-600 | `#8B7355` | Texte secondaire |
| taupe-700 | `#6B5B45` | Texte principal |
| taupe-800 | `#4A3F30` | Titres |
| taupe-900 | `#2D2620` | Texte très foncé |

### Couleur d'Accent - Cuivre
*Touche métallique chaude et contemporaine*

| Nuance | Hex | Usage |
|--------|-----|-------|
| copper-50 | `#FDF4F0` | Backgrounds notifications |
| copper-100 | `#FCE8E0` | Badges légers |
| copper-200 | `#F9D0C0` | Hover léger |
| copper-300 | `#F0A890` | Accents |
| copper-400 | `#E07850` | Boutons secondaires |
| **copper-500** | `#B87333` | **Couleur principale** |
| copper-600 | `#9A5D2A` | Hover boutons |
| copper-700 | `#7A4A22` | États actifs |
| copper-800 | `#5C381A` | Texte sur fond clair |
| copper-900 | `#3D2512` | Texte foncé |

### Accent Luxe - Or Rose
*Pour les éléments premium et luxueux*

| Nuance | Hex | Usage |
|--------|-----|-------|
| rosegold-50 | `#FFF5F5` | Backgrounds premium |
| rosegold-100 | `#FFEBE8` | Badges VIP |
| rosegold-200 | `#FFD6D0` | Hover premium |
| rosegold-300 | `#FFB8AD` | Accents luxe |
| rosegold-400 | `#E8A090` | Éléments premium |
| **rosegold-500** | `#B76E79` | **Couleur principale** |
| rosegold-600 | `#9A5A64` | Hover premium |
| rosegold-700 | `#7D474F` | États actifs |

---

## Usage des Couleurs

### Boutons
```jsx
// Bouton principal
<Button>Ajouter au panier</Button>  // emerald-600

// Bouton gradient
<Button variant="gradient">Acheter maintenant</Button>  // emerald gradient

// Bouton cuivre (accent)
<Button variant="copper">Offre spéciale</Button>  // copper gradient

// Bouton secondaire
<Button variant="secondary">En savoir plus</Button>  // taupe-100

// Bouton outline
<Button variant="outline">Annuler</Button>  // taupe border
```

### Gradients
```css
.gradient-emerald   /* Vert émeraude */
.gradient-taupe     /* Beige doré */
.gradient-copper    /* Cuivre */
.gradient-rosegold  /* Or rose */
.gradient-luxury    /* Émeraude → Taupe → Cuivre */
```

### Texte
- **Titres principaux**: `text-anthracite-700` ou `text-taupe-800`
- **Texte corps**: `text-nuanced-600` ou `text-taupe-600`
- **Liens**: `text-emerald-600 hover:text-emerald-700`
- **Prix**: `text-copper-600` ou `text-emerald-700`

### Backgrounds
- **Page**: `bg-taupe-50` ou `bg-platinum-50`
- **Cards**: `bg-white` avec `border-taupe-200`
- **Sections alternées**: `bg-taupe-100`
- **Footer**: `bg-emerald-800`

---

## Typographie

### Polices
- **Display/Titres**: Poppins (font-display)
- **Corps**: Inter (font-sans)

### Hiérarchie
```
H1: text-display-xl (3-4rem)
H2: text-display-lg (2.5-3rem)
H3: text-display-md (2-2.5rem)
H4: text-display-sm (1.5-2rem)
Body: text-base (1rem)
Small: text-sm (0.875rem)
```

---

## Exemples d'Application

### Header
- Background: `bg-white`
- Border: `border-taupe-200`
- Logo: Couleur émeraude
- Icônes: `text-taupe-600 hover:text-emerald-600`

### Footer
- Background: `bg-emerald-800` gradient
- Texte: `text-emerald-100`
- Liens hover: `text-white`

### Cards Produit
- Background: `bg-white`
- Border: `border-taupe-200`
- Prix: `text-emerald-700` (normal) / `text-copper-600` (promo)
- Bouton: `bg-emerald-600`

### Badges
- Nouveau: `bg-emerald-100 text-emerald-700`
- Promo: `bg-copper-100 text-copper-700`
- Premium: `bg-rosegold-100 text-rosegold-700`
- Stock faible: `bg-taupe-100 text-taupe-700`

---

## Valeurs de la Marque

1. **Luxe Accessible** - Qualité premium sans prétention
2. **Durabilité** - Engagement écologique
3. **Artisanat** - Savoir-faire et authenticité
4. **Bien-être** - Produits qui enrichissent la vie
5. **Élégance Naturelle** - Beauté organique et intemporelle
