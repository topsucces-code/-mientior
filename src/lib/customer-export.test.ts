import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { getCustomer360View } from '@/lib/customer-360'
import { generateCustomerExportData } from '@/lib/customer-export'

vi.mock('@/lib/customer-360')
vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    text: vi.fn(),
    setFontSize: vi.fn(),
    output: vi.fn().mockReturnValue('mock-pdf-data'),
  })),
}))
vi.mock('@/lib/audit-logger', () => ({
  logAction: vi.fn().mockResolvedValue(undefined),
}))

describe('Customer Export Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should include all required customer data in exports', async () => {
    const mockCustomerData = {
      profile: {
        id: 'test-customer-1',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: null,
        avatar: null,
        registrationDate: new Date('2023-01-01'),
        accountStatus: 'active',
        addresses: [],
        loyaltyLevel: 'BRONZE' as const,
      },
      metrics: {
        lifetimeValue: 1000,
        totalOrders: 5,
        averageOrderValue: 200,
        totalSpent: 1000,
        daysSinceLastPurchase: 30,
        purchaseFrequency: 0.5,
        customerTenure: 365,
      },
      healthScore: {
        score: 75,
        level: 'good' as const,
        factors: { purchase: 80, engagement: 70, support: 75, recency: 75 },
        recommendations: ['Continue engagement'],
      },
      churnRisk: {
        level: 'LOW' as const,
        score: 25,
        factors: { daysSinceLastPurchase: 30, engagementDecline: 10, supportIssues: 0 },
        retentionStrategies: ['Regular engagement'],
      },
      segments: [],
      tags: [],
    }

    vi.mocked(getCustomer360View).mockResolvedValue(mockCustomerData)
    const exportData = await generateCustomerExportData('test-customer-1', { format: 'pdf' })

    expect(exportData.profile.id).toBe(mockCustomerData.profile.id)
    expect(exportData.profile.name).toBe(mockCustomerData.profile.name)
    expect(exportData.profile.email).toBe(mockCustomerData.profile.email)
    expect(exportData.metrics.lifetimeValue).toBe(mockCustomerData.metrics.lifetimeValue)
    expect(exportData.healthScore.score).toBe(mockCustomerData.healthScore.score)
    expect(exportData.churnRisk.level).toBe(mockCustomerData.churnRisk.level)
  })

  /**
   * **Feature: customer-360-dashboard, Property 9: Export data completeness**
   * **Validates: Requirements 17.2, 17.3**
   */
  it('property test: export data completeness', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          email: fc.emailAddress(),
          lifetimeValue: fc.float({ min: 0, max: 100000 }),
        }),
        async (testData) => {
          const mockCustomerData = {
            profile: {
              id: testData.id,
              name: testData.name,
              email: testData.email,
              phone: null,
              avatar: null,
              registrationDate: new Date(),
              accountStatus: 'active',
              addresses: [],
              loyaltyLevel: 'BRONZE' as const,
            },
            metrics: {
              lifetimeValue: testData.lifetimeValue,
              totalOrders: 1,
              averageOrderValue: 100,
              totalSpent: testData.lifetimeValue,
              daysSinceLastPurchase: 10,
              purchaseFrequency: 0.1,
              customerTenure: 100,
            },
            healthScore: {
              score: 50,
              level: 'fair' as const,
              factors: { purchase: 50, engagement: 50, support: 50, recency: 50 },
              recommendations: [],
            },
            churnRisk: {
              level: 'MEDIUM' as const,
              score: 50,
              factors: { daysSinceLastPurchase: 10, engagementDecline: 20, supportIssues: 1 },
              retentionStrategies: [],
            },
            segments: [],
            tags: [],
          }

          vi.mocked(getCustomer360View).mockResolvedValue(mockCustomerData)
          const exportData = await generateCustomerExportData(testData.id, { format: 'pdf' })

          // Return boolean instead of using expect
          return (
            exportData.profile.id === testData.id &&
            exportData.profile.name === testData.name &&
            exportData.profile.email === testData.email &&
            exportData.metrics.lifetimeValue === testData.lifetimeValue
          )
        }
      ),
      { numRuns: 100 }
    )
  })
})