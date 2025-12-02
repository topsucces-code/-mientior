# Search System Validation Checklist

This checklist complements automated tests with manual UI/UX validation.

## 1. Interface Utilisateur

### SearchResults Component
- [ ] **Onglets** : Affichage correct des onglets (Produits, Marques, Articles)
- [ ] **Correction orthographique** : Message "Résultats pour [correction]" visible et cliquable
- [ ] **Aucun résultat** : Message approprié avec suggestions
- [ ] **Chargement** : Skeleton loaders pendant la recherche
- [ ] **Pagination** : Navigation entre pages fonctionnelle

### AdvancedSearchBar Component
- [ ] **Historique** : Dropdown au focus (si historique existe)
- [ ] **Suggestions** : Dropdown après 2 caractères
- [ ] **Bouton X** : Efface la recherche
- [ ] **Icônes** : Micro (vocal), caméra (visuelle) affichées
- [ ] **Responsive** : Adaptation mobile correcte

### FiltersSidebar Component
- [ ] **Facettes dynamiques** : Mise à jour après filtres
- [ ] **Compteurs** : Nombres corrects sur chaque facette
- [ ] **Bouton "Effacer"** : Réinitialise tous les filtres
- [ ] **Accordéons** : Ouverture/fermeture fluide
- [ ] **Responsive** : Drawer/modal sur mobile

## 2. Fonctionnalités de Recherche

### Autocomplétion
- [ ] **Latence** : Suggestions <100ms (vérifier Network tab)
- [ ] **Limite** : Max 10 suggestions affichées
- [ ] **Navigation clavier** : Flèches haut/bas, Enter
- [ ] **Highlighting** : Caractères tapés mis en évidence
- [ ] **Cache** : 2ème recherche identique plus rapide

### Correction Orthographique
- [ ] **Typos** : "smartphon" → "smartphone"
- [ ] **Message** : "Résultats pour [correction]" affiché
- [ ] **Lien original** : "Rechercher plutôt [original]" fonctionnel
- [ ] **Accents** : "telephone" → "téléphone"
- [ ] **Pluriels** : "ordinateurs" → "ordinateur"

### Recherche Sémantique
- [ ] **Synonymes FR** : "téléphone" trouve "smartphone"
- [ ] **Synonymes EN** : "laptop" trouve "ordinateur"
- [ ] **Stemming** : Formes dérivées trouvées
- [ ] **Requêtes vides** : Message approprié

### Facettes Dynamiques
- [ ] **Mise à jour catégories** : Après sélection prix
- [ ] **Mise à jour marques** : Après sélection catégorie
- [ ] **Compteurs corrects** : Après filtres multiples
- [ ] **Performance** : <200ms (Network tab)
- [ ] **Ordre** : Triées par count décroissant

## 3. Performance

### Latence
- [ ] **Autocomplete** : <100ms P95 (vérifier)
- [ ] **Search** : <200ms P95 (vérifier)
- [ ] **Facets** : <200ms P95 (vérifier)
- [ ] **Cache hit** : Header `X-Cache-Status: HIT` après 2ème recherche
- [ ] **Indexation** : Nouveau produit indexé en <5s

### Charge
- [ ] **10 recherches simultanées** : Pas de dégradation >10%
- [ ] **100 suggestions/min** : Pas d'erreur
- [ ] **Mémoire** : Pas de fuite (DevTools Memory)

## 4. Multilingue

### Détection Langue
- [ ] **EN** : "smartphone" détecté comme EN (header `X-Search-Locale`)
- [ ] **FR** : "téléphone" détecté comme FR
- [ ] **Paramètre** : `?locale=en` force EN
- [ ] **Paramètre** : `?locale=fr` force FR

### Normalisation
- [ ] **Accents** : "cafe" trouve "café"
- [ ] **Accents** : "telephone" trouve "téléphone"
- [ ] **Pluriels FR** : "chaussures" → "chaussure"
- [ ] **Pluriels EN** : "laptops" → "laptop"

## 5. Personnalisation

### Utilisateur Connecté
- [ ] **Résultats personnalisés** : Logs "Personalization enabled"
- [ ] **Catégories favorites** : Boostées en premier
- [ ] **Marques favorites** : Boostées en premier
- [ ] **Préférences nulles** : Pas d'erreur, ranking standard

### Utilisateur Anonyme
- [ ] **Pas de personnalisation** : Pas de logs personnalisation
- [ ] **Ranking standard** : Ordre par popularité

