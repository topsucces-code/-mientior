# Search Cache System pour Mientior

## 📖 Introduction

Ce document décrit l'implémentation du système de cache de recherche avancé pour Mientior, offrant une architecture 3-tier avec invalidation intelligente, réchauffement automatique et métriques de performance complètes.

### Avantages du Cache de Recherche

- ⚡ **Performance** : < 50ms pour les recherches mises en cache (vs ~200ms non mises en cache)
- 🎯 **Évolutivité** : Réduction de 80% de la charge sur la base de données
- 🔄 **Fraîcheur** : TTLs différenciés selon la volatilité des données
- 📊 **Observabilité** : Métriques complètes de hit rate et latence
- 🚀 **CDN Ready** : Headers HTTP pour le cache navigateur/CDN
- 🛠️ **Maintenance** : Scripts CLI pour la gestion opérationnelle

### Architecture 3-Tier

Le système utilise trois niveaux de cache distincts avec des TTLs optimisés :

```
Browser/CDN (stale-while-revalidate)
    ↓
Redis Cache (TTL différencié)
    ↓
Database (PostgreSQL/MeiliSearch)
```

**Avantages** :
- Cache navigateur réduit les requêtes réseau
- Redis fournit un cache partagé rapide
- TTLs différenciés équilibrent fraîcheur et performance

## 🏗️ Architecture

### Flux de Cache

```
Requête Utilisateur
    ↓
1. Cache Navigateur/CDN (stale-while-revalidate)
    ↓ (si miss ou stale)
2. Cache Redis (TTL 1h/30min/5min)
    ↓ (si miss)
3. Moteur de Recherche (PostgreSQL/MeiliSearch)
    ↓
4. Base de Données
```

### Avantages du Cache Multi-Niveau

- **Navigateur** : UX instantanée pour les requêtes répétées
- **CDN** : Réduction de la latence géographique
- **Redis** : Cache partagé entre instances applicatives
- **Base de données** : Toujours disponible comme fallback

## 🎯 Cache Tiers

### Suggestions Cache (1 heure TTL)

**Objectif** : Suggestions d'autocomplétion pour la recherche

**Préfixe de clé** : `search:suggestions:`

**Pourquoi 1h** :
- Les suggestions changent peu fréquemment
- Taux de hit élevé (>90%) pour les requêtes populaires
- Impact minimal sur la fraîcheur des données

**Invalidation** : Lors des changements Produit/Catégorie/Tag

**Exemple de clé** : `search:suggestions:smart`

### Search Results Cache (30 minutes TTL)

**Objectif** : Résultats de recherche complets avec produits

**Préfixe de clé** : `search:products:`, `search:global:`

**Pourquoi 30min** :
- Équilibre entre fraîcheur et performance
- Les prix et stocks changent régulièrement
- Bonne couverture pour les requêtes populaires

**Invalidation** : Lors des changements Produit/Variant

**Exemple de clé** : `search:products:smartphone:filters:{}:sort:relevance`

### Facets Cache (5 minutes TTL)

**Objectif** : Options de filtres dynamiques

**Préfixe de clé** : `facets:`

**Pourquoi 5min** :
- Les facettes changent fréquemment avec l'inventaire
- Calcul coûteux mais données volatiles
- TTL court pour maintenir la précision

**Invalidation** : Lors des changements Produit/Variant

**Exemple de clé** : `facets:query:laptop:filters:{categories:["electronics"]}`

## 🌐 Cache HTTP

### Headers Cache-Control

Le système ajoute des headers `Cache-Control` avec `stale-while-revalidate` :

```typescript
'Cache-Control': `public, s-maxage=${httpCacheTTL}, stale-while-revalidate=${httpCacheTTL}`
```

**Où** : `httpCacheTTL = Math.floor(redisTTL / 2)` (moitié du TTL Redis)

### Stratégie CDN/Navigateur

- **CDN** : Met en cache pour 15min (recherche) ou 30min (suggestions)
- **Navigateur** : Peut servir du contenu "stale" pendant la révalidation
- **Background** : Requête en arrière-plan pour rafraîchir le cache

### Complémentarité avec Redis

- **Redis** : Cache applicatif partagé
- **HTTP** : Cache périphérique (CDN/navigateur)
- **Avantages** : Réduction drastique des requêtes réseau

### Trade-offs

- **Avantage** : UX améliorée, réduction de latence
- **Inconvénient** : Données légèrement obsolètes (max 15-30min)
- **Acceptable** : Pour l'e-commerce, la fraîcheur parfaite n'est pas critique

## 🔄 Invalidation du Cache

### Invalidation Automatique via Prisma Middleware

Le middleware Prisma détecte les changements et invalide automatiquement :

```typescript
// Dans src/lib/prisma.ts
prisma.$use(async (params, next) => {
  const result = await next(params)
  
  if (params.model === 'Product' && params.action === 'update') {
    await invalidateSearchCache('*')
    await invalidateSuggestionsCache('*')
    await invalidateFacetsCache('*')
  }
  
  return result
})
```

### Triggers d'Invalidation

- **Produit** : Invalidation complète (suggestions, recherche, facettes)
- **Variant Produit** : Invalidation recherche et facettes
- **Catégorie** : Invalidation suggestions et recherche
- **Tag** : Invalidation suggestions

### Invalidation Basée sur les Patterns

Utilise `Redis SCAN` pour l'invalidation pattern-based :

```typescript
await redis.eval(`
  local keys = redis.call('SCAN', 0, 'MATCH', ARGV[1], 'COUNT', 1000)
  for i, key in ipairs(keys[2]) do
    redis.call('DEL', key)
  end
`, 0, pattern)
```

**Avantages** : Simple, efficace pour l'échelle actuelle

**Limites** : Peut invalider plus que nécessaire (acceptable)

### Invalidation Manuelle via Scripts CLI

```bash
# Invalider tout le cache de recherche
npm run search:clear-cache

# Invalider seulement les suggestions
npm run search:clear-cache:suggestions

# Invalider avec pattern
npm run search:clear-cache -- --tier search --pattern *smartphone*
```

## 🔥 Réchauffement du Cache

### Objectif

Pré-remplir le cache Redis avec les résultats des requêtes populaires pour améliorer les performances au démarrage ou après vidage du cache.

### Quand Utiliser

- Après les déploiements
- Après vidage manuel du cache
- Quand le taux de hit est faible (<70%)
- Maintenance programmée (quotidienne, heures creuses)

### Fonctionnement

1. **Analyse des Logs** : Récupère les N requêtes les plus populaires depuis les 7 derniers jours
2. **Filtrage** : Exclut les requêtes sans résultats
3. **Exécution** : Lance les recherches et met en cache les résultats
4. **Rapport** : Statistiques de succès/échec

### Utilisation CLI

```bash
# Réchauffer avec les paramètres par défaut (50 requêtes, 7 jours)
npm run search:warm-cache

# Réchauffer 100 requêtes des 30 derniers jours
npm run search:warm-cache -- --top-queries 100 --period-days 30

# Mode dry-run pour prévisualiser
npm run search:warm-cache:dry-run
```

### Programmation Recommandée

- **Fréquence** : Quotidienne, 2h du matin (heures creuses)
- **Limites** : 50-100 requêtes max pour éviter la surcharge Redis
- **Monitoring** : Vérifier l'impact sur la mémoire Redis

## 📊 Métriques de Performance

### Métriques Disponibles

- **Taux de Hit** : % de requêtes servies depuis le cache
- **Latence** : Temps de réponse moyen (mis en cache vs non mis en cache)
- **Utilisation Mémoire** : Consommation Redis
- **Requêtes Populaires** : Top des clés mises en cache
- **Fréquence d'Invalidation** : Nombre d'invalidations par période

### Consultation des Métriques

**Via API Admin** :
```bash
GET /api/admin/search/metrics?hours=24
```

**Via CLI** :
```bash
# Métriques des dernières 24h
npm run search:cache-metrics

# Métriques des 7 derniers jours
npm run search:cache-metrics -- --hours 168

# Sortie JSON pour monitoring
npm run search:cache-metrics:json
```

### Interprétation des Métriques

#### Taux de Hit
- **>80%** : Excellent, cache très efficace
- **60-80%** : Bon, peut être amélioré par le réchauffement
- **<60%** : Problématique, vérifier TTL ou invalidation

#### Latence
- **Mis en cache** : <50ms idéal
- **Non mis en cache** : <200ms acceptable
- **>100ms** : Vérifier les performances Redis

#### Utilisation Mémoire
- **<100MB** : Bon pour 10K produits
- **100-500MB** : Acceptable pour 100K produits
- **>500MB** : Considérer réduction TTL ou instance dédiée

### Dépannage des Taux de Hit Faibles

1. **Vérifier TTL** : Trop court ? Augmenter progressivement
2. **Analyser les Requêtes** : Sont-elles répétées ?
3. **Réchauffer le Cache** : Pour les requêtes populaires
4. **Vérifier Invalidation** : Trop fréquente ?

## ⚙️ Configuration

### Variables d'Environnement

