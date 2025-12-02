/**
 * TRIGRAM SEARCH MAINTENANCE SCRIPT
 *
 * Utilities for managing and optimizing pg_trgm fuzzy search indexes
 *
 * Commands:
 * - status: Check extension and index status
 * - test: Test similarity queries with sample data
 * - analyze: Analyze query performance with EXPLAIN
 * - optimize: Rebuild indexes and update statistics
 * - clear-cache: Clear Redis suggestion cache
 * - benchmark: Test different similarity thresholds
 *
 * Usage:
 *   tsx scripts/maintain-trigram-search.ts <command>
 */

import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

// ================================================================
// TYPES
// ================================================================

interface IndexInfo {
  indexname: string;
  tablename: string;
  size: string;
}

interface SimilarityTestResult {
  name: string;
  score: number;
  matchedQuery: string;
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color?: keyof typeof colors) {
  const colorCode = color ? colors[color] : '';
  console.log(`${colorCode}${message}${colors.reset}`);
}

function header(message: string) {
  log('\n' + '='.repeat(60), 'cyan');
  log(message, 'bright');
  log('='.repeat(60), 'cyan');
}

function success(message: string) {
  log(`✓ ${message}`, 'green');
}

function error(message: string) {
  log(`✗ ${message}`, 'red');
}

function info(message: string) {
  log(`ℹ ${message}`, 'blue');
}

function warning(message: string) {
  log(`⚠ ${message}`, 'yellow');
}

// ================================================================
// MAINTENANCE CLASS
// ================================================================

class TrigramSearchMaintenance {
  /**
   * Check status of pg_trgm extension and indexes
   */
  static async getStatus(): Promise<void> {
    header('TRIGRAM SEARCH STATUS');

    try {
      // Check if pg_trgm extension is enabled
      const extensionCheck = await prisma.$queryRaw<
        Array<{ extname: string; extversion: string }>
      >`
        SELECT extname, extversion
        FROM pg_extension
        WHERE extname = 'pg_trgm'
      `;

      if (extensionCheck.length === 0) {
        error('pg_trgm extension is NOT enabled');
        warning('Run: bash scripts/apply-trigram-search-migration.sh');
        return;
      }

      success(`pg_trgm extension v${extensionCheck[0].extversion} is active`);

      // List all trigram indexes with sizes
      const indexes = await prisma.$queryRaw<IndexInfo[]>`
        SELECT
          indexname,
          tablename,
          pg_size_pretty(pg_relation_size(indexrelid)) as size
        FROM pg_stat_user_indexes
        WHERE indexname LIKE '%_trgm%'
        ORDER BY indexname
      `;

      log('\n📊 Trigram Indexes:', 'bright');
      if (indexes.length === 0) {
        warning('No trigram indexes found');
        warning('Run: bash scripts/apply-trigram-search-migration.sh');
      } else {
        indexes.forEach((idx) => {
          log(`  • ${idx.indexname} (${idx.tablename}) - ${idx.size}`, 'cyan');
        });
        success(`Found ${indexes.length} trigram indexes`);
      }

      // Count indexed records
      const productCount = await prisma.product.count();
      const categoryCount = await prisma.category.count();
      const tagCount = await prisma.tag.count();

      log('\n📈 Indexed Records:', 'bright');
      log(`  • Products: ${productCount}`, 'cyan');
      log(`  • Categories: ${categoryCount}`, 'cyan');
      log(`  • Tags: ${tagCount}`, 'cyan');

      // Check current similarity thresholds
      const thresholdConfig = await prisma.$queryRaw<
        Array<{ name: string; setting: string }>
      >`
        SELECT name, setting
        FROM pg_settings
        WHERE name LIKE 'pg_trgm.%'
      `;

      if (thresholdConfig.length > 0) {
        log('\n⚙️  Current Thresholds:', 'bright');
        thresholdConfig.forEach((config) => {
          log(`  • ${config.name}: ${config.setting}`, 'cyan');
        });
      }

      success('\nStatus check complete');
    } catch (err) {
      error(`Status check failed: ${err}`);
      throw err;
    }
  }

