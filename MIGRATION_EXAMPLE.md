# Migration Example: API Route Refactoring

Ce document montre comment migrer une route API existante pour utiliser les nouvelles utilities.

## Exemple: Route de Recherche de Produits

### ❌ AVANT (Code Original)

```typescript
// src/app/api/products/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    console.log('Searching products:', query)

    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          status: 'ACTIVE',
        },
        skip,
        take: limit,
      }),
      prisma.product.count({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          status: 'ACTIVE',
        },
      }),
    ])

    console.log('Found products:', products.length)

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + products.length < total,
      },
    })
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    )
  }
}
```

### ✅ APRÈS (Code Refactoré)

```typescript
// src/app/api/products/search/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { env } from '@/lib/env'
import { logger, createApiLogger, measureTime } from '@/lib/logger'
import { apiSuccess, apiError, ErrorCodes, CommonErrors } from '@/lib/api-response'
import { validateQueryParams, CommonSchemas, combineSchemas } from '@/lib/api-validation'

// Schéma de validation pour les paramètres de recherche
const searchSchema = combineSchemas(
  CommonSchemas.search, // { q: string }
  CommonSchemas.pagination, // { page: number, limit: number }
  z.object({
    sortBy: z.enum(['name', 'price', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  })
)

export async function GET(request: NextRequest) {
  // Créer un logger avec le contexte de la requête
  const log = createApiLogger(request)

  // Valider les paramètres de requête
  const validation = validateQueryParams(request, searchSchema)
  if (!validation.success) {
    log.warn('Invalid search parameters')
    return validation.response
  }

  const { q: query, page, limit, sortBy, sortOrder } = validation.data

  try {
    log.info('Searching products', { query, page, limit })

    // Mesurer le temps d'exécution de la recherche
    const { products, total } = await measureTime(
      'product-search',
      async () => {
        const skip = (page - 1) * limit

        // Construire la clause where
        const where = {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { description: { contains: query, mode: 'insensitive' as const } },
          ],
          status: 'ACTIVE' as const,
        }

        // Construire la clause orderBy
        const orderBy = sortBy
          ? { [sortBy]: sortOrder }
          : { createdAt: 'desc' as const }

        const [products, total] = await Promise.all([
          prisma.product.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              images: true,
              status: true,
              createdAt: true,
            },
          }),
          prisma.product.count({ where }),
        ])

        return { products, total }
      },
      { query, page, limit }
    )

    log.info('Search completed', {
      query,
      resultsCount: products.length,
      totalResults: total,
    })

    // Retourner une réponse standardisée avec métadonnées
    return apiSuccess(products, {
      page,
      limit,
      total,
      hasMore: (page - 1) * limit + products.length < total,
    })
  } catch (error) {
    // Logger l'erreur avec contexte
    log.error('Product search failed', error, {
      query,
      page,
      limit,
    })

    // Retourner une erreur standardisée
    return apiError(
      'Failed to search products',
      ErrorCodes.DATABASE_ERROR,
      500
    )
  }
}
```

---

## Comparaison des Améliorations

### 1. **Validation des Entrées**

**Avant**:
```typescript
const query = searchParams.get('q')
const page = parseInt(searchParams.get('page') || '1')
// ❌ Pas de validation de type
// ❌ Pas de validation de format
// ❌ Erreurs manuelles
```

**Après**:
```typescript
const validation = validateQueryParams(request, searchSchema)
if (!validation.success) return validation.response
// ✅ Validation automatique avec Zod
// ✅ Types garantis
// ✅ Erreurs standardisées
```

---

### 2. **Logging**

**Avant**:
```typescript
console.log('Searching products:', query)
console.error('Search error:', error)
// ❌ Logs non structurés
// ❌ Pas de contexte
// ❌ Pas de niveaux de log
```

**Après**:
```typescript
log.info('Searching products', { query, page, limit })
log.error('Product search failed', error, { query, page, limit })
// ✅ Logs structurés
// ✅ Contexte automatique (IP, user-agent, path)
// ✅ Niveaux de log appropriés
// ✅ Intégration Sentry en production
```

---

### 3. **Réponses API**

**Avant**:
```typescript
return NextResponse.json({
  products,
  pagination: { page, limit, total, hasMore }
})
// ❌ Format inconsistant
// ❌ Pas de champ success
// ❌ Erreurs non standardisées
```

**Après**:
```typescript
return apiSuccess(products, {
  page, limit, total, hasMore
})
// ✅ Format standardisé
// ✅ Champ success: true
// ✅ Structure cohérente
```

---

### 4. **Gestion d'Erreurs**

**Avant**:
```typescript
catch (error: any) {
  console.error('Search error:', error)
  return NextResponse.json(
    { error: 'Failed to search products' },
    { status: 500 }
  )
}
// ❌ Type any
// ❌ Pas de code d'erreur
// ❌ Pas de contexte
```

