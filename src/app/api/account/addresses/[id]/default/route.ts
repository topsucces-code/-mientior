import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/account/addresses/[id]/default - Set address as default
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existing = await prisma.savedAddress.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    // Unset all other defaults
    await prisma.savedAddress.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    })

    // Set this one as default
    const address = await prisma.savedAddress.update({
      where: { id },
      data: { isDefault: true },
    })

    return NextResponse.json(address)
  } catch (error) {
    console.error('Error setting default address:', error)
    return NextResponse.json({ error: 'Failed to set default address' }, { status: 500 })
  }
}
