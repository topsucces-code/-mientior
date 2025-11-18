# CAHIER DE CHARGE - MIENTIOR E-COMMERCE

**Date**: 18 novembre 2025
**Version**: 1.0

---

## 📋 PRÉSENTATION DU PROJET

Mientior est une plateforme e-commerce marketplace de niveau entreprise construite avec:
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Admin**: Refine framework + Ant Design
- **Backend**: Prisma ORM + PostgreSQL
- **Auth**: Better Auth
- **Paiements**: Stripe
- **Cache**: Redis

**Statut actuel**: 50% complété (UI: 85%, Backend: 45%, Intégration: 30%)

---

## 🎯 OBJECTIFS

### Objectifs métier
1. Vente en ligne performante avec parcours d'achat fluide
2. Gestion centralisée via panel admin
3. Expérience utilisateur premium
4. Fidélisation client (points de fidélité)
5. Optimisation des conversions

### Objectifs techniques
1. Performance (Lighthouse > 90)
2. SEO (SSR, métadonnées dynamiques)
3. Sécurité (Better Auth, Stripe PCI compliant)
4. Scalabilité (architecture modulaire)
5. Maintenabilité (TypeScript strict, code documenté)

---

## 📦 MODULES FONCTIONNELS

### ✅ Modules implémentés

| Module | Fonctionnalités | Statut |
|--------|----------------|--------|
| Catalogue produits | Listing, filtres, tri, recherche | ✅ Complet |
| Gestion produits (Admin) | CRUD, variantes, images, tags | ✅ Complet |
| Gestion catégories (Admin) | CRUD hiérarchique | ✅ Complet |
| Panier | Ajout/retrait, quantités, persistance | ✅ Complet |
| Wishlist | Favoris avec localStorage | ✅ Complet |
| Comparateur | Comparaison 4 produits max | ✅ Complet |
| Recherche | Full-text Prisma | ✅ Complet |

### ⚠️ Modules partiels

| Module | Manquant | Priorité |
|--------|----------|----------|
| **Tunnel d'achat** | Stripe Elements, création commande | 🔴 Critique |
| **Compte utilisateur** | Récupération données réelles | 🟡 Haute |
| **Gestion commandes (Admin)** | Édition, changement statut | 🟡 Haute |
| **Avis produits** | API endpoints, soumission | 🟢 Moyenne |

### ❌ Modules non implémentés

| Module | Description | Priorité |
|--------|-------------|----------|
| **Authentification UI** | Pages login/signup | 🔴 Critique |
| **Emails** | Templates React Email | 🔴 Critique |
| **Codes promo** | Validation, application | 🟡 Haute |
| **Upload images** | Gestion S3/Cloudflare | 🟡 Haute |
| **Multi-langue** | i18n implementation | 🟢 Basse |

---

## 🗄️ ARCHITECTURE BASE DE DONNÉES

### Modèles Prisma (10 principaux)

**Product**
- Champs: name, slug, description, price, stock, status
- Relations: category, images[], variants[], tags[], reviews[]

**Category**
- Hiérarchique (parent/children)
- Champs: name, slug, description, image, order

**Order**
- Champs: orderNumber, status, paymentStatus, totals
- Relations: user, items[]

**User** (Better Auth)
- Champs: email, firstName, lastName, loyaltyPoints
- Relations: orders[], reviews[]

**Review**
- Champs: rating, title, comment, status
- Relations: product, user

+ FAQ, Media, Analytics, AuditLog

---

## 🔐 SÉCURITÉ

### Bloquants critiques
- ⚠️ **Stripe Elements manquant** (non PCI compliant)
- ⚠️ **Admin panel non protégé**
- ⚠️ **Pas de rate limiting**

### À implémenter
- Stripe Elements dans checkout
- Auth provider pour admin Refine
- Rate limiting API
- Input sanitization
- CSRF protection

---

## 📊 PERFORMANCE

### Objectifs
- Lighthouse Performance: > 90
- FCP: < 1.5s
- LCP: < 2.5s
- TTI: < 3.5s

