import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-server'
import { z } from 'zod'

const applySchema = z.object({
  businessName: z.string().min(2, 'Le nom de l\'entreprise est requis'),
  businessType: z.string().min(2, 'Le type d\'activité est requis'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  phone: z.string().min(8, 'Le numéro de téléphone est requis'),
  city: z.string().min(2, 'La ville est requise'),
  country: z.string().length(2, 'Le code pays doit contenir 2 caractères'),
})

// Generate a unique slug from business name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour soumettre une candidature' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = applySchema.parse(body)

    // Get user from database
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Check if user is already a vendor
    if (user.role === 'VENDOR') {
      return NextResponse.json(
        { error: 'Vous êtes déjà un vendeur' },
        { status: 400 }
      )
    }

    // Check if there's already a pending vendor application
    const existingVendor = await prisma.vendors.findUnique({
      where: { userId: user.id },
    })

    if (existingVendor) {
      if (existingVendor.status === 'PENDING') {
        return NextResponse.json(
          { error: 'Vous avez déjà une demande en cours de traitement' },
          { status: 400 }
        )
      }
      if (existingVendor.status === 'ACTIVE') {
        // Update user role to VENDOR if not already
        await prisma.users.update({
          where: { id: user.id },
          data: { role: 'VENDOR' },
        })
        return NextResponse.json(
          { error: 'Votre compte vendeur est déjà actif' },
          { status: 400 }
        )
      }
    }

    // Generate unique slug
    let slug = generateSlug(validatedData.businessName)
    const existingSlug = await prisma.vendors.findUnique({ where: { slug } })
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    // Create vendor application
    const vendor = await prisma.vendors.create({
      data: {
        userId: user.id,
        businessName: validatedData.businessName,
        businessType: validatedData.businessType,
        slug,
        email: user.email,
        description: validatedData.description,
        phone: validatedData.phone,
        city: validatedData.city,
        country: validatedData.country,
        status: 'PENDING',
        commissionRate: 10, // Default 10% commission
      },
    })

    // Update user phone if not set
    if (!user.phone) {
      await prisma.users.update({
        where: { id: user.id },
        data: { phone: validatedData.phone },
      })
    }

    // TODO: Send notification email to admin
    // TODO: Send confirmation email to user

    return NextResponse.json({
      success: true,
      message: 'Votre demande a été soumise avec succès',
      vendorId: vendor.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Vendor application error:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la soumission' },
      { status: 500 }
    )
  }
}
