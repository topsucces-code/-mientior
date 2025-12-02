# MeiliSearch Synonym Management for Mientior

## 📖 Introduction

This document describes the synonym management system for Mientior's MeiliSearch-powered search. Synonyms improve search relevance by matching related terms (e.g., "téléphone" finds "smartphone" products).

### What are Synonyms?

Synonyms are groups of words that should return the same search results. When a user searches for one term, MeiliSearch automatically includes results for all related terms.

**Example:**
- User searches: "téléphone"
- MeiliSearch also searches: "smartphone", "mobile", "portable"
- Result: User finds all phone products regardless of terminology

### Why Synonyms Matter for E-commerce

1. **Language Variations**: French users may use "ordinateur" or "laptop"
2. **Brand Terms**: "frigo" vs "réfrigérateur"
3. **Colloquialisms**: "fringues" vs "vêtements"
4. **Abbreviations**: "tv" vs "télévision"
5. **Regional Differences**: "cellulaire" (Quebec) vs "portable" (France)

## 🏗️ Architecture

### Components

1. **`synonyms.json`**: Source of truth for runtime-managed synonyms
2. **`meilisearch.config.json`**: Default synonyms (version-controlled)
3. **`synonyms-manager.ts`**: Service layer for CRUD operations
4. **`/api/admin/search/synonyms`**: REST API for admin UI
5. **`/admin/search/synonyms`**: Admin UI for managing synonyms
6. **`init-meilisearch.ts`**: Merges and applies synonyms on startup

### Data Flow

```
Admin UI → API → synonyms-manager.ts → synonyms.json → MeiliSearch
                                      ↓
                              init-meilisearch.ts (on startup)
                                      ↓
                              meilisearch.config.json (defaults)
```

### Merge Strategy

- **Priority**: `synonyms.json` > `meilisearch.config.json`
- **Behavior**: Admin changes override defaults
- **Fallback**: If `synonyms.json` missing/invalid, use config only

## 🚀 Usage

### Admin UI (Recommended)

1. Navigate to **Settings → Search Synonyms** in admin panel
2. Click **"Add Synonym"** button
3. Enter synonym key (e.g., "téléphone")
4. Add related terms (e.g., "smartphone", "mobile", "portable")
5. Click **"Save"**
6. Synonyms are immediately applied to MeiliSearch

**Editing:**
- Click edit icon (✏️) next to synonym
- Modify terms (key is read-only)
- Save changes

**Deleting:**
- Click delete icon (🗑️) next to synonym
- Confirm deletion
- Synonym removed from MeiliSearch

### API (Programmatic)

**Get all synonyms:**
```bash
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:3000/api/admin/search/synonyms
```

**Add synonym:**
```bash
curl -X POST \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"key":"téléphone","terms":["smartphone","mobile"]}' \
  http://localhost:3000/api/admin/search/synonyms
```

**Update synonym:**
```bash
curl -X PUT \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"terms":["smartphone","mobile","portable"]}' \
  http://localhost:3000/api/admin/search/synonyms/téléphone
```

**Delete synonym:**
```bash
curl -X DELETE \
  -H "Authorization: Bearer <admin_token>" \
  http://localhost:3000/api/admin/search/synonyms/téléphone
```

### CLI Scripts

**Test synonyms:**
```bash
npm run synonyms:test
```

**Manually sync to MeiliSearch:**
```bash
npm run synonyms:sync
```

## 📋 Synonym Guidelines

### Best Practices

1. **Keep groups focused**: 3-5 terms per group (max 20)
2. **Use lowercase**: All terms should be lowercase
3. **Avoid duplicates**: Each term should appear in only one group
4. **Test thoroughly**: Verify synonyms work with real searches
5. **Document reasoning**: Add comments in `synonyms.json` for complex groups

### Common Synonym Types

**1. Language Variations:**
```json
{
  "ordinateur": ["laptop", "pc", "computer", "portable"]
}
```

**2. Brand/Generic Terms:**
```json
{
  "réfrigérateur": ["frigo", "frigidaire"]
}
```

**3. Abbreviations:**
```json
{
  "télévision": ["tv", "télé", "écran"]
}
```