### Optimisations implémentées
- ✅ ISR prêt
- ✅ Cache Redis
- ✅ Next.js Image optimization
- ✅ Dynamic imports

### À implémenter
- ❌ ISR revalidation fonctionnelle
- ❌ Bundle splitting optimisé
- ❌ CDN pour assets

---

## 🚀 SEO

### À implémenter
- Métadonnées dynamiques par page
- Sitemap.xml
- Robots.txt
- Structured data (JSON-LD)
- Canonical URLs
- Breadcrumbs

---

## 📱 RESPONSIVE DESIGN

**Breakpoints**:
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

✅ Tous les composants sont responsives

---

## ⚡ API ENDPOINTS

### Products API
- GET /api/products → Liste
- POST /api/products → Créer
- GET /api/products/[id] → Détail
- PUT /api/products/[id] → Modifier
- DELETE /api/products/[id] → Supprimer

### Categories API
- GET /api/categories → Liste hiérarchique
- POST /api/categories → Créer
- PUT /api/categories/[id] → Modifier
- DELETE /api/categories/[id] → Supprimer

### Orders API
- GET /api/orders → Liste
- POST /api/orders/create → Créer (⚠️ placeholder)
- GET /api/orders/[id] → Détail
- PUT /api/orders/[id] → Modifier

### Checkout API
- POST /api/checkout/create-payment-intent → ✅ Complet
- GET /api/checkout/shipping-options → ⚠️ Mock data
- POST /api/checkout/validate-address → ⚠️ Placeholder

---

## 🎨 COMPOSANTS UI

**Total**: ~80 composants, ~12,344 lignes

### Catégories
- Layout: header, footer, mobile-nav
- Header: 14 composants (mega-menu, cart, wishlist, etc.)
- Home: 6 composants (hero, featured, flash-deals)
- Products: 6 composants (card, gallery, tabs)
- Checkout: 5 composants (stepper, forms, summary)
- UI: 27+ shadcn/ui composants

---

## 🔧 STORES ZUSTAND

1. **cart.store** - Panier (localStorage)
2. **wishlist.store** - Wishlist (localStorage)
3. **preferences.store** - Langue, devise, thème
4. **comparator.store** - Comparaison produits
5. **notifications.store** - Notifications utilisateur

Tous fonctionnels ✅

---

## 📋 EXIGENCES NON FONCTIONNELLES

### Disponibilité
- Uptime: 99.9%
- RTO: < 1h
- RPO: < 5min

### Scalabilité
- 10,000 utilisateurs concurrents
- 100,000 produits
- 1,000,000 commandes/an

### Conformité
- RGPD (si UE)
- PCI DSS (paiements)
- WCAG 2.1 AA (accessibilité)

---

## 🎯 PROCHAINES ÉTAPES CRITIQUES

### Phase 1 (2-3 semaines) - MVP
1. **Authentification** (5-7j)
   - Pages login/signup/forgot-password
   - Intégration Better Auth

2. **Tunnel achat** (7-10j)
   - Stripe Elements
   - Création commande
   - Webhook processing

3. **Emails** (3-4j)
   - Templates React Email
   - Envoi automatique

4. **Admin protection** (2-3j)
   - Auth provider Refine
   - Édition commandes

---

## 📞 SUPPORT & DOCUMENTATION

### Documentation disponible
- ✅ CLAUDE.md - Instructions projet
- ✅ ROADMAP.md - Feuille de route (45 pages)
- ✅ CAHIER_DE_CHARGE.md - Ce document
- ✅ ANALYSE_EXECUTIVE_SUMMARY.md - Synthèse
- ✅ .vscode/GUIDE_VSCODE.md - Guide VS Code

### Commandes utiles
```bash
npm run dev          # Serveur dev
npm run build        # Build production
npm run lint         # Lint code
npm run format       # Format code
npm run db:push      # Push schema Prisma
npm run db:studio    # Prisma Studio
npm run email:dev    # Test email
```

---

**Document établi le**: 18 novembre 2025
**Version**: 1.0