```bash
# TTLs du Cache (en secondes)
SUGGESTIONS_CACHE_TTL=3600        # 1 heure - suggestions
SEARCH_CACHE_TTL=1800             # 30 minutes - résultats recherche
FACETS_CACHE_TTL=300              # 5 minutes - facettes

# Réchauffement du Cache
CACHE_WARMING_ENABLED=true        # Activer le réchauffement automatique
CACHE_WARMING_TOP_QUERIES=50      # Nombre de requêtes populaires
CACHE_WARMING_PERIOD_DAYS=7       # Période d'analyse (jours)

# Métriques du Cache
CACHE_METRICS_ENABLED=true        # Activer le tracking des métriques
CACHE_METRICS_RETENTION_HOURS=24  # Rétention des données (heures)
```

### Valeurs Recommandées par Échelle

#### Petite Échelle (<10K produits)
```bash
SUGGESTIONS_CACHE_TTL=3600  # 1h
SEARCH_CACHE_TTL=1800       # 30min
FACETS_CACHE_TTL=300        # 5min
```

#### Moyenne Échelle (10K-100K produits)
```bash
SUGGESTIONS_CACHE_TTL=7200  # 2h (+100%)
SEARCH_CACHE_TTL=2700       # 45min (+50%)
FACETS_CACHE_TTL=450        # 7.5min (+50%)
```

#### Grande Échelle (>100K produits)
```bash
# Instance Redis dédiée recommandée
SUGGESTIONS_CACHE_TTL=10800 # 3h (+200%)
SEARCH_CACHE_TTL=3600       # 1h (+100%)
FACETS_CACHE_TTL=600        # 10min (+100%)
```

## 🖥️ Commandes CLI

### Scripts Disponibles

```bash
# Réchauffement du cache
npm run search:warm-cache                    # Réchauffer avec paramètres par défaut
npm run search:warm-cache:dry-run           # Mode aperçu
npm run search:warm-cache -- --top-queries 100 --period-days 30

# Métriques
npm run search:cache-metrics                # Métriques formatées
npm run search:cache-metrics:json          # Sortie JSON
npm run search:cache-metrics:watch         # Surveillance temps réel

# Gestion du cache
npm run search:clear-cache                  # Vider tout le cache
npm run search:clear-cache:all              # Forcer vidage complet
npm run search:clear-cache:suggestions      # Vider seulement suggestions
npm run search:clear-cache:search           # Vider seulement recherche
npm run search:clear-cache:facets           # Vider seulement facettes
```

### Workflows Courants

#### Après Déploiement
```bash
npm run search:clear-cache:all
npm run search:warm-cache
npm run search:cache-metrics
```

#### Maintenance Quotidienne
```bash
npm run search:warm-cache
npm run search:cache-metrics -- --hours 24
```

#### Dépannage
```bash
npm run search:cache-metrics:watch
npm run search:clear-cache -- --tier search --pattern *problem*
```

#### Monitoring de Production
```bash
npm run search:cache-metrics:json | jq . > metrics.json
```

## 📈 Monitoring & Alertes

### Métriques Clés à Surveiller

- **Taux de Hit Global** : >75% en moyenne
- **Latence Moyenne** : <100ms pour les requêtes mises en cache
- **Utilisation Mémoire Redis** : <80% de la capacité
- **Fréquence d'Invalidation** : <1000/jour (selon volume)

### Seuils d'Alerte Recommandés

- **Taux de Hit <70%** : Investiguer TTL ou réchauffement
- **Latence >100ms** : Vérifier performances Redis
- **Mémoire >500MB** : Réduire TTL ou limiter taille cache
- **Invalidations >5000/jour** : Vérifier logique invalidation

### Intégration Outils de Monitoring

#### Sentry
```typescript
// Dans src/lib/redis.ts
try {
  const result = await getCachedData(key, ttl, fetcher)
} catch (error) {
  Sentry.captureException(error, {
    tags: { service: 'redis-cache' },
    extra: { key, ttl }
  })
}
```

#### DataDog
```bash
# Métriques custom
npm run search:cache-metrics:json | curl -X POST \
  -H "Content-Type: application/json" \
  -d @- https://api.datadoghq.com/api/v1/series
```

#### Prometheus
```yaml
# Exporter les métriques
- job_name: 'mientior-cache'
  static_configs:
    - targets: ['localhost:9090']
  metrics_path: '/api/admin/search/metrics'
```

## 🐛 Dépannage

### Problèmes Courants

#### Taux de Hit Faible
**Symptômes** : Cache peu utilisé, latence élevée

**Solutions** :
1. Augmenter TTL progressivement
2. Activer le réchauffement du cache
3. Vérifier fréquence d'invalidation

