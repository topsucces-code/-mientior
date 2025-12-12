import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession()

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get email verification status from BetterAuthUser
    const betterAuthUser = await prisma.betterAuthUser.findUnique({
      where: { id: session.user.id },
      select: {
        emailVerified: true,
        email: true,
      },
    })

    if (!betterAuthUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      emailVerified: betterAuthUser.emailVerified,
      email: betterAuthUser.email,
    })
  } catch (error) {
    console.error('Verification status error:', error)
    return NextResponse.json(
      { error: 'An error occurred while checking verification status' },
      { status: 500 }
    )
  }
}
