# ROADMAP - MIENTIOR E-COMMERCE MARKETPLACE

**Version**: 2.0 (Mise à jour du 18 novembre 2025)
**Statut projet actuel**: 65% complété
**Dernière analyse**: Analyse complète du codebase effectuée

---

## 📊 VUE D'ENSEMBLE - ANALYSE ACTUALISÉE

### Situation actuelle (Novembre 2025)

```
┌─────────────────────────────────────────────────────────────┐
│ ÉTAT D'AVANCEMENT PAR DOMAINE                               │
├─────────────────────────────────────────────────────────────┤
│ Core Commerce:      █████████████████░░░  85%              │
│ Admin Panel:        ████████████░░░░░░░░  60%              │
│ Authentication:     ██████░░░░░░░░░░░░░░  30%              │
│ Payment Gateway:    ██████████████████░░  90%              │
│ Database Design:    ███████████████████░  95%              │
│ Code Quality:       ███████████████░░░░░  75%              │
│                                                              │
│ GLOBAL:             █████████████░░░░░░░  65/100           │
└─────────────────────────────────────────────────────────────┘
```

### Analyse détaillée

**✅ Ce qui fonctionne PARFAITEMENT (Production-Ready):**
- Cart management système complet (Zustand + localStorage)
- Order creation flow avec verrouillage atomique (Redis)
- Paystack/Flutterwave webhooks (idempotence + signature validation)
- Admin product CRUD complet (Refine + Prisma)
- Checkout flow multi-étapes fonctionnel
- Database schema professionnel (26 modèles Prisma)
- 75 API endpoints fonctionnels
- Homepage avec featured products, flash deals, categories
- Product listing avec filtres/tri
- Product detail page avec variants

