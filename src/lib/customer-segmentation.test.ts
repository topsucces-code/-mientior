/**
 * Unit tests for Customer Segmentation Service
 * 
 * Tests:
 * - Automatic segment assignment
 * - Manual segment assignment
 * - Segment removal
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  calculateAutomaticSegments,
  assignAutomaticSegments,
  assignManualSegment,
  removeManualSegment,
  getAllSegments,
  createSegment,
} from './customer-segmentation'
import { LoyaltyLevel } from '@prisma/client'

// Mock the customer-360 module
vi.mock('./customer-360', () => ({
  getCustomerMetrics: vi.fn(),
}))

import { getCustomerMetrics } from './customer-360'

describe('Customer Segmentation Service', () => {
  let testCustomerId: string
  let testSegmentId: string
  let manualSegmentId: string

  beforeEach(async () => {
    // Create a test customer
    const user = await prisma.user.create({
      data: {
        email: `test-segment-${Date.now()}@example.com`,
        name: 'Test Segment User',
        emailVerified: true,
        loyaltyLevel: LoyaltyLevel.SILVER,
        loyaltyPoints: 500,
        totalOrders: 5,
        totalSpent: 1000,
      },
    })
    testCustomerId = user.id

    // Create test segments
    const autoSegment = await prisma.customerSegment.create({
      data: {
        name: 'High Value Customers',
        criteria: {
          minLifetimeValue: 500,
          minOrders: 3,
        },
        isAutomatic: true,
      },
    })
    testSegmentId = autoSegment.id

    const manualSegment = await prisma.customerSegment.create({
      data: {
        name: 'VIP Customers',
        criteria: {},
        isAutomatic: false,
      },
    })
    manualSegmentId = manualSegment.id
  })

  afterEach(async () => {
    // Clean up test data
    await prisma.customerSegmentAssignment.deleteMany({
      where: { customerId: testCustomerId },
    })
    await prisma.customerSegment.deleteMany({
      where: {
        id: { in: [testSegmentId, manualSegmentId] },
      },
    })
    await prisma.user.delete({
      where: { id: testCustomerId },
    })
  })

  describe('calculateAutomaticSegments', () => {
    it('should identify matching segments based on customer metrics', async () => {
      // Mock customer metrics
      vi.mocked(getCustomerMetrics).mockResolvedValue({
        lifetimeValue: 1000,
        totalOrders: 5,
        averageOrderValue: 200,
        totalSpent: 1000,
        daysSinceLastPurchase: 10,
        purchaseFrequency: 2.5,
        customerTenure: 60,
      })

      const matchingSegments = await calculateAutomaticSegments(testCustomerId)

      expect(matchingSegments).toContain(testSegmentId)
      expect(matchingSegments.length).toBeGreaterThan(0)
    })

    it('should not match segments when criteria are not met', async () => {
      // Mock customer metrics that don't meet criteria
      vi.mocked(getCustomerMetrics).mockResolvedValue({
        lifetimeValue: 100, // Below minLifetimeValue of 500
        totalOrders: 1, // Below minOrders of 3
        averageOrderValue: 100,
        totalSpent: 100,
        daysSinceLastPurchase: 10,
        purchaseFrequency: 0.5,
        customerTenure: 30,
      })

      const matchingSegments = await calculateAutomaticSegments(testCustomerId)

      expect(matchingSegments).not.toContain(testSegmentId)
    })

    it('should handle loyalty level criteria', async () => {
      // Create segment with loyalty level criteria
      const loyaltySegment = await prisma.customerSegment.create({
        data: {
          name: 'Silver+ Customers',
          criteria: {
            loyaltyLevels: ['SILVER', 'GOLD', 'PLATINUM'],
          },
          isAutomatic: true,
        },
      })

      vi.mocked(getCustomerMetrics).mockResolvedValue({
        lifetimeValue: 1000,
        totalOrders: 5,
        averageOrderValue: 200,
        totalSpent: 1000,
        daysSinceLastPurchase: 10,
        purchaseFrequency: 2.5,
        customerTenure: 60,
      })

      const matchingSegments = await calculateAutomaticSegments(testCustomerId)

      expect(matchingSegments).toContain(loyaltySegment.id)

      // Clean up
      await prisma.customerSegment.delete({
        where: { id: loyaltySegment.id },
      })
    })
  })

  describe('assignAutomaticSegments', () => {
    it('should assign matching automatic segments to customer', async () => {
      vi.mocked(getCustomerMetrics).mockResolvedValue({
        lifetimeValue: 1000,
        totalOrders: 5,
        averageOrderValue: 200,
        totalSpent: 1000,
        daysSinceLastPurchase: 10,
        purchaseFrequency: 2.5,
        customerTenure: 60,
      })

      await assignAutomaticSegments(testCustomerId)

      const assignments = await prisma.customerSegmentAssignment.findMany({
        where: { customerId: testCustomerId },
      })

      expect(assignments.length).toBeGreaterThan(0)
      expect(assignments.some((a) => a.segmentId === testSegmentId)).toBe(true)
    })

    it('should remove old automatic assignments that no longer match', async () => {
      // First assign the segment
      vi.mocked(getCustomerMetrics).mockResolvedValue({
        lifetimeValue: 1000,
        totalOrders: 5,
        averageOrderValue: 200,
        totalSpent: 1000,
        daysSinceLastPurchase: 10,
        purchaseFrequency: 2.5,
        customerTenure: 60,
      })

      await assignAutomaticSegments(testCustomerId)

      let assignments = await prisma.customerSegmentAssignment.findMany({
        where: { customerId: testCustomerId },
      })
      expect(assignments.some((a) => a.segmentId === testSegmentId)).toBe(true)

      // Now change metrics so segment no longer matches
      vi.mocked(getCustomerMetrics).mockResolvedValue({
        lifetimeValue: 100,
        totalOrders: 1,
        averageOrderValue: 100,
        totalSpent: 100,
        daysSinceLastPurchase: 10,
        purchaseFrequency: 0.5,
        customerTenure: 30,
      })

      await assignAutomaticSegments(testCustomerId)

      assignments = await prisma.customerSegmentAssignment.findMany({
        where: { customerId: testCustomerId },
      })
      expect(assignments.some((a) => a.segmentId === testSegmentId)).toBe(false)
    })

    it('should not affect manual segment assignments', async () => {
      // Manually assign a segment
      await assignManualSegment(testCustomerId, manualSegmentId)

      // Run automatic assignment
      vi.mocked(getCustomerMetrics).mockResolvedValue({
        lifetimeValue: 1000,
        totalOrders: 5,
        averageOrderValue: 200,
        totalSpent: 1000,
        daysSinceLastPurchase: 10,
        purchaseFrequency: 2.5,
        customerTenure: 60,
      })

      await assignAutomaticSegments(testCustomerId)

      // Manual assignment should still exist
      const manualAssignment = await prisma.customerSegmentAssignment.findUnique({
        where: {
          customerId_segmentId: {
            customerId: testCustomerId,
            segmentId: manualSegmentId,
          },
        },
      })

      expect(manualAssignment).not.toBeNull()
    })
  })

  describe('assignManualSegment', () => {
    it('should assign a manual segment to a customer', async () => {
      await assignManualSegment(testCustomerId, manualSegmentId)

      const assignment = await prisma.customerSegmentAssignment.findUnique({
        where: {
          customerId_segmentId: {
            customerId: testCustomerId,
            segmentId: manualSegmentId,
          },
        },
      })

      expect(assignment).not.toBeNull()
      expect(assignment?.customerId).toBe(testCustomerId)
      expect(assignment?.segmentId).toBe(manualSegmentId)
    })

    it('should not allow manual assignment of automatic segments', async () => {
      await expect(
        assignManualSegment(testCustomerId, testSegmentId)
      ).rejects.toThrow('Cannot manually assign automatic segment')
    })

    it('should be idempotent (no error if already assigned)', async () => {
      await assignManualSegment(testCustomerId, manualSegmentId)
      
      // Assigning again should not throw
      await expect(
        assignManualSegment(testCustomerId, manualSegmentId)
      ).resolves.not.toThrow()

      // Should still have only one assignment
      const assignments = await prisma.customerSegmentAssignment.findMany({
        where: {
          customerId: testCustomerId,
          segmentId: manualSegmentId,
        },
      })

      expect(assignments.length).toBe(1)
    })

    it('should throw error for non-existent segment', async () => {
      await expect(
        assignManualSegment(testCustomerId, 'non-existent-id')
      ).rejects.toThrow('Segment not found')
    })
  })

  describe('removeManualSegment', () => {
    it('should remove a manual segment from a customer', async () => {
      // First assign the segment
      await assignManualSegment(testCustomerId, manualSegmentId)

      // Verify it's assigned
      let assignment = await prisma.customerSegmentAssignment.findUnique({
        where: {
          customerId_segmentId: {
            customerId: testCustomerId,
            segmentId: manualSegmentId,
          },
        },
      })
      expect(assignment).not.toBeNull()

      // Remove it
      await removeManualSegment(testCustomerId, manualSegmentId)

      // Verify it's removed
      assignment = await prisma.customerSegmentAssignment.findUnique({
        where: {
          customerId_segmentId: {
            customerId: testCustomerId,
            segmentId: manualSegmentId,
          },
        },
      })
      expect(assignment).toBeNull()
    })

    it('should not allow removal of automatic segments', async () => {
      await expect(
        removeManualSegment(testCustomerId, testSegmentId)
      ).rejects.toThrow('Cannot manually remove automatic segment')
    })

    it('should throw error for non-existent segment', async () => {
      await expect(
        removeManualSegment(testCustomerId, 'non-existent-id')
      ).rejects.toThrow('Segment not found')
    })
  })

  describe('getAllSegments', () => {
    it('should return all segments', async () => {
      const segments = await getAllSegments()

      expect(segments.length).toBeGreaterThanOrEqual(2)
      expect(segments.some((s) => s.id === testSegmentId)).toBe(true)
      expect(segments.some((s) => s.id === manualSegmentId)).toBe(true)
    })

    it('should return segments ordered by name', async () => {
      const segments = await getAllSegments()

      for (let i = 1; i < segments.length; i++) {
        expect(segments[i].name >= segments[i - 1].name).toBe(true)
      }
    })
  })

  describe('createSegment', () => {
    it('should create a new automatic segment', async () => {
      const segment = await createSegment({
        name: 'Test Auto Segment',
        criteria: {
          minLifetimeValue: 1000,
          minOrders: 5,
        },
        isAutomatic: true,
        description: 'Test description',
      })

      expect(segment.id).toBeDefined()
      expect(segment.name).toBe('Test Auto Segment')
      expect(segment.isAutomatic).toBe(true)
      expect(segment.description).toBe('Test description')

      // Clean up
      await prisma.customerSegment.delete({
        where: { id: segment.id },
      })
    })

    it('should create a new manual segment', async () => {
      const segment = await createSegment({
        name: 'Test Manual Segment',
        criteria: {},
        isAutomatic: false,
      })

      expect(segment.id).toBeDefined()
      expect(segment.name).toBe('Test Manual Segment')
      expect(segment.isAutomatic).toBe(false)

      // Clean up
      await prisma.customerSegment.delete({
        where: { id: segment.id },
      })
    })
  })
})
