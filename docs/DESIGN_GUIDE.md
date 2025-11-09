# 🎨 Guide d'Utilisation du Système de Design Mientior

## 🚀 Démarrage Rapide

### Visualiser le Système de Design

Pour voir tous les composants en action, visitez la page de démonstration :

```bash
npm run dev
```

Puis naviguez vers : `http://localhost:3000/design-showcase`

## 📦 Composants Disponibles

### 1. Badge - Système de Signalétique

#### Import
```tsx
import { Badge } from '@/components/ui/badge'
```

#### Utilisation Basique
```tsx
<Badge variant="flash">Vente Flash</Badge>
<Badge variant="new" icon={<Sparkles />}>Nouveau</Badge>
<Badge variant="urgent" pulse>Offre Limitée</Badge>
```

#### Variantes Disponibles
- `flash` - Urgence maximale (orange gradient + pulse)
- `urgent` - Urgence (orange solide)
- `bestseller` - Performance (bleu gradient)
- `trending` - Tendance (bleu solide)
- `new` - Nouveauté (aurore gradient + shimmer)
- `success` - Succès (vert)
- `warning` - Avertissement (jaune)
- `error` - Erreur (rouge)
- `default` - Standard (gris)
- `outline` - Contour transparent

#### Tailles
- `sm` - Petit (10px)
- `md` - Moyen (11px) - Par défaut
- `lg` - Grand (12px)

### 2. ProductCard - Card Produit Sophistiquée

#### Import
```tsx
import { ProductCard } from '@/components/ui/product-card'
```

#### Exemple Complet
```tsx
<ProductCard
  id="prod-123"
  name="Montre Élégante Premium"
  slug="montre-elegante-premium"
  price={199.99}
  compareAtPrice={399.99}
  image="/images/watch.jpg"
  images={['/images/watch-2.jpg', '/images/watch-3.jpg']}
  rating={4.8}
  reviewCount={12300}
  badge={{ text: "Vente Flash", variant: "flash" }}
  freeShipping={true}
  inStock={true}
  onAddToCart={(id) => console.log('Add to cart:', id)}
  onQuickView={(id) => console.log('Quick view:', id)}
  onWishlistToggle={(id) => console.log('Toggle wishlist:', id)}
  isInWishlist={false}
/>
```

#### Props Principales
- `id` - Identifiant unique du produit
- `name` - Nom du produit
- `slug` - URL slug pour le lien
- `price` - Prix actuel
- `compareAtPrice` - Prix barré (optionnel)
- `image` - Image principale
- `images` - Images secondaires (rotation au hover)
- `rating` - Note sur 5
- `reviewCount` - Nombre d'avis
- `badge` - Badge à afficher
- `freeShipping` - Affiche badge livraison gratuite
- `inStock` - Disponibilité

#### Callbacks
- `onAddToCart(id)` - Ajout au panier
- `onQuickView(id)` - Aperçu rapide
- `onWishlistToggle(id)` - Toggle favoris

### 3. FortuneWheel - Roue de la Fortune

#### Import
```tsx
import { FortuneWheel, type WheelSegment } from '@/components/gamification/fortune-wheel'
```

#### Configuration des Segments
```tsx
const segments: WheelSegment[] = [
  {
    id: '1',
    label: '10% OFF',
    value: 'Réduction de 10%',
    color: '#FF6B00',
    probability: 0.25 // 25% de chance
  },
  {
    id: '2',
    label: 'Livraison Gratuite',
    value: 'Livraison gratuite',
    color: '#2563EB',
    probability: 0.3 // 30% de chance
  },
  // ... autres segments
]
```

#### Utilisation
```tsx
<FortuneWheel
  segments={segments}
  spinsRemaining={3}
  onSpin={(result) => console.log('Spinning...', result)}
  onComplete={(result) => {
    console.log('Won:', result)
    // Appliquer la récompense
  }}
  disabled={false}
/>
```

#### Caractéristiques
- ✅ Sélection pondérée basée sur probabilités
- ✅ Animation physique réaliste (4 secondes)
- ✅ Effet confetti à la victoire
- ✅ Compteur de tours restants
- ✅ Rendu Canvas haute performance

### 4. ChallengeCard - Carte de Défi

#### Import
```tsx
import { ChallengeCard } from '@/components/gamification/challenge-card'
```

#### Exemple
```tsx
<ChallengeCard
  id="challenge-1"
  title="Shopping Spree"
  description="Effectuez 3 achats ce mois-ci"
  type="PURCHASE_COUNT"
  difficulty="MEDIUM"
  pointsReward={500}
  progress={2}
  target={3}
  unit="achats"
  timeRemaining="15 jours"
  participantCount={12500}
  featured={true}
  status="in-progress"
  onAccept={(id) => console.log('Accept challenge:', id)}
  onClaim={(id) => console.log('Claim reward:', id)}
/>
```