**🟡 Ce qui est FONCTIONNEL mais incomplet:**
- Admin panel (list/show OK, mais CRUD manquants pour vendors, campaigns, promos)
- Better Auth configuré mais aucune UI d'authentification
- Checkout flow fonctionne mais pas de gestion d'erreurs avancée
- Email system basique (Resend intégré, pas de templates)
- Redis caching basique (pas de stratégie d'invalidation)

**🔴 BLOQUEURS CRITIQUES:**
1. **Aucune page de login/register** - Les utilisateurs ne peuvent pas s'authentifier
2. **Admin auth bypassé en dev** (SKIP_AUTH=true) - Risque sécurité
3. **Pages admin CRUD manquantes** (vendors, campaigns, promo codes, admin users)
4. **Aucun test** - Pas de Jest/Vitest/Playwright
5. **Pas de rate limiting** - Vulnérabilité sécurité
6. **Stripe configuré mais non implémenté** - Seulement Paystack/Flutterwave

**📦 Inventaire des pages:**
- **Publiques**: 9 pages (home, products, product detail, cart, checkout, search, faq, categories, design-showcase)
- **Authentifiées**: 3 pages (account, checkout callback, confirmation)
- **Admin**: 20 resources (products, categories, orders, users, vendors, campaigns, etc.)
- **Manquantes**: /login, /register, /forgot-password, vendor CRUD admin, campaign edit, promo CRUD, media library

---

## 🎯 PHASES DE DÉVELOPPEMENT (MISE À JOUR 2.0)

## PHASE 1: FONDATIONS CRITIQUES ⚠️
**Durée**: 2-3 semaines
**Objectif**: Débloquer l'authentification et sécuriser l'admin
**Priorité**: 🔴 CRITIQUE ABSOLU

### Sprint 1.1: Authentification Frontend (5-7 jours) 🔴

**Contexte**: Better Auth est configuré dans `/src/lib/auth.ts` avec PostgreSQL + Redis, mais aucune UI n'existe.

#### Tâches

- [ ] **Page Login** `/src/app/(app)/login/page.tsx`
  - Formulaire email/password avec react-hook-form + Zod
  - Appel à `auth.api.signInEmail({ email, password })`
  - Gestion erreurs: "Invalid credentials", "Too many attempts"
  - Lien "Mot de passe oublié" → `/forgot-password`
  - Bouton Google OAuth (si `GOOGLE_CLIENT_ID` configuré)
  - Redirection intelligente: `?next=` param sinon `/account`
  - Design avec shadcn/ui components (Card, Input, Button)

- [ ] **Page Register** `/src/app/(app)/register/page.tsx`
  - Formulaire: email, password, confirmPassword, firstName, lastName
  - Validation Zod: email unique (check API), password >= 8 chars
  - Checkbox CGV obligatoire
  - Opt-in newsletter (enregistrer dans `NewsletterSubscription`)
  - Appel `auth.api.signUpEmail()`
  - Connexion automatique après inscription réussie
  - Redirection vers `/account`

- [ ] **Page Forgot Password** `/src/app/(app)/forgot-password/page.tsx`
  - Input email uniquement
  - Appel `auth.api.forgetPassword({ email })`
  - Génération token reset (Better Auth)
  - Envoi email avec lien `/reset-password?token=XXX` via Resend
  - Message de confirmation affiché même si email invalide (sécurité)

- [ ] **Page Reset Password** `/src/app/(app)/reset-password/page.tsx`
  - Récupération `token` depuis query params
  - Validation token avec Better Auth
  - Formulaire: password, confirmPassword
  - Appel `auth.api.resetPassword({ token, password })`
  - Redirection `/login` après succès
  - Gestion token expiré/invalide

- [ ] **Mettre à jour middleware.ts**
  - Vérifier que routes protégées redirigent vers `/login?next=XXX`
  - Actuellement: redirige vers `/auth/sign-in` qui n'existe pas
  - Modifier ligne 18-20 de `middleware.ts`

- [ ] **Logout functionality**
  - Ajouter bouton logout dans header (pour utilisateurs connectés)
  - Appel `auth.api.signOut()`
  - Clear session Redis
  - Redirection vers homepage

#### Critères d'acceptation
- ✅ Utilisateur peut créer un compte avec email/password
- ✅ Utilisateur peut se connecter (email/password ET Google OAuth)
- ✅ Utilisateur peut réinitialiser mot de passe
- ✅ Session persistante (cookie + Redis cache)
- ✅ Routes protégées redirigent correctement vers `/login?next=XXX`
- ✅ Logout fonctionne et clear la session

#### Fichiers à modifier
- Créer: `src/app/(app)/login/page.tsx`
- Créer: `src/app/(app)/register/page.tsx`
- Créer: `src/app/(app)/forgot-password/page.tsx`
- Créer: `src/app/(app)/reset-password/page.tsx`
- Modifier: `middleware.ts` (ligne 18-20)
- Modifier: `src/components/layout/header.tsx` (ajouter logout button)

---

### Sprint 1.2: Sécuriser l'Admin Panel (3-4 jours) 🔴

**Contexte**: L'admin est actuellement accessible sans auth en mode dev (`SKIP_AUTH=true`). L'auth provider Refine est un placeholder.

#### Tâches

- [ ] **Créer Admin Auth Provider réel**
  - Fichier: `src/app/admin/auth-provider.ts`
  - Remplacer le placeholder actuel (ligne 6-14 de `layout.tsx`)
  - Implémenter `login()`: redirect vers `/login` avec `?next=/admin`
  - Implémenter `check()`: vérifier session Better Auth + role ADMIN
  - Implémenter `getIdentity()`: récupérer current admin user
  - Implémenter `logout()`: appel `auth.api.signOut()`
  - Gérer les permissions avec enum `Permission` du schema Prisma

- [ ] **Créer table AdminUser si nécessaire**
  - Vérifier si `AdminUser` model Prisma est bien peuplé
  - Créer script seed: `prisma/seeds/admin-user.ts`
  - Créer un admin par défaut: `admin@mientior.com` / password fort
  - Assigner role `SUPER_ADMIN` avec toutes permissions

- [ ] **Protéger toutes les routes admin**
  - Middleware vérifie role ADMIN avant accès `/admin/*`
  - Unauthorized users → redirect `/login?next=/admin`
  - Ajouter Permission checks dans composants Refine

- [ ] **Supprimer SKIP_AUTH en production**
  - Modifier `.env.production` pour retirer flag
  - Ajouter warning si SKIP_AUTH=true en production

- [ ] **Audit logs pour actions admin**
  - Déjà implémenté dans schema (modèle `AuditLog`)
  - Vérifier que TOUTES les actions CRUD créent un log
  - Ajouter endpoints manquants si besoin

#### Critères d'acceptation
- ✅ Admin panel inaccessible sans authentification
- ✅ Seuls les users avec role ADMIN peuvent accéder
- ✅ Permissions vérifiées pour chaque action
- ✅ Audit logs créés pour toutes modifications
- ✅ Pas de bypass possible en production

---

### Sprint 1.3: Pages Admin CRUD Manquantes (7-10 jours) 🟡

**Contexte**: Admin list/show pages existent pour vendors, campaigns, promo codes, mais pas de create/edit/delete.

#### Tâches - Vendor Management

- [ ] **Vendor Create Page** `/admin/vendors/create/page.tsx`
  - Formulaire Ant Design avec `useForm` hook
  - Champs: name, email, description, commission (percentage), status
  - Upload logo image
  - Validation: commission 0-100%, email unique
  - API POST `/api/vendors`

- [ ] **Vendor Edit Page** `/admin/vendors/edit/[id]/page.tsx`
  - Récupération données avec `useForm` (populate)
  - Tous champs éditables
  - Bouton "Approve" si status PENDING
  - API PUT `/api/vendors/[id]`

- [ ] **Vendor Payout Management** `/admin/vendors/[id]/payouts`
  - Liste des payouts du vendor
  - Create nouveau payout manuel
  - Mark payout as PAID
  - Lien vers model `VendorPayout`

#### Tâches - Campaign Management

- [ ] **Campaign Edit Page** `/admin/marketing/campaigns/edit/[id]/page.tsx`
  - Rich text editor (Tiptap déjà installé)
  - Champs: name, type (email/SMS/push), content, schedule
  - Customer segment selector
  - Preview email/SMS
  - API PUT `/api/campaigns/[id]`

- [ ] **Campaign Show Page** `/admin/marketing/campaigns/show/[id]/page.tsx`
  - Afficher stats: sent, opened, clicked, converted
  - Liste des recipients
  - Performance metrics (si tracking implémenté)

- [ ] **Campaign Send Functionality**
  - Button "Send Now" ou "Schedule"
  - API POST `/api/campaigns/[id]/send`
  - Implémenter logique d'envoi:
    - Résoudre customer segment
    - Queue emails/SMS via Resend
    - Update campaign status → SENT
    - Track delivery (webhook Resend)

#### Tâches - Promo Code Management

- [ ] **Promo Code Create Page** `/admin/marketing/promo-codes/create/page.tsx`
  - Champs: code, type (PERCENTAGE/FIXED/FREE_SHIPPING), value
  - Scope: CART/SHIPPING/CATEGORY/PRODUCT
  - Dates: validFrom, validUntil
  - Usage limits: maxUsage, maxUsagePerUser, minOrderValue
  - API POST `/api/promo-codes`

- [ ] **Promo Code Edit Page** `/admin/marketing/promo-codes/edit/[id]/page.tsx`
  - Tous champs éditables sauf `code` (read-only si déjà utilisé)
  - Stats affichées: timesUsed, totalDiscount
  - Liste des usages (table `PromoCodeUsage`)

- [ ] **Promo Code Validation API** (améliorer existant)
  - Fichier: `/api/promo/validate/route.ts`
  - Actuellement placeholder (ligne 186 de `/api/orders/create/route.ts`)
  - Implémenter toutes validations:
    - Code exists && active
    - Dates valides (validFrom <= now <= validUntil)
    - Usage limits non atteints
    - minOrderValue respecté
    - Scope applicable (CART, SHIPPING, specific products)

#### Tâches - Media Library

- [ ] **Media Library Page** `/admin/media/page.tsx`
  - Grid view de tous les media (model `Media`)
  - Upload multiple files (react-dropzone déjà installé)
  - Compression images (browser-image-compression déjà installé)
  - Crop/resize images (react-easy-crop déjà installé)
  - Filtres: type (IMAGE/VIDEO), tags
  - Search par filename
  - Delete media (check si utilisé dans products avant)

- [ ] **Media Picker Component**
  - Composant réutilisable pour sélection image
  - Utiliser dans Product create/edit
  - Modal avec Media Library
  - Upload rapide inline

#### Critères d'acceptation
- ✅ Vendor full CRUD fonctionnel
- ✅ Campaign edit/send/show fonctionnels
- ✅ Promo code full CRUD fonctionnel
- ✅ Promo validation API complète
- ✅ Media library opérationnelle

---

### Sprint 1.4: Testing & Sécurité (5-7 jours) 🟢

**Contexte**: Aucun test actuellement. Pas de rate limiting. Vulnérabilités potentielles.

#### Tâches - Testing

- [ ] **Setup Jest + React Testing Library**
  - Install: `jest`, `@testing-library/react`, `@testing-library/jest-dom`
  - Config: `jest.config.js` pour Next.js
  - Setup file: `jest.setup.js`
  - Script: `npm run test`

- [ ] **Tests unitaires critiques**
  - `cart.store.ts`: add/remove items, coupon application, calculations
  - `auth.ts`: getSession, requireAuth
  - API routes: `/api/orders/create`, `/api/promo/validate`
  - Utilities: tax calculation, free shipping threshold

- [ ] **Tests E2E (Playwright)**
  - Install Playwright
  - Test critiques:
    - User registration → login → add to cart → checkout → payment
    - Admin login → create product → publish → verify frontend
  - Script: `npm run test:e2e`

#### Tâches - Sécurité

- [ ] **Implémenter Rate Limiting**
  - Package: `@upstash/ratelimit` (Redis-based)
  - Config dans `.env`: `RATE_LIMIT_REQUESTS`, `RATE_LIMIT_WINDOW`
  - Endpoints critiques:
    - `/api/auth/*` - 5 req/min par IP
    - `/api/orders/create` - 10 req/hour par user
    - `/api/webhooks/*` - Illimité (signatures validées)
  - Middleware global pour API routes

- [ ] **CSRF Protection (production)**
  - Actuellement disabled (dev mode)
  - Activer en production: `CSRF_ENABLED=true`
  - Générer token dans forms
  - Valider dans API POST/PUT/DELETE

- [ ] **Input Sanitization**
  - Package: `validator` ou `dompurify`
  - Sanitize tous les inputs utilisateur
  - XSS protection dans rich text editors

- [ ] **Security Headers**
  - `next.config.js` headers:
    - Content-Security-Policy
    - X-Frame-Options: DENY
    - X-Content-Type-Options: nosniff
    - Referrer-Policy: strict-origin-when-cross-origin

#### Critères d'acceptation
- ✅ >70% code coverage tests unitaires
- ✅ E2E tests passent pour flows critiques
- ✅ Rate limiting actif sur API
- ✅ CSRF protection enabled en production
- ✅ Security headers configurés

---

## PHASE 2: EXPÉRIENCE UTILISATEUR AVANCÉE 🟡
**Durée**: 3-4 semaines
**Objectif**: Améliorer UX, ajouter features retention
**Priorité**: 🟡 HAUTE

### Sprint 2.1: Compte Utilisateur Complet (5 jours)

**Contexte**: Page `/account` existe mais affiche des données mock. APIs user existent.

#### Tâches

- [ ] **Dashboard Overview (vraies données)**
  - Récupérer orders via GET `/api/orders?userId=XXX`
  - Afficher loyalty points (déjà dans User model)
  - Recent orders (3 dernières)
  - Saved addresses count
  - Wishlist count

- [ ] **Orders History Full**
  - Liste paginée de toutes les commandes
  - Filtres: status, date range
  - Détail commande (modal ou page dédiée)
  - Download invoice (PDF generation)
  - Track order (lien vers `/api/orders/track/[orderNumber]`)

- [ ] **Address Book Management**
  - Liste saved addresses (GET `/api/user/addresses`)
  - Add/Edit/Delete addresses
  - Mark default address
  - Validation adresses françaises (API `/api/checkout/validate-address`)

- [ ] **Profile Settings**
  - Edit: firstName, lastName, phone
  - Change password (Better Auth API)
  - Email preferences (newsletter opt-in/out)
  - Delete account (GDPR compliance)

- [ ] **Loyalty Program Display**
  - Current tier: Bronze/Silver/Gold/Platinum
  - Points balance
  - Points history (earned, redeemed)
  - Next tier requirements
  - Rewards catalog

#### Critères d'acceptation
- ✅ Dashboard affiche vraies données user
- ✅ Orders history avec tracking
- ✅ Address book full CRUD
- ✅ Profile settings fonctionnels
- ✅ Loyalty program visible

---

### Sprint 2.2: Système d'Avis Produits (5-7 jours)

**Contexte**: Model `Review` existe, API GET reviews fonctionne, mais pas de soumission.

#### Tâches

- [ ] **Review Submission Form**
  - Component: `ReviewForm.tsx`
  - Champs: rating (1-5 stars), title, comment
  - Upload images (optionnel, max 3)
  - Validation: user must have purchased product (check OrderItem)
  - API POST `/api/reviews`

- [ ] **Review Display Component**
  - Component: `ProductReviews.tsx`
  - Stars rating aggregate
  - Rating distribution (5 stars: X%, 4 stars: Y%, etc.)
  - Liste reviews paginée
  - Filtres: rating, verified purchase, with images
  - Helpful votes (upvote/downvote)

- [ ] **Review Moderation (Admin)**
  - Admin page: `/admin/reviews`
  - Approve/Reject reviews
  - Merchant response feature
  - Bulk actions

- [ ] **Review Notifications**
  - Email customer après achat (demande review)
  - Email merchant quand nouveau review
  - Pusher real-time notification admin

#### Critères d'acceptation
- ✅ Users peuvent laisser avis après achat
- ✅ Reviews affichés sur product page
- ✅ Admin peut modérer reviews
- ✅ Merchant response fonctionnel
- ✅ Email notifications envoyées

---

### Sprint 2.3: Options Livraison & Suivi (5 jours)

**Contexte**: API `/api/checkout/shipping-options` retourne mock data. Pas de suivi réel.

#### Tâches

- [ ] **Intégration Transporteur Réel**
  - Choix: Colissimo, Chronopost, ou Mondial Relay
  - API integration pour calcul tarifs réels
  - Remplacer mock data dans `/api/checkout/shipping-options`
  - Stocker shipping method dans Order

- [ ] **Points Relais**
  - API `/api/checkout/relay-points` existe
  - Intégrer vraie API (Mondial Relay, InPost)
  - Map interactive pour sélection point relais
  - Stocker adresse point relais dans Order

- [ ] **Tracking Commandes**
  - Webhook transporteur → update `trackingNumber` in Order
  - API GET `/api/orders/track/[orderNumber]`
  - Page dédiée: `/track-order?orderNumber=XXX`
  - Afficher timeline: ordered → shipped → in transit → delivered
  - Email notifications à chaque étape

- [ ] **Estimated Delivery**
  - Calcul dates `estimatedDeliveryMin/Max`
  - Affichage sur product page: "Livré entre le X et le Y"
  - Affichage dans checkout
  - Update si délai change (webhook transporteur)

#### Critères d'acceptation
- ✅ Tarifs shipping réels calculés
- ✅ Points relais sélectionnables
- ✅ Tracking number enregistré
- ✅ Timeline tracking fonctionnelle
- ✅ Estimated delivery calculée

---

### Sprint 2.4: Codes Promo & Gamification (3-4 jours)

**Contexte**: Model `PromoCode` existe, validation partielle dans API.

#### Tâches

- [ ] **Codes Promo Frontend**
  - Input code promo dans cart
  - API POST `/api/promo/validate`
  - Afficher discount appliqué
  - Gérer scope (CART, SHIPPING, CATEGORY, PRODUCT)
  - Gérer cumul codes (si autorisé)

- [ ] **First Order Discount**
  - Code auto-généré pour nouveaux users
  - Email welcome avec code 10% de réduction
  - Validation: user.totalOrders === 0

- [ ] **Loyalty Points Redemption**
  - Convert points → discount code
  - 100 points = 1€ de réduction
  - API POST `/api/user/loyalty/redeem`
  - Décrémenter loyaltyPoints user
  - Créer PromoCode unique

- [ ] **Referral System**
  - User a code referral unique: `user.referralCode`
  - Parrainage: ami utilise code → les 2 gagnent 10€
  - Track referrals dans `User.referredBy`

#### Critères d'acceptation
- ✅ Promo codes fonctionnels sur cart
- ✅ First order discount automatique
- ✅ Loyalty points convertibles en €
- ✅ Referral system opérationnel

---

## PHASE 3: OPTIMISATIONS & PRODUCTION 🟢
**Durée**: 2-3 semaines
**Objectif**: Performance, SEO, Monitoring
**Priorité**: 🟢 MOYENNE

### Sprint 3.1: Performance & SEO (7 jours)

#### Tâches - Performance

- [ ] **Bundle Analysis**
  - Install: `@next/bundle-analyzer`
  - Identifier gros bundles
  - Code splitting agressif
  - Dynamic imports pour composants lourds

- [ ] **Image Optimization**
  - Audit toutes les images
  - Convert PNG → WebP/AVIF
  - Lazy loading images below fold
  - Responsive images avec srcset
  - CDN pour images (Cloudflare Images ou Vercel)

- [ ] **Database Query Optimization**
  - Identifier N+1 queries (Prisma query logging)
  - Add indexes manquants
  - Use `select` pour limiter champs retournés
  - Implement pagination partout

- [ ] **Redis Caching Strategy**
  - Cache API responses (TTL: 5min pour products, 1h pour categories)
  - Cache invalidation on update
  - Cache warming pour homepage

#### Tâches - SEO

- [ ] **Metadata Dynamiques**
  - Toutes pages avec `generateMetadata()`
  - Title unique par page (50-60 chars)
  - Description unique (150-160 chars)
  - Open Graph tags (og:image, og:title, etc.)
  - Twitter Card tags

- [ ] **Structured Data (JSON-LD)**
  - Product schema sur PDP
  - Organization schema
  - Breadcrumb schema
  - Review aggregate rating schema

- [ ] **Sitemap.xml & Robots.txt**
  - Generate sitemap.xml dynamique
  - Include: homepage, products, categories
  - Exclude: admin, account, checkout
  - Robots.txt avec Allow/Disallow rules

- [ ] **Core Web Vitals**
  - LCP < 2.5s (optimize hero image)
  - FID < 100ms (reduce JS)
  - CLS < 0.1 (reserve space for images)
  - Measure avec Lighthouse

#### Critères d'acceptation
- ✅ Lighthouse score > 90 (Performance, SEO, Accessibility)
- ✅ Bundle size réduit de 30%
- ✅ LCP < 2.5s, FID < 100ms, CLS < 0.1
- ✅ Structured data validé (Google Rich Results Test)
- ✅ Sitemap.xml généré

---

### Sprint 3.2: Upload Images & Media (4-5 jours)

**Contexte**: Images hardcodées, pas d'upload réel.

#### Tâches

- [ ] **Choisir Storage Provider**
  - Options: AWS S3, Cloudflare R2, Vercel Blob, Supabase Storage
  - Recommandé: Cloudflare R2 (cheap, S3-compatible)
  - Setup bucket, access keys

- [ ] **Upload API**
  - API POST `/api/upload`
  - Accept: image/jpeg, image/png, image/webp
  - Max size: 10MB
  - Compression avec `sharp`
  - Generate thumbnails (small, medium, large)
  - Return URLs

- [ ] **Intégration Admin Product**
  - Modifier Product create/edit forms
  - Remplacer input URL par upload button
  - Use `react-dropzone` pour drag & drop
  - Preview avant upload
  - Multi-upload (max 8 images)

- [ ] **Media Library Integration**
  - Stocker uploads dans model `Media`
  - Track: filename, url, size, type, uploadedBy
  - Reuse media existants (search par URL)

#### Critères d'acceptation
- ✅ Upload images fonctionnel
- ✅ Compression automatique
- ✅ Thumbnails générées
- ✅ Admin peut upload dans product forms
- ✅ Media library track uploads

---

### Sprint 3.3: Monitoring & Alertes (3-4 jours)

#### Tâches

- [ ] **Error Tracking**
  - Setup Sentry (sentry.io)
  - Track errors frontend + backend
  - Source maps upload
  - Alert Slack/Email sur critical errors

- [ ] **Analytics (PostHog)**
  - PostHog déjà installé (`posthog-js`)
  - Instrument events:
    - page_view
    - product_viewed
    - add_to_cart
    - checkout_started
    - purchase_completed
  - Setup funnels dans PostHog UI

- [ ] **Uptime Monitoring**
  - Service: Better Uptime ou UptimeRobot
  - Monitor: homepage, API health endpoint
  - Alert si down > 2min

- [ ] **Admin Alerts**
  - Low stock alerts (trigger: stock < 5)
  - Payment failures spike
  - High cart abandonment (daily digest)

#### Critères d'acceptation
- ✅ Sentry track errors
- ✅ PostHog events instrumentés
- ✅ Uptime monitoring actif
- ✅ Admin reçoit alertes low stock

---

## PHASE 4: FONCTIONNALITÉS AVANCÉES ⚪
**Durée**: 3-4 semaines
**Objectif**: Features différenciatrices, multi-langue
**Priorité**: ⚪ BASSE (Post-MVP)

### Sprint 4.1: Gamification Avancée (5 jours)

#### Tâches

- [ ] **Daily Login Rewards**
  - Track login streak
  - Points bonus: 10 pts/jour (streak 7j: 100pts bonus)
  - UI: Badge dans account dashboard

- [ ] **Achievement System**
  - Badges: "First Purchase", "Review Writer", "Loyal Customer"
  - Display dans profile
  - Unlock rewards (free shipping code)

- [ ] **Spin the Wheel**
  - Component: daily spin pour loyalty users
  - Rewards: points, discount codes, free shipping
  - Limit: 1 spin/day

#### Critères d'acceptation
- ✅ Login streak tracked
- ✅ Badges attribuables
- ✅ Spin wheel fonctionnel

---

### Sprint 4.2: Multi-langue (i18n) (5-7 jours)

**Contexte**: i18next installé, pas configuré.

#### Tâches

- [ ] **Setup i18n**
  - Fichiers: `public/locales/fr/common.json`, `/en/common.json`
  - Configure `i18next-http-backend`
  - Detect langue browser

- [ ] **Traduire UI**
  - Toutes strings hard-codées → `t('key')`
  - Traduire: header, footer, product pages, checkout
  - Langues cibles: FR (default), EN, ES

- [ ] **Multi-langue Admin**
  - Refine i18n provider
  - Admin content en multi-langue
  - Product descriptions traduites

#### Critères d'acceptation
- ✅ Site en FR/EN/ES
- ✅ Langue détectée auto
- ✅ Switcher langue dans header

---

### Sprint 4.3: Fonctionnalités Marketplace (7 jours)

**Contexte**: Models Vendor ready, UI incomplète.

#### Tâches

- [ ] **Vendor Dashboard**
  - Page: `/vendor/dashboard`
  - Stats: sales, orders, commission
  - Product management (own products only)
  - Payout requests

- [ ] **Commission Calculation**
  - Auto-calculate commission sur order
  - Track dans `Order.vendorCommission`
  - Generate payout requests

- [ ] **Vendor Approval Workflow**
  - Admin approve/reject vendors
  - Email notification
  - Status: PENDING → ACTIVE

#### Critères d'acceptation
- ✅ Vendors ont dashboard
- ✅ Commission auto-calculée
- ✅ Approval workflow fonctionnel

---

## 📋 RÉCAPITULATIF PRIORISATION

### Bloqueurs MVP (À faire IMMÉDIATEMENT) 🔴
1. Sprint 1.1 - Authentification Frontend (5-7j)
2. Sprint 1.2 - Sécuriser Admin (3-4j)
3. Sprint 1.3 - Admin CRUD Pages (7-10j)
4. Sprint 1.4 - Testing & Sécurité (5-7j)

**Total Phase 1: 20-28 jours (3-4 semaines)**

### Features Importantes (Post-MVP) 🟡
- Sprint 2.1 à 2.4 (Compte user, Reviews, Shipping, Promos)

**Total Phase 2: 18-23 jours (3-4 semaines)**

### Optimisations (Pre-Launch) 🟢
- Sprint 3.1 à 3.3 (Performance, SEO, Upload, Monitoring)

**Total Phase 3: 14-16 jours (2-3 semaines)**

### Nice-to-Have (Post-Launch) ⚪
- Sprint 4.1 à 4.3 (Gamification, i18n, Marketplace)

**Total Phase 4: 17-19 jours (3-4 semaines)**

---

## ⏱️ ESTIMATIONS GLOBALES

| Équipe | Phase 1 (MVP) | Phase 2 (UX) | Phase 3 (Optim) | Phase 4 (Avancé) | TOTAL |
|--------|---------------|--------------|-----------------|------------------|-------|
| 1 dev  | 3-4 sem | 3-4 sem | 2-3 sem | 3-4 sem | **11-15 sem** |
| 2 devs | 2-2.5 sem | 2-2.5 sem | 1-2 sem | 2-2.5 sem | **7-9 sem** |

---

## 🎯 MILESTONE CIBLES

**Milestone 1: MVP Authentication** (Fin Sprint 1.2)
→ Users peuvent s'authentifier, admin sécurisé

**Milestone 2: Admin Complet** (Fin Sprint 1.3)
→ Tous les CRUD admin fonctionnels

**Milestone 3: Production-Ready** (Fin Phase 2)
→ Tests, sécurité, UX complète

**Milestone 4: Optimisé SEO** (Fin Phase 3)
→ Performance, monitoring, SEO top

**Milestone 5: Feature-Complete** (Fin Phase 4)
→ Toutes features implémentées

---

## 📞 NOTES TECHNIQUES

### Stack Actuel (Vérifié Nov 2025)
- **Framework**: Next.js 15 + React 19 + TypeScript 5.3
- **Database**: PostgreSQL + Prisma 6.19
- **Admin**: Refine 5.0 + Ant Design 5.28
- **Auth**: Better Auth 1.0
- **Payment**: Paystack + Flutterwave (Stripe installé mais non utilisé)
- **Cache**: Redis (ioredis 5.3)
- **Email**: Resend 1.0
- **State**: Zustand 4.5 + React Query 5.0
- **UI**: shadcn/ui + Radix UI + Tailwind CSS 3.4
- **Forms**: react-hook-form 7.66 + Zod 3.25
- **Analytics**: PostHog 1.0 (installé, peu instrumenté)
- **Real-time**: Pusher 5.2

### Dépendances Totales: 134 packages

### Environment Variables Critiques
- `PRISMA_DATABASE_URL` (PostgreSQL)
- `REDIS_URL`
- `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL`
- `PAYSTACK_SECRET_KEY` + `PAYSTACK_WEBHOOK_SECRET`
- `FLUTTERWAVE_SECRET_KEY` + `FLUTTERWAVE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `SKIP_AUTH` (⚠️ À retirer en production)

---

**Document maintenu par**: Claude Code
**Dernière mise à jour**: 18 novembre 2025
**Version**: 2.0 (Analyse complète du codebase)