  /**
   * Test similarity queries with sample data
   */
  static async testSimilarity(): Promise<void> {
    header('TESTING SIMILARITY QUERIES');

    const testQueries = [
      { query: 'smartphon', description: 'Typo: smartphone' },
      { query: 'téléfone', description: 'Accent: téléphone' },
      { query: 'chausure', description: 'Typo: chaussure' },
      { query: 'portable gaming', description: 'Multi-word query' },
    ];

    const thresholds = [0.1, 0.3, 0.5];

    for (const { query, description } of testQueries) {
      log(`\n🔍 Testing: "${query}" (${description})`, 'bright');

      for (const threshold of thresholds) {
        const startTime = Date.now();

        try {
          const results = await prisma.$queryRaw<SimilarityTestResult[]>`
            SELECT
              name,
              GREATEST(
                similarity(name, ${query}),
                word_similarity(${query}, name)
              ) as score,
              ${query} as "matchedQuery"
            FROM "Product"
            WHERE
              similarity(name, ${query}) > ${threshold}
              OR word_similarity(${query}, name) > ${threshold}
            ORDER BY score DESC
            LIMIT 5
          `;

          const duration = Date.now() - startTime;

          log(`  Threshold ${threshold}:`, 'yellow');
          if (results.length === 0) {
            warning(`    No results (${duration}ms)`);
          } else {
            results.forEach((result, index) => {
              log(
                `    ${index + 1}. ${result.name} (score: ${Number(result.score).toFixed(3)})`,
                'cyan'
              );
            });
            success(`    Found ${results.length} results in ${duration}ms`);
          }
        } catch (err) {
          error(`    Query failed: ${err}`);
        }
      }
    }

    // Compare with contains search
    log('\n📊 Comparing with CONTAINS search:', 'bright');
    const compareQuery = 'smartphon';

    const startContains = Date.now();
    const containsResults = await prisma.product.findMany({
      where: {
        name: {
          contains: compareQuery,
          mode: 'insensitive',
        },
      },
      select: { name: true },
      take: 5,
    });
    const durationContains = Date.now() - startContains;

    const startTrigram = Date.now();
    const trigramResults = await prisma.$queryRaw<SimilarityTestResult[]>`
      SELECT name, similarity(name, ${compareQuery}) as score
      FROM "Product"
      WHERE similarity(name, ${compareQuery}) > 0.3
      ORDER BY score DESC
      LIMIT 5
    `;
    const durationTrigram = Date.now() - startTrigram;

    log(`  CONTAINS: ${containsResults.length} results in ${durationContains}ms`, 'yellow');
    log(`  TRIGRAM: ${trigramResults.length} results in ${durationTrigram}ms`, 'yellow');

    if (trigramResults.length > containsResults.length) {
      success('  Trigram search found more results (better recall)');
    }

    success('\nSimilarity test complete');
  }

  /**
   * Analyze query performance with EXPLAIN
   */
  static async analyzePerformance(): Promise<void> {
    header('ANALYZING QUERY PERFORMANCE');

    const testQuery = 'smartphone';
    const threshold = 0.3;

    log('\n📊 Query Plan for Similarity Search:', 'bright');

    try {
      // Run EXPLAIN ANALYZE
      const plan = await prisma.$queryRawUnsafe<Array<{ 'QUERY PLAN': string }>>(
        `
        EXPLAIN ANALYZE
        SELECT name, similarity(name, $1) as score
        FROM "Product"
        WHERE similarity(name, $1) > $2
        ORDER BY score DESC
        LIMIT 10
        `,
        testQuery,
        threshold
      );

      plan.forEach((row) => {
        log(`  ${row['QUERY PLAN']}`, 'cyan');
      });

      // Check if index is being used
      const planText = plan.map((p) => p['QUERY PLAN']).join(' ');
      if (planText.includes('Index Scan') || planText.includes('Bitmap Index Scan')) {
        success('\n✓ Trigram index is being used');
      } else {
        warning('\n⚠ Trigram index may not be used (check query plan)');
      }
    } catch (err) {
      error(`Performance analysis failed: ${err}`);
      throw err;
    }

    success('\nPerformance analysis complete');
  }

  /**
   * Optimize indexes and update statistics
   */
  static async optimizeIndexes(): Promise<void> {
    header('OPTIMIZING TRIGRAM INDEXES');

    const tables = ['Product', 'Category', 'Tag'];

    try {
      for (const table of tables) {
        log(`\n🔧 Optimizing ${table} table...`, 'bright');

        // Run VACUUM ANALYZE
        info(`  Running VACUUM ANALYZE on "${table}"...`);
        await prisma.$executeRawUnsafe(`VACUUM ANALYZE "${table}"`);
        success(`  ✓ VACUUM ANALYZE complete`);

        // Note: REINDEX CONCURRENTLY requires separate transactions
        // and may not work with Prisma transactions
        info(`  Note: To rebuild indexes, run manually:`);
        log(`    REINDEX TABLE CONCURRENTLY "${table}"`, 'yellow');
      }

      success('\nOptimization complete');
      warning('For full index rebuild, run REINDEX manually in psql');
    } catch (err) {
      error(`Optimization failed: ${err}`);
      throw err;
    }
  }