#### Niveaux de Difficulté
- `EASY` - Facile (⭐, vert)
- `MEDIUM` - Moyen (⭐⭐, aurore)
- `HARD` - Difficile (⭐⭐⭐, orange)
- `EXPERT` - Expert (⭐⭐⭐⭐, rouge)

#### Statuts
- `available` - Disponible (bouton "Accepter")
- `in-progress` - En cours (bouton désactivé)
- `completed` - Terminé (bouton "Réclamer")
- `expired` - Expiré (grisé)

### 5. LoyaltyProgress - Programme de Fidélité

#### Import
```tsx
import { LoyaltyProgress } from '@/components/gamification/loyalty-progress'
```

#### Utilisation Simple
```tsx
<LoyaltyProgress currentPoints={3500} />
```

#### Niveaux Par Défaut
1. **Bronze** (0-999 pts)
   - 5% de réduction
   - Livraison standard gratuite

2. **Argent** (1000-4999 pts)
   - 10% de réduction
   - Livraison express gratuite
   - Accès anticipé aux ventes

3. **Or** (5000-14999 pts)
   - 15% de réduction
   - Livraison prioritaire
   - Cadeaux exclusifs
   - Support VIP

4. **Platine** (15000+ pts)
   - 20% de réduction
   - Livraison gratuite illimitée
   - Événements exclusifs
   - Concierge personnel
   - Produits en édition limitée

#### Niveaux Personnalisés
```tsx
const customLevels = [
  {
    name: 'Débutant',
    minPoints: 0,
    maxPoints: 499,
    color: 'from-gray-400 to-gray-600',
    icon: <Star />,
    perks: ['Bienvenue !']
  },
  // ... autres niveaux
]

<LoyaltyProgress currentPoints={250} levels={customLevels} />
```

## 🎨 Palette de Couleurs

### Utilisation dans Tailwind

```tsx
// Orange Dynamique
className="bg-orange-500 text-white"
className="bg-gradient-to-r from-orange-500 to-orange-600"

// Bleu Institutionnel
className="bg-blue-500 text-white"
className="bg-blue-600"

// Accent Aurore
className="bg-aurore-500"
className="bg-gradient-to-r from-aurore-500 to-aurore-600"

// Neutres
className="bg-platinum-100"
className="text-anthracite-500"
className="text-nuanced-500"
```

## 🎭 Animations Personnalisées

### Classes Disponibles

```tsx
// Pulse subtil
className="animate-pulse-subtle"

// Shimmer effect
className="animate-shimmer bg-[length:200%_100%]"

// Scale in
className="animate-scale-in"

// Ripple (automatique sur RippleButton)
```

## 📐 Système d'Élévation

```tsx
// Shadows
className="shadow-elevation-1" // Subtil
className="shadow-elevation-2" // Moyen
className="shadow-elevation-3" // Prononcé
className="shadow-elevation-4" // Maximum
```

## 🔧 Bonnes Pratiques

### 1. Hiérarchie Visuelle
- Utilisez les badges `flash` et `urgent` avec parcimonie
- Réservez `featured` pour 1-2 défis maximum
- Maintenez une cohérence dans les couleurs

### 2. Performance
- Les ProductCards utilisent lazy loading automatique
- Les images sont optimisées avec Next.js Image
- Les animations utilisent GPU acceleration

### 3. Accessibilité
- Tous les composants respectent WCAG 2.2 AAA
- Navigation clavier complète
- ARIA labels appropriés
- Support reduced-motion

### 4. Responsive
- Tous les composants sont mobile-first
- Grilles adaptatives automatiques
- Touch-friendly sur mobile

## 🐛 Dépannage

### Les badges ne s'affichent pas correctement
Vérifiez que vous avez importé les styles Tailwind personnalisés :
```tsx
import '@/app/globals.css'
```

### Les animations ne fonctionnent pas
Assurez-vous que les animations sont définies dans `tailwind.config.ts` :
```js
animation: {
  'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
  'shimmer': 'shimmer 2s linear infinite',
  // ...
}
```

### Les couleurs personnalisées ne fonctionnent pas
Vérifiez la configuration des couleurs dans `tailwind.config.ts` :
```js
colors: {
  orange: { /* ... */ },
  aurore: { /* ... */ },
  // ...
}
```

## 📚 Ressources

- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)

## 🤝 Contribution

Pour ajouter de nouveaux composants au système de design :

1. Créez le composant dans `src/components/ui/` ou `src/components/gamification/`
2. Ajoutez la documentation dans ce guide
3. Ajoutez un exemple dans `/design-showcase`
4. Testez l'accessibilité et la responsivité
5. Soumettez une PR avec screenshots

---

**Version**: 1.0.0  
**Dernière mise à jour**: 2025-11-07

