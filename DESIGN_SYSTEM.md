# 🎨 Mientior Marketplace - Système de Design Sophistiqué

## Vue d'ensemble

Ce document décrit l'architecture de design sophistiquée de la plateforme e-commerce Mientior, basée sur les principes de psychologie comportementale, d'accessibilité universelle et d'excellence visuelle.

## 🎨 Palette Chromatique Stratégique

### Palette Primaire - Hiérarchie Émotionnelle

#### Orange Dynamique (#FF6B00 → #FF8C00)
- **Usage**: CTA principaux, badges promotionnels, indicateurs d'action
- **Psychologie**: Énergie, opportunité, urgence maîtrisée
- **Classes Tailwind**: `orange-500`, `orange-600`
- **Gradient**: `bg-gradient-to-r from-orange-500 to-orange-600`

#### Bleu Institutionnel (#1E3A8A → #2563EB)
- **Usage**: Navigation, footer, sections de confiance
- **Psychologie**: Fiabilité, expertise, professionnalisme
- **Classes Tailwind**: `blue-500`, `blue-600`

#### Accent Aurore (#FFC107 → #FFD54F)
- **Usage**: Gamification, récompenses, éléments premium
- **Psychologie**: Valeur, exclusivité, réussite
- **Classes Tailwind**: `aurore-500`, `aurore-600`
- **Effet**: Lueur subtile avec `shadow-elevation-2`

### Palette Neutre - Fondation Minimaliste

- **Blanc Pur** (`#FFFFFF`): Espace de respiration cognitif
- **Gris Platine** (`#F8F9FA`): Fond secondaire
- **Gris Anthracite** (`#2D3748`): Texte principal (contraste AAA)
- **Gris Nuancé** (`#718096`): Texte secondaire, métadonnées

## 📐 Système Typographique

### Hiérarchie des Polices

```css
/* Display - Impact Visuel */
font-family: 'Inter Variable', sans-serif;
font-weight: 700-800;
letter-spacing: -0.02em;

/* Corporative - Lisibilité */
font-family: 'Inter', system-ui;
font-weight: 400-600;
line-height: 1.6;

/* Données - Clarté Numérique */
font-feature-settings: 'tnum'; /* Tabular numerals */
```

### Échelle Modulaire (Ratio 1.250 - Major Third)

- **Display**: 48px / 3rem
- **H1**: 38px / 2.375rem
- **H2**: 30px / 1.875rem
- **H3**: 24px / 1.5rem
- **Body**: 16px / 1rem
- **Small**: 14px / 0.875rem
- **Tiny**: 12px / 0.75rem

## 🎭 Composants UI Sophistiqués

### Badge - Système de Signalétique

#### Hiérarchie des Badges

**Tier 1 - Urgence** (Orange + pulse)
```tsx
<Badge variant="flash">Vente Flash</Badge>
<Badge variant="urgent">Dernières pièces</Badge>
```

**Tier 2 - Performance** (Bleu + icône)
```tsx
<Badge variant="bestseller">Bestseller</Badge>
<Badge variant="trending">Trending</Badge>
```

**Tier 3 - Nouveauté** (Gradient aurore + shimmer)
```tsx
<Badge variant="new">Nouveau</Badge>
```

### ProductCard - Anatomie Sophistiquée

**Caractéristiques**:
- Ratio d'image 4:5 (portrait optimal)
- Lazy loading progressif (blur-up)
- Hover: Zoom doux (scale: 1.05) + rotation image
- Élévation au hover (0dp → 12dp)
- Transform: translateY(-4px)

**Micro-interactions**:
- Ripple effect sur boutons
- Image carousel au hover
- Quick view overlay
- Wishlist toggle animé

```tsx
<ProductCard
  id="prod-123"
  name="Produit Premium"
  slug="produit-premium"
  price={34.99}
  compareAtPrice={69.99}
  image="/product.jpg"
  rating={4.8}
  reviewCount={12300}
  badge={{ text: "Vente Flash", variant: "flash" }}
  freeShipping={true}
/>
```

### RippleButton - Effet Ripple Sophistiqué

**Variantes**:
- `default`: Orange gradient
- `gradient`: Orange to orange-dark
- `secondary`: Bleu
- `outline`: Transparent avec bordure
- `ghost`: Hover subtil

**Props spéciales**:
- `loading`: Affiche spinner
- `rippleColor`: Couleur de l'onde (défaut: blanc 60%)

```tsx
<RippleButton variant="gradient" size="lg" loading={isLoading}>
  Ajouter au panier
</RippleButton>
```

