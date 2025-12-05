# 🌍 Localisation Afrique - Mientior

## Vue d'ensemble

Mientior est adapté pour le marché africain avec support complet pour :
- **28 pays africains** (Afrique de l'Ouest, Centrale, de l'Est, du Nord, du Sud)
- **8 devises** (XOF, XAF, NGN, KES, ZAR, MAD, GHS, EUR)
- **3 langues** (Français, Anglais, Arabe)
- **10+ méthodes de paiement** (Mobile Money, cartes, virement, COD)

---

## 🗣️ Internationalisation (i18n)

### Langues supportées

| Code | Langue | Direction | Pays principaux |
|------|--------|-----------|-----------------|
| `fr` | Français | LTR | Sénégal, Côte d'Ivoire, Cameroun, Mali, etc. |
| `en` | English | LTR | Nigeria, Ghana, Kenya, South Africa, etc. |
| `ar` | العربية | RTL | Maroc, Algérie, Tunisie, Égypte |

### Configuration

```typescript
// src/i18n/config.ts
import { locales, defaultLocale, isRtlLocale } from '@/i18n/config';

// Locales disponibles
console.log(locales); // ['fr', 'en', 'ar']

// Vérifier si RTL
console.log(isRtlLocale('ar')); // true
```

### Utilisation dans les composants

```tsx
'use client';
import { useTranslations } from 'next-intl';

export function ProductCard() {
  const t = useTranslations('products');
  
  return (
    <button>{t('addToCart')}</button>
    // FR: "Ajouter au panier"
    // EN: "Add to cart"
    // AR: "أضف إلى السلة"
  );
}
```

### Fichiers de traduction

```
src/i18n/messages/
├── fr.json  # Français (défaut)
├── en.json  # English
└── ar.json  # العربية
```

---

## 💰 Devises Africaines

### Devises supportées

| Code | Nom | Symbole | Pays | Taux (vs EUR) |
|------|-----|---------|------|---------------|
| `XOF` | Franc CFA (BCEAO) | FCFA | Sénégal, Côte d'Ivoire, Mali, etc. | 655.957 (fixe) |
| `XAF` | Franc CFA (BEAC) | FCFA | Cameroun, Gabon, Congo, etc. | 655.957 (fixe) |
| `NGN` | Nigerian Naira | ₦ | Nigeria | ~1650 |
| `KES` | Kenyan Shilling | KSh | Kenya | ~165 |
| `ZAR` | South African Rand | R | Afrique du Sud | ~20 |
| `MAD` | Dirham Marocain | DH | Maroc | ~11 |
| `GHS` | Ghanaian Cedi | GH₵ | Ghana | ~15 |
| `EUR` | Euro | € | Référence | 1 |

### Utilisation

```typescript
import { formatPrice, convertPrice } from '@/lib/currency-utils';

// Formater un prix
formatPrice(25, 'XOF', 'fr'); // "16 399 FCFA"
formatPrice(25, 'NGN', 'en'); // "₦41,250.00"
formatPrice(25, 'MAD', 'ar'); // "275.00 DH"

// Convertir
convertPrice(100, 'XOF'); // 65595.7 FCFA
```

---

## 💳 Méthodes de Paiement

### Mobile Money

| Service | Pays | ID |
|---------|------|-----|
| **Orange Money** | SN, CI, ML, BF, NE, CM, GN, MG | `orange_money` |
| **MTN Mobile Money** | CI, CM, GH, UG, RW, BJ, CG | `mtn_momo` |
| **M-Pesa** | KE, TZ, GH, EG | `mpesa` |
| **Wave** | SN, CI, ML, BF | `wave` |
| **Moov Money** | CI, BJ, TG, NE, BF | `moov_money` |
| **Free Money** | SN | `free_money` |

### Autres méthodes

| Méthode | Disponibilité | ID |
|---------|---------------|-----|
| **Visa/Mastercard** | Tous les pays | `visa`, `mastercard` |
| **Virement bancaire** | Tous les pays | `bank_transfer` |
| **Paiement à la livraison** | SN, CI, CM, NG, GH, KE, MA | `cod` |

### Intégration

```tsx
import { AfricanPaymentMethods } from '@/components/checkout/african-payment-methods';

<AfricanPaymentMethods
  countryCode="SN"
  selectedMethod={selectedPayment}
  onSelect={setSelectedPayment}
/>
```

---

## 🚚 Livraison

### Zones de livraison

| Zone | Délai | Multiplicateur |
|------|-------|----------------|
| `urban` | 1-2 jours | x1.0 |
| `suburban` | 2-4 jours | x1.3 |
| `rural` | 3-7 jours | x1.6 |

### Villes principales

```typescript
import { getCitiesForCountry, getDeliveryEstimate } from '@/lib/african-cities';

const cities = getCitiesForCountry('SN');
// [{ name: 'Dakar', region: 'Dakar', deliveryZone: 'urban', ... }, ...]

const estimate = getDeliveryEstimate(cities[0]);
// "1-2 jours"
```

