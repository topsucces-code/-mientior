#!/usr/bin/env node

/**
 * Load test script to verify transactional stock decrements
 * Simulates concurrent order creation to ensure no overselling occurs
 * 
 * Usage: node scripts/test-concurrent-orders.js
 */

const CONCURRENT_REQUESTS = 10
const PRODUCT_ID = 'test-product-id' // Replace with actual product ID
const INITIAL_STOCK = 5 // Product should have this stock before test
const API_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

async function createTestOrder(index) {
  const startTime = Date.now()
  
  try {
    // Note: This is a simplified test. In production, you'd need:
    // 1. Valid authentication token
    // 2. Valid payment intent ID from Stripe
    // 3. Proper test data setup
    
    const response = await fetch(`${API_URL}/api/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth header here
      },
      body: JSON.stringify({
        items: [
          {
            productId: PRODUCT_ID,
            quantity: 1,
          },
        ],
        shippingAddress: {
          firstName: `Test${index}`,
          lastName: 'User',
          line1: '123 Test St',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
          phone: '0123456789',
          email: `test${index}@example.com`,
        },
        shippingOption: 'standard',
        paymentIntentId: `test_pi_${Date.now()}_${index}`, // Unique per request
      }),
    })

    const duration = Date.now() - startTime
    const data = await response.json()

    return {
      index,
      success: response.ok,
      status: response.status,
      duration,
      data,
    }
  } catch (error) {
    return {
      index,
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
    }
  }
}

async function runLoadTest() {
  console.log('🚀 Starting concurrent order creation test...')
  console.log(`   Concurrent requests: ${CONCURRENT_REQUESTS}`)
  console.log(`   Product ID: ${PRODUCT_ID}`)
  console.log(`   Initial stock: ${INITIAL_STOCK}`)
  console.log(`   Expected successful orders: ${INITIAL_STOCK}`)
  console.log(`   Expected failed orders: ${CONCURRENT_REQUESTS - INITIAL_STOCK}`)
  console.log('')

  const startTime = Date.now()

  // Create all requests concurrently
  const promises = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
    createTestOrder(i + 1)
  )

  const results = await Promise.all(promises)

  const totalDuration = Date.now() - startTime

  // Analyze results
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  const stockErrors = failed.filter(r => 
    r.data?.error?.includes('stock') || r.data?.error?.includes('Stock')
  )

  console.log('📊 Test Results:')
  console.log(`   Total duration: ${totalDuration}ms`)
  console.log(`   Successful orders: ${successful.length}`)
  console.log(`   Failed orders: ${failed.length}`)
  console.log(`   Stock-related failures: ${stockErrors.length}`)
  console.log('')

  // Show individual results
  console.log('📝 Individual Results:')
  results.forEach(result => {
    const status = result.success ? '✅' : '❌'
    const msg = result.success
      ? `Order ${result.data?.orderNumber || 'N/A'}`
      : result.data?.error || result.error || 'Unknown error'
    console.log(`   ${status} Request #${result.index} (${result.duration}ms): ${msg}`)
  })

  console.log('')

  // Validation
  if (successful.length === INITIAL_STOCK && stockErrors.length === CONCURRENT_REQUESTS - INITIAL_STOCK) {
    console.log('✅ TEST PASSED: Stock management is working correctly!')
    console.log(`   Exactly ${INITIAL_STOCK} orders succeeded (matching initial stock)`)
    console.log(`   Remaining ${stockErrors.length} orders failed due to insufficient stock`)
  } else {
    console.log('❌ TEST FAILED: Stock management has issues!')
    console.log(`   Expected ${INITIAL_STOCK} successful orders, got ${successful.length}`)
    console.log(`   Expected ${CONCURRENT_REQUESTS - INITIAL_STOCK} stock failures, got ${stockErrors.length}`)
    console.log('')
    console.log('⚠️  Possible issues:')
    console.log('   - Race conditions in stock decrement')
    console.log('   - Lock acquisition failures')
    console.log('   - Overselling occurred')
  }

  console.log('')
  console.log('💡 Next steps:')
  console.log('   1. Check product stock in database')
  console.log('   2. Verify order count matches successful requests')
  console.log('   3. Check Redis for any stuck locks')
  console.log('   4. Review server logs for errors')
}

// Run the test
runLoadTest().catch(console.error)

