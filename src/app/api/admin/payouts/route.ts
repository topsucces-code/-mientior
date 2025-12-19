import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { Permission } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication with financial permissions
    await requireAdminAuth(Permission.FINANCIAL_VIEW)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const vendorId = searchParams.get('vendorId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status.toUpperCase()
    }
    if (vendorId) {
      where.vendorId = vendorId
    }

    // Fetch payout requests with vendor information
    const [requests, total] = await Promise.all([
      prisma.payoutRequest.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              payoutSettings: {
                select: {
                  mobileMoneyProvider: true,
                  phoneNumber: true,
                  preferredMethod: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.payoutRequest.count({ where })
    ])

    // Format response
    const formattedRequests = requests.map(request => ({
      id: request.id,
      vendorId: request.vendorId,
      vendorName: request.vendor.businessName,
      amount: request.amount,
      currency: request.currency,
      method: request.method,
      mobileMoneyProvider: request.vendor.payoutSettings?.mobileMoneyProvider || 
                          request.metadata?.mobileMoneyProvider,
      phoneNumber: request.vendor.payoutSettings?.phoneNumber || 
                   request.metadata?.phoneNumber,
      status: request.status,
      transactionId: request.transactionId,
      createdAt: request.createdAt.toISOString(),
      scheduledAt: request.scheduledAt?.toISOString(),
      processedAt: request.processedAt?.toISOString(),
      completedAt: request.completedAt?.toISOString(),
      failedAt: request.failedAt?.toISOString(),
      failureReason: request.failureReason
    }))

    return NextResponse.json({
      requests: formattedRequests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Payouts fetch error:', error)
    
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
      { error: 'Failed to fetch payout requests' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication with financial management permissions
    await requireAdminAuth(Permission.FINANCIAL_MANAGE)

    const body = await request.json()
    const { vendorId, amount, currency = 'XOF', method, metadata } = body

    // Validate required fields
    if (!vendorId || !amount || !method) {
      return NextResponse.json(
        { error: 'Vendor ID, amount, and method are required' },
        { status: 400 }
      )
    }

    // Validate amount
    if (amount < 1000) { // Minimum 1,000 XOF
      return NextResponse.json(
        { error: 'Minimum payout amount is 1,000 XOF' },
        { status: 400 }
      )
    }

    // Check vendor exists and has sufficient balance
    const vendor = await prisma.vendors.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        businessName: true,
        pendingBalance: true,
        payoutSettings: true
      }
    })

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      )
    }

    if (vendor.pendingBalance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance for payout' },
        { status: 400 }
      )
    }

    // Create payout request
    const payoutRequest = await prisma.payoutRequest.create({
      data: {
        vendorId,
        amount,
        currency,
        method,
        status: 'PENDING',
        scheduledAt: new Date(),
        metadata: {
          ...metadata,
          createdBy: 'admin', // Track who created the payout
          mobileMoneyProvider: vendor.payoutSettings?.mobileMoneyProvider,
          phoneNumber: vendor.payoutSettings?.phoneNumber
        }
      },
      include: {
        vendor: {
          select: {
            businessName: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      payoutRequest: {
        id: payoutRequest.id,
        vendorName: payoutRequest.vendor.businessName,
        amount: payoutRequest.amount,
        currency: payoutRequest.currency,
        method: payoutRequest.method,
        status: payoutRequest.status,
        createdAt: payoutRequest.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Payout creation error:', error)
    
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
      { error: 'Failed to create payout request' },
      { status: 500 }
    )
  }
}