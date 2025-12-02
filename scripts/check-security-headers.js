#!/usr/bin/env node

/**
 * Security Headers Checker
 * 
 * Checks if all required security headers are present
 * Run with: npm run security:headers
 */

import https from 'https'
import http from 'http'

const TARGET_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const REQUIRED_HEADERS = {
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'x-xss-protection': '1; mode=block',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': /camera=\(\)/,
  'content-security-policy': /default-src 'self'/,
}

const PRODUCTION_HEADERS = {
  'strict-transport-security': /max-age=\d+/,
}

function checkHeaders(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http

    protocol.get(url, (res) => {
      const headers = {}
      for (const [key, value] of Object.entries(res.headers)) {
        headers[key.toLowerCase()] = value
      }
      resolve(headers)
    }).on('error', reject)
  })
}

async function main() {
  console.log('🔒 Checking Security Headers...\n')
  console.log(`Target: ${TARGET_URL}\n`)

  try {
    const headers = await checkHeaders(TARGET_URL)
    
    let passed = 0
    let failed = 0
    let warnings = 0

    // Check required headers
    console.log('📋 Required Headers:')
    for (const [headerName, expectedValue] of Object.entries(REQUIRED_HEADERS)) {
      const actualValue = headers[headerName]

      if (!actualValue) {
        console.log(`  ❌ ${headerName}: MISSING`)
        failed++
      } else if (expectedValue instanceof RegExp) {
        if (expectedValue.test(actualValue)) {
          console.log(`  ✅ ${headerName}: ${actualValue}`)
          passed++
        } else {
          console.log(`  ❌ ${headerName}: ${actualValue} (expected pattern: ${expectedValue})`)
          failed++
        }
      } else if (actualValue === expectedValue) {
        console.log(`  ✅ ${headerName}: ${actualValue}`)
        passed++
      } else {
        console.log(`  ❌ ${headerName}: ${actualValue} (expected: ${expectedValue})`)
        failed++
      }
    }

    // Check production-only headers
    if (process.env.NODE_ENV === 'production') {
      console.log('\n📋 Production Headers:')
      for (const [headerName, expectedValue] of Object.entries(PRODUCTION_HEADERS)) {
        const actualValue = headers[headerName]

        if (!actualValue) {
          console.log(`  ❌ ${headerName}: MISSING`)
          failed++
        } else if (expectedValue instanceof RegExp) {
          if (expectedValue.test(actualValue)) {
            console.log(`  ✅ ${headerName}: ${actualValue}`)
            passed++
          } else {
            console.log(`  ❌ ${headerName}: ${actualValue}`)
            failed++
          }
        }
      }
    } else {
      console.log('\n⚠️  Production headers not checked (NODE_ENV !== production)')
      warnings++
    }

    // Check for unwanted headers
    console.log('\n📋 Unwanted Headers:')
    const unwantedHeaders = ['x-powered-by', 'server']
    for (const headerName of unwantedHeaders) {
      if (headers[headerName]) {
        console.log(`  ⚠️  ${headerName}: ${headers[headerName]} (should be removed)`)
        warnings++
      } else {
        console.log(`  ✅ ${headerName}: not present`)
        passed++
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50))
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⚠️  Warnings: ${warnings}`)
    console.log('='.repeat(50))

    if (failed > 0) {
      console.log('\n❌ Security headers check FAILED')
      process.exit(1)
    } else if (warnings > 0) {
      console.log('\n⚠️  Security headers check PASSED with warnings')
      process.exit(0)
    } else {
      console.log('\n✅ Security headers check PASSED')
      process.exit(0)
    }
  } catch (error) {
    console.error('❌ Error checking headers:', error.message)
    process.exit(1)
  }
}

main()