#### Utilisation Mémoire Élevée
**Symptômes** : Redis utilise >500MB

**Solutions** :
1. Réduire TTL des caches
2. Limiter nombre de clés mises en cache
3. Vérifier fuites mémoire (clés non expirées)

#### Données Obsolètes
**Symptômes** : Résultats de recherche incorrects

**Solutions** :
1. Vérifier triggers d'invalidation Prisma
2. Tester invalidation manuelle
3. Vérifier logique pattern-based

#### Erreurs de Connexion Redis
**Symptômes** : Échecs de cache, fallback vers DB

**Solutions** :
1. Vérifier statut Redis : `redis-cli ping`
2. Vérifier configuration réseau
3. Redémarrer service Redis

### Mode Debug

Activer le logging verbeux :

```bash
# Variables d'environnement
REDIS_DEBUG=true
CACHE_DEBUG=true

# Voir logs détaillés
npm run dev 2>&1 | grep -i cache
```

### Vérification du Fonctionnement du Cache

```bash
# 1. Vérifier statut Redis
redis-cli INFO | grep used_memory_human

# 2. Voir clés cache
redis-cli KEYS "search:*" | head -10

# 3. Tester API avec cache
curl -H "Cache-Control: no-cache" "http://localhost:3000/api/search?q=test"

# 4. Vérifier métriques
npm run search:cache-metrics
```

## 💡 Bonnes Pratiques

### Quand Vider le Cache Manuellement

- **Après Import Massif** : Nouveaux produits/catégories
- **Après Corrections de Données** : Prix, stocks incorrects
- **Après Changements Majeurs** : Refonte catégories/tags
- **Maintenance Programmée** : Avant pics de trafic

### Test des Changements de Cache

```bash
# 1. Backup métriques actuelles
npm run search:cache-metrics:json > before.json

# 2. Appliquer changements (TTL, etc.)
# 3. Vider cache
npm run search:clear-cache:all

# 4. Réchauffer
npm run search:warm-cache

# 5. Comparer métriques
npm run search:cache-metrics:json > after.json
diff before.json after.json
```

### Guidelines de Test de Performance

- **Charge** : 100 requêtes/sec pendant 5min
- **Mélange** : 80% requêtes populaires, 20% nouvelles
- **Métriques** : Latence P95, taux d'erreur, utilisation CPU/mémoire
- **Outils** : k6, Artillery, ou ab

### Considérations d'Évolutivité

#### Redis Cluster
- **Quand** : >1M clés ou haute disponibilité requise
- **Configuration** : Instance dédiée avec persistance
- **Migration** : Utiliser redis-cluster-proxy pour compatibilité

#### Cache Multi-Région
- **CDN** : Cloudflare ou AWS CloudFront
- **Redis** : Instance par région avec réplication
- **Invalidation** : Webhooks pour synchronisation

#### Monitoring Avancé
- **Alertes** : PagerDuty pour seuils critiques
- **Dashboards** : Grafana avec sources Prometheus
- **Logs** : ELK stack pour analyse rétrospective

## 📐 Diagrammes d'Architecture

### Flux de Cache (Requête → Réponse)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Utilisateur │───▶│  Navigateur │───▶│     CDN     │───▶│ Application │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                        │              │
                                                        ▼              │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│   Redis     │◀───│   Cache     │◀───│   HTTP      │◀────┘
│  (TTL)      │    │  Helpers    │    │  Headers    │
└─────────────┘    └─────────────┘    └─────────────┘
                                                        │
                                                        ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Moteur de   │───▶│ PostgreSQL  │    │ MeiliSearch │
│ Recherche   │    │   FTS       │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Flux d'Invalidation (Changement DB → Vidage Cache)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Changement  │───▶│ Prisma      │───▶│ Middleware  │
│ Base de     │    │ Transaction │    │             │
│ Données     │    └─────────────┘    └─────────────┘
└─────────────┘                                   │
                                                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Pattern     │───▶│  Redis SCAN │───▶│   DELETE    │
│ Matching    │    │             │    │   Keys      │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Flux de Réchauffement (Analytics → Cache Population)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ SearchLog   │───▶│ Top Queries │───▶│   Filter    │
│ Analytics   │    │  (7 days)   │    │ (with results│
└─────────────┘    └─────────────┘    │   only)     │
                                       └─────────────┘
                                                  │
                                                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Execute     │───▶│   Cache     │───▶│   Report    │
│ Searches    │    │   Results   │    │ Success/    │
└─────────────┘    └─────────────┘    │ Failures    │
                                       └─────────────┘
```

---

**Version** : 1.0.0
**Dernière mise à jour** : 2025-01-15
**Auteur** : Équipe Mientior