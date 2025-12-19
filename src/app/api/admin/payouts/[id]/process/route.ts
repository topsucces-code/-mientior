import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { processMobileMoneyPayout } from '@/lib/marketplace-commission-system'
import { Permission } from '@/lib/permissions'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication with financial management permissions
    await requireAdminAuth(Permission.FINANCIAL_MANAGE)

    const payoutId = params.id

    // Fetch payout request with vendor details
    const payoutRequest = await prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      include: {
        vendor: {
          include: {
            payoutSettings: true
          }
        }
      }
    })

    if (!payoutRequest) {
      return NextResponse.json(
        { error: 'Payout request not found' },
        { status: 404 }
      )
    }

    if (payoutRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Payout request is already ${payoutRequest.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Update status to processing
    await prisma.payoutRequest.update({
      where: { id: payoutId },
      data: {
        status: 'PROCESSING',
        processedAt: new Date()
      }
    })

    try {
      let result: { success: boolean; transactionId?: string; error?: string }

      // Process based on payment method
      switch (payoutRequest.method) {
        case 'MOBILE_MONEY':
          const mobileMoneyProvider = payoutRequest.vendor.payoutSettings?.mobileMoneyProvider ||
                                    payoutRequest.metadata?.mobileMoneyProvider
          const phoneNumber = payoutRequest.vendor.payoutSettings?.phoneNumber ||
                            payoutRequest.metadata?.phoneNumber

          if (!mobileMoneyProvider || !phoneNumber) {
            throw new Error('Mobile Money provider and phone number are required')
          }

          result = await processMobileMoneyPayout({
            vendorId: payoutRequest.vendorId,
            amount: payoutRequest.amount,
            currency: payoutRequest.currency as 'XOF' | 'EUR',
            method: 'MOBILE_MONEY',
            mobileMoneyProvider: mobileMoneyProvider as 'ORANGE' | 'MTN' | 'MOOV',
            accountDetails: {
              phoneNumber
            }
          })
          break

        case 'BANK_TRANSFER':
          // TODO: Implement bank transfer processing
          result = {
            success: true,
            transactionId: `BANK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
          break

        case 'CASH':
          // For cash payouts, mark as completed immediately
          result = {
            success: true,
            transactionId: `CASH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
          break

        default:
          throw new Error(`Unsupported payout method: ${payoutRequest.method}`)
      }

      if (result.success) {
        // Update payout request as completed
        await prisma.$transaction(async (tx) => {
          // Update payout request
          await tx.payoutRequest.update({
            where: { id: payoutId },
            data: {
              status: 'COMPLETED',
              transactionId: result.transactionId,
              completedAt: new Date()
            }
          })

          // Update vendor balance
          await tx.vendor.update({
            where: { id: payoutRequest.vendorId },
            data: {
              pendingBalance: {
                decrement: payoutRequest.amount
              }
            }
          })

          // Create vendor transaction record
          await tx.vendorTransaction.create({
            data: {
              vendorId: payoutRequest.vendorId,
              type: 'PAYOUT',
              amount: -payoutRequest.amount,
              currency: payoutRequest.currency,
              description: `Paiement ${payoutRequest.method} - ${result.transactionId}`,
              payoutId: payoutRequest.id,
              balanceBefore: payoutRequest.vendor.pendingBalance,
              balanceAfter: payoutRequest.vendor.pendingBalance - payoutRequest.amount,
              metadata: {
                transactionId: result.transactionId,
                method: payoutRequest.method,
                processedBy: 'admin'
              }
            }
          })
        })

        return NextResponse.json({
          success: true,
          message: 'Payout processed successfully',
          transactionId: result.transactionId
        })

      } else {
        // Update payout request as failed
        await prisma.payoutRequest.update({
          where: { id: payoutId },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            failureReason: result.error || 'Unknown error'
          }
        })

        return NextResponse.json({
          success: false,
          error: result.error || 'Payout processing failed'
        }, { status: 400 })
      }

    } catch (processingError) {
      // Update payout request as failed
      await prisma.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          failureReason: processingError instanceof Error ? 
            processingError.message : 'Processing error'
        }
      })

      throw processingError
    }

  } catch (error) {
    console.error('Payout processing error:', error)
    
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
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process payout'
      },
      { status: 500 }
    )
  }
}