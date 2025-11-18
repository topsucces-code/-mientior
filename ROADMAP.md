# ROADMAP - MIENTIOR E-COMMERCE

**Version**: 1.0
**Date**: 18 novembre 2025
**Statut projet actuel**: 40-60% complété

---

## 📊 VUE D'ENSEMBLE

### Situation actuelle

```
┌─────────────────────────────────────────────────────┐
│ ÉTAT D'AVANCEMENT GLOBAL                            │
├─────────────────────────────────────────────────────┤
│ UI/UX:           ████████████████░░░░  85%          │
│ Backend Logic:   █████████░░░░░░░░░░░  45%          │
│ Intégration:     ██████░░░░░░░░░░░░░░  30%          │
│                                                      │
│ GLOBAL:          ██████████░░░░░░░░░░  50%          │
└─────────────────────────────────────────────────────┘
```

### Objectif

- **MVP fonctionnel** en **2-3 semaines**
- **Version complète** en **8-10 semaines**
- **Production-ready** en **10-14 semaines**

---

## 🎯 PHASES DE DÉVELOPPEMENT

## PHASE 1: FONDATIONS CRITIQUES ⚠️
**Durée**: 2-3 semaines
**Objectif**: Rendre le parcours d'achat fonctionnel
**Priorité**: 🔴 CRITIQUE

### Sprint 1.1: Authentification (5-7 jours)

#### Tâches
- [ ] **Créer page Login** `/login`
  - Formulaire email/password avec validation Zod
  - Intégration Better Auth (auth.api.signInEmail)
  - Gestion erreurs
  - Lien "Mot de passe oublié"
  - Bouton Google OAuth (si configuré)
  - Redirection vers `?next=` param ou `/account`

- [ ] **Créer page Signup** `/signup`
  - Formulaire: email, password, firstName, lastName
  - Validation: email unique, password >= 8 caractères
  - Case à cocher CGV
  - Opt-in newsletter
  - Création user via Better Auth
  - Connexion automatique après signup

- [ ] **Page Forgot Password** `/forgot-password`
  - Input email
  - Génération token
  - Envoi email avec lien reset

- [ ] **Page Reset Password** `/reset-password?token=xxx`
  - Validation token
  - Formulaire nouveau password
  - Redirection login après succès

- [ ] **Middleware corrections**
  - Vérifier routes protégées redirigent vers `/login?next=XXX`

#### Critères d'acceptation
- ✅ Un utilisateur peut créer un compte
- ✅ Un utilisateur peut se connecter
- ✅ Un utilisateur peut réinitialiser son mot de passe
- ✅ Les routes protégées redirigent correctement

---

### Sprint 1.2: Tunnel d'achat complet (7-10 jours)

#### Tâches

**1. Intégration Stripe Elements** (2-3 jours)
- [ ] Installer @stripe/stripe-js et @stripe/react-stripe-js
- [ ] Créer composant `StripePaymentForm` avec Elements
- [ ] Remplacer payment-form.tsx placeholder
- [ ] Tester cartes test Stripe

**2. API création commande** (2 jours)
- [ ] **Endpoint POST /api/orders/create**
  - Vérifier auth
  - Vérifier stock disponible
  - Créer commande Prisma
  - Générer orderNumber unique
  - Créer OrderItems
  - Lock stock

**3. Webhook Stripe** (2 jours)
- [ ] **Améliorer /api/webhooks/stripe**
  - checkout.session.completed
  - payment_intent.succeeded
  - payment_intent.payment_failed
  - charge.refunded

**4. Flux checkout complet** (1-2 jours)
- [ ] Page /checkout corrections
- [ ] Page /checkout/success (nouvelle)
- [ ] Vider panier après commande

**5. Décrémentation stock** (1 jour)
- [ ] Fonction decrementStock()
- [ ] Appeler dans webhook

#### Critères d'acceptation
- ✅ Un utilisateur peut payer avec sa carte
- ✅ La commande est créée en base
- ✅ Le stock est décrémenté
- ✅ Email de confirmation envoyé

---

### Sprint 1.3: Emails transactionnels (3-4 jours)

#### Tâches

**1. Setup React Email** (1 jour)
- [ ] Installer react-email
- [ ] Créer dossier `/emails`

**2. Templates emails** (2 jours)
- [ ] OrderConfirmation.tsx
- [ ] OrderShipped.tsx
- [ ] OrderDelivered.tsx
- [ ] PasswordReset.tsx
- [ ] WelcomeEmail.tsx (optionnel)