## 6. Analytics

### Logging
- [ ] **Recherche loggée** : Entrée dans table `SearchLog`
- [ ] **Champs corrects** : query, resultCount, timestamp, userId
- [ ] **Filtres loggés** : JSON des filtres appliqués
- [ ] **Locale loggée** : FR ou EN

### Tracking Clics
- [ ] **Clic loggé** : `clickedProductId` et `clickPosition` remplis
- [ ] **Position correcte** : Index dans liste de résultats
- [ ] **Session** : `sessionId` cohérent

### Dashboard Admin
- [ ] **Accès** : `/admin/search/analytics` accessible (RBAC)
- [ ] **Graphiques** : Top queries, CTR, tendances affichés
- [ ] **Filtres** : 7j, 30j, 90j, custom fonctionnels
- [ ] **Export CSV** : Génère CSV valide
- [ ] **Requêtes zéro-résultat** : Identifiées et affichées

## 7. Historique de Recherche

### Stockage Local
- [ ] **Affichage** : Historique au focus (max 10)
- [ ] **Clic** : Lance recherche
- [ ] **Suppression item** : Bouton X fonctionne
- [ ] **Effacer tout** : "Effacer l'historique" supprime tout
- [ ] **Deduplication** : Pas de doublons

### Sync Backend
- [ ] **Utilisateur connecté** : Sync vers `SearchHistory`
- [ ] **Connexion** : Merge local → backend puis clear local
- [ ] **Cross-device** : Même historique sur 2 appareils
- [ ] **Limite** : Max 10 dans DB
- [ ] **Deduplication** : Mise à jour timestamp, pas doublon

## 8. Résilience

### Fallback
- [ ] **MeiliSearch down** : Recherche fonctionne (PostgreSQL)
- [ ] **Header** : `X-Search-Engine: postgresql`
- [ ] **Redis down** : Recherche fonctionne (sans cache)
- [ ] **Latence acceptable** : <500ms même en fallback

### Gestion d'Erreurs
- [ ] **Pas d'erreur 500** : Jamais affiché à l'utilisateur
- [ ] **Messages gracieux** : "Échec de la recherche, veuillez réessayer"
- [ ] **Logs serveur** : Erreurs loggées côté backend
- [ ] **Retry automatique** : 1 tentative de fallback

## 9. Accessibilité

### Clavier
- [ ] **Navigation complète** : Tab, Enter, Esc
- [ ] **Focus visible** : Indicateurs clairs
- [ ] **Échappement** : Esc ferme dropdowns
- [ ] **Enter** : Lance recherche

### Screen Reader
- [ ] **Labels ARIA** : aria-label, aria-describedby
- [ ] **Annonces** : Résultats annoncés (aria-live)
- [ ] **Rôles** : role="search", role="listbox"
- [ ] **États** : aria-expanded, aria-selected

### Visuel
- [ ] **Contraste** : Texte lisible (ratio >4.5:1)
- [ ] **Taille police** : Minimum 14px
- [ ] **Focus** : Outline visible
- [ ] **Erreurs** : Messages en couleur + texte

## 10. Mobile

### Responsive
- [ ] **Barre de recherche** : Adaptée mobile (pleine largeur)
- [ ] **Filtres** : Dans drawer/modal
- [ ] **Résultats** : Grille 1 colonne
- [ ] **Touch targets** : Minimum 44x44px

### Performance Mobile
- [ ] **3G throttling** : <3s chargement initial
- [ ] **Images optimisées** : WebP, lazy loading
- [ ] **Bundle size** : <500KB JS compressé
- [ ] **Lighthouse score** : >90 Performance

---

## Instructions d'Utilisation

1. **Avant validation** : Exécuter `npm run search:validate-all`
2. **Pendant validation** : Cocher chaque item manuellement
3. **Après validation** : Noter les problèmes ci-dessous
4. **Prendre screenshots** : Pour documentation
5. **Comparer** : Avec résultats des tests automatisés

## Issues Identifiés

| Item | Description | Priorité | Action |
|------|-------------|----------|--------|
|      |             |          |        |
|      |             |          |        |
|      |             |          |        |

---

**Version:** 1.0.0
**Date:** 2025-11-30
**Valideur:** ________________
**Statut:** ☐ Approuvé ☐ Corrections nécessaires ☐ Rejeté