**Après**:
```typescript
catch (error) {
  log.error('Product search failed', error, { query, page, limit })
  return apiError(
    'Failed to search products',
    ErrorCodes.DATABASE_ERROR,
    500
  )
}
// ✅ Type safe
// ✅ Code d'erreur standardisé
// ✅ Contexte complet
// ✅ Tracking automatique
```

---

### 5. **Performance Monitoring**

**Avant**:
```typescript
// ❌ Pas de mesure de performance
const products = await prisma.product.findMany(...)
```

**Après**:
```typescript
// ✅ Mesure automatique du temps d'exécution
const { products, total } = await measureTime(
  'product-search',
  async () => { /* ... */ },
  { query, page, limit }
)
```

---

## Résultats de la Migration

### Avant
```json
// Succès
{
  "products": [...],
  "pagination": { "page": 1, "limit": 10, "total": 100 }
}

// Erreur
{
  "error": "Failed to search products"
}
```

### Après
```json
// Succès
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "hasMore": true
  }
}

// Erreur
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to search products"
  }
}
```

---

## Logs Générés

### Avant
```
Searching products: laptop
Found products: 10
```

### Après
```json
[2024-01-15T10:30:00.000Z] [INFO ] Searching products
{
  "query": "laptop",
  "page": 1,
  "limit": 10,
  "method": "GET",
  "path": "/api/products/search",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}

[2024-01-15T10:30:00.150Z] [DEBUG] product-search completed
{
  "duration": 150,
  "operation": "product-search",
  "query": "laptop",
  "page": 1,
  "limit": 10
}

[2024-01-15T10:30:00.151Z] [INFO ] Search completed
{
  "query": "laptop",
  "resultsCount": 10,
  "totalResults": 45
}
```

---

## Bénéfices Mesurables

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| Type Safety | ❌ any types | ✅ Fully typed | +100% |
| Error Context | ❌ None | ✅ Full context | +100% |
| Log Structure | ❌ Unstructured | ✅ JSON structured | +100% |
| Validation | ❌ Manual | ✅ Automatic | +100% |
| Response Format | ❌ Inconsistent | ✅ Standardized | +100% |
| Performance Tracking | ❌ None | ✅ Automatic | +100% |
| Error Tracking | ❌ None | ✅ Sentry ready | +100% |

---

## Checklist de Migration

Pour chaque route API:

- [ ] Remplacer `process.env` par `import { env } from '@/lib/env'`
- [ ] Ajouter `createApiLogger(request)` pour le logging
- [ ] Créer un schéma Zod pour la validation
- [ ] Utiliser `validateRequest()` ou `validateQueryParams()`
- [ ] Remplacer `NextResponse.json()` par `apiSuccess()` ou `apiError()`
- [ ] Utiliser `ErrorCodes` pour les erreurs
- [ ] Remplacer `console.*` par `log.*`
- [ ] Ajouter `measureTime()` pour les opérations critiques
- [ ] Tester la route avec les nouveaux formats

---

## Prochaines Routes à Migrer

### Priorité Haute (Utilisées fréquemment)
1. ✅ `/api/products/search` - Exemple ci-dessus
2. ⏳ `/api/auth/login` - Authentification
3. ⏳ `/api/auth/register` - Inscription
4. ⏳ `/api/checkout/initialize-payment` - Paiement
5. ⏳ `/api/cart/*` - Panier

### Priorité Moyenne
6. ⏳ `/api/products/*` - CRUD produits
7. ⏳ `/api/orders/*` - Gestion commandes
8. ⏳ `/api/user/*` - Profil utilisateur

### Priorité Basse
9. ⏳ `/api/admin/*` - Administration
10. ⏳ `/api/newsletter/*` - Newsletter

---

## Script de Migration Automatique

```bash
#!/bin/bash
# migration-helper.sh

echo "🔍 Recherche des fichiers à migrer..."

# Trouver tous les fichiers API
find src/app/api -name "route.ts" | while read file; do
  echo "📄 Analyse: $file"
  
  # Vérifier si le fichier utilise process.env
  if grep -q "process\.env\." "$file"; then
    echo "  ⚠️  Utilise process.env"
  fi
  
  # Vérifier si le fichier utilise console.*
  if grep -q "console\.\(log\|error\|warn\)" "$file"; then
    echo "  ⚠️  Utilise console.*"
  fi
  
  # Vérifier si le fichier utilise NextResponse.json directement
  if grep -q "NextResponse\.json" "$file"; then
    echo "  ⚠️  Utilise NextResponse.json directement"
  fi
done

echo "✅ Analyse terminée"
```

---

**Note**: Cette migration peut être faite progressivement, route par route, sans casser le code existant.