**3. Intégration envoi** (1 jour)
- [ ] Créer helper `src/lib/email.ts`
- [ ] Appeler dans webhook Stripe
- [ ] Appeler dans forgot-password

#### Critères d'acceptation
- ✅ Email confirmation envoyé après commande
- ✅ Email réinitialisation envoyé
- ✅ Emails s'affichent correctement

---

### Sprint 1.4: Admin - Protection et commandes (2-3 jours)

#### Tâches

**1. Protection admin panel** (1 jour)
- [ ] Créer auth provider Refine custom
- [ ] Ajouter champ role dans User schema
- [ ] Migration Prisma
- [ ] Vérifier role sur `/admin/*`

**2. Édition commandes** (1-2 jours)
- [ ] Page /admin/orders/edit/[id]
- [ ] API PUT /api/orders/[id]
- [ ] Timeline changements statut

#### Critères d'acceptation
- ✅ Seuls les ADMIN peuvent accéder à /admin
- ✅ Un admin peut changer le statut commande
- ✅ Email envoyé au client

---

## ✅ FIN PHASE 1 - MVP FONCTIONNEL

**Durée totale**: 2-3 semaines
**Résultat**: Application e-commerce fonctionnelle

---

## PHASE 2: EXPÉRIENCE UTILISATEUR
**Durée**: 3-4 semaines
**Objectif**: Enrichir l'expérience client
**Priorité**: 🟡 HAUTE

### Sprint 2.1: Compte utilisateur complet (1 semaine)
- Dashboard compte
- Historique commandes
- Gestion adresses (CRUD)
- Édition profil
- Préférences communication
- Suppression compte

### Sprint 2.2: Système d'avis produits (1 semaine)
- API Reviews complète
- Soumission avis depuis compte
- Affichage avis sur produits
- Modération admin
- Calcul rating automatique

### Sprint 2.3: Options livraison & suivi (1 semaine)
- API shipping options
- Suivi commandes
- Timeline livraison visuelle
- Validation adresse (optionnel)

### Sprint 2.4: Codes promo & réductions (4-5 jours)
- Modèle PromoCode
- API validation
- UI application promo
- Admin gestion promos
- Bannières promotionnelles

---

## PHASE 3: OPTIMISATIONS & SCALABILITÉ
**Durée**: 2-3 semaines
**Objectif**: Performance, SEO, scalabilité
**Priorité**: 🟢 MOYENNE

### Sprint 3.1: Performance & SEO (1 semaine)
- Métadonnées dynamiques
- Structured data (JSON-LD)
- Sitemap & Robots
- ISR & caching
- Image optimization
- Lighthouse audit

### Sprint 3.2: Upload images & media (4-5 jours)
- Setup Cloudflare Images (ou S3)
- API upload
- UI upload component
- Intégration admin
- Tests

### Sprint 3.3: Recherche avancée (optionnel, 3-4 jours)
- Elasticsearch ou Algolia
- Autocomplétion
- Filtres avancés
- Recherche visuelle (optionnel)

---

## PHASE 4: FONCTIONNALITÉS AVANCÉES
**Durée**: 3-4 semaines
**Objectif**: Features premium
**Priorité**: ⚪ BASSE

### Sprint 4.1: Fidélité & Gamification (1 semaine)
- Calcul automatique points
- Historique points
- Conversion points → bons
- Challenges et badges
- Roue de la fortune
- Programme parrainage

### Sprint 4.2: Multi-langue (i18n) (1 semaine)
- Setup next-intl
- Traductions FR/EN
- Détection locale
- URLs localisées

### Sprint 4.3: Analytics & Tracking (4-5 jours)
- Activer PostHog
- Events tracking
- Funnel checkout
- Dashboard analytics admin

### Sprint 4.4: Tests automatisés (1 semaine)
- Unit tests (Vitest)
- Integration tests
- E2E tests (Playwright)
- CI/CD GitHub Actions
- Coverage > 80%

---

## 📅 PLANNING GLOBAL

