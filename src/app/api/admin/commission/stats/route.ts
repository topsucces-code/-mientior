import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth-server'
import { generateCommissionReport } from '@/lib/marketplace-commission-system'
import { Permission } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication with financial permissions
    await requireAdminAuth(Permission.FINANCIAL_VIEW)

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    // Calculate date range based on period
    const endDate = new Date()
    const startDate = new Date()

    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    // Generate commission report
    const report = await generateCommissionReport(startDate, endDate)

    // Calculate additional metrics
    const averageCommissionRate = report.totalSales > 0 
      ? report.totalCommission / report.totalSales 
      : 0

    const activeVendors = report.topVendors.length

    return NextResponse.json({
      totalCommission: report.totalCommission,
      totalSales: report.totalSales,
      vendorPayouts: report.vendorPayouts,
      pendingPayouts: 0, // Will be calculated from PayoutRequest table
      activeVendors,
      averageCommissionRate,
      topVendors: report.topVendors.map(vendor => ({
        ...vendor,
        payoutMethod: 'MOBILE_MONEY' // Default for Côte d'Ivoire market
      })),
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    })

  } catch (error) {
    console.error('Commission stats error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Permission denied')) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
      if (error.message.includes('Admin authentication required')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch commission statistics' },
      { status: 500 }
    )
  }
}