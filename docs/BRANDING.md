# Mientior Branding Guide

## 🎨 Palette "Frais & Confiant" - Turquoise/Orange

### Philosophy
Mientior utilise une palette moderne et dynamique qui inspire **confiance** (turquoise) et encourage l'**action** (orange). Cette combinaison est optimisée pour les conversions e-commerce, particulièrement adaptée au marché africain jeune et connecté.

### Pourquoi cette palette convertit ?
- ✅ **Turquoise** = Confiance, fiabilité (crucial pour paiements Mobile Money)
- ✅ **Orange** = Urgence, action (+30% de clics vs autres couleurs)
- ✅ **Contraste fort** = Hiérarchie visuelle claire
- ✅ **Moderne & frais** = Adapté au public jeune africain
- ✅ **Unisexe** = Fonctionne pour tous produits

---

## Color Palette

### Turquoise (Primary) - Confiance & Fiabilité

| Nuance | Hex | Tailwind | Usage |
|--------|-----|----------|-------|
| turquoise-50 | `#ECFEFF` | `bg-turquoise-50` | Fond neutre sections |
| turquoise-100 | `#CFFAFE` | `bg-turquoise-100` | Backgrounds légers |
| turquoise-200 | `#A5F3FC` | `bg-turquoise-200` | Hover léger |
| turquoise-300 | `#67E8F9` | `text-turquoise-300` | Accents |
| turquoise-400 | `#22D3EE` | `text-turquoise-400` | Icônes actives |
| **turquoise-500** | `#06B6D4` | `bg-turquoise-500` | **Hover, badges, icônes** |
| **turquoise-600** | `#0891B2` | `bg-turquoise-600` | **Header, navigation, liens** |
| turquoise-700 | `#0E7490` | `bg-turquoise-700` | États actifs |
| turquoise-800 | `#155E75` | `bg-turquoise-800` | Texte sur fond clair |
| turquoise-900 | `#164E63` | `bg-turquoise-900` | Footer |

### Orange CTA - Urgence & Action

| Nuance | Hex | Tailwind | Usage |
|--------|-----|----------|-------|
| orange-50 | `#FFF7ED` | `bg-orange-50` | Backgrounds promo |
| orange-100 | `#FFEDD5` | `bg-orange-100` | Badges légers |
| orange-200 | `#FED7AA` | `bg-orange-200` | Hover léger |
| orange-300 | `#FDBA74` | `text-orange-300` | Accents |
| orange-400 | `#FB923C` | `bg-orange-400` | Hover boutons |
| **orange-500** | `#F97316` | `bg-orange-500` | **Boutons d'achat, promos** |
| orange-600 | `#EA580C` | `bg-orange-600` | Hover CTA |
| orange-700 | `#C2410C` | `bg-orange-700` | États actifs |

### Gris - Textes & UI

| Nuance | Hex | Tailwind | Usage |
|--------|-----|----------|-------|
| gray-50 | `#F9FAFB` | `bg-gray-50` | Backgrounds page |
| gray-100 | `#F3F4F6` | `bg-gray-100` | Cards, sections |
| gray-200 | `#E5E7EB` | `border-gray-200` | Borders |
| gray-500 | `#6B7280` | `text-gray-500` | **Textes secondaires** |
| gray-800 | `#1F2937` | `text-gray-800` | **Textes principaux** |

### Couleurs Sémantiques

| Couleur | Hex | Tailwind | Usage |
|---------|-----|----------|-------|
| Succès | `#10B981` | `text-success` | Stock disponible, validation |
| Erreur | `#EF4444` | `text-error` | Stock limité, erreurs |
| Warning | `#F59E0B` | `text-warning` | Alertes |

---

## Usage des Couleurs

### 1. Boutons d'Action

```jsx
// Bouton principal "Ajouter au panier" / "Acheter" → Orange
<Button className="bg-orange-500 hover:bg-orange-600 text-white">
  Ajouter au panier
</Button>

// Boutons secondaires "Voir détails" / "En savoir plus" → Turquoise
<Button className="bg-turquoise-600 hover:bg-turquoise-700 text-white">
  Voir détails
</Button>

// Boutons tertiaires "Favoris" / "Comparer" → Blanc avec bordure turquoise
<Button className="bg-white border-2 border-turquoise-500 text-turquoise-600 hover:bg-turquoise-50">
  Ajouter aux favoris
</Button>
```

