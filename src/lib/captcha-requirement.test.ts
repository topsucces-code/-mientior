import { describe, it, expect, beforeEach } from 'vitest'
import {
  isCaptchaRequired,
  trackRegistration,
  getRegistrationCount,
  resetRegistrationTracking,
} from './captcha-requirement'

/**
 * Test suite for CAPTCHA requirement tracking
 * 
 * Requirements:
 * - 8.3: Registration from same IP requires CAPTCHA after 3 accounts in 24 hours
 */

describe('CAPTCHA Requirement Tracking', () => {
  const testIp = '192.168.1.100'
  
  beforeEach(async () => {
    // Clean up before each test
    await resetRegistrationTracking(testIp)
  })

  it('should not require CAPTCHA for first registration', async () => {
    const required = await isCaptchaRequired(testIp)
    expect(required).toBe(false)
  })

  it('should not require CAPTCHA for second registration', async () => {
    await trackRegistration(testIp)
    const required = await isCaptchaRequired(testIp)
    expect(required).toBe(false)
  })

  it('should not require CAPTCHA for third registration', async () => {
    await trackRegistration(testIp)
    await trackRegistration(testIp)
    const required = await isCaptchaRequired(testIp)
    expect(required).toBe(false)
  })

  it('should require CAPTCHA after 3 registrations', async () => {
    // Track 3 registrations
    await trackRegistration(testIp)
    await trackRegistration(testIp)
    await trackRegistration(testIp)
    
    // 4th attempt should require CAPTCHA
    const required = await isCaptchaRequired(testIp)
    expect(required).toBe(true)
  })

  it('should track registration count correctly', async () => {
    expect(await getRegistrationCount(testIp)).toBe(0)
    
    await trackRegistration(testIp)
    expect(await getRegistrationCount(testIp)).toBe(1)
    
    await trackRegistration(testIp)
    expect(await getRegistrationCount(testIp)).toBe(2)
    
    await trackRegistration(testIp)
    expect(await getRegistrationCount(testIp)).toBe(3)
  })

  it('should handle multiple IPs independently', async () => {
    const ip1 = '192.168.1.100'
    const ip2 = '192.168.1.101'
    
    await resetRegistrationTracking(ip1)
    await resetRegistrationTracking(ip2)
    
    // Track registrations for ip1
    await trackRegistration(ip1)
    await trackRegistration(ip1)
    await trackRegistration(ip1)
    
    // Track only 1 registration for ip2
    await trackRegistration(ip2)
    
    // ip1 should require CAPTCHA
    expect(await isCaptchaRequired(ip1)).toBe(true)
    
    // ip2 should not require CAPTCHA
    expect(await isCaptchaRequired(ip2)).toBe(false)
    
    // Clean up
    await resetRegistrationTracking(ip1)
    await resetRegistrationTracking(ip2)
  })

  it('should reset tracking correctly', async () => {
    await trackRegistration(testIp)
    await trackRegistration(testIp)
    await trackRegistration(testIp)
    
    expect(await isCaptchaRequired(testIp)).toBe(true)
    
    await resetRegistrationTracking(testIp)
    
    expect(await isCaptchaRequired(testIp)).toBe(false)
    expect(await getRegistrationCount(testIp)).toBe(0)
  })

  it('should handle Redis errors gracefully', async () => {
    // Test with invalid IP to potentially trigger errors
    const invalidIp = ''
    
    // Should not throw errors
    const required = await isCaptchaRequired(invalidIp)
    expect(typeof required).toBe('boolean')
    
    await trackRegistration(invalidIp)
    const count = await getRegistrationCount(invalidIp)
    expect(typeof count).toBe('number')
  })
})
