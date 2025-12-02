/**
 * Session Auto-Renewal Demo
 * 
 * This file demonstrates how the session auto-renewal logic works.
 * It's not meant to be run in production, but serves as documentation
 * and can be used for manual testing.
 */

import { prisma } from './prisma'
import { redis } from './redis'

/**
 * Demo: Create a session that's about to expire and show renewal
 */
export async function demoSessionRenewal() {
  console.log('=== Session Auto-Renewal Demo ===\n')

  // Create a test session that expires in 12 hours (within 24h window)
  const now = new Date()
  const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000)
  
  console.log('1. Creating test session...')
  console.log(`   Current time: ${now.toISOString()}`)
  console.log(`   Expires at: ${twelveHoursFromNow.toISOString()}`)
  console.log(`   Time until expiry: 12 hours\n`)

  // Simulate checking if renewal is needed
  const timeUntilExpiry = twelveHoursFromNow.getTime() - now.getTime()
  const twentyFourHoursInMs = 24 * 60 * 60 * 1000
  const shouldRenew = timeUntilExpiry > 0 && timeUntilExpiry <= twentyFourHoursInMs

  console.log('2. Checking renewal conditions...')
  console.log(`   Time until expiry: ${Math.round(timeUntilExpiry / (60 * 60 * 1000))} hours`)
  console.log(`   Within 24h window: ${shouldRenew}`)
  console.log(`   Should renew: ${shouldRenew}\n`)

  if (shouldRenew) {
    // Calculate new expiry (7 days from now)
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000
    const newExpiresAt = new Date(now.getTime() + sevenDaysInMs)

    console.log('3. Renewing session...')
    console.log(`   Old expiry: ${twelveHoursFromNow.toISOString()}`)
    console.log(`   New expiry: ${newExpiresAt.toISOString()}`)
    console.log(`   Extended by: 7 days\n`)
  }

  console.log('=== Demo Complete ===\n')
}

/**
 * Demo: Show different scenarios
 */
export function demoRenewalScenarios() {
  console.log('=== Session Renewal Scenarios ===\n')

  const now = new Date()
  const scenarios = [
    {
      name: 'Active session (5 days left)',
      expiresIn: 5 * 24 * 60 * 60 * 1000,
      shouldRenew: false,
      reason: 'More than 24 hours until expiry'
    },
    {
      name: 'Soon to expire (20 hours left)',
      expiresIn: 20 * 60 * 60 * 1000,
      shouldRenew: true,
      reason: 'Within 24 hours of expiry'
    },
    {
      name: 'Very soon to expire (2 hours left)',
      expiresIn: 2 * 60 * 60 * 1000,
      shouldRenew: true,
      reason: 'Within 24 hours of expiry'
    },
    {
      name: 'Already expired (1 hour ago)',
      expiresIn: -1 * 60 * 60 * 1000,
      shouldRenew: false,
      reason: 'Session already expired'
    },
    {
      name: 'Just created (7 days left)',
      expiresIn: 7 * 24 * 60 * 60 * 1000,
      shouldRenew: false,
      reason: 'More than 24 hours until expiry'
    }
  ]

  scenarios.forEach((scenario, index) => {
    const expiresAt = new Date(now.getTime() + scenario.expiresIn)
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000
    const actualShouldRenew = timeUntilExpiry > 0 && timeUntilExpiry <= twentyFourHoursInMs

    console.log(`${index + 1}. ${scenario.name}`)
    console.log(`   Expires: ${expiresAt.toISOString()}`)
    console.log(`   Time left: ${Math.round(scenario.expiresIn / (60 * 60 * 1000))} hours`)
    console.log(`   Should renew: ${actualShouldRenew ? '✅ YES' : '❌ NO'}`)
    console.log(`   Reason: ${scenario.reason}\n`)
  })

  console.log('=== Scenarios Complete ===\n')
}

/**
 * Demo: Show the renewal calculation
 */
export function demoRenewalCalculation() {
  console.log('=== Session Renewal Calculation ===\n')

  const now = new Date()
  const currentExpiry = new Date(now.getTime() + 18 * 60 * 60 * 1000) // 18 hours from now

  console.log('Current Session:')
  console.log(`  Created: ${now.toISOString()}`)
  console.log(`  Expires: ${currentExpiry.toISOString()}`)
  console.log(`  Time left: 18 hours\n`)

  console.log('Renewal Calculation:')
  const timeUntilExpiry = currentExpiry.getTime() - now.getTime()
  const twentyFourHoursInMs = 24 * 60 * 60 * 1000
  const withinWindow = timeUntilExpiry <= twentyFourHoursInMs

  console.log(`  Time until expiry: ${timeUntilExpiry}ms`)
  console.log(`  24-hour window: ${twentyFourHoursInMs}ms`)
  console.log(`  Within window: ${withinWindow}\n`)

  if (withinWindow) {
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000
    const newExpiry = new Date(now.getTime() + sevenDaysInMs)

    console.log('After Renewal:')
    console.log(`  New expiry: ${newExpiry.toISOString()}`)
    console.log(`  Extended by: 7 days`)
    console.log(`  New time left: 168 hours (7 days)\n`)
  }

  console.log('=== Calculation Complete ===\n')
}

// Run demos if this file is executed directly
if (require.main === module) {
  console.clear()
  demoRenewalScenarios()
  demoRenewalCalculation()
  demoSessionRenewal().catch(console.error)
}
