/**
 * Security utilities for checkout and payment processing
 */

export interface SecurityHeaders {
  'X-CSRF-Token': string
  'X-Request-ID': string
  'X-Client-Version': string
}

export interface EncryptedData {
  iv: string
  data: string
  tag: string
}

export interface SuspiciousActivityIndicators {
  rapidRequests: boolean
  multipleFailedAttempts: boolean
  unusualLocation: boolean
  suspiciousUserAgent: boolean
}

/**
 * Generate a CSRF token
 */
export async function generateCSRFToken(): Promise<string> {
  if (typeof window === 'undefined') {
    // Server-side: use crypto
    const crypto = await import('crypto')
    return crypto.randomBytes(32).toString('base64url')
  }

  // Client-side: use Web Crypto API
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Get or create CSRF token from session storage
 */
export function getCSRFToken(): string {
  if (typeof window === 'undefined') return ''

  let token = sessionStorage.getItem('csrf_token')
  if (!token) {
    token = generateCSRFToken()
    sessionStorage.setItem('csrf_token', token)
  }
  return token
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false
  return token === storedToken
}

/**
 * Encrypt sensitive payment data using Web Crypto API
 */
export async function encryptPaymentData(
  data: string,
  key?: CryptoKey
): Promise<EncryptedData> {
  if (typeof window === 'undefined') {
    throw new Error('Encryption only available in browser')
  }

  // Generate or use provided key
  const cryptoKey =
    key ||
    (await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    ))

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // Encrypt data
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    cryptoKey,
    new TextEncoder().encode(data)
  )

  // Split encrypted data and authentication tag
  const encryptedArray = new Uint8Array(encrypted)
  const dataBytes = encryptedArray.slice(0, -16)
  const tagBytes = encryptedArray.slice(-16)

  return {
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...dataBytes)),
    tag: btoa(String.fromCharCode(...tagBytes)),
  }
}

/**
 * Decrypt payment data
 */
export async function decryptPaymentData(
  encrypted: EncryptedData,
  key: CryptoKey
): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Decryption only available in browser')
  }

  // Decode base64
  const iv = Uint8Array.from(atob(encrypted.iv), (c) => c.charCodeAt(0))
  const data = Uint8Array.from(atob(encrypted.data), (c) => c.charCodeAt(0))
  const tag = Uint8Array.from(atob(encrypted.tag), (c) => c.charCodeAt(0))

  // Combine data and tag
  const combined = new Uint8Array(data.length + tag.length)
  combined.set(data)
  combined.set(tag, data.length)

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    combined
  )

  return new TextDecoder().decode(decrypted)
}

/**
 * Detect suspicious activity patterns
 */
export function detectSuspiciousActivity(
  requestHistory: Array<{ timestamp: number; success: boolean }>,
  userAgent?: string,
  _ipAddress?: string
): SuspiciousActivityIndicators {
  const now = Date.now()
  const recentRequests = requestHistory.filter(
    (r) => now - r.timestamp < 60000 // Last minute
  )
  const failedAttempts = recentRequests.filter((r) => !r.success).length

  return {
    rapidRequests: recentRequests.length > 10,
    multipleFailedAttempts: failedAttempts > 3,
    unusualLocation: false, // Would need IP geolocation service
    suspiciousUserAgent: userAgent
      ? /bot|crawler|spider|scraper/i.test(userAgent)
      : false,
  }
}

/**
 * Hash sensitive data for logging (one-way)
 */
export async function hashSensitiveData(data: string): Promise<string> {
  if (typeof window === 'undefined') {
    const crypto = await import('crypto')
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  // Client-side: use Web Crypto API
  const msgBuffer = new TextEncoder().encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate request ID for tracking
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Create security headers for API requests
 */
export function createSecurityHeaders(): SecurityHeaders {
  return {
    'X-CSRF-Token': getCSRFToken(),
    'X-Request-ID': generateRequestId(),
    'X-Client-Version': '1.0.0',
  }
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
}

/**
 * Validate payment amount to prevent manipulation
 */
export function validatePaymentAmount(
  clientAmount: number,
  serverAmount: number,
  tolerance: number = 0.01
): boolean {
  const diff = Math.abs(clientAmount - serverAmount)
  return diff <= tolerance
}
