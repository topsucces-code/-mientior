import { redis } from './redis'

/**
 * CAPTCHA requirement tracking for high-frequency registrations
 * 
 * Requirements:
 * - 8.3: Registration from same IP requires CAPTCHA after 3 accounts in 24 hours
 * 
 * Strategy:
 * - Track registration attempts per IP in Redis with 24-hour window
 * - Require CAPTCHA after 3 successful registrations from same IP
 * - Use sorted sets to track timestamps and automatically expire old entries
 */

const REGISTRATION_TRACKING_PREFIX = 'registration:ip:'
const REGISTRATION_LIMIT = 3
const TRACKING_WINDOW_SECONDS = 24 * 60 * 60 // 24 hours

/**
 * Check if CAPTCHA is required for a given IP address
 * Returns true if the IP has created 3 or more accounts in the last 24 hours
 * CAPTCHA is required AFTER 3 successful registrations (on the 4th attempt)
 */
export async function isCaptchaRequired(ipAddress: string): Promise<boolean> {
  // Disable CAPTCHA in development mode
  if (process.env.NODE_ENV === 'development') {
    return false
  }
  
  try {
    const key = `${REGISTRATION_TRACKING_PREFIX}${ipAddress}`
    const now = Date.now()
    const windowStart = now - (TRACKING_WINDOW_SECONDS * 1000)
    
    // Remove expired entries (older than 24 hours)
    await redis?.zremrangebyscore(key, 0, windowStart)
    
    // Count registrations in the last 24 hours
    const count = await redis?.zcount(key, windowStart, now) ?? 0
    
    // Require CAPTCHA if 3 or more registrations already completed
    // This means the 4th attempt and beyond require CAPTCHA
    return count >= REGISTRATION_LIMIT
  } catch (error) {
    console.error('Error checking CAPTCHA requirement:', error)
    // Fail open - don't block registration if Redis is unavailable
    return false
  }
}

/**
 * Track a successful registration from an IP address
 * Adds the current timestamp to the sorted set for this IP
 */
export async function trackRegistration(ipAddress: string): Promise<void> {
  try {
    const key = `${REGISTRATION_TRACKING_PREFIX}${ipAddress}`
    const now = Date.now()
    
    // Add current timestamp to sorted set with unique member
    // Use timestamp + random string to ensure uniqueness
    const member = `${now}-${Math.random().toString(36).substring(7)}`
    await redis?.zadd(key, now, member)
    
    // Set expiry on the key (25 hours to ensure cleanup)
    await redis?.expire(key, TRACKING_WINDOW_SECONDS + 3600)
  } catch (error) {
    console.error('Error tracking registration:', error)
    // Don't fail the registration if tracking fails
  }
}

/**
 * Get the number of registrations from an IP in the last 24 hours
 * Useful for debugging and monitoring
 */
export async function getRegistrationCount(ipAddress: string): Promise<number> {
  try {
    const key = `${REGISTRATION_TRACKING_PREFIX}${ipAddress}`
    const now = Date.now()
    const windowStart = now - (TRACKING_WINDOW_SECONDS * 1000)
    
    // Remove expired entries
    await redis?.zremrangebyscore(key, 0, windowStart)
    
    // Count registrations in window
    return await redis?.zcount(key, windowStart, now) ?? 0
  } catch (error) {
    console.error('Error getting registration count:', error)
    return 0
  }
}

/**
 * Verify CAPTCHA token (placeholder for actual CAPTCHA service integration)
 * 
 * To integrate a CAPTCHA service:
 * 1. Choose a service: hCaptcha (recommended) or reCAPTCHA
 * 2. Add environment variables:
 *    - CAPTCHA_SECRET_KEY (server-side)
 *    - NEXT_PUBLIC_CAPTCHA_SITE_KEY (client-side)
 * 3. Install the appropriate package:
 *    - hCaptcha: npm install @hcaptcha/react-hcaptcha
 *    - reCAPTCHA: npm install react-google-recaptcha
 * 4. Implement verification logic below
 * 
 * Example for hCaptcha:
 * ```typescript
 * const response = await fetch('https://hcaptcha.com/siteverify', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
 *   body: new URLSearchParams({
 *     secret: process.env.CAPTCHA_SECRET_KEY!,
 *     response: token,
 *     remoteip: ipAddress
 *   })
 * })
 * const data = await response.json()
 * return data.success === true
 * ```
 */
export async function verifyCaptchaToken(
  token: string,
  _ipAddress: string
): Promise<boolean> {
  // TODO: Implement actual CAPTCHA verification
  // For now, return true to allow development without CAPTCHA service
  
  if (!token) {
    return false
  }
  
  // Check if CAPTCHA is configured
  const captchaSecretKey = process.env.CAPTCHA_SECRET_KEY
  if (!captchaSecretKey) {
    console.warn('CAPTCHA_SECRET_KEY not configured, skipping verification')
    return true // Allow in development
  }
  
  // TODO: Add actual verification logic here
  // This is a placeholder that should be replaced with real CAPTCHA verification
  console.log('CAPTCHA verification not implemented, token:', token.substring(0, 10))
  
  return true
}

/**
 * Reset registration tracking for an IP (useful for testing)
 */
export async function resetRegistrationTracking(ipAddress: string): Promise<void> {
  try {
    const key = `${REGISTRATION_TRACKING_PREFIX}${ipAddress}`
    await redis?.del(key)
  } catch (error) {
    console.error('Error resetting registration tracking:', error)
  }
}
