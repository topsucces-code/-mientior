# Checkout Enhancements Documentation

## Vue d'ensemble

Ce document décrit les améliorations apportées au processus de checkout pour améliorer l'expérience utilisateur, la sécurité et les performances.

## Nouvelles fonctionnalités

### 1. Système de codes promo

#### Endpoint: `/api/checkout/apply-coupon`

**Méthode:** POST

**Body:**
```json
{
  "code": "PROMO2024",
  "subtotal": 5000
}
```

**Réponse succès:**
```json
{
  "success": true,
  "discount": 500,
  "message": "Code promo appliqué ! Réduction de 5.00€",
  "promoCodeId": "clx..."
}
```

**Réponse erreur:**
```json
{
  "success": false,
  "error": "Code promo invalide"
}
```

#### Types de codes promo

- **PERCENTAGE**: Réduction en pourcentage (ex: 10%)
- **FIXED_AMOUNT**: Montant fixe en centimes (ex: 1000 = 10€)

#### Validations

- Code actif (isActive = true)
- Dates de validité (validFrom / validTo)
- Montant minimum de commande (minOrderAmount)
- Limite d'utilisation (usageLimit)
- Réduction maximale (maxDiscount pour les pourcentages)

### 2. Autocomplétion des codes postaux

#### Endpoint: `/api/checkout/cities`

**Méthode:** GET

**Query params:**
- `postalCode`: Code postal à 5 chiffres

**Réponse:**
```json
{
  "success": true,
  "cities": [
    {
      "name": "Paris",
      "postalCode": "75001",
      "code": "75056",
      "department": "75",
      "region": "11",
      "population": 2187526
    }
  ]
}
```

#### Intégration

Le composant `PostalCodeAutocomplete` utilise l'API geo.api.gouv.fr pour suggérer automatiquement les villes correspondant au code postal saisi.

**Fonctionnalités:**
- Suggestions en temps réel
- Navigation au clavier (↑/↓, Enter, Escape)
- Auto-remplissage de la ville
- Accessible (ARIA)

### 3. Sécurité renforcée

#### Utilitaires disponibles (`src/lib/security.ts`)

**CSRF Protection:**
```typescript
import { getCSRFToken, validateCSRFToken } from '@/lib/security'

// Client-side
const token = getCSRFToken()

// Server-side
validateCSRFToken(receivedToken, storedToken)
```

**Chiffrement des données:**
```typescript
import { encryptPaymentData, decryptPaymentData } from '@/lib/security'

// Encrypt
const encrypted = await encryptPaymentData(sensitiveData)

// Decrypt
const decrypted = await decryptPaymentData(encrypted, key)
```

**Détection d'activité suspecte:**
```typescript
import { detectSuspiciousActivity } from '@/lib/security'

const indicators = detectSuspiciousActivity(requestHistory, userAgent, ip)
if (indicators.multipleFailedAttempts) {
  // Block or challenge user
}
```

### 4. Rate Limiting

#### Configuration disponible

**Payment Rate Limit:**
- 3 requêtes par 5 minutes
- Protège contre les tentatives de fraude

**Checkout Rate Limit:**
- 20 requêtes par minute
- Protection standard

**Coupon Rate Limit:**
- 10 requêtes par minute
- Empêche le bruteforce de codes promo

#### Utilisation

```typescript
import { checkRateLimit, paymentRateLimit } from '@/middleware/rate-limit'

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, paymentRateLimit)
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }
  
  // Process request...
}
```

### 5. Analytics améliorées

#### Événements trackés

- Début du checkout
- Complétion de chaque étape
- Application/suppression de code promo
- Sélection de mode de livraison
- Erreurs de paiement (catégorisées)
- Abandon de panier

#### Hook d'analytics

```typescript
import { useCheckoutAnalytics } from '@/hooks/use-checkout-analytics'

const {
  trackCheckoutStart,
  trackStepCompleted,
  trackError,
  trackCouponApplied,
  trackAbandonment
} = useCheckoutAnalytics({ step, items, total })
```

## Optimisations de performance

### 1. Lazy Loading des étapes

Les composants des étapes de checkout sont chargés à la demande pour réduire le bundle initial :

```typescript
const ShippingForm = React.lazy(() => import('./shipping-form'))
const PaymentForm = React.lazy(() => import('./payment-form'))
```

### 2. Préchargement intelligent

L'étape suivante est préchargée lorsque l'utilisateur arrive sur une étape :

```typescript
React.useEffect(() => {
  if (currentStep === 'shipping') {
    // Preload payment step
    import('./payment-form')
  }
}, [currentStep])
```

## Configuration requise

### Variables d'environnement

```env
# Prisma Database
PRISMA_DATABASE_URL="postgresql://..."

# Payment Gateways
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_..."
PAYSTACK_SECRET_KEY="sk_..."

NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY="FLWPUBK_..."
FLUTTERWAVE_SECRET_KEY="FLWSECK_..."
```

### Base de données

Le schéma Prisma doit inclure les modèles suivants :
- `PromoCode`
- `PromoCodeUsage`
- `Order`
- `OrderItem`

Exécutez les migrations :
```bash
npm run db:push
```

## Tests

### Tester les codes promo

1. Créer un code promo dans Prisma Studio
2. Appliquer le code dans le checkout
3. Vérifier que la réduction est appliquée au total

### Tester le rate limiting

```bash
# Faire plusieurs requêtes rapides
for i in {1..15}; do
  curl http://localhost:3000/api/checkout/apply-coupon \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"code":"TEST","subtotal":1000}'
done
```

## Sécurité - Checklist

- [ ] HTTPS activé en production
- [ ] CSRF tokens validés sur toutes les mutations
- [ ] Rate limiting configuré sur endpoints sensibles
- [ ] Validation côté serveur de tous les montants
- [ ] Logs d'audit pour les transactions
- [ ] Webhooks sécurisés avec signatures HMAC

## Support

Pour toute question ou problème :
1. Vérifiez les logs serveur
2. Consultez la documentation Prisma
3. Vérifiez les variables d'environnement
4. Testez les endpoints avec Postman/Insomnia

## Roadmap

### Prochaines améliorations

- [ ] Intégration Apple Pay / Google Pay
- [ ] Save pour plus tard
- [ ] Checkout invité amélioré
- [ ] Multi-devise
- [ ] Cartes cadeaux
- [ ] Programme de fidélité
