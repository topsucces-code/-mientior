/**
 * Customer 360 API Permission Enforcement Property-Based Tests
 * 
 * Feature: customer-360-dashboard, Property 5: Permission enforcement
 * Validates: Requirements 19.1, 19.2, 19.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { GET } from './route'
import { NextRequest } from 'next/server'
import { Permission } from '@/lib/permissions'
import { Role } from '@prisma/client'

// Mock dependencies
vi.mock('@/lib/auth-admin', () => ({
  requirePermission: vi.fn(),
}))

vi.mock('@/lib/customer-360', () => ({
  getCustomer360View: vi.fn(),
}))

import { requirePermission } from '@/lib/auth-admin'
import { getCustomer360View } from '@/lib/customer-360'

describe('Customer 360 API - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Feature: customer-360-dashboard, Property 5: Permission enforcement
  // Validates: Requirements 19.1, 19.2, 19.3
  describe('Property 5: Permission enforcement', () => {
    it('should verify USERS_READ permission before displaying customer data', { timeout: 30000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerId: fc.uuid(),
            hasPermission: fc.boolean(),
            customerData: fc.record({
              profile: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                email: fc.emailAddress(),
              }),
              metrics: fc.record({
                lifetimeValue: fc.float({ min: 0, max: 100000, noNaN: true }),
                totalOrders: fc.integer({ min: 0, max: 1000 }),
              }),
            }),
          }),
          async ({ customerId, hasPermission, customerData }) => {
            // Reset mocks for each iteration
            vi.clearAllMocks()
            
            // Mock permission check
            if (hasPermission) {
              vi.mocked(requirePermission).mockResolvedValueOnce({
                user: { id: 'admin-id', email: 'admin@test.com', name: 'Admin' },
                session: {} as any,
                adminUser: {
                  id: 'admin-id',
                  email: 'admin@test.com',
                  role: Role.ADMIN,
                  permissions: [Permission.USERS_READ],
                } as any,
              })
              vi.mocked(getCustomer360View).mockResolvedValueOnce(customerData as any)
            } else {
              vi.mocked(requirePermission).mockRejectedValueOnce(
                new Error('Forbidden: Missing permission USERS_READ')
              )
            }

            // Create mock request
            const request = new NextRequest(
              `http://localhost:3000/api/admin/customers/${customerId}/360`
            )

            // Call API endpoint
            const response = await GET(request, { params: { id: customerId } })
            const data = await response.json()

            if (hasPermission) {
              // Should succeed and return customer data
              expect(response.status).toBe(200)
              expect(data.profile).toBeDefined()
              expect(data.metrics).toBeDefined()
              
              // Verify permission was checked
              expect(requirePermission).toHaveBeenCalledWith(Permission.USERS_READ)
              
              // Verify customer data was fetched
              expect(getCustomer360View).toHaveBeenCalledWith(customerId)
            } else {
              // Should fail with 403 Forbidden
              expect(response.status).toBe(403)
              expect(data.error).toContain('Forbidden')
              
              // Verify permission was checked
              expect(requirePermission).toHaveBeenCalledWith(Permission.USERS_READ)
              
              // Verify customer data was NOT fetched
              expect(getCustomer360View).not.toHaveBeenCalled()
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should enforce permission checks for all admin users regardless of role', { timeout: 30000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerId: fc.uuid(),
            adminRole: fc.constantFrom(
              Role.SUPER_ADMIN,
              Role.ADMIN,
              Role.MANAGER,
              Role.SUPPORT,
              Role.VIEWER
            ),
            hasUsersReadPermission: fc.boolean(),
          }),
          async ({ customerId, adminRole, hasUsersReadPermission }) => {
            // Reset mocks for each iteration
            vi.clearAllMocks()
            
            // Mock permission check based on whether admin has permission
            if (hasUsersReadPermission) {
              vi.mocked(requirePermission).mockResolvedValueOnce({
                user: { id: 'admin-id', email: 'admin@test.com', name: 'Admin' },
                session: {} as any,
                adminUser: {
                  id: 'admin-id',
                  email: 'admin@test.com',
                  role: adminRole,
                  permissions: [Permission.USERS_READ],
                } as any,
              })
              vi.mocked(getCustomer360View).mockResolvedValueOnce({
                profile: { id: customerId, name: 'Test', email: 'test@test.com' },
                metrics: { lifetimeValue: 1000, totalOrders: 5 },
              } as any)
            } else {
              vi.mocked(requirePermission).mockRejectedValueOnce(
                new Error('Forbidden: Missing permission USERS_READ')
              )
            }

            // Create mock request
            const request = new NextRequest(
              `http://localhost:3000/api/admin/customers/${customerId}/360`
            )

            // Call API endpoint
            const response = await GET(request, { params: { id: customerId } })

            // Permission check should always be enforced regardless of role
            expect(requirePermission).toHaveBeenCalledWith(Permission.USERS_READ)

            if (hasUsersReadPermission) {
              expect(response.status).toBe(200)
            } else {
              expect(response.status).toBe(403)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 401 Unauthorized when not authenticated', { timeout: 30000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (customerId) => {
            // Reset mocks for each iteration
            vi.clearAllMocks()
            
            // Mock authentication failure
            vi.mocked(requirePermission).mockRejectedValueOnce(
              new Error('Unauthorized: Admin access required')
            )

            // Create mock request
            const request = new NextRequest(
              `http://localhost:3000/api/admin/customers/${customerId}/360`
            )

            // Call API endpoint
            const response = await GET(request, { params: { id: customerId } })
            const data = await response.json()

            // Should return 401 Unauthorized
            expect(response.status).toBe(401)
            expect(data.error).toContain('Unauthorized')
            
            // Verify permission check was attempted
            expect(requirePermission).toHaveBeenCalledWith(Permission.USERS_READ)
            
            // Verify customer data was NOT fetched
            expect(getCustomer360View).not.toHaveBeenCalled()
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
