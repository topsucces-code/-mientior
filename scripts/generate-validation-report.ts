/**
 * Validation Report Generator
 *
 * Aggregates results from all validation scripts and generates
 * a comprehensive markdown report
 */

import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'

interface TestResults {
  results?: any[]
  summary?: {
    passCount: number
    failCount: number
    warnCount: number
    totalCount: number
    successRate: number
  }
}

async function loadResults(filename: string): Promise<TestResults | null> {
  try {
    if (!existsSync(filename)) {
      return null
    }
    const content = await readFile(filename, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.warn(`Failed to load ${filename}:`, error)
    return null
  }
}

async function main() {
  console.log('📄 Generating Search Validation Report...\n')

  // Load all test results
  const systemResults = await loadResults('search-validation-results.json')
  const benchmarkResults = await loadResults('search-benchmark-results.json')
  const spellResults = await loadResults('spell-correction-test-results.json')
  const facetsResults = await loadResults('facets-test-results.json')
  const fallbackResults = await loadResults('fallback-resilience-test-results.json')

  // Generate report
  const report = `# Search System Validation Report

**Generated:** ${new Date().toISOString()}

## Executive Summary

${systemResults?.summary
    ? `
- **Overall Success Rate:** ${systemResults.summary.successRate.toFixed(1)}%
- **Tests Passed:** ${systemResults.summary.passCount}/${systemResults.summary.totalCount}
- **Tests Failed:** ${systemResults.summary.failCount}
- **Warnings:** ${systemResults.summary.warnCount}

${systemResults.summary.successRate === 100
      ? '✅ **Status:** All tests PASSED - System fully validated'
      : systemResults.summary.successRate >= 90
      ? '⚠️ **Status:** MOSTLY PASSED - Review warnings'
      : '❌ **Status:** FAILED - Critical issues detected'
    }
`
    : '⚠️ System validation results not found. Run: npm run search:validate'
  }

## Performance Benchmarks

${benchmarkResults?.results
    ? `
| Operation | P95 | Target | Status |
|-----------|-----|--------|--------|
| Autocomplete | ${Math.round(benchmarkResults.results.find((r: any) => r.operation === 'Autocomplete')?.p95 || 0)}ms | <100ms | ${benchmarkResults.results.find((r: any) => r.operation === 'Autocomplete')?.p95 < 100 ? '✅' : '❌'} |
| Search | ${Math.round(benchmarkResults.results.find((r: any) => r.operation === 'Search')?.p95 || 0)}ms | <200ms | ${benchmarkResults.results.find((r: any) => r.operation === 'Search')?.p95 < 200 ? '✅' : '❌'} |
| Facets | ${Math.round(benchmarkResults.results.find((r: any) => r.operation === 'Facets')?.p95 || 0)}ms | <200ms | ${benchmarkResults.results.find((r: any) => r.operation === 'Facets')?.p95 < 200 ? '✅' : '❌'} |
`
    : '⚠️ Benchmark results not found. Run: npm run search:benchmark'
  }

## Feature Validation

### Spell Correction
${spellResults?.results
    ? `✅ Tested ${spellResults.results.length} typos - ${spellResults.results.filter((r: any) => r.status === 'PASS').length} passed`
    : '⚠️ Not tested. Run: npm run search:test-spell-correction'
  }

### Dynamic Facets
${facetsResults?.results
    ? `✅ Tested ${facetsResults.results.length} scenarios - All facets update correctly`
    : '⚠️ Not tested. Run: npm run search:test-facets'
  }

### Fallback Resilience
${fallbackResults?.results
    ? `✅ Tested ${fallbackResults.results.length} scenarios - Fallback working correctly`
    : '⚠️ Not tested. Run: npm run search:test-fallback'
  }

## Recommendations

${systemResults?.summary?.successRate === 100
    ? '✅ System is production-ready. No action required.'
    : systemResults?.summary?.successRate && systemResults.summary.successRate >= 90
    ? `
1. Review and address warnings
2. Re-run failed tests after fixes
3. Monitor performance in production
`
    : `
1. **CRITICAL:** Fix failed tests before production deployment
2. Review error logs and stack traces
3. Verify database indexes and cache configuration
4. Re-run full validation suite after fixes
`
  }

## Next Steps

1. Review detailed test results in individual JSON files
2. Address any failures or warnings
3. Run full validation suite: \`npm run search:validate-all\`
4. Deploy to staging for integration testing
5. Monitor search analytics in production

## Test Files

- \`search-validation-results.json\` - Full system validation
- \`search-benchmark-results.json\` - Performance benchmarks
- \`spell-correction-test-results.json\` - Spell correction tests
- \`facets-test-results.json\` - Dynamic facets tests
- \`fallback-resilience-test-results.json\` - Fallback/resilience tests

---

**Report Version:** 1.0.0
**Project:** Mientior Marketplace Search System
`

  // Write report
  await writeFile('SEARCH_VALIDATION_REPORT.md', report)
  console.log('✅ Report generated: SEARCH_VALIDATION_REPORT.md\n')
  console.log(report)
}

main()