```
┌──────────────────────────────────────────────────┐
│ TIMELINE MIENTIOR E-COMMERCE                     │
├──────────────────────────────────────────────────┤
│                                                   │
│ PHASE 1: FONDATIONS (2-3 sem)      ████████      │
│ PHASE 2: EXPÉRIENCE (3-4 sem)      ██████████    │
│ PHASE 3: OPTIMISATIONS (2-3 sem)   ██████        │
│ PHASE 4: AVANCÉES (3-4 sem)        ████████      │
│                                                   │
├──────────────────────────────────────────────────┤
│ TOTAL: 10-14 semaines (2,5 - 3,5 mois)          │
└──────────────────────────────────────────────────┘

MILESTONES:
🎯 Semaine 3:  MVP fonctionnel
🎯 Semaine 7:  Version beta publique
🎯 Semaine 10: Production-ready
🎯 Semaine 14: Version premium complète
```

---

## 🎯 PRIORITÉS

### PRIORITÉ CRITIQUE 🔴 (MVP)
1. Authentification (Sprint 1.1)
2. Tunnel achat + Stripe (Sprint 1.2)
3. Emails (Sprint 1.3)
4. Admin protection (Sprint 1.4)

**Durée**: 2-3 semaines

---

### PRIORITÉ HAUTE 🟡 (Améliore conversion)
5. Compte utilisateur (Sprint 2.1)
6. Avis produits (Sprint 2.2)
7. Livraison & suivi (Sprint 2.3)
8. Codes promo (Sprint 2.4)

**Durée**: +3-4 semaines

---

### PRIORITÉ MOYENNE 🟢 (Performance)
9. SEO & Performance (Sprint 3.1)
10. Upload images (Sprint 3.2)
11. Recherche avancée (Sprint 3.3)

**Durée**: +2-3 semaines

---

### PRIORITÉ BASSE ⚪ (Nice to have)
12. Fidélité (Sprint 4.1)
13. Multi-langue (Sprint 4.2)
14. Analytics (Sprint 4.3)
15. Tests (Sprint 4.4)

**Durée**: +3-4 semaines

---

## ⏱️ ESTIMATIONS

| Équipe | Phase 1 | Phase 2 | Phase 3 | Phase 4 | TOTAL |
|--------|---------|---------|---------|---------|-------|
| 1 dev | 2-3 sem | 3-4 sem | 2-3 sem | 3-4 sem | 10-14 sem |
| 2 devs | 1-2 sem | 2 sem | 1-2 sem | 2 sem | 6-8 sem |
| 3+ devs | 1 sem | 1-2 sem | 1 sem | 1-2 sem | 4-6 sem |

---

## 📊 MÉTRIQUES DE SUCCÈS

### Phase 1 (MVP)
- ✅ Taux de conversion checkout > 60%
- ✅ Temps création commande < 30s
- ✅ Emails livrés à 100%

### Phase 2 (Expérience)
- ✅ >10% acheteurs laissent avis
- ✅ Taux utilisation codes promo > 20%
- ✅ CSAT > 4.5/5

### Phase 3 (Performance)
- ✅ Lighthouse > 90
- ✅ Temps chargement < 2s
- ✅ Taux de rebond < 40%

### Phase 4 (Avancé)
- ✅ Coverage tests > 80%
- ✅ Uptime > 99.9%
- ✅ Zero critical bugs

---

## 📋 CHECKLIST PRÉ-LANCEMENT

### Technique
- [ ] Lighthouse > 90
- [ ] Tests E2E
- [ ] Sentry configuré
- [ ] Backups DB automatiques
- [ ] CDN configuré
- [ ] SSL certificate
- [ ] Rate limiting
- [ ] Headers sécurité

### Fonctionnel
- [ ] Parcours achat testé
- [ ] Emails fonctionnels
- [ ] Stripe webhooks OK
- [ ] Admin sécurisé
- [ ] Stock management
- [ ] Codes promo testés

### Contenu
- [ ] Produits réels
- [ ] Images haute qualité
- [ ] Descriptions SEO
- [ ] CGV
- [ ] Politique confidentialité
- [ ] FAQ
- [ ] Page Contact

---

## 🎉 CONCLUSION

Ce roadmap transforme Mientior d'un projet à 50% vers une **plateforme e-commerce complète**.

### Timeline recommandé

**Approche agile**: MVP → feedback users → itération

**Timeline réaliste**:
- **1 développeur**: 10-14 semaines
- **2 développeurs**: 6-8 semaines
- **Équipe 3+**: 4-6 semaines

### Prochaines étapes immédiates

1. ✅ Valider roadmap
2. 🔲 **Démarrer Sprint 1.1** (Authentification)
3. 🔲 Setup environnements
4. 🔲 Configurer CI/CD

---

**Document établi le**: 18 novembre 2025
**Version**: 1.0
