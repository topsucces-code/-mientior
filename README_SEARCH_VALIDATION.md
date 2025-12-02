# Guide de Validation du Système de Recherche Mientior

## Introduction

Ce document décrit la procédure complète de validation du système de recherche avancé de Mientior, conformément au cahier des charges (14 requirements, 70+ critères d'acceptation).

## Prérequis

### Infrastructure
- ✅ PostgreSQL avec extensions FTS (`pg_trgm`) activées
- ✅ MeiliSearch v1.11+ en cours d'exécution
- ✅ Redis pour le cache
- ✅ Node.js 20+ et dépendances installées

### Données
- Minimum 1000 produits indexés
- Plusieurs catégories et marques
- Au moins 10 utilisateurs avec historique d'achats

### Vérification Préliminaire

```bash
# Vérifier les services
docker compose ps

# Vérifier PostgreSQL FTS
npm run db:product-search:status
npm run db:trigram-search:status

# Vérifier MeiliSearch
npm run meilisearch:status

# Vérifier Redis
redis-cli ping

# Vérifier les index
npm run db:facets:verify
```

## Étape 1 : Validation Automatisée Complète

### 1.1 Validation Système Globale

```bash
npm run search:validate
```

**Ce test vérifie :**
- ✅ Performance (autocomplete <100ms, search <200ms)
- ✅ Correction orthographique
- ✅ Recherche sémantique (synonymes)
- ✅ Facettes dynamiques
- ✅ Fallback PostgreSQL ↔ MeiliSearch
- ✅ Support multilingue FR/EN
- ✅ Personnalisation utilisateur
- ✅ Analytics et logging
- ✅ Historique de recherche
- ✅ Performance du cache

**Résultats attendus :**
- 100% des tests PASS
- Fichier `search-validation-results.json` généré
- Success rate ≥ 90%

### 1.2 Benchmarks de Performance

```bash
npm run search:benchmark
```

**Ce test mesure :**
- Latence autocomplete (P50/P95/P99)
- Latence search (P50/P95/P99)
- Latence facets (P50/P95/P99)
- Throughput (requêtes/seconde)
- Performance concurrente (10 requêtes parallèles)

**Résultats attendus :**
- Autocomplete P95 < 100ms ✅
- Search P95 < 200ms ✅
- Facets P95 < 200ms ✅
- Fichier `search-benchmark-results.json` généré

### 1.3 Tests Spécifiques

#### Correction Orthographique

```bash
npm run search:test-spell-correction
```

Tests : "smartphon" → "smartphone", "ordinatuer" → "ordinateur", etc.

#### Facettes Dynamiques

```bash
npm run search:test-facets
```

Tests : Facettes initiales, avec filtres prix, avec query, multiples filtres.

#### Fallback Résilience

```bash
npm run search:test-fallback
```

Tests : MeiliSearch unavailable, graceful degradation, consistency.

#### Recherche Multilingue

```bash
npm run search:test-multilingual
```

Tests : Détection FR/EN, normalisation accents, stemming.

#### Personnalisation

```bash
npm run search:test-personalization
```

Tests : Boosts catégories/marques favorites, préférences utilisateur.

#### Analytics

```bash
npm run search:test-analytics
```

Tests : Logging searches, click tracking, dashboard data.

#### Historique de Recherche

```bash
npm run search:test-history
```

Tests : Stockage local/backend, deduplication, sync cross-device.

### 1.4 Exécution Complète

Pour exécuter tous les tests en séquence :

```bash
npm run search:validate-all
```

**Durée estimée :** 10-15 minutes

## Étape 2 : Validation Manuelle UI/UX

### 2.1 Préparation

```bash
# Démarrer l'application
npm run dev

# Ouvrir dans le navigateur
open http://localhost:3000
```

### 2.2 Checklist Manuelle

Suivre la checklist dans [SEARCH_VALIDATION_CHECKLIST.md](./SEARCH_VALIDATION_CHECKLIST.md).

**Sections à valider :**
1. Interface Utilisateur (SearchResults, AdvancedSearchBar, FiltersSidebar)
2. Fonctionnalités de Recherche (autocomplétion, spell correction, facets)
3. Performance (latence, cache)
4. Multilingue (FR/EN)
5. Personnalisation
6. Analytics
7. Historique de recherche
8. Résilience
9. Accessibilité
10. Mobile

### 2.3 Tests Manuels Critiques

#### Test 1 : Autocomplétion
1. Taper "smar" dans la barre de recherche
2. Vérifier que les suggestions apparaissent en <100ms
3. Naviguer avec les flèches haut/bas
4. Presser Enter pour lancer la recherche
5. Vérifier que Network tab montre latence <100ms

#### Test 2 : Correction Orthographique
1. Taper "smartphon" (faute de frappe)
2. Presser Enter
3. Vérifier le message "Résultats pour smartphone"
4. Vérifier le lien "Rechercher plutôt smartphon"
5. Cliquer sur le lien et vérifier requête originale

#### Test 3 : Facettes Dynamiques
1. Rechercher "smartphone"
2. Noter les marques disponibles (ex: Apple, Samsung, Xiaomi)
3. Appliquer un filtre prix 500-1000€
4. Vérifier que les marques sont mises à jour
5. Vérifier que les compteurs sont corrects

#### Test 4 : Personnalisation
1. Se connecter avec un utilisateur
2. Rechercher "laptop"
3. Noter l'ordre des résultats
4. Vérifier dans les logs : "Personalization enabled for user {userId}"
5. Comparer avec résultats en mode anonyme

#### Test 5 : Analytics Dashboard
1. Aller sur `/admin/search/analytics`
2. Vérifier les graphiques (top queries, CTR, tendances)
3. Tester les filtres par période (7j, 30j, 90j)
4. Exporter en CSV
5. Vérifier le contenu du CSV

## Étape 3 : Tests de Performance sous Charge

### 3.1 Benchmark Standard

```bash
npm run search:benchmark
```

### 3.2 Cache Metrics

```bash
# Afficher les métriques de cache
npm run search:cache-metrics

# Ou en temps réel
npm run search:cache-metrics:watch
```

**Métriques attendues :**
- Cache hit rate > 80% ✅
- Avg latency suggestions < 50ms (avec cache)
- Avg latency search < 100ms (avec cache)

### 3.3 Réchauffer le Cache

```bash
# Dry run (pour voir ce qui serait fait)
npm run search:warm-cache:dry-run

# Exécution réelle
npm run search:warm-cache
```

## Étape 4 : Tests de Résilience

### 4.1 Test MeiliSearch Indisponible

```bash
# Arrêter MeiliSearch
docker compose stop meilisearch

# Tester la recherche (doit utiliser PostgreSQL)
npm run search:test-fallback

# Redémarrer MeiliSearch
docker compose start meilisearch
```

**Résultat attendu :** Recherche fonctionne avec PostgreSQL, latence < 500ms.

### 4.2 Test Redis Indisponible

```bash
# Arrêter Redis
docker compose stop redis

# Effectuer des recherches manuelles
# Vérifier que la recherche fonctionne (sans cache)

# Redémarrer Redis
docker compose start redis
```

**Résultat attendu :** Recherche fonctionne sans cache, latence acceptable.

### 4.3 Test Charge Élevée

Simuler 100 requêtes simultanées :

```bash
npm run search:benchmark
```

Vérifier dans la section "Concurrent" que la dégradation est <10%.

## Étape 5 : Validation des Analytics

### 5.1 Générer de l'Activité

```bash
# Effectuer 50+ recherches variées manuellement
# Cliquer sur plusieurs résultats
```

### 5.2 Vérifier les Logs

```bash
npm run search:test-analytics
```

**Vérifications :**
- Table `SearchLog` contient les recherches
- Champs `clickedProductId` et `clickPosition` remplis
- `sessionId` cohérent
- `locale` correct (FR ou EN)

### 5.3 Dashboard Admin

1. Aller sur `/admin/search/analytics`
2. Vérifier les graphiques :
   - Top 10 requêtes
   - CTR (Click-Through Rate)
   - Tendances temporelles
   - Requêtes zéro-résultat
3. Tester l'export CSV
4. Vérifier le RBAC (seuls les admins ont accès)

## Étape 6 : Génération du Rapport Final

### 6.1 Générer le Rapport

```bash
npm run search:report
```

**Fichier généré :** `SEARCH_VALIDATION_REPORT.md`

### 6.2 Contenu du Rapport

- Executive Summary (statut global, success rate)
- Performance Benchmarks (tableaux comparatifs)
- Feature Validation (spell correction, facets, etc.)
- Recommendations (améliorations prioritaires)
- Next Steps (prochaines étapes)

### 6.3 Fichiers de Résultats

```
search-validation-results.json
search-benchmark-results.json
spell-correction-test-results.json
facets-test-results.json
fallback-resilience-test-results.json
```

## Étape 7 : Revue et Approbation

### 7.1 Critères de Validation

#### ✅ Validation RÉUSSIE si :
- 100% des tests automatisés PASS
- 100% de la checklist manuelle validée
- Performance : P95 <100ms (autocomplete), <200ms (search)
- Cache hit rate > 80%
- Résilience : Fallback fonctionnel
- Analytics : Dashboard complet et fonctionnel

#### ⚠️ Validation PARTIELLE si :
- 90-99% des tests PASS
- Performance légèrement dégradée (P95 <250ms)
- Quelques issues UI mineures
- Nécessite corrections mineures

#### ❌ Validation ÉCHOUÉE si :
- <90% des tests PASS
- Performance insuffisante (P95 >250ms)
- Fonctionnalités critiques manquantes
- Nécessite refactoring majeur

### 7.2 Approbation Formelle

Une fois la validation complète :

1. Signer la checklist manuelle
2. Archiver tous les fichiers de résultats
3. Créer un tag Git : `git tag search-validation-v1.0`
4. Documenter les exceptions acceptées (si nécessaire)

## Troubleshooting

### Problème : Tests échouent avec "MeiliSearch unavailable"

**Solution :**
```bash
npm run meilisearch:start
npm run meilisearch:status
```

### Problème : Performance dégradée (>200ms)

**Solutions :**
```bash
# 1. Vérifier le cache
npm run search:cache-metrics

# 2. Optimiser les index PostgreSQL
npm run db:product-search:optimize
npm run db:trigram-search:optimize

# 3. Réchauffer le cache
npm run search:warm-cache

# 4. Vérifier les logs
docker compose logs -f
```

### Problème : Facettes incorrectes

**Solutions :**
```bash
# 1. Vérifier les index de facettes
npm run db:facets:verify

# 2. Réindexer si nécessaire
npm run search:reindex

# 3. Clear cache
npm run search:clear-cache:facets
```

### Problème : Spell correction ne fonctionne pas

**Solutions :**
```bash
# 1. Vérifier la configuration
echo $SEARCH_SPELL_CORRECTION_THRESHOLD

# 2. Tester manuellement
npm run search:test-spell-correction

# 3. Vérifier le cache
npm run search:cache-metrics
```

## Ressources

### Documentation
- [Cahier des Charges](./docs/CAHIER_DE_CHARGE_SEARCH.md)
- [README MeiliSearch](./README_MEILISEARCH.md)
- [README PostgreSQL FTS](./README_PRODUCT_FTS.md)
- [README Search Service](./README_SEARCH_SERVICE.md)
- [README Analytics](./README_SEARCH_ANALYTICS.md)
- [README Cache](./README_SEARCH_CACHE.md)

### Scripts Utiles
- `npm run search:validate-all` - Validation complète
- `npm run search:report` - Génération du rapport
- `npm run search:cache-metrics` - Métriques de cache
- `npm run meilisearch:status` - Statut MeiliSearch
- `npm run db:product-search:status` - Statut PostgreSQL FTS

### Support

Pour toute question ou problème pendant la validation :
1. Consulter les README spécifiques
2. Vérifier les logs : `docker compose logs`
3. Contacter l'équipe technique

---

**Version :** 1.0.0
**Date :** 2025-11-30
**Auteur :** Équipe Mientior
**Statut :** ✅ Prêt pour validation
