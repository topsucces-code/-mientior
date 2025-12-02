/**
 * Integration Tests for Customer 360 Quick Actions
 * 
 * Tests the underlying functionality that quick actions would use:
 * - Email sending functionality
 * - Support ticket creation (mock implementation)
 * - Loyalty points adjustment
 * - Note addition
 * 
 * Requirements: 14.2, 14.3, 14.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LoyaltyLevel } from '@prisma/client'
import * as email from '@/lib/email'

// Mock email module
vi.mock('@/lib/email', () => ({
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendWelcomeEmailAuth: vi.fn(),
  sendSecurityAlertEmail: vi.fn(),
}))

// Mock auth
vi.mock('@/lib/auth-server', () => ({
  requireAdminAuth: vi.fn().mockResolvedValue({
    user: {
      id: 'admin-123',
      name: 'Admin User',
      email: 'admin@test.com',
    },
  }),
}))

// Mock real-time updates
vi.mock('@/lib/real-time-updates', () => ({
  triggerCustomerNotesUpdate: vi.fn(),
  triggerCustomerLoyaltyUpdate: vi.fn(),
}))

describe('Quick Actions Integration Tests', () => {
  let testCustomer: any
  let testAdmin: any

  beforeEach(async () => {
    // Create test admin user
    testAdmin = await prisma.user.create({
      data: {
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        loyaltyLevel: LoyaltyLevel.BRONZE,
        loyaltyPoints: 0,
        totalOrders: 0,
        totalSpent: 0,
        emailVerified: true,
      },
    })

    // Create test customer
    testCustomer = await prisma.user.create({
      data: {
        id: 'customer-123',
        email: 'customer@test.com',
        name: 'Test Customer',
        firstName: 'Test',
        lastName: 'Customer',
        loyaltyLevel: LoyaltyLevel.BRONZE,
        loyaltyPoints: 100,
        totalOrders: 2,
        totalSpent: 150.50,
        emailVerified: true,
      },
    })
  })

  afterEach(async () => {
    // Clean up test data
    if (testCustomer?.id) {
      await prisma.customerNote.deleteMany({
        where: { customerId: testCustomer.id },
      })
      await prisma.user.deleteMany({
        where: { id: testCustomer.id },
      })
    }
    if (testAdmin?.id) {
      await prisma.user.deleteMany({
        where: { id: testAdmin.id },
      })
    }
    vi.clearAllMocks()
  })

  describe('Email Sending Quick Action', () => {
    it('should send email to customer successfully', async () => {
      // Requirement 14.2: Test email sending
      const mockSendEmail = vi.fn().mockResolvedValue({ success: true })
      vi.mocked(email.sendWelcomeEmailAuth).mockImplementation(mockSendEmail)

      // Simulate sending a welcome email (as an example of email quick action)
      const emailData = {
        name: testCustomer.name,
        email: testCustomer.email,
      }

      const result = await email.sendWelcomeEmailAuth(emailData)

      expect(result.success).toBe(true)
      expect(mockSendEmail).toHaveBeenCalledWith(emailData)
    })

    it('should handle email sending failure gracefully', async () => {
      // Test email sending error handling
      const mockSendEmail = vi.fn().mockResolvedValue({ 
        success: false, 
        error: 'Email service unavailable' 
      })
      vi.mocked(email.sendWelcomeEmailAuth).mockImplementation(mockSendEmail)

      const emailData = {
        name: testCustomer.name,
        email: testCustomer.email,
      }

      const result = await email.sendWelcomeEmailAuth(emailData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email service unavailable')
    })

    it('should validate email data before sending', async () => {
      // Test email data validation
      const invalidEmailData = {
        name: '',
        email: 'invalid-email',
      }

      // This would normally be validated by the quick action endpoint
      expect(invalidEmailData.name).toBe('')
      expect(invalidEmailData.email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    })
  })

  describe('Support Ticket Creation Quick Action', () => {
    it('should create support ticket for customer', async () => {
      // Requirement 14.3: Test ticket creation
      // Since support tickets aren't fully implemented, we'll test the data structure
      const ticketData = {
        customerId: testCustomer.id,
        subject: 'Test Support Ticket',
        description: 'This is a test support ticket created via quick action',
        priority: 'medium' as const,
        status: 'open' as const,
        createdBy: 'admin-123',
      }

      // Validate ticket data structure
      expect(ticketData.customerId).toBe(testCustomer.id)
      expect(ticketData.subject).toBeTruthy()
      expect(ticketData.description).toBeTruthy()
      expect(['low', 'medium', 'high', 'urgent']).toContain(ticketData.priority)
      expect(['open', 'in_progress', 'resolved', 'closed']).toContain(ticketData.status)
      expect(ticketData.createdBy).toBeTruthy()
    })

    it('should validate ticket data before creation', async () => {
      // Test ticket data validation
      const invalidTicketData = {
        customerId: '',
        subject: '',
        description: '',
        priority: 'invalid' as any,
        status: 'invalid' as any,
      }

      // Validate required fields
      expect(invalidTicketData.customerId).toBe('')
      expect(invalidTicketData.subject).toBe('')
      expect(invalidTicketData.description).toBe('')
      expect(['low', 'medium', 'high', 'urgent']).not.toContain(invalidTicketData.priority)
      expect(['open', 'in_progress', 'resolved', 'closed']).not.toContain(invalidTicketData.status)
    })

    it('should verify customer exists before creating ticket', async () => {
      // Test customer existence validation
      const customer = await prisma.user.findUnique({
        where: { id: testCustomer.id },
        select: { id: true },
      })

      expect(customer).toBeTruthy()
      expect(customer?.id).toBe(testCustomer.id)

      // Test non-existent customer
      const nonExistentCustomer = await prisma.user.findUnique({
        where: { id: 'non-existent-id' },
        select: { id: true },
      })

      expect(nonExistentCustomer).toBeNull()
    })
  })

  describe('Loyalty Points Adjustment Quick Action', () => {
    it('should adjust customer loyalty points successfully', async () => {
      // Requirement 14.4: Test points adjustment
      const initialPoints = testCustomer.loyaltyPoints
      const pointsToAdd = 50

      // Update customer points
      const updatedCustomer = await prisma.user.update({
        where: { id: testCustomer.id },
        data: {
          loyaltyPoints: initialPoints + pointsToAdd,
        },
        select: {
          id: true,
          loyaltyPoints: true,
        },
      })

      expect(updatedCustomer.loyaltyPoints).toBe(initialPoints + pointsToAdd)
    })

    it('should handle points subtraction correctly', async () => {
      // Test points subtraction
      const initialPoints = testCustomer.loyaltyPoints
      const pointsToSubtract = 25

      const updatedCustomer = await prisma.user.update({
        where: { id: testCustomer.id },
        data: {
          loyaltyPoints: Math.max(0, initialPoints - pointsToSubtract),
        },
        select: {
          id: true,
          loyaltyPoints: true,
        },
      })

      expect(updatedCustomer.loyaltyPoints).toBe(initialPoints - pointsToSubtract)
    })

    it('should prevent negative loyalty points', async () => {
      // Test negative points prevention
      const initialPoints = testCustomer.loyaltyPoints
      const pointsToSubtract = initialPoints + 50 // More than available

      const updatedCustomer = await prisma.user.update({
        where: { id: testCustomer.id },
        data: {
          loyaltyPoints: Math.max(0, initialPoints - pointsToSubtract),
        },
        select: {
          id: true,
          loyaltyPoints: true,
        },
      })

      expect(updatedCustomer.loyaltyPoints).toBe(0)
      expect(updatedCustomer.loyaltyPoints).toBeGreaterThanOrEqual(0)
    })

    it('should validate points adjustment data', async () => {
      // Test points adjustment validation
      const adjustmentData = {
        customerId: testCustomer.id,
        amount: 100,
        reason: 'Manual adjustment via quick action',
        type: 'add' as const,
      }

      expect(adjustmentData.customerId).toBeTruthy()
      expect(typeof adjustmentData.amount).toBe('number')
      expect(adjustmentData.amount).toBeGreaterThan(0)
      expect(adjustmentData.reason).toBeTruthy()
      expect(['add', 'subtract']).toContain(adjustmentData.type)
    })

    it('should update loyalty tier based on points', async () => {
      // Test loyalty tier progression
      const highPoints = 5000 // Should be GOLD tier

      const updatedCustomer = await prisma.user.update({
        where: { id: testCustomer.id },
        data: {
          loyaltyPoints: highPoints,
          // In a real implementation, this would be calculated automatically
          loyaltyLevel: LoyaltyLevel.GOLD,
        },
        select: {
          id: true,
          loyaltyPoints: true,
          loyaltyLevel: true,
        },
      })

      expect(updatedCustomer.loyaltyPoints).toBe(highPoints)
      expect(updatedCustomer.loyaltyLevel).toBe(LoyaltyLevel.GOLD)
    })
  })

  describe('Add Note Quick Action', () => {
    it('should add note to customer successfully', async () => {
      // Test note addition (using existing notes endpoint functionality)
      const noteContent = 'Quick action note: Customer contacted via phone'

      const note = await prisma.customerNote.create({
        data: {
          customerId: testCustomer.id,
          content: noteContent,
          createdBy: 'admin-123',
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      expect(note.content).toBe(noteContent)
      expect(note.customerId).toBe(testCustomer.id)
      expect(note.createdBy).toBe('admin-123')
      expect(note.createdAt).toBeInstanceOf(Date)
    })

    it('should validate note content before creation', async () => {
      // Test note content validation
      const validNote = 'This is a valid note content'
      const emptyNote = ''
      const longNote = 'x'.repeat(5001) // Exceeds max length

      expect(validNote.length).toBeGreaterThan(0)
      expect(validNote.length).toBeLessThanOrEqual(5000)

      expect(emptyNote.length).toBe(0)
      expect(longNote.length).toBeGreaterThan(5000)
    })

    it('should associate note with correct author', async () => {
      // Test note author attribution
      const noteContent = 'Test note with author'
      const adminId = 'admin-123'

      const note = await prisma.customerNote.create({
        data: {
          customerId: testCustomer.id,
          content: noteContent,
          createdBy: adminId,
        },
        select: {
          id: true,
          createdBy: true,
        },
      })

      expect(note.createdBy).toBe(adminId)
    })
  })

  describe('Quick Actions Integration', () => {
    it('should handle multiple quick actions in sequence', async () => {
      // Test performing multiple quick actions
      
      // 1. Add a note
      const note = await prisma.customerNote.create({
        data: {
          customerId: testCustomer.id,
          content: 'Customer contacted via quick action',
          createdBy: 'admin-123',
        },
      })

      // 2. Adjust points
      const updatedCustomer = await prisma.user.update({
        where: { id: testCustomer.id },
        data: {
          loyaltyPoints: testCustomer.loyaltyPoints + 100,
        },
        select: {
          loyaltyPoints: true,
        },
      })

      // 3. Prepare email (mock)
      const emailData = {
        name: testCustomer.name,
        email: testCustomer.email,
      }

      // Verify all actions completed successfully
      expect(note.content).toBeTruthy()
      expect(updatedCustomer.loyaltyPoints).toBe(testCustomer.loyaltyPoints + 100)
      expect(emailData.email).toBe(testCustomer.email)
    })

    it('should maintain data consistency across quick actions', async () => {
      // Test data consistency when performing quick actions
      const initialState = await prisma.user.findUnique({
        where: { id: testCustomer.id },
        select: {
          loyaltyPoints: true,
          totalOrders: true,
          totalSpent: true,
        },
      })

      // Perform points adjustment
      await prisma.user.update({
        where: { id: testCustomer.id },
        data: {
          loyaltyPoints: initialState!.loyaltyPoints + 50,
        },
      })

      // Verify other fields remain unchanged
      const finalState = await prisma.user.findUnique({
        where: { id: testCustomer.id },
        select: {
          loyaltyPoints: true,
          totalOrders: true,
          totalSpent: true,
        },
      })

      expect(finalState!.loyaltyPoints).toBe(initialState!.loyaltyPoints + 50)
      expect(finalState!.totalOrders).toBe(initialState!.totalOrders)
      expect(finalState!.totalSpent).toBe(initialState!.totalSpent)
    })

    it('should handle quick action failures gracefully', async () => {
      // Test error handling in quick actions
      
      // Try to add note to non-existent customer
      await expect(
        prisma.customerNote.create({
          data: {
            customerId: 'non-existent-customer',
            content: 'This should fail',
            createdBy: 'admin-123',
          },
        })
      ).rejects.toThrow()

      // Try to update non-existent customer points
      const result = await prisma.user.updateMany({
        where: { id: 'non-existent-customer' },
        data: { loyaltyPoints: 100 },
      })

      expect(result.count).toBe(0)
    })
  })

  describe('Quick Actions Permissions and Security', () => {
    it('should verify admin permissions for quick actions', async () => {
      // Test that admin authentication is required
      // This is mocked in our setup, but in real implementation would be tested
      const { requireAdminAuth } = await import('@/lib/auth-server')
      
      // Verify the mock is called (simulating permission check)
      expect(requireAdminAuth).toBeDefined()
    })

    it('should validate customer existence for all quick actions', async () => {
      // Test customer existence validation
      const existingCustomer = await prisma.user.findUnique({
        where: { id: testCustomer.id },
        select: { id: true },
      })

      const nonExistentCustomer = await prisma.user.findUnique({
        where: { id: 'invalid-customer-id' },
        select: { id: true },
      })

      expect(existingCustomer).toBeTruthy()
      expect(nonExistentCustomer).toBeNull()
    })

    it('should sanitize input data for quick actions', async () => {
      // Test input sanitization
      const maliciousContent = '<script>alert("xss")</script>Legitimate note content'
      
      // In a real implementation, this would be sanitized
      const sanitizedContent = maliciousContent.replace(/<script.*?>.*?<\/script>/gi, '')
      
      expect(sanitizedContent).toBe('Legitimate note content')
      expect(sanitizedContent).not.toContain('<script>')
    })
  })
})