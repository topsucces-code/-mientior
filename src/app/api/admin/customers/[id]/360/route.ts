import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth-admin'
import { Permission } from '@/lib/permissions'
import { getCustomer360View } from '@/lib/customer-360'
import { maskCustomer360View, getAllowedActions } from '@/lib/customer-360-permissions'

/**
 * GET /api/admin/customers/[id]/360
 * 
 * Get comprehensive 360 view of a customer
 * 
 * Requirements:
 * - 1.1: Display customer profile overview
 * - 19.1: Verify admin has customer view permissions
 * - 19.2: Mask sensitive data based on role
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require USERS_READ permission
    const adminSession = await requirePermission(Permission.USERS_READ)

    const customerId = params.id

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    // Get customer 360 view
    const customer360 = await getCustomer360View(customerId)

    if (!customer360) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Apply role-based data masking
    const customPermissions = adminSession.adminUser.permissions as Permission[] | null
    const maskedData = maskCustomer360View(customer360, {
      role: adminSession.adminUser.role,
      permissions: customPermissions || [],
    })

    // Include allowed actions for UI to show/hide features
    const allowedActions = getAllowedActions({
      role: adminSession.adminUser.role,
      permissions: customPermissions || [],
    })

    return NextResponse.json({
      ...maskedData,
      _permissions: allowedActions,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
    }

    console.error('Error fetching customer 360 view:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer 360 view' },
      { status: 500 }
    )
  }
}