**4. Colloquialisms:**
```json
{
  "vêtements": ["habits", "fringues", "tenues"]
}
```

**5. Regional Differences:**
```json
{
  "téléphone": ["smartphone", "mobile", "portable", "cellulaire"]
}
```

### What NOT to Include

❌ **Misspellings**: Use typo tolerance instead
❌ **Unrelated terms**: "chaussures" ≠ "vêtements"
❌ **Stop words**: "le", "la", "les" (handled separately)
❌ **Singular/plural**: MeiliSearch handles this automatically

## 🔧 Configuration

### File Format (`synonyms.json`)

```json
{
  "synonyms": {
    "key1": ["term1", "term2", "term3"],
    "key2": ["term4", "term5"]
  },
  "version": "1.0.0",
  "lastUpdated": "2025-11-30T12:00:00.000Z"
}
```

### Validation Rules

**Key:**
- Format: Lowercase alphanumeric + spaces/hyphens
- Length: 1-50 characters
- Regex: `/^[a-zà-ÿ0-9\s-]+$/`
- Unique: No duplicate keys

**Terms:**
- Count: 2-20 terms per group
- Length: 1-50 characters each
- Format: Lowercase
- Unique: No duplicates within group

### Permissions

**Required Permission:** `SEARCH_MANAGE`

**Default Access:**
- ✅ SUPER_ADMIN
- ✅ ADMIN
- ❌ MANAGER
- ❌ SUPPORT
- ❌ VIEWER

## 🧪 Testing

### Automated Tests

Run the test suite:
```bash
npm run synonyms:test
```

**What it tests:**
- MeiliSearch availability
- Synonym loading from file
- Search result overlap for each synonym group
- Specific test cases (téléphone → smartphone, etc.)

**Expected output:**
```
✅ Synonym working: 12 overlapping results
```

### Manual Testing

1. **Add a synonym** via admin UI
2. **Search for the key** (e.g., "téléphone")
3. **Search for a term** (e.g., "smartphone")
4. **Verify overlap**: Both searches should return similar products

### Troubleshooting

**Problem:** Synonyms not working

**Solutions:**
1. Check MeiliSearch is running: `npm run meilisearch:status`
2. Verify synonyms applied: Check MeiliSearch dashboard → Settings → Synonyms
3. Reindex products: `npm run search:reindex`
4. Check logs for errors: `npm run meilisearch:logs`

**Problem:** Synonym key already exists

**Solution:** Use a different key or update the existing synonym

**Problem:** Changes not reflected in search

**Solutions:**
1. Wait 5 seconds (cache TTL)
2. Manually sync: `npm run synonyms:sync`
3. Restart MeiliSearch: `docker compose restart meilisearch`

## 📊 Monitoring

### Metrics to Track

1. **Synonym usage**: Which synonyms are searched most
2. **Search improvement**: CTR before/after adding synonyms
3. **Zero-result reduction**: Fewer searches with no results

### Analytics Integration

Synonym searches are logged in `SearchLog` table:
- Query: Original search term
- Result count: Number of results found
- Execution time: Search performance

Use `/api/admin/search/analytics` to analyze synonym effectiveness.

## 🔐 Security

### Access Control

- **Authentication**: Admin session required
- **Authorization**: `SEARCH_MANAGE` permission enforced
- **Audit logging**: All changes logged to audit trail
- **Rate limiting**: API endpoints rate-limited

### Input Validation

- **Zod schemas**: Validate all inputs
- **Regex patterns**: Prevent injection attacks
- **Length limits**: Prevent DoS via large payloads
- **Sanitization**: Lowercase and trim all inputs

## 📚 References

- [MeiliSearch Synonyms Documentation](https://www.meilisearch.com/docs/learn/configuration/synonyms)
- [French Language Support](https://www.meilisearch.com/docs/learn/what_is_meilisearch/language)
- [Search Relevancy](https://www.meilisearch.com/docs/learn/core_concepts/relevancy)

---

**Version:** 1.0.0
**Last Updated:** 2025-11-30
**Author:** Équipe Mientior
