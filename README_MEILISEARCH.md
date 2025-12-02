# MeiliSearch pour Mientior - Phase 2

## 📖 Introduction

Ce document décrit l'implémentation de MeiliSearch comme moteur de recherche avancé pour Mientior (Phase 2). MeiliSearch complète PostgreSQL FTS en offrant des fonctionnalités avancées de recherche, de filtrage et d'autocomplétion.

### Pourquoi MeiliSearch pour Mientior

MeiliSearch est un moteur de recherche open-source, ultra-rapide et tolérant aux fautes, spécialement conçu pour offrir une excellente expérience de recherche instantanée. Il s'intègre parfaitement avec notre stack existante (PostgreSQL, Redis, Next.js).

### Avantages de MeiliSearch

- ⚡ **Performance** : < 50ms pour 1M+ produits (vs ~80ms PostgreSQL FTS)
- 🎯 **Typo-tolerance** : Correction automatique des fautes de frappe (1-2 caractères)
- 🇫🇷 **Français** : Support natif optimisé avec stemming et normalisation
- 🔍 **Facettes** : Filtres dynamiques ultra-rapides (10x plus rapide que PostgreSQL)
- 📊 **Analytics** : Dashboard intégré pour analyser les requêtes
- 🚀 **Scalabilité** : Horizontal scaling facile (10M+ produits)
- 🎨 **Personnalisation** : Ranking rules sur mesure pour l'e-commerce
- 🌐 **Multi-langue** : Support natif de 30+ langues

## 🏗️ Architecture

### Index MeiliSearch

Mientior utilise trois index principaux :

1. **products** : Catalogue de produits avec variants, catégories et tags
2. **categories** : Catégories hiérarchiques
3. **brands** : Marques et vendors

### Configuration des Index

#### Index `products`

**searchableAttributes** (ordre de priorité) :
1. `name` - Nom du produit (priorité maximale)
2. `description` - Description détaillée
3. `category.name` - Nom de la catégorie
4. `vendor.businessName` - Nom du vendeur
5. `tags.name` - Tags associés
6. `specifications` - Caractéristiques techniques (JSON)

**filterableAttributes** (pour les facettes dynamiques) :
- `categoryId`, `vendorId` - Filtrage par catégorie/vendeur
- `price`, `rating`, `stock` - Filtrage numérique
- `onSale`, `featured` - Flags booléens
- `variants.color`, `variants.size` - Attributs de variants
- `createdAt`, `updatedAt` - Filtrage temporel

**sortableAttributes** (pour le tri) :
- `price` - Prix croissant/décroissant
- `rating` - Note des clients
- `reviewCount` - Popularité
- `createdAt` - Nouveautés
- `stock` - Disponibilité

**rankingRules** (algorithme de pertinence) :
1. `words` - Correspondance des mots
2. `typo` - Tolérance aux fautes (1-2 caractères)
3. `proximity` - Proximité des mots dans la requête
4. `attribute` - Ordre des searchableAttributes
5. `sort` - Tri personnalisé
6. `exactness` - Correspondance exacte vs partielle
7. `featured:desc` - Boost des produits mis en avant
8. `rating:desc` - Boost des produits bien notés

**stopWords** (mots français ignorés) :
Liste de 50+ stop words français (le, la, les, un, une, des, de, du, à, au, etc.) pour améliorer la pertinence.

**synonyms** (synonymes e-commerce) :
- `téléphone` ↔ `smartphone`, `mobile`, `portable`
- `ordinateur` ↔ `laptop`, `pc`, `computer`
- `chaussures` ↔ `souliers`, `baskets`, `sneakers`
- `vêtements` ↔ `habits`, `fringues`, `tenues`
- `pas cher` ↔ `économique`, `abordable`, `bon marché`

#### Index `categories`

Configuration simplifiée pour la recherche de catégories :
- **searchableAttributes** : `name`, `description`, `slug`
- **filterableAttributes** : `isActive`, `parentId`
- **sortableAttributes** : `name`, `createdAt`

#### Index `brands`

Configuration pour les marques/vendors :
- **searchableAttributes** : `businessName`, `description`, `slug`
- **filterableAttributes** : `isActive`, `verified`
- **sortableAttributes** : `businessName`, `createdAt`

## 🚀 Installation

### Prérequis

