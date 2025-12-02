import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'
import { redis } from '@/lib/redis'
import {
  clearAccountLockout,
  clearFailedLoginAttempts,
  checkAccountLockout,
} from '@/lib/auth-rate-limit'

describe('Account Lockout Integration', () => {
  // Use unique email for each test to avoid conflicts
  const getTestEmail = (testName: string) => `lockout-${testName}-${Date.now()}@example.com`

  beforeEach(async () => {
    // Clean up any Redis keys before each test
    const keys = await redis.keys('auth:*')
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  })

  afterEach(async () => {
    // Clean up any Redis keys after each test
    const keys = await redis.keys('auth:*')
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  })

  it('should lock account after 5 failed login attempts and return lockout error', async () => {
    const testEmail = getTestEmail('lock-after-5')
    
    // Make 5 failed login attempts
    for (let i = 0; i < 5; i++) {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: testEmail,
          password: 'wrongpassword',
        }),
      })

      const response = await POST(request)
      
      // First 4 attempts should return 401 (invalid credentials)
      // 5th attempt should return 429 (locked)
      if (i < 4) {
        expect(response.status).toBe(401)
      } else {
        expect(response.status).toBe(429)
        const data = await response.json()
        expect(data.code).toBe('ACCOUNT_LOCKED')
        expect(data.remainingSeconds).toBeGreaterThan(0)
      }
    }

    // Verify account is locked
    const lockoutStatus = await checkAccountLockout(testEmail)
    expect(lockoutStatus.isLocked).toBe(true)
    expect(lockoutStatus.remainingSeconds).toBeGreaterThan(1790) // ~30 minutes
    expect(lockoutStatus.remainingSeconds).toBeLessThanOrEqual(1800)
    
    // Clean up
    await clearAccountLockout(testEmail)
    await clearFailedLoginAttempts(testEmail)
  })

  it('should prevent login attempts while account is locked', async () => {
    const testEmail = getTestEmail('prevent-while-locked')
    
    // Make 5 failed attempts to trigger lockout
    for (let i = 0; i < 5; i++) {
      await POST(
        new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: testEmail,
            password: 'wrongpassword',
          }),
        })
      )
    }

    // Try to login again - should be blocked immediately
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'correctpassword',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.code).toBe('ACCOUNT_LOCKED')
    expect(data.error).toBe('Account temporarily locked due to too many failed attempts')
    
    // Clean up
    await clearAccountLockout(testEmail)
    await clearFailedLoginAttempts(testEmail)
  })

  it('should track remaining lockout time correctly', async () => {
    const testEmail = getTestEmail('track-remaining-time')
    
    // Trigger lockout
    for (let i = 0; i < 5; i++) {
      await POST(
        new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: testEmail,
            password: 'wrongpassword',
          }),
        })
      )
    }

    // Check lockout status
    const status1 = await checkAccountLockout(testEmail)
    expect(status1.isLocked).toBe(true)
    const remaining1 = status1.remainingSeconds!

    // Wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check again - remaining time should be less
    const status2 = await checkAccountLockout(testEmail)
    expect(status2.isLocked).toBe(true)
    const remaining2 = status2.remainingSeconds!

    expect(remaining2).toBeLessThan(remaining1)
    expect(remaining1 - remaining2).toBeGreaterThanOrEqual(1)
    expect(remaining1 - remaining2).toBeLessThanOrEqual(2) // Allow 1 second tolerance
    
    // Clean up
    await clearAccountLockout(testEmail)
    await clearFailedLoginAttempts(testEmail)
  })
})
