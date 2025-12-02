import { describe, it, expect } from 'vitest'
import {
  generateVerificationEmail,
  generatePasswordResetEmail,
  generateWelcomeEmail,
  generateSecurityAlertEmail,
  type VerificationEmailData,
  type PasswordResetEmailData,
  type WelcomeEmailData,
  type SecurityAlertEmailData,
} from './email'

describe('Email Templates', () => {
  describe('generateVerificationEmail', () => {
    it('should render verification email with token URL', () => {
      const data: VerificationEmailData = {
        name: 'John Doe',
        email: 'john@example.com',
        verificationUrl: 'https://mientior.com/verify-email?token=abc123',
        expiresIn: '24 hours',
      }

      const html = generateVerificationEmail(data)

      // Check that the email contains the user's name
      expect(html).toContain('Hi John Doe')
      
      // Check that the verification URL is present
      expect(html).toContain('https://mientior.com/verify-email?token=abc123')
      
      // Check that expiry information is included
      expect(html).toContain('24 hours')
      
      // Check for key elements
      expect(html).toContain('Verify Your Email Address')
      expect(html).toContain('Verify Email Address')
      
      // Check that it's valid HTML
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('</html>')
    })

    it('should include support contact information', () => {
      const data: VerificationEmailData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        verificationUrl: 'https://mientior.com/verify-email?token=xyz789',
        expiresIn: '24 hours',
      }

      const html = generateVerificationEmail(data)

      expect(html).toContain('support@mientior.com')
    })

    it('should include Mientior branding', () => {
      const data: VerificationEmailData = {
        name: 'Test User',
        email: 'test@example.com',
        verificationUrl: 'https://mientior.com/verify-email?token=test123',
        expiresIn: '24 hours',
      }

      const html = generateVerificationEmail(data)

      expect(html).toContain('Mientior')
    })
  })

  describe('generatePasswordResetEmail', () => {
    it('should render password reset email with expiry and IP address', () => {
      const data: PasswordResetEmailData = {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        resetUrl: 'https://mientior.com/reset-password?token=reset123',
        expiresIn: '1 hour',
        ipAddress: '192.168.1.1',
      }

      const html = generatePasswordResetEmail(data)

      // Check that the email contains the user's name
      expect(html).toContain('Hi Alice Johnson')
      
      // Check that the reset URL is present
      expect(html).toContain('https://mientior.com/reset-password?token=reset123')
      
      // Check that expiry information is included
      expect(html).toContain('1 hour')
      
      // Check that IP address is included for security
      expect(html).toContain('192.168.1.1')
      
      // Check for key elements
      expect(html).toContain('Reset Your Password')
      expect(html).toContain('Reset Password')
      
      // Check for security information section
      expect(html).toContain('Security Information')
      expect(html).toContain('Request made from IP')
    })

    it('should include security warning about unauthorized requests', () => {
      const data: PasswordResetEmailData = {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        resetUrl: 'https://mientior.com/reset-password?token=reset456',
        expiresIn: '1 hour',
        ipAddress: '10.0.0.1',
      }

      const html = generatePasswordResetEmail(data)

      expect(html).toContain("didn't request")
      expect(html).toContain('contact support')
    })

    it('should mention single-use link for security', () => {
      const data: PasswordResetEmailData = {
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        resetUrl: 'https://mientior.com/reset-password?token=reset789',
        expiresIn: '1 hour',
        ipAddress: '172.16.0.1',
      }

      const html = generatePasswordResetEmail(data)

      expect(html).toContain('only be used once')
    })
  })

  describe('generateWelcomeEmail', () => {
    it('should render welcome email with user name', () => {
      const data: WelcomeEmailData = {
        name: 'David Lee',
        email: 'david@example.com',
      }

      const html = generateWelcomeEmail(data)

      // Check that the email contains the user's name
      expect(html).toContain('Hi David Lee')
      
      // Check for welcome message
      expect(html).toContain('Welcome to Mientior')
      
      // Check that it's valid HTML
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('</html>')
    })

    it('should include onboarding tips', () => {
      const data: WelcomeEmailData = {
        name: 'Emma Davis',
        email: 'emma@example.com',
      }

      const html = generateWelcomeEmail(data)

      // Check for getting started section
      expect(html).toContain('Getting Started Tips')
      
      // Check for specific onboarding tips
      expect(html).toContain('Complete your profile')
      expect(html).toContain('Browse our collections')
      expect(html).toContain('Create a wishlist')
      expect(html).toContain('Enable notifications')
      expect(html).toContain('loyalty program')
    })

    it('should include call-to-action button', () => {
      const data: WelcomeEmailData = {
        name: 'Frank Miller',
        email: 'frank@example.com',
      }

      const html = generateWelcomeEmail(data)

      expect(html).toContain('Start Shopping')
    })

    it('should include support contact information', () => {
      const data: WelcomeEmailData = {
        name: 'Grace Taylor',
        email: 'grace@example.com',
      }

      const html = generateWelcomeEmail(data)

      expect(html).toContain('support@mientior.com')
    })
  })

  describe('generateSecurityAlertEmail', () => {
    it('should render security alert with device details', () => {
      const data: SecurityAlertEmailData = {
        name: 'Henry Anderson',
        email: 'henry@example.com',
        deviceInfo: 'Chrome on Windows 10',
        location: 'New York, USA',
        ipAddress: '203.0.113.1',
        timestamp: '2024-01-15 10:30:00 UTC',
      }

      const html = generateSecurityAlertEmail(data)

      // Check that the email contains the user's name
      expect(html).toContain('Hi Henry Anderson')
      
      // Check that device information is included
      expect(html).toContain('Chrome on Windows 10')
      
      // Check that location is included
      expect(html).toContain('New York, USA')
      
      // Check that IP address is included
      expect(html).toContain('203.0.113.1')
      
      // Check that timestamp is included
      expect(html).toContain('2024-01-15 10:30:00 UTC')
      
      // Check for key elements
      expect(html).toContain('Security Alert')
      expect(html).toContain('New Login')
    })

    it('should include warning about unauthorized access', () => {
      const data: SecurityAlertEmailData = {
        name: 'Iris Chen',
        email: 'iris@example.com',
        deviceInfo: 'Safari on iPhone',
        location: 'London, UK',
        ipAddress: '198.51.100.1',
        timestamp: '2024-01-15 14:45:00 UTC',
      }

      const html = generateSecurityAlertEmail(data)

      expect(html).toContain('Was this you')
      expect(html).toContain('account may have been compromised')
      expect(html).toContain('secure your account')
    })

    it('should include link to account security settings', () => {
      const data: SecurityAlertEmailData = {
        name: 'Jack Robinson',
        email: 'jack@example.com',
        deviceInfo: 'Firefox on Linux',
        location: 'Tokyo, Japan',
        ipAddress: '192.0.2.1',
        timestamp: '2024-01-15 18:00:00 UTC',
      }

      const html = generateSecurityAlertEmail(data)

      expect(html).toContain('Review Account Security')
      expect(html).toContain('account/security')
    })

    it('should mention ability to view and manage sessions', () => {
      const data: SecurityAlertEmailData = {
        name: 'Karen White',
        email: 'karen@example.com',
        deviceInfo: 'Edge on Windows 11',
        location: 'Sydney, Australia',
        ipAddress: '198.18.0.1',
        timestamp: '2024-01-15 22:15:00 UTC',
      }

      const html = generateSecurityAlertEmail(data)

      expect(html).toContain('active sessions')
      expect(html).toContain('log out from unfamiliar devices')
    })
  })
})
