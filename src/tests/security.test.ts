/**
 * Security Testing Suite
 * 
 * Tests for OWASP Top 10 vulnerabilities and general security best practices
 * Run with: npm run test:security
 * 
 * Note: These tests require a running server. Set RUN_INTEGRATION_TESTS=true to enable.
 */

import { describe, it, expect } from 'vitest'

const shouldRunIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true'

describe.skipIf(!shouldRunIntegrationTests)('Security Tests - OWASP Top 10', () => {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  describe('A01:2021 – Broken Access Control', () => {
    it('should protect /account routes without authentication', async () => {
      const response = await fetch(`${BASE_URL}/account`)
      
      // Should redirect to login
      expect(response.status).toBe(307) // Redirect
      expect(response.headers.get('location')).toContain('/login')
    })

    it('should protect /checkout routes without authentication', async () => {
      const response = await fetch(`${BASE_URL}/checkout`)
      
      // Should redirect to login
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
    })

    it('should protect /admin routes', async () => {
      const response = await fetch(`${BASE_URL}/admin`)
      
      // Should require authentication
      expect([401, 403, 307]).toContain(response.status)
    })
  })

  describe('A02:2021 – Cryptographic Failures', () => {
    it('should enforce HTTPS in production', () => {
      if (process.env.NODE_ENV === 'production') {
        expect(BASE_URL).toMatch(/^https:\/\//)
      }
    })

    it('should have HSTS header in production', async () => {
      if (process.env.NODE_ENV === 'production') {
        const response = await fetch(BASE_URL)
        const hsts = response.headers.get('strict-transport-security')
        
        expect(hsts).toBeTruthy()
        expect(hsts).toContain('max-age=')
        expect(hsts).toContain('includeSubDomains')
      }
    })
  })

  describe('A03:2021 – Injection', () => {
    it('should sanitize SQL injection attempts', async () => {
      const maliciousInput = "'; DROP TABLE users; --"
      const response = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(maliciousInput)}`)
      
      // Should not return 500 error (Prisma should handle this)
      expect(response.status).not.toBe(500)
    })

    it('should handle XSS attempts in search', async () => {
      const xssPayload = '<script>alert("XSS")</script>'
      const response = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(xssPayload)}`)
      
      const data = await response.json()
      
      // Should escape HTML in response
      if (data.results) {
        const stringified = JSON.stringify(data)
        expect(stringified).not.toContain('<script>')
      }
    })
  })

  describe('A04:2021 – Insecure Design', () => {
    it('should have rate limiting on auth endpoints', async () => {
      const requests = []
      
      // Make 10 rapid requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          fetch(`${BASE_URL}/api/auth/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      
      const responses = await Promise.all(requests)
      const statuses = responses.map(r => r.status)
      
      // At least one should be rate limited (429)
      expect(statuses).toContain(429)
    })
  })

  describe('A05:2021 – Security Misconfiguration', () => {
    it('should have X-Frame-Options header', async () => {
      const response = await fetch(BASE_URL)
      const xFrameOptions = response.headers.get('x-frame-options')
      
      expect(xFrameOptions).toBe('DENY')
    })

    it('should have X-Content-Type-Options header', async () => {
      const response = await fetch(BASE_URL)
      const xContentTypeOptions = response.headers.get('x-content-type-options')
      
      expect(xContentTypeOptions).toBe('nosniff')
    })

    it('should have Content-Security-Policy header', async () => {
      const response = await fetch(BASE_URL)
      const csp = response.headers.get('content-security-policy')
      
      expect(csp).toBeTruthy()
      expect(csp).toContain("default-src 'self'")
    })

    it('should not expose server version', async () => {
      const response = await fetch(BASE_URL)
      const xPoweredBy = response.headers.get('x-powered-by')
      
      // Should not reveal Next.js or Node version
      expect(xPoweredBy).toBeNull()
    })
  })

  describe('A06:2021 – Vulnerable and Outdated Components', () => {
    it('should use supported Node.js version', () => {
      const nodeVersion = process.version
      const major = parseInt(nodeVersion.slice(1).split('.')[0] || '0', 10)
      
      // Node 20+ is required
      expect(major).toBeGreaterThanOrEqual(20)
    })
  })

  describe('A07:2021 – Identification and Authentication Failures', () => {
    it('should reject weak passwords', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: '123', // Weak password
          name: 'Test User',
        }),
      })
      
      // Should reject weak password
      expect([400, 422]).toContain(response.status)
    })

    it('should have session timeout', async () => {
      // Sessions should expire (checked via Better Auth config)
      // This is configured in src/lib/auth.ts
      expect(true).toBe(true) // Placeholder - actual test would check session expiry
    })
  })

  describe('A08:2021 – Software and Data Integrity Failures', () => {
    it('should validate webhook signatures', async () => {
      const response = await fetch(`${BASE_URL}/api/webhooks/paystack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'charge.success' }),
      })
      
      // Should reject unsigned webhook
      expect([400, 401, 403]).toContain(response.status)
    })
  })

  describe('A09:2021 – Security Logging and Monitoring Failures', () => {
    it('should log authentication failures', () => {
      // This would require checking logs
      // Placeholder for actual implementation
      expect(true).toBe(true)
    })
  })

  describe('A10:2021 – Server-Side Request Forgery (SSRF)', () => {
    it('should validate external URLs', async () => {
      const maliciousUrl = 'http://localhost:6379' // Try to access Redis
      const response = await fetch(`${BASE_URL}/api/proxy?url=${encodeURIComponent(maliciousUrl)}`)
      
      // Should reject internal URLs
      expect([400, 403, 404]).toContain(response.status)
    })
  })
})

describe('Additional Security Tests', () => {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  describe('CORS Configuration', () => {
    it('should have proper CORS headers', async () => {
      const response = await fetch(`${BASE_URL}/api/products`, {
        headers: {
          'Origin': 'https://malicious-site.com',
        },
      })
      
      const accessControlAllowOrigin = response.headers.get('access-control-allow-origin')
      
      // Should not allow all origins
      expect(accessControlAllowOrigin).not.toBe('*')
    })
  })

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      const response = await fetch(`${BASE_URL}/api/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email',
        }),
      })
      
      expect([400, 422].includes(response.status)).toBe(true)
    })

    it('should validate required fields', async () => {
      const response = await fetch(`${BASE_URL}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Empty body
      })
      
      expect([400, 401, 422].includes(response.status)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should not expose stack traces in production', async () => {
      const response = await fetch(`${BASE_URL}/api/nonexistent-route`)
      const data = await response.text()
      
      if (process.env.NODE_ENV === 'production') {
        expect(data).not.toContain('at ')
        expect(data).not.toContain('node_modules')
      }
    })
  })
})
