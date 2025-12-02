import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateVerificationToken, deleteVerificationToken } from '@/lib/verification-token'
import { sendWelcomeEmailAuth } from '@/lib/email'
import { logEmailVerified } from '@/lib/auth-audit-logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Invalid verification link' },
        { status: 400 }
      )
    }

    // Validate the token and get the email
    const email = await validateVerificationToken(token)

    if (!email) {
      // Check if token exists but is expired
      const expiredToken = await prisma.verification.findFirst({
        where: { value: token },
      })

      if (expiredToken) {
        return NextResponse.json(
          { 
            error: 'Verification link has expired',
            expired: true 
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Invalid verification link' },
        { status: 400 }
      )
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { 
          success: true,
          message: 'Email already verified',
          alreadyVerified: true 
        },
        { status: 200 }
      )
    }

    // Update user's emailVerified status
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    })

    // Delete the verification token
    await deleteVerificationToken(token)

    // Send welcome email
    const userName = user.name || email.split('@')[0] || 'User'
    await sendWelcomeEmailAuth({
      name: userName,
      email: user.email,
    })
    
    // Log email verification
    await logEmailVerified(user.id, user.email, {
      userName,
    })

    return NextResponse.json(
      { 
        success: true,
        message: 'Email verified successfully' 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'An error occurred during verification' },
      { status: 500 }
    )
  }
}
