import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth-admin'
import { Permission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/customers/[id]/marketing
 * 
 * Get customer's marketing engagement data
 * 
 * Requirements:
 * - 5.1: Display email opt-in status, SMS opt-in status, and push notification status
 * - 19.1: Verify admin has customer view permissions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require MARKETING_READ permission
    await requirePermission(Permission.MARKETING_READ)

    const customerId = params.id

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check newsletter subscription
    const newsletterSub = await prisma.newsletterSubscription.findUnique({
      where: { email: user.email }
    })

    // Get customer segments
    const segmentAssignments = await prisma.customerSegmentAssignment.findMany({
      where: { customerId },
      include: {
        segment: {
          select: {
            id: true,
            name: true,
            isAutomatic: true
          }
        }
      }
    })

    // For now, return mock data for campaigns and engagement metrics
    // These would be populated from a marketing automation system
    const campaigns: any[] = []
    const openRate = 0
    const clickRate = 0
    const lastEmailOpened = null
    const lastCampaignClicked = null

    return NextResponse.json({
      emailOptIn: newsletterSub?.isActive ?? false,
      smsOptIn: false, // Not implemented yet
      pushOptIn: false, // Not implemented yet
      campaigns,
      openRate,
      clickRate,
      lastEmailOpened,
      lastCampaignClicked,
      segments: segmentAssignments.map(sa => sa.segment.name)
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

    console.error('Error fetching customer marketing:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer marketing' },
      { status: 500 }
    )
  }
}
