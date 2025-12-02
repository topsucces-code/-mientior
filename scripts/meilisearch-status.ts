import 'dotenv/config'
import {
  meilisearchClient,
  isAvailable,
  getStats,
  getIndex,
  getConfig,
  ENABLE_MEILISEARCH,
} from '../src/lib/meilisearch-client'

/**
 * Check MeiliSearch status
 */
async function checkStatus(): Promise<void> {
  console.log('⚙️  MeiliSearch Configuration')
  console.log('=' .repeat(50))

  const config = getConfig()
  console.log(`URL: ${config.url}`)
  console.log(`Master Key: ${config.masterKey}`)
  console.log(`Index Prefix: ${config.indexPrefix}`)
  console.log(`Enabled: ${config.enabled ? '✅' : '❌'}`)

  if (!ENABLE_MEILISEARCH) {
    console.log('\n⚠️  MeiliSearch is disabled in configuration')
    console.log('Set ENABLE_MEILISEARCH=true in .env to enable')
  }

  console.log('\n📡 Checking availability...')

  const available = await isAvailable()

  if (!available) {
    console.log('❌ MeiliSearch is not available')
    console.log('\n💡 Troubleshooting:')
    console.log('  • Run: npm run meilisearch:start')
    console.log('  • Check Docker: docker compose ps meilisearch')
    console.log('  • View logs: npm run meilisearch:logs')
    process.exit(1)
  }

  console.log('✅ MeiliSearch is available')

  // Get version
  try {
    const version = await meilisearchClient.getVersion()
    console.log(`\n📦 Version: ${version.pkgVersion}`)
  } catch (error: any) {
    console.log(`\n⚠️  Could not retrieve version: ${error.message}`)
  }

  // List indexes
  console.log('\n📊 Indexes:')
  try {
    const indexes = await meilisearchClient.getIndexes()

    if (indexes.results.length === 0) {
      console.log('   No indexes found')
      console.log('\n💡 Run: npm run meilisearch:init')
    } else {
      for (const index of indexes.results) {
        const stats = await index.getStats()
        console.log(
          `   • ${index.uid}: ${stats.numberOfDocuments} documents${stats.isIndexing ? ' (indexing...)' : ''}`
        )
      }
    }
  } catch (error: any) {
    console.log(`   ⚠️  Could not list indexes: ${error.message}`)
  }

  // Check health
  console.log('\n💚 Health Check:')
  try {
    const health = await meilisearchClient.health()
    console.log(`   Status: ${health.status === 'available' ? '✅' : '❌'} ${health.status}`)
  } catch (error: any) {
    console.log(`   ❌ Health check failed: ${error.message}`)
  }

  console.log('\n✅ Status check complete')
}

/**
 * Show detailed statistics
 */
async function showStats(): Promise<void> {
  console.log('📊 MeiliSearch Statistics')
  console.log('=' .repeat(50))

  // Check availability
  const available = await isAvailable()
  if (!available) {
    console.log('❌ MeiliSearch is not available')
    process.exit(1)
  }

  // Global stats
  console.log('\n📈 Global Statistics:')
  try {
    const stats = await getStats()

    console.log(`   Database size: ${formatBytes(stats.databaseSize)}`)
    console.log(`   Last update: ${new Date(stats.lastUpdate).toLocaleString()}`)

    // Index stats
    console.log('\n📊 Index Statistics:')

    const indexNames = Object.keys(stats.indexes)
    if (indexNames.length === 0) {
      console.log('   No indexes found')
    } else {
      for (const indexName of indexNames) {
        const indexStats = stats.indexes[indexName]
        console.log(`\n   Index: ${indexName}`)
        console.log(`   └─ Documents: ${indexStats.numberOfDocuments}`)
        console.log(`   └─ Indexing: ${indexStats.isIndexing ? 'Yes' : 'No'}`)

        // Field distribution
        const fields = Object.entries(indexStats.fieldDistribution)
        if (fields.length > 0) {
          console.log('   └─ Field distribution:')
          const topFields = fields
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 10)

          for (const [field, count] of topFields) {
            console.log(`      • ${field}: ${count}`)
          }

          if (fields.length > 10) {
            console.log(`      ... and ${fields.length - 10} more fields`)
          }
        }
      }
    }
  } catch (error: any) {
    console.log(`   ❌ Error retrieving statistics: ${error.message}`)
  }

  // Detailed settings per index
  console.log('\n⚙️  Index Settings:')
  try {
    const indexes = await meilisearchClient.getIndexes()

    for (const index of indexes.results) {
      console.log(`\n   Index: ${index.uid}`)

      try {
        const settings = await index.getSettings()

        console.log(`   └─ Primary key: ${index.primaryKey}`)

        if (settings.searchableAttributes && settings.searchableAttributes.length > 0) {
          console.log(`   └─ Searchable attributes: ${settings.searchableAttributes.length}`)
          console.log(`      ${settings.searchableAttributes.slice(0, 5).join(', ')}${settings.searchableAttributes.length > 5 ? '...' : ''}`)
        }

        if (settings.filterableAttributes && settings.filterableAttributes.length > 0) {
          console.log(`   └─ Filterable attributes: ${settings.filterableAttributes.length}`)
        }

        if (settings.sortableAttributes && settings.sortableAttributes.length > 0) {
          console.log(`   └─ Sortable attributes: ${settings.sortableAttributes.length}`)
        }

        if (settings.rankingRules && settings.rankingRules.length > 0) {
          console.log(`   └─ Ranking rules: ${settings.rankingRules.length}`)
          for (const rule of settings.rankingRules) {
            console.log(`      • ${rule}`)
          }
        }

        if (settings.synonyms) {
          const synonymCount = Object.keys(settings.synonyms).length
          if (synonymCount > 0) {
            console.log(`   └─ Synonyms: ${synonymCount} entries`)
          }
        }

        if (settings.stopWords && settings.stopWords.length > 0) {
          console.log(`   └─ Stop words: ${settings.stopWords.length}`)
        }
      } catch (error: any) {
        console.log(`   ⚠️  Could not retrieve settings: ${error.message}`)
      }
    }
  } catch (error: any) {
    console.log(`   ❌ Error retrieving index settings: ${error.message}`)
  }

  console.log('\n✅ Statistics complete')
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

import { fileURLToPath } from 'url'

// CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const showStatsFlag = process.argv.includes('--stats')

  if (showStatsFlag) {
    showStats()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error('❌ Error:', err.message)
        process.exit(1)
      })
  } else {
    checkStatus()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error('❌ Error:', err.message)
        process.exit(1)
      })
  }
}

export { checkStatus, showStats }
