/**
 * API endpoint for validating promo codes
 */

import { NextRequest, NextResponse } from 'next/server'

// In production, this would query a PromoCodes collection in Payload
// For now, using hardcoded promo codes
const PROMO_CODES: Record<string, { discount: number; discountType: 'percentage' | 'fixed'; minAmount?: number; maxDiscount?: number }> = {
  'WELCOME10': { discount: 10, discountType: 'percentage', minAmount: 0 },
  'SAVE20': { discount: 20, discountType: 'percentage', minAmount: 50 },
  'FREESHIP': { discount: 490, discountType: 'fixed', minAmount: 0 }, // 4.90€ in cents
  'SUMMER25': { discount: 25, discountType: 'percentage', minAmount: 100, maxDiscount: 5000 }, // Max 50€
}

export async function POST(request: NextRequest) {
  try {
    const { code, cartTotal } = await request.json()

    if (!code) {
      return NextResponse.json({
        valid: false,
        discount: 0,
        discountType: 'fixed' as const,
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
        discount: 0,
        discountType: 'fixed' as const,
        message: 'Code promo invalide',
      })
    }

    // Check minimum amount
    if (promoConfig.minAmount && cartTotal < promoConfig.minAmount) {
      return NextResponse.json({
        valid: false,
        discount: 0,
        discountType: promoConfig.discountType,
        message: `Montant minimum de ${promoConfig.minAmount.toFixed(2)}€ requis`,
      })
    }

    // Calculate discount
    let discount = promoConfig.discount

    if (promoConfig.discountType === 'percentage') {
      // Convert percentage to actual amount (in cents if cartTotal is in cents)
      const isInCents = cartTotal > 1000 // Heuristic: if > 1000, likely in cents
      const totalInEuros = isInCents ? cartTotal / 100 : cartTotal
      discount = (totalInEuros * promoConfig.discount) / 100
      
      // Apply max discount if set
      if (promoConfig.maxDiscount) {
        const maxInEuros = isInCents ? promoConfig.maxDiscount / 100 : promoConfig.maxDiscount
        discount = Math.min(discount, maxInEuros)
      }
      
      // Convert back to cents if needed
      if (isInCents) {
        discount = Math.round(discount * 100)
      }
    }

    return NextResponse.json({
      valid: true,
      discount,
      discountType: promoConfig.discountType,
      message: `Code promo appliqué: -${promoConfig.discountType === 'percentage' ? promoConfig.discount + '%' : (discount / 100).toFixed(2) + '€'}`,
    })
  } catch (error) {
    console.error('Promo validation error:', error)
    return NextResponse.json(
      {
        valid: false,
        discount: 0,
        discountType: 'fixed' as const,
        message: 'Erreur lors de la validation du code promo',
      },
      { status: 500 }
    )
  }
}