  /**
   * Clear Redis suggestion cache
   */
  static async clearCache(): Promise<void> {
    header('CLEARING SUGGESTION CACHE');

    try {
      const cachePattern = 'search:suggestions:*';
      info(`Looking for keys matching: ${cachePattern}`);

      // Get all keys matching the pattern
      const keys = await redis.keys(cachePattern);

      if (keys.length === 0) {
        warning('No cache keys found');
        return;
      }

      log(`\nFound ${keys.length} cache keys`, 'yellow');

      // Delete all keys
      const deleteCount = await redis.del(...keys);

      success(`\n✓ Cleared ${deleteCount} cache entries`);
    } catch (err) {
      error(`Cache clear failed: ${err}`);
      throw err;
    }
  }

  /**
   * Benchmark different similarity thresholds
   */
  static async benchmarkThresholds(): Promise<void> {
    header('BENCHMARKING SIMILARITY THRESHOLDS');

    const testQuery = 'smartphon';
    const thresholds = [0.1, 0.2, 0.3, 0.4, 0.5];

    log('\n📊 Testing query: "smartphon" (intentional typo)', 'bright');
    log('\nThreshold | Results | Avg Score | Time (ms)', 'cyan');
    log('-'.repeat(50), 'cyan');

    for (const threshold of thresholds) {
      const startTime = Date.now();

      try {
        const results = await prisma.$queryRaw<SimilarityTestResult[]>`
          SELECT
            name,
            similarity(name, ${testQuery}) as score
          FROM "Product"
          WHERE similarity(name, ${testQuery}) > ${threshold}
          ORDER BY score DESC
          LIMIT 20
        `;

        const duration = Date.now() - startTime;
        const avgScore =
          results.length > 0
            ? results.reduce((sum, r) => sum + Number(r.score), 0) / results.length
            : 0;

        const resultCount = results.length.toString().padEnd(7);
        const avgScoreStr = avgScore.toFixed(3).padEnd(9);
        const durationStr = duration.toString().padStart(8);

        log(
          `${threshold.toFixed(1)}       | ${resultCount} | ${avgScoreStr} | ${durationStr}`,
          'yellow'
        );
      } catch (err) {
        error(`  Threshold ${threshold} failed: ${err}`);
      }
    }

    log('\n💡 Recommendations:', 'bright');
    log('  • 0.3: Good balance for autocomplete (default)', 'cyan');
    log('  • 0.2: More permissive, catches more typos', 'cyan');
    log('  • 0.4: Stricter, fewer false positives', 'cyan');

    success('\nBenchmark complete');
  }
}

// ================================================================
// CLI INTERFACE
// ================================================================

async function main() {
  const command = process.argv[2];

  if (!command) {
    log('\n📚 Trigram Search Maintenance Tool\n', 'bright');
    log('Usage: tsx scripts/maintain-trigram-search.ts <command>\n');
    log('Available commands:', 'cyan');
    log('  status      - Check extension and index status', 'yellow');
    log('  test        - Test similarity queries', 'yellow');
    log('  analyze     - Analyze query performance', 'yellow');
    log('  optimize    - Rebuild indexes and update statistics', 'yellow');
    log('  clear-cache - Clear Redis suggestion cache', 'yellow');
    log('  benchmark   - Test different similarity thresholds', 'yellow');
    log('\nExamples:', 'cyan');
    log('  npm run db:trigram-search:status', 'green');
    log('  npm run db:trigram-search:test', 'green');
    log('  npm run db:trigram-search:benchmark\n', 'green');
    process.exit(0);
  }

  try {
    switch (command) {
      case 'status':
        await TrigramSearchMaintenance.getStatus();
        break;
      case 'test':
        await TrigramSearchMaintenance.testSimilarity();
        break;
      case 'analyze':
        await TrigramSearchMaintenance.analyzePerformance();
        break;
      case 'optimize':
        await TrigramSearchMaintenance.optimizeIndexes();
        break;
      case 'clear-cache':
        await TrigramSearchMaintenance.clearCache();
        break;
      case 'benchmark':
        await TrigramSearchMaintenance.benchmarkThresholds();
        break;
      default:
        error(`Unknown command: ${command}`);
        log('Run without arguments to see available commands\n');
        process.exit(1);
    }
  } catch (err) {
    error(`\nCommand failed: ${err}`);
    process.exit(1);
  } finally {
    // Cleanup connections
    await prisma.$disconnect();
    await redis.quit();
  }
}

// Run the CLI
main();
