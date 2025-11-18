/**
 * API endpoint for validating promo codes
 */

import { NextRequest, NextResponse } from 'next/server'
import type { CouponCode } from '@/types'
import { formatCurrency } from '@/lib/currency'

// In production, this would query a PromoCodes collection in Prisma
// For now, using hardcoded promo codes
const PROMO_CODES: Record<string, { discount: number; type: 'percentage' | 'fixed'; scope: 'cart' | 'shipping'; minPurchase?: number; expiresAt?: Date }> = {
  'WELCOME10': { discount: 10, type: 'percentage', scope: 'cart', minPurchase: 0 },
  'SAVE20': { discount: 20, type: 'percentage', scope: 'cart', minPurchase: 5000 }, // $50 in cents
  'FREESHIP': { discount: 599, type: 'fixed', scope: 'shipping', minPurchase: 0 }, // $5.99 shipping cost
  'SUMMER25': { discount: 25, type: 'percentage', scope: 'cart', minPurchase: 10000 }, // $100 in cents
}

export async function POST(request: NextRequest) {
  try {
    const { code, cartTotal } = await request.json()

    if (!code) {
      return NextResponse.json({
        valid: false,
        message: 'Code promo requis',
      })
    }

    // Normalize code
    const normalizedCode = code.toUpperCase().trim()

    // Check if code exists
    const promoConfig = PROMO_CODES[normalizedCode]

    if (!promoConfig) {
      return NextResponse.json({
        valid: false,
        message: 'Code promo invalide',
      })
    }

    // Check expiration
    if (promoConfig.expiresAt && new Date() > promoConfig.expiresAt) {
      return NextResponse.json({
        valid: false,
        message: 'Code promo expiré',
      })
    }

    // Check minimum purchase (cartTotal is in cents)
    if (promoConfig.minPurchase && cartTotal < promoConfig.minPurchase) {
      return NextResponse.json({
        valid: false,
        message: `Montant minimum de ${formatCurrency(promoConfig.minPurchase)} requis`,
      })
    }

    // Build coupon response
    const coupon: CouponCode = {
      code: normalizedCode,
      discount: promoConfig.discount,
      type: promoConfig.type,
      scope: promoConfig.scope,
      minPurchase: promoConfig.minPurchase,
      expiresAt: promoConfig.expiresAt
    }

    return NextResponse.json({
      valid: true,
      coupon,
      message: `Code promo appliqué avec succès`,
    })
  } catch (error) {
    console.error('Promo validation error:', error)
    return NextResponse.json(
      {
        valid: false,
        message: 'Erreur lors de la validation du code promo',
      },
      { status: 500 }
    )
  }
}

