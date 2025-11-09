# 🚀 Guide de Démarrage Rapide - Mientior Design System

## 📋 Table des Matières

1. [Installation](#installation)
2. [Premiers Pas](#premiers-pas)
3. [Exemples Rapides](#exemples-rapides)
4. [Ressources](#ressources)

## 🔧 Installation

Le système de design est déjà intégré dans le projet. Aucune installation supplémentaire n'est nécessaire.

### Dépendances Requises

Toutes les dépendances sont déjà installées :
- ✅ `tailwindcss` - Framework CSS
- ✅ `class-variance-authority` - Gestion des variantes
- ✅ `lucide-react` - Bibliothèque d'icônes
- ✅ `@radix-ui/*` - Composants UI primitifs

## 🎯 Premiers Pas

### 1. Visualiser le Système de Design

```bash
npm run dev
```

Visitez : `http://localhost:3000/design-showcase`

### 2. Structure des Fichiers

```
src/
├── components/
│   ├── ui/                      # Composants UI de base
│   │   ├── badge.tsx           # Système de badges
│   │   ├── button.tsx          # Boutons standards
│   │   ├── ripple-button.tsx   # Boutons avec effet ripple
│   │   └── product-card.tsx    # Cards produits
│   └── gamification/            # Composants de gamification
│       ├── fortune-wheel.tsx   # Roue de la fortune
│       ├── challenge-card.tsx  # Cartes de défis
│       └── loyalty-progress.tsx # Programme de fidélité
└── app/
    └── (app)/
        └── design-showcase/     # Page de démonstration
            └── page.tsx
```

## ⚡ Exemples Rapides

### Badge Simple

```tsx
import { Badge } from '@/components/ui/badge'
import { Flame } from 'lucide-react'

export function MyComponent() {
  return (
    <div>
      <Badge variant="flash">Vente Flash</Badge>
      <Badge variant="new" icon={<Flame />}>Nouveau</Badge>
      <Badge variant="urgent" pulse>Dernières Pièces</Badge>
    </div>
  )
}
```

### Product Card

```tsx
import { ProductCard } from '@/components/ui/product-card'

export function ProductGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <ProductCard
        id="1"
        name="Montre Élégante"
        slug="montre-elegante"
        price={199.99}
        compareAtPrice={399.99}
        image="/images/watch.jpg"
        rating={4.8}
        reviewCount={12300}
        badge={{ text: "Vente Flash", variant: "flash" }}
        freeShipping={true}
        onAddToCart={(id) => console.log('Add to cart:', id)}
      />
    </div>
  )
}
```

### Fortune Wheel

```tsx
import { FortuneWheel } from '@/components/gamification/fortune-wheel'

export function GamificationPage() {
  const segments = [
    { id: '1', label: '10% OFF', value: 'DISCOUNT10', color: '#FF6B00', probability: 0.3 },
    { id: '2', label: 'Free Ship', value: 'FREESHIP', color: '#2563EB', probability: 0.4 },
    { id: '3', label: '20% OFF', value: 'DISCOUNT20', color: '#FFC107', probability: 0.2 },
    { id: '4', label: 'Gift', value: 'GIFT', color: '#10b981', probability: 0.1 },
  ]

  return (
    <FortuneWheel
      segments={segments}
      spinsRemaining={3}
      onComplete={(result) => {
        console.log('Won:', result)
        // Appliquer la récompense
      }}
    />
  )
}
```

### Challenge Card

```tsx
import { ChallengeCard } from '@/components/gamification/challenge-card'

export function ChallengesPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChallengeCard
        id="1"
        title="Shopping Spree"
        description="Effectuez 3 achats ce mois-ci"
        difficulty="MEDIUM"
        pointsReward={500}
        progress={2}
        target={3}
        unit="achats"
        timeRemaining="15 jours"
        status="in-progress"
        onAccept={(id) => console.log('Accept:', id)}
        onClaim={(id) => console.log('Claim:', id)}
      />
    </div>
  )
}
```

### Loyalty Progress

```tsx
import { LoyaltyProgress } from '@/components/gamification/loyalty-progress'

export function ProfilePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <LoyaltyProgress currentPoints={3500} />
    </div>
  )
}
```

## 🎨 Utilisation des Couleurs

### Classes Tailwind Personnalisées

```tsx
// Orange Dynamique
<div className="bg-orange-500 text-white">
<div className="bg-gradient-to-r from-orange-500 to-orange-600">

// Bleu Institutionnel
<div className="bg-blue-500 text-white">
<div className="bg-blue-600">

// Accent Aurore
<div className="bg-aurore-500">
<div className="bg-gradient-to-r from-aurore-500 to-aurore-600">

// Neutres
<div className="bg-platinum-100">
<div className="text-anthracite-500">
<div className="text-nuanced-500">
```

## 🎭 Animations

### Classes d'Animation Disponibles

```tsx
// Pulse subtil
<div className="animate-pulse-subtle">

// Shimmer effect
<div className="animate-shimmer bg-[length:200%_100%]">

// Scale in
<div className="animate-scale-in">

// Fade in up
<div className="animate-fade-in-up">
```

### Système d'Élévation

```tsx
// Shadows
<div className="shadow-elevation-1"> // Subtil
<div className="shadow-elevation-2"> // Moyen
<div className="shadow-elevation-3"> // Prononcé
<div className="shadow-elevation-4"> // Maximum
```

## 📱 Responsive Design

### Breakpoints

```tsx
// Mobile first
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

// Spacing responsive
<div className="p-4 md:p-6 lg:p-8">

// Typography responsive
<h1 className="text-2xl md:text-3xl lg:text-4xl">
```

## 🔗 Intégration avec Payload CMS

### Récupérer les Récompenses

```tsx
import { getPayload } from '@/lib/payload'

export async function getRewards() {
  const payload = await getPayload()
  
  const rewards = await payload.find({
    collection: 'rewards',
    where: {
      active: { equals: true }
    },
    limit: 10
  })
  
  return rewards.docs
}
```

### Récupérer les Défis

```tsx
import { getPayload } from '@/lib/payload'

export async function getChallenges() {
  const payload = await getPayload()
  
  const challenges = await payload.find({
    collection: 'challenges',
    where: {
      active: { equals: true },
      startDate: { less_than_equal: new Date() }
    },
    sort: '-featured'
  })
  
  return challenges.docs
}
```

## 🎯 Bonnes Pratiques

### 1. Hiérarchie Visuelle
```tsx
// ✅ Bon - Utilisation modérée des badges urgents
<Badge variant="flash">Vente Flash</Badge>

// ❌ Mauvais - Trop de badges urgents
<Badge variant="flash">Tout</Badge>
<Badge variant="urgent">Est</Badge>
<Badge variant="flash">Urgent</Badge>
```

### 2. Accessibilité
```tsx
// ✅ Bon - ARIA labels appropriés
<button aria-label="Ajouter aux favoris">
  <Heart />
</button>

// ❌ Mauvais - Pas de label
<button>
  <Heart />
</button>
```

### 3. Performance
```tsx
// ✅ Bon - Lazy loading
<Image
  src="/product.jpg"
  alt="Product"
  loading="lazy"
/>

// ❌ Mauvais - Eager loading partout
<Image
  src="/product.jpg"
  alt="Product"
  loading="eager"
/>
```

## 📚 Ressources

### Documentation
- [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) - Vue d'ensemble technique
- [DESIGN_GUIDE.md](./DESIGN_GUIDE.md) - Guide détaillé
- [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md) - Résumé de l'implémentation

### Liens Externes
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)
- [Payload CMS](https://payloadcms.com/docs)

### Support
- Issues GitHub: [github.com/mientior/issues](https://github.com)
- Documentation: `/design-showcase`

---

**Prêt à créer des expériences e-commerce exceptionnelles !** 🚀