### 2. Navigation & Interface

```jsx
// Header / Menu → Turquoise
<header className="bg-turquoise-600 text-white">

// Liens → Turquoise avec hover orange
<a className="text-turquoise-600 hover:text-orange-500">

// Badges (Nouveau, Promo) → Orange sur fond blanc
<span className="bg-orange-500 text-white px-2 py-1 rounded">
  -20%
</span>
```

### 3. Zones de Confiance

```jsx
// Paiement / Checkout → Dominance turquoise (rassure)
<section className="bg-turquoise-50 border border-turquoise-200">

// Prix / Promotions → Orange (attire l'œil)
<span className="text-orange-500 font-bold">29,99 €</span>

// Témoignages / Avis → Fond neutre
<section className="bg-turquoise-50">
```

### Texte
- **Titres principaux**: `text-gray-800`
- **Texte corps**: `text-gray-500`
- **Liens**: `text-turquoise-600 hover:text-orange-500`
- **Prix normal**: `text-gray-800`
- **Prix promo**: `text-orange-500`

### Backgrounds
- **Page**: `bg-white`
- **Cards**: `bg-white` avec `border-gray-200`
- **Sections alternées**: `bg-turquoise-50`
- **Header**: `bg-turquoise-600`
- **Footer**: `bg-turquoise-900`

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

### Header (Top Bar)
- Background: `bg-turquoise-600`
- Texte: `text-white`
- Liens hover: `hover:text-white/80`

### Header (Main)
- Background: `bg-white`
- Border: `border-gray-200`
- Logo: Couleur turquoise
- Icônes: `text-gray-600 hover:text-turquoise-600`

### Footer
- Background: `bg-turquoise-900`
- Texte: `text-turquoise-100`
- Liens hover: `hover:text-white`

### Cards Produit
- Background: `bg-white`
- Border: `border-gray-200`
- Prix normal: `text-gray-800`
- Prix promo: `text-orange-500 font-bold`
- Bouton: `bg-orange-500 hover:bg-orange-600`

### Badges
- Nouveau: `bg-turquoise-500 text-white`
- Promo: `bg-orange-500 text-white`
- Best Seller: `bg-turquoise-600 text-white`
- Stock faible: `bg-error text-white`

---

## 🔧 Admin Panel Branding

L'interface admin utilise également la palette Turquoise/Orange via Ant Design.

### Configuration Ant Design

Le thème est configuré dans `src/contexts/theme-context.tsx` :

```typescript
const colors = {
  turquoise: {
    primary: '#0891B2',    // turquoise-600
    light: '#06B6D4',      // turquoise-500
    dark: '#0E7490',       // turquoise-700
    bg: '#ECFEFF',         // turquoise-50
  },
  orange: {
    primary: '#F97316',    // orange-500
    light: '#FB923C',      // orange-400
    dark: '#EA580C',       // orange-600
  },
};
```

### Composants Admin

| Élément | Couleur | Usage |
|---------|---------|-------|
| Logo "Mientior" | Turquoise-600 | Sidebar header |
| Badge "Admin" | Orange-500 | Identification admin |
| Boutons primaires | Turquoise-600 | Actions principales |
| Liens | Turquoise-600 | Navigation, documentation |
| Menu sélectionné | Turquoise-bg | État actif |
| Badges notifications | Orange-500 | Alertes, compteurs |
| Tags succès | Success (#10B981) | Statuts positifs |
| Tags erreur | Error (#EF4444) | Statuts négatifs |

### Fichiers Admin

- `src/contexts/theme-context.tsx` - Configuration thème Ant Design
- `src/components/admin/admin-sidebar.tsx` - Sidebar avec logo
- `src/components/admin/admin-header.tsx` - Header admin
- `src/components/auth/admin-login-form.tsx` - Formulaire login
- `src/styles/admin-responsive.css` - Styles responsive

---

## Valeurs de la Marque

1. **Confiance** - Fiabilité pour les paiements Mobile Money
2. **Action** - Encourager les conversions
3. **Modernité** - Adapté au public jeune africain
4. **Accessibilité** - Design clair et intuitif
5. **Dynamisme** - Énergie et fraîcheur