- Docker et Docker Compose installés
- Node.js 20+ installé
- PostgreSQL et Redis déjà configurés
- Accès au terminal

### Étape 1 : Configuration des variables d'environnement

1. Copier `.env.example` vers `.env` (si pas déjà fait)
2. Générer une master key sécurisée :

```bash
openssl rand -base64 32
```

3. Ajouter les variables MeiliSearch dans `.env` :

```env
# MeiliSearch Configuration
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_MASTER_KEY=your_generated_master_key_here
ENABLE_MEILISEARCH=true
MEILISEARCH_INDEX_PREFIX=mientior_
```

**⚠️ Important** : Ne jamais commiter la master key dans Git !

### Étape 2 : Installer les dépendances

```bash
npm install
```

Cela installera `meilisearch` (SDK JavaScript officiel) et toutes les dépendances.

### Étape 3 : Démarrer MeiliSearch

Utiliser le script de démarrage automatique :

```bash
npm run meilisearch:start
```

Ce script va :
1. ✅ Vérifier les prérequis (Docker, Docker Compose, .env)
2. 🚀 Démarrer le conteneur MeiliSearch
3. ⏳ Attendre que MeiliSearch soit prêt (healthcheck)
4. 🔨 Créer les index (products, categories, brands)
5. ⚙️ Appliquer la configuration (settings, synonyms, stop words)
6. 📊 Afficher les statistiques

**Sortie attendue** :
```
🚀 Starting MeiliSearch Setup
==================================================
✅ Docker installed
✅ Docker Compose installed
✅ .env file found
✅ MEILISEARCH_MASTER_KEY configured
✅ meilisearch.config.json found

🚀 Starting MeiliSearch container...
✅ MeiliSearch container started

⏳ Waiting for MeiliSearch to be ready...
✅ MeiliSearch is ready

🔨 Initializing indexes...
✅ Indexes initialized

✅ MeiliSearch setup completed successfully!
```

### Étape 4 : Vérifier l'installation

Vérifier le statut :

```bash
npm run meilisearch:status
```

Sortie attendue :
```
⚙️  MeiliSearch Configuration
URL: http://localhost:7700
Enabled: ✅

📡 Checking availability...
✅ MeiliSearch is available

📦 Version: 1.11.0

📊 Indexes:
   • mientior_products: 0 documents
   • mientior_categories: 0 documents
   • mientior_brands: 0 documents

💚 Health Check:
   Status: ✅ available
```

### Étape 5 : Accéder au dashboard

Ouvrir le dashboard MeiliSearch :

```bash
npm run meilisearch:dashboard
```

