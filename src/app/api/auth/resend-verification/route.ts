import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateVerificationToken, invalidateVerificationTokens } from '@/lib/verification-token'
import { sendVerificationEmail } from '@/lib/email'
import { rateLimitAuth } from '@/lib/auth-rate-limit'

// Rate limit config: 1 resend per 5 minutes per email
const RESEND_RATE_LIMIT = {
  maxAttempts: 1,
  windowMs: 5 * 60 * 1000, // 5 minutes
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Apply rate limiting (1 resend per 5 minutes per email)
    const rateLimitResult = await rateLimitAuth(
      email,
      'registration', // Reuse registration operation type
      RESEND_RATE_LIMIT
    )

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '300',
          },
        }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Always return success to prevent email enumeration
    // But only send email if user exists and is not verified
    if (user && !user.emailVerified) {
      // Invalidate any existing verification tokens
      await invalidateVerificationTokens(email)

      // Generate new verification token
      const token = await generateVerificationToken(email)

      // Build verification URL
      const baseURL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
      const verificationUrl = `${baseURL}/verify-email?token=${token}`

      // Send verification email
      await sendVerificationEmail({
        name: user.name,
        email,
        verificationUrl,
        expiresIn: '24 hours',
      })
    }

    // Always return success message to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a verification link has been sent.',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    
    // Still return success to prevent information leakage
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a verification link has been sent.',
    })
  }
}
