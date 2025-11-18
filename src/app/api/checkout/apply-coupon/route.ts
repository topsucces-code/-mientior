import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, subtotal } = body

    // Validation
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Code promo requis' },
        { status: 400 }
      )
    }

    if (!subtotal || typeof subtotal !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Montant du panier requis' },
        { status: 400 }
      )
    }

    // Find promo code
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!promoCode) {
      return NextResponse.json(
        { success: false, error: 'Code promo invalide' },
        { status: 404 }
      )
    }

    // Check if active
    if (!promoCode.isActive) {
      return NextResponse.json(
        { success: false, error: 'Code promo expiré ou désactivé' },
        { status: 400 }
      )
    }

    // Check validity dates
    const now = new Date()
    if (promoCode.validFrom && promoCode.validFrom > now) {
      return NextResponse.json(
        { success: false, error: 'Code promo pas encore valide' },
        { status: 400 }
      )
    }

    if (promoCode.validTo && promoCode.validTo < now) {
      return NextResponse.json(
        { success: false, error: 'Code promo expiré' },
        { status: 400 }
      )
    }

    // Check minimum order amount (convert from cents to DB format)
    if (promoCode.minOrderAmount && subtotal < promoCode.minOrderAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Montant minimum de ${(promoCode.minOrderAmount / 100).toFixed(2)}€ requis`,
        },
        { status: 400 }
      )
    }

    // Check usage limit
    if (
      promoCode.usageLimit &&
      promoCode.usageCount >= promoCode.usageLimit
    ) {
      return NextResponse.json(
        { success: false, error: 'Nombre maximal d\'utilisations atteint' },
        { status: 400 }
      )
    }

    // Calculate discount based on type
    let discount = 0
    if (promoCode.type === 'PERCENTAGE') {
      discount = Math.round((subtotal * promoCode.value) / 100)
      
      // Apply max discount if specified
      if (promoCode.maxDiscount && discount > promoCode.maxDiscount) {
        discount = promoCode.maxDiscount
      }
    } else if (promoCode.type === 'FIXED_AMOUNT') {
      discount = Math.round(promoCode.value)
      
      // Discount can't be more than subtotal
      if (discount > subtotal) {
        discount = subtotal
      }
    }

    return NextResponse.json({
      success: true,
      discount, // in cents
      message: `Code promo appliqué ! Réduction de ${(discount / 100).toFixed(2)}€`,
      promoCodeId: promoCode.id,
    })
  } catch (error) {
    console.error('Apply coupon error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'application du code promo' },
      { status: 500 }
    )
  }
}