Ou manuellement : [http://localhost:7700](http://localhost:7700)

**Authentification** : Utiliser la `MEILISEARCH_MASTER_KEY` configurée dans `.env`

## 📚 Utilisation

### Recherche Simple

```typescript
import { meilisearchClient, getIndex } from '@/lib/meilisearch-client'

const index = getIndex('products')
const results = await index.search('smartphone samsung', {
  limit: 24,
  offset: 0
})

console.log(results.hits) // Produits trouvés
console.log(results.estimatedTotalHits) // Nombre total estimé
console.log(results.processingTimeMs) // Temps de traitement
```

### Recherche avec Filtres

```typescript
const results = await index.search('chaussures', {
  filter: [
    'price >= 50 AND price <= 200',
    'categoryId = "chaussures-homme"',
    'stock > 0'
  ],
  sort: ['price:asc'],
  limit: 24
})
```

**Syntaxe des filtres** :
- Égalité : `categoryId = "cat1"`
- Comparaison : `price >= 50`, `price <= 200`
- Combinaison : `price >= 50 AND price <= 200`
- Tableaux : `variants.color = "rouge" OR variants.color = "bleu"`

### Facettes Dynamiques

```typescript
const results = await index.search('', {
  facets: ['categoryId', 'vendorId', 'variants.color', 'variants.size'],
  filter: ['price >= 50']
})

console.log(results.facetDistribution)
// {
//   categoryId: { 'cat1': 10, 'cat2': 5 },
//   vendorId: { 'vendor1': 8, 'vendor2': 7 },
//   'variants.color': { 'rouge': 15, 'bleu': 12 }
// }
```

### Autocomplétion

```typescript
const suggestions = await index.search('smart', {
  limit: 10,
  attributesToRetrieve: ['name', 'price', 'images']
})
```

### Recherche Multi-Critères

```typescript
const results = await index.search('ordinateur portable', {
  filter: [
    'price >= 500 AND price <= 1500',
    'rating >= 4.0',
    'stock > 0'
  ],
  sort: ['rating:desc'],
  facets: ['categoryId', 'vendorId', 'variants.color'],
  limit: 24,
  offset: 0
})
```

## 🎯 Configuration Avancée

### Personnaliser les Ranking Rules

Pour modifier l'ordre de pertinence, éditer `meilisearch.config.json` :

```json
{
  "indexes": {
    "products": {
      "rankingRules": [
        "words",
        "typo",
        "proximity",
        "attribute",
        "sort",
        "exactness",
        "stock:desc",      // Boost produits en stock
        "featured:desc",   // Boost produits mis en avant
        "rating:desc"      // Boost produits bien notés
      ]
    }
  }
}
```

Puis réappliquer la configuration :

```bash
npm run meilisearch:init
```

### Ajouter des Synonymes

Éditer `meilisearch.config.json` :

```json
{
  "synonyms": {
    "téléphone": ["smartphone", "mobile", "portable"],
    "ordinateur": ["laptop", "pc", "computer"],
    "pull": ["chandail", "sweater", "tricot"]
  }
}
```

Réappliquer :

```bash
npm run meilisearch:init
```

### Configurer les Stop Words

Les stop words français sont déjà configurés dans `meilisearch.config.json`. Pour ajouter des stop words personnalisés :

```json
{
  "stopWords": [
    "le", "la", "les",
    "votre_mot_personnalisé"
  ]
}
```

### Ajuster la Tolérance aux Fautes

Par défaut, MeiliSearch tolère 1 faute pour les mots de 5-8 caractères, et 2 fautes pour les mots de 9+ caractères.

Pour désactiver la tolérance :

```json
{
  "typoTolerance": {
    "enabled": false
  }
}
```

Pour ajuster les seuils :

```json
{
  "typoTolerance": {
    "minWordSizeForTypos": {
      "oneTypo": 4,
      "twoTypos": 8
    }
  }
}
```

## 🔧 Maintenance

### Scripts Disponibles

```bash
# Initialisation et gestion
npm run meilisearch:init      # Initialiser/mettre à jour les index
npm run meilisearch:reset     # Réinitialiser complètement (⚠️ supprime les données)

# Monitoring
npm run meilisearch:status    # Vérifier le statut de base
npm run meilisearch:stats     # Statistiques détaillées

# Gestion du conteneur
npm run meilisearch:start     # Démarrer MeiliSearch et initialiser
npm run meilisearch:stop      # Arrêter le conteneur
npm run meilisearch:logs      # Voir les logs en temps réel

# Dashboard
npm run meilisearch:dashboard # Ouvrir le dashboard web
```

### Quand Réindexer

Vous devez réindexer dans les cas suivants :

1. **Modification de la configuration** : Après avoir modifié `meilisearch.config.json`
2. **Ajout de nouveaux champs** : Nouveaux searchableAttributes ou filterableAttributes
3. **Résultats incorrects** : Si les résultats semblent incohérents
4. **Mise à jour MeiliSearch** : Après une mise à jour de version

**Commande** :

```bash
npm run meilisearch:reset  # Réinitialisation complète
```

### Backup et Restore

#### Créer un dump

```bash
curl -X POST 'http://localhost:7700/dumps' \
  -H 'Authorization: Bearer YOUR_MASTER_KEY'
```

Le dump sera créé dans `/meili_data/dumps/` à l'intérieur du conteneur.

**Copier le dump localement** :

```bash
docker cp mientior-meilisearch:/meili_data/dumps/your-dump.dump ./backups/
```

#### Restaurer depuis un dump

1. Arrêter le conteneur :

```bash
docker compose stop meilisearch
```

2. Démarrer avec import :

```bash
docker run -v $(pwd)/backups:/dumps \
  -v meilisearch_data:/meili_data \
  getmeili/meilisearch:v1.11 \
  --import-dump /dumps/your-dump.dump \
  --master-key YOUR_MASTER_KEY
```

3. Redémarrer normalement :

```bash
docker compose up -d meilisearch
```

### Maintenance Automatique

MeiliSearch est conçu pour être "zero-maintenance". Cependant, voici quelques bonnes pratiques :

1. **Monitoring régulier** : Vérifier les stats une fois par semaine
2. **Backups** : Créer des dumps avant les mises à jour majeures
3. **Nettoyage** : Supprimer les vieux dumps (>30 jours)
4. **Logs** : Surveiller les logs pour détecter les erreurs

## 🐛 Troubleshooting

### MeiliSearch ne démarre pas

**Symptôme** : Erreur au démarrage du conteneur

**Causes possibles** :
- Port 7700 déjà utilisé
- Master key invalide ou manquante
- Volume Docker corrompu

**Solutions** :

1. Vérifier les ports :

```bash
lsof -i :7700
# Si utilisé, arrêter le processus ou changer le port
```

2. Vérifier les logs :

```bash
docker compose logs meilisearch
```

3. Redémarrer le conteneur :

```bash
docker compose restart meilisearch
```

4. Recréer le conteneur (⚠️ perte de données) :

```bash
docker compose down meilisearch
docker compose up -d meilisearch
```

### Aucun résultat trouvé

**Symptôme** : `search()` retourne 0 résultat alors que des documents existent

**Causes possibles** :
- Index vide (aucun document indexé)
- Filtres trop restrictifs
- Typo dans le nom de l'index
- Configuration incorrecte

**Solutions** :

1. Vérifier le nombre de documents :

```bash
npm run meilisearch:status
```

2. Tester sans filtres :

```typescript
const results = await index.search('', { limit: 10 })
console.log(results.hits)
```

3. Réinitialiser l'index :

```bash
npm run meilisearch:reset
```

### Performances lentes

**Symptôme** : Temps de réponse > 100ms

**Causes possibles** :
- Trop de documents en mémoire (>10M)
- Trop de searchableAttributes (>10)
- RAM insuffisante
- Disque lent (I/O)

**Solutions** :

1. **Augmenter la RAM du conteneur** :

Éditer `docker-compose.yml` :

```yaml
meilisearch:
  # ... autres config ...
  deploy:
    resources:
      limits:
        memory: 2G  # Augmenter à 2GB
```

2. **Optimiser les searchableAttributes** :

Réduire le nombre d'attributs dans `meilisearch.config.json` :

```json
{
  "searchableAttributes": [
    "name",
    "description"
    // Supprimer les attributs moins importants
  ]
}
```

3. **Utiliser la pagination** :

```typescript
const results = await index.search('query', {
  limit: 24,      // Limiter les résultats
  offset: 0
})
```

4. **Activer le cache HTTP** :

MeiliSearch supporte le cache HTTP via ETags. Utiliser un CDN/reverse proxy.

### Erreur "Invalid API key"

**Symptôme** : `MeiliSearchApiError: Invalid API key`

**Cause** : Master key incorrecte ou non configurée

**Solutions** :

1. Vérifier la variable d'environnement :

```bash
echo $MEILISEARCH_MASTER_KEY
```

2. Régénérer une clé :

```bash
openssl rand -base64 32
```

3. Mettre à jour `.env` :

```env
MEILISEARCH_MASTER_KEY=nouvelle_cle_generee
```

4. Redémarrer le conteneur :

```bash
docker compose restart meilisearch
```

### Index non trouvé

**Symptôme** : `MeiliSearchError: index_not_found`

**Cause** : L'index n'a pas été créé

**Solution** :

```bash
npm run meilisearch:init
```

### Données corrompues

**Symptôme** : Résultats incohérents ou erreurs aléatoires

**Solution** : Réinitialisation complète

```bash
# 1. Backup (optionnel)
curl -X POST 'http://localhost:7700/dumps' \
  -H 'Authorization: Bearer YOUR_MASTER_KEY'

# 2. Arrêter et supprimer
docker compose down meilisearch
docker volume rm mientior_meilisearch_data

# 3. Redémarrer
npm run meilisearch:start
```

## ⚡ Performance

### Benchmarks Attendus

Pour un catalogue de **100K produits** :

| Opération | PostgreSQL FTS | MeiliSearch | Amélioration |
|-----------|----------------|-------------|--------------|
| Recherche simple | 80ms | 20ms | **4x** |
| Recherche avec filtres | 150ms | 30ms | **5x** |
| Facettes dynamiques | 300ms | 25ms | **12x** |
| Autocomplétion | 100ms | 10ms | **10x** |

### Comparaison MeiliSearch vs PostgreSQL FTS

| Caractéristique | PostgreSQL FTS | MeiliSearch | Recommandation |
|----------------|----------------|-------------|----------------|
| **Performance** | 80ms (100K) | 20ms (100K) | MeiliSearch ✅ |
| **Scalabilité** | 100K produits | 10M+ produits | MeiliSearch ✅ |
| **Typo-tolerance** | Non | Oui | MeiliSearch ✅ |
| **Facettes** | Lent (300ms) | Rapide (25ms) | MeiliSearch ✅ |
| **Configuration** | SQL complexe | JSON simple | MeiliSearch ✅ |
| **Infrastructure** | Inclus | Docker requis | PostgreSQL ✅ |
| **Coût** | $0 | $0 (self-hosted) | Égalité |
| **Synchronisation** | Native | Nécessaire | PostgreSQL ✅ |

**Conclusion** : Utiliser **PostgreSQL FTS** pour la Phase 1 (simple, rapide à déployer), puis **MeiliSearch** pour la Phase 2 (performances avancées).

### Optimisations

#### 1. Limiter les searchableAttributes

❌ **Mauvais** : Trop d'attributs

```json
{
  "searchableAttributes": [
    "name", "description", "category.name", "vendor.name",
    "tags.name", "specifications", "sku", "barcode", "metaTitle"
  ]
}
```

✅ **Bon** : Seulement les attributs essentiels

```json
{
  "searchableAttributes": [
    "name",
    "description",
    "category.name"
  ]
}
```

#### 2. Utiliser la pagination

❌ **Mauvais** : Récupérer tous les résultats

```typescript
const results = await index.search('query', {
  limit: 1000  // Trop de résultats
})
```

✅ **Bon** : Pagination avec limite raisonnable

```typescript
const results = await index.search('query', {
  limit: 24,
  offset: page * 24
})
```

#### 3. Filtrer au niveau MeiliSearch

❌ **Mauvais** : Filtrer côté application

```typescript
const results = await index.search('query')
const filtered = results.hits.filter(hit => hit.price > 50)
```

✅ **Bon** : Filtrer avec MeiliSearch

```typescript
const results = await index.search('query', {
  filter: ['price > 50']
})
```

#### 4. Activer le cache HTTP

Utiliser un reverse proxy (Nginx, Cloudflare) pour cacher les requêtes fréquentes.

## 🇫🇷 Configuration Française

### Stemming Automatique

MeiliSearch applique automatiquement le **stemming français** :

| Requête | Normalisé | Correspondances |
|---------|-----------|-----------------|
| chaussures | chaussur | chaussure, chaussures |
| téléphones | telephon | téléphone, téléphones, téléphoner |
| ordinateur | ordinateur | ordinateur, ordinateurs |

### Typo-tolerance

MeiliSearch corrige automatiquement les fautes de frappe :

| Requête avec faute | Correction | Résultats |
|-------------------|------------|-----------|
| smartphon | smartphone | ✅ Smartphones Samsung, iPhone, etc. |
| ordinatuer | ordinateur | ✅ Ordinateurs portables, PC |
| chausures | chaussures | ✅ Chaussures Nike, Adidas |

**Niveau de tolérance** :
- Mots de 1-4 caractères : 0 faute
- Mots de 5-8 caractères : 1 faute
- Mots de 9+ caractères : 2 fautes

### Normalisation des Accents

Les accents sont automatiquement normalisés :

| Requête | Correspondances |
|---------|-----------------|
| cafe | café, cafe, cafè |
| telephone | téléphone, telephone |
| vetement | vêtement, vetement |

Cela fonctionne **dans les deux sens** :
- Requête "cafe" → Trouve "café"
- Requête "café" → Trouve "cafe"

### Stop Words Français

Liste complète des stop words configurés dans `meilisearch.config.json` :

```
le, la, les, un, une, des, de, du, à, au, aux,
en, dans, pour, par, avec, sans, sur, sous,
et, ou, mais, donc, car, ni,
que, qui, quoi, dont, où,
ce, cet, cette, ces,
mon, ton, son, ma, ta, sa, mes, tes, ses,
notre, votre, leur, nos, vos, leurs
```

Ces mots sont ignorés lors de la recherche pour améliorer la pertinence.

## 🔐 Sécurité

### Master Key

La **master key** donne un accès administrateur complet à MeiliSearch. Elle doit être :

✅ **Bonnes pratiques** :
- Générée avec `openssl rand -base64 32` (minimum 32 caractères)
- Stockée uniquement dans `.env` (jamais commité)
- Différente pour dev/staging/production
- Renouvelée tous les 6 mois

❌ **À éviter** :
- Utiliser "changeme" ou "test123"
- Commiter la clé dans Git
- Partager la clé dans Slack/email
- Utiliser la même clé partout

### API Keys (Production)

En production, créer des **API keys spécifiques** pour les clients :

**Search Key** (lecture seule, pour le frontend) :

```bash
curl -X POST 'http://localhost:7700/keys' \
  -H 'Authorization: Bearer YOUR_MASTER_KEY' \
  -H 'Content-Type: application/json' \
  --data-binary '{
    "description": "Search key for frontend",
    "actions": ["search"],
    "indexes": ["mientior_products", "mientior_categories"],
    "expiresAt": null
  }'
```

**Admin Key** (lecture/écriture, pour le backend) :

```bash
curl -X POST 'http://localhost:7700/keys' \
  -H 'Authorization: Bearer YOUR_MASTER_KEY' \
  -H 'Content-Type: application/json' \
  --data-binary '{
    "description": "Admin key for backend",
    "actions": ["*"],
    "indexes": ["*"],
    "expiresAt": null
  }'
```

### CORS

En production, configurer CORS pour autoriser uniquement votre domaine :

Éditer `docker-compose.yml` :

```yaml
meilisearch:
  environment:
    - MEILI_HTTP_CORS_ALLOW_ORIGIN=https://mientior.com
```

### HTTPS

En production, **toujours** utiliser HTTPS :

1. Utiliser un reverse proxy (Nginx, Caddy, Traefik)
2. Configurer un certificat SSL (Let's Encrypt)
3. Rediriger HTTP → HTTPS

**Exemple Nginx** :

```nginx
server {
    listen 443 ssl http2;
    server_name search.mientior.com;

    ssl_certificate /etc/letsencrypt/live/search.mientior.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/search.mientior.com/privkey.pem;

    location / {
        proxy_pass http://localhost:7700;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🚀 Migration depuis PostgreSQL FTS

### Stratégie de Migration Progressive

La migration vers MeiliSearch se fait en **4 phases** :

#### Phase 1 : Installation en Parallèle (En cours)

- ✅ Installer MeiliSearch en parallèle de PostgreSQL FTS
- ✅ Configurer les index et settings
- ✅ Créer le client TypeScript
- ✅ Tester en environnement de dev
- Feature flag : `ENABLE_MEILISEARCH=false` (désactivé par défaut)

#### Phase 2 : Tests A/B (Prochaine étape)

- Activer MeiliSearch pour 10% des utilisateurs
- Comparer les performances et la pertinence
- Collecter les métriques (temps de réponse, taux de conversion)
- Feature flag : `ENABLE_MEILISEARCH=true` + `MEILISEARCH_PERCENTAGE=10`

#### Phase 3 : Migration Progressive

- Augmenter progressivement : 10% → 25% → 50% → 75% → 100%
- Surveiller les erreurs et les performances
- Garder PostgreSQL FTS en fallback
- Feature flag : `MEILISEARCH_PERCENTAGE=100`

#### Phase 4 : Décommission PostgreSQL FTS

- Supprimer le code PostgreSQL FTS
- Supprimer les colonnes `tsvector` de la base de données
- Simplifier le code
- Feature flag : Supprimer `ENABLE_MEILISEARCH` (toujours activé)

### Feature Flag

Le système utilise un **feature flag** pour basculer entre PostgreSQL et MeiliSearch :

```env
# .env
ENABLE_MEILISEARCH=true   # Utiliser MeiliSearch
# ou
ENABLE_MEILISEARCH=false  # Utiliser PostgreSQL FTS
```

**Implémentation** :

```typescript
import { ENABLE_MEILISEARCH } from '@/lib/meilisearch-client'
import { searchProducts as searchPostgres } from '@/lib/product-search-service'
import { searchProducts as searchMeili } from '@/lib/meilisearch-search-service'

export async function searchProducts(query: string) {
  if (ENABLE_MEILISEARCH) {
    // Utiliser MeiliSearch
    try {
      return await searchMeili(query)
    } catch (error) {
      // Fallback vers PostgreSQL en cas d'erreur
      console.error('MeiliSearch error, falling back to PostgreSQL:', error)
      return await searchPostgres(query)
    }
  } else {
    // Utiliser PostgreSQL FTS
    return await searchPostgres(query)
  }
}
```

### Synchronisation des Données

**Phase actuelle** : Pas de synchronisation automatique (Phase 1)

**Prochaine phase** : Synchronisation temps réel PostgreSQL → MeiliSearch

**Options de synchronisation** :

1. **Triggers PostgreSQL** : Envoyer les changements à MeiliSearch via HTTP
2. **Debezium** : Change Data Capture (CDC) via Kafka
3. **Prisma Middleware** : Intercepter les requêtes Prisma et synchroniser
4. **Cron Job** : Synchronisation périodique (moins réactif)

**Recommandation** : Prisma Middleware (plus simple, intégré au stack existant)

## 📊 Monitoring

### Métriques Clés à Surveiller

1. **Temps de réponse** : < 50ms pour 95% des requêtes
2. **Utilisation mémoire** : < 80% de la RAM allouée
3. **Taille de la DB** : Croissance linéaire avec le nombre de produits
4. **Taux d'erreur** : < 0.1%
5. **Nombre de requêtes** : Surveiller les pics de trafic

### Dashboard MeiliSearch

Accéder au dashboard : [http://localhost:7700](http://localhost:7700)

**Fonctionnalités** :
- 📊 Vue d'ensemble des index
- 🔍 Testeur de recherche intégré
- 📈 Statistiques en temps réel
- ⚙️ Configuration des settings
- 🔑 Gestion des API keys

### Logs

**Voir les logs en temps réel** :

```bash
npm run meilisearch:logs
```

**Filtrer les logs Docker** :

```bash
docker compose logs meilisearch | grep ERROR
```

**Niveaux de log** :

```yaml
# docker-compose.yml
meilisearch:
  environment:
    - MEILI_LOG_LEVEL=INFO  # DEBUG, INFO, WARN, ERROR
```

### Alertes

Configurer des alertes pour :

1. **MeiliSearch down** : Healthcheck échoue
2. **Performances dégradées** : Temps de réponse > 100ms
3. **Erreurs fréquentes** : Taux d'erreur > 1%
4. **Mémoire saturée** : Utilisation > 90%

**Exemple avec Sentry** :

```typescript
import * as Sentry from '@sentry/nextjs'

try {
  const results = await index.search(query)
} catch (error) {
  Sentry.captureException(error, {
    tags: { service: 'meilisearch' },
    extra: { query }
  })
}
```

## 📞 Support

Pour toute question ou problème :

1. ✅ Consulter ce document (README_MEILISEARCH.md)
2. 🔍 Vérifier les logs : `npm run meilisearch:logs`
3. 📊 Vérifier le statut : `npm run meilisearch:status`
4. 📚 Consulter la documentation officielle : [meilisearch.com/docs](https://www.meilisearch.com/docs)
5. 💬 Contacter l'équipe technique

## 📝 Références

- [MeiliSearch Documentation](https://www.meilisearch.com/docs)
- [MeiliSearch GitHub](https://github.com/meilisearch/meilisearch)
- [MeiliSearch Node.js Client](https://github.com/meilisearch/meilisearch-js)
- [French Language Support](https://www.meilisearch.com/docs/learn/what_is_meilisearch/language)
- [Ranking Rules](https://www.meilisearch.com/docs/learn/core_concepts/relevancy)
- [Typo Tolerance](https://www.meilisearch.com/docs/learn/configuration/typo_tolerance)
- [Faceted Search](https://www.meilisearch.com/docs/learn/fine_tuning_results/faceted_search)
- [Docker Deployment](https://www.meilisearch.com/docs/learn/cookbooks/docker)

---

**Version** : 1.0.0 (Phase 2)
**Dernière mise à jour** : 2025-11-30
**Auteur** : Équipe Mientior