### Seuils de livraison gratuite

| Région | Seuil (EUR) |
|--------|-------------|
| Afrique de l'Ouest (FCFA) | 30€ |
| Afrique Centrale | 35-40€ |
| Afrique de l'Est | 40-45€ |
| Afrique du Nord | 40-45€ |
| Afrique du Sud | 50€ |

---

## 🏳️ Pays Supportés

### Afrique de l'Ouest - Zone FCFA (XOF)

| Code | Pays | Capitale | Langue |
|------|------|----------|--------|
| SN | Sénégal 🇸🇳 | Dakar | Français |
| CI | Côte d'Ivoire 🇨🇮 | Yamoussoukro | Français |
| ML | Mali 🇲🇱 | Bamako | Français |
| BF | Burkina Faso 🇧🇫 | Ouagadougou | Français |
| NE | Niger 🇳🇪 | Niamey | Français |
| TG | Togo 🇹🇬 | Lomé | Français |
| BJ | Bénin 🇧🇯 | Porto-Novo | Français |
| GW | Guinée-Bissau 🇬🇼 | Bissau | Français |

### Afrique Centrale - Zone FCFA (XAF)

| Code | Pays | Capitale | Langue |
|------|------|----------|--------|
| CM | Cameroun 🇨🇲 | Yaoundé | Français |
| GA | Gabon 🇬🇦 | Libreville | Français |
| CG | Congo 🇨🇬 | Brazzaville | Français |
| TD | Tchad 🇹🇩 | N'Djamena | Français |
| CF | Centrafrique 🇨🇫 | Bangui | Français |
| GQ | Guinée équatoriale 🇬🇶 | Malabo | Français |

### Afrique Anglophone

| Code | Pays | Capitale | Devise |
|------|------|----------|--------|
| NG | Nigeria 🇳🇬 | Abuja | NGN |
| GH | Ghana 🇬🇭 | Accra | GHS |
| KE | Kenya 🇰🇪 | Nairobi | KES |
| ZA | Afrique du Sud 🇿🇦 | Pretoria | ZAR |
| TZ | Tanzanie 🇹🇿 | Dodoma | TZS |
| UG | Ouganda 🇺🇬 | Kampala | UGX |
| RW | Rwanda 🇷🇼 | Kigali | RWF |

### Afrique du Nord (Arabophone)

| Code | Pays | Capitale | Devise |
|------|------|----------|--------|
| MA | Maroc 🇲🇦 | Rabat | MAD |
| DZ | Algérie 🇩🇿 | Alger | DZD |
| TN | Tunisie 🇹🇳 | Tunis | TND |
| EG | Égypte 🇪🇬 | Le Caire | EGP |

---

## 🔧 Configuration Technique

### Variables d'environnement

```env
# Devise par défaut
DEFAULT_CURRENCY=XOF

# Pays par défaut
DEFAULT_COUNTRY=SN

# Locale par défaut
DEFAULT_LOCALE=fr

# APIs de paiement
ORANGE_MONEY_API_KEY=xxx
MTN_MOMO_API_KEY=xxx
MPESA_API_KEY=xxx
WAVE_API_KEY=xxx
```

### Schéma Prisma

```prisma
model User {
  countryCode String @default("SN")
  currency    String @default("XOF")
  locale      String @default("fr")
  phone       String? // Pour Mobile Money
}

model Order {
  currency     String @default("XOF")
  currencyRate Float  @default(1)
  totalInEur   Float? // Pour reporting
  countryCode  String?
  locale       String @default("fr")
  paymentMethod String? // orange_money, mtn_momo, etc.
}
```

---

## 📱 Composants UI

### Sélecteur Pays/Devise

```tsx
import { CountryCurrencySelector } from '@/components/header/country-currency-selector';

<CountryCurrencySelector />
```

### Méthodes de paiement

```tsx
import { AfricanPaymentMethods } from '@/components/checkout/african-payment-methods';

<AfricanPaymentMethods
  countryCode="SN"
  selectedMethod={method}
  onSelect={setMethod}
/>
```

---

## 🚀 Roadmap

### Phase 1 (Actuel) ✅
- [x] Support 28 pays africains
- [x] 8 devises
- [x] 3 langues (fr, en, ar)
- [x] Mobile Money (Orange, MTN, M-Pesa, Wave)
- [x] Villes principales pour livraison

### Phase 2 (Prévu)
- [ ] Intégration API Orange Money
- [ ] Intégration API MTN MoMo
- [ ] Intégration M-Pesa
- [ ] SMS notifications (Twilio)
- [ ] WhatsApp Business API

### Phase 3 (Futur)
- [ ] Support langues locales (Wolof, Swahili, etc.)
- [ ] Points relais partenaires
- [ ] Livraison express inter-villes
- [ ] Application mobile

---

*Document mis à jour : Décembre 2024*