## 🎮 Gamification - Engagement Stratégique

### FortuneWheel - Roue de la Fortune 2.0

**Caractéristiques**:
- Canvas HTML5 pour rendu haute performance
- Sélection pondérée basée sur probabilités
- Animation physique réaliste (4s, cubic-bezier)
- Confetti effect à la victoire (50 particules)
- Haptic feedback (mobile)

```tsx
<FortuneWheel
  segments={[
    { id: '1', label: '10% OFF', value: 'DISCOUNT10', color: '#FF6B00', probability: 0.3 },
    { id: '2', label: 'Free Shipping', value: 'FREESHIP', color: '#2563EB', probability: 0.4 },
    // ...
  ]}
  spinsRemaining={3}
  onComplete={(result) => console.log('Won:', result)}
/>
```

### ChallengeCard - Défis Quotidiens

**Statuts**:
- `available`: Défi disponible
- `in-progress`: En cours
- `completed`: Terminé (récompense à réclamer)
- `expired`: Expiré

**Niveaux de difficulté**:
- EASY: ⭐ (vert)
- MEDIUM: ⭐⭐ (aurore)
- HARD: ⭐⭐⭐ (orange)
- EXPERT: ⭐⭐⭐⭐ (rouge)

```tsx
<ChallengeCard
  id="challenge-1"
  title="Shopping Spree"
  description="Effectuez 3 achats ce mois-ci"
  difficulty="MEDIUM"
  pointsReward={500}
  progress={2}
  target={3}
  timeRemaining="5 jours"
  status="in-progress"
/>
```

### LoyaltyProgress - Programme de Fidélité

**Niveaux par défaut**:
1. **Bronze** (0-999 pts): 5% réduction, livraison standard gratuite
2. **Argent** (1000-4999 pts): 10% réduction, livraison express, accès anticipé
3. **Or** (5000-14999 pts): 15% réduction, cadeaux exclusifs, support VIP
4. **Platine** (15000+ pts): 20% réduction, concierge personnel, éditions limitées

```tsx
<LoyaltyProgress currentPoints={3500} />
```

## 🎬 Animations & Micro-interactions

### Principes d'Animation

- **Durée**: 200-400ms (sweet spot cognitif)
- **Easing**: `cubic-bezier(0.4, 0.0, 0.2, 1)` pour naturalité
- **Performance**: Transform et opacity uniquement (GPU accelerated)

### Catalogue d'Animations Tailwind

```css
/* Pulse subtil */
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* Shimmer effect */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Ripple effect */
@keyframes ripple {
  0% { transform: scale(0); opacity: 0.8; }
  100% { transform: scale(4); opacity: 0; }
}

/* Scale in */
@keyframes scale-in {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* Confetti */
@keyframes confetti {
  to {
    transform: translate(var(--confetti-x), var(--confetti-y)) rotate(var(--confetti-rotation));
    opacity: 0;
  }
}
```

## 🎯 Design Tokens

### Spacing (Échelle 8px)
```js
spacing: {
  unit: '8px',
  scale: [4, 8, 12, 16, 24, 32, 48, 64, 96]
}
```

### Border Radius
```js
borderRadius: {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px'
}
```

### Elevation (Shadows)
```js
elevation: {
  0: 'none',
  1: '0 1px 3px rgba(0,0,0,0.12)',
  2: '0 4px 6px rgba(0,0,0,0.1)',
  3: '0 10px 15px rgba(0,0,0,0.1)',
  4: '0 20px 25px rgba(0,0,0,0.15)'
}
```

## ♿ Accessibilité (WCAG 2.2 AAA)

- **Contraste**: Minimum 7:1 pour texte principal
- **Focus visible**: Outline 3px, high contrast
- **Navigation clavier**: Tab-order logique, skip links
- **Screen readers**: ARIA labels exhaustifs
- **Reduced motion**: Respect de `prefers-reduced-motion`
- **Font scaling**: Support jusqu'à 200% zoom

## 📱 Responsive Design

### Breakpoints
```js
screens: {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}
```

### Grille Produits Adaptative
- **Desktop XL**: 5 colonnes
- **Desktop**: 4 colonnes
- **Tablet**: 3 colonnes
- **Mobile**: 2 colonnes

## 🚀 Performance

- **Images**: WebP avec fallback, lazy loading progressif
- **Code-splitting**: Route-based et component-based
- **Prefetch**: Intersection Observer pour liens visibles
- **Service Worker**: Offline capability

---

**Version**: 1.0.0  
**Dernière mise à jour**: 2025-11-07  
**Auteur**: Mientior Design Team

