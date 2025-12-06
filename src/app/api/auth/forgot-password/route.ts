import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePasswordResetToken, invalidatePasswordResetTokens } from '@/lib/verification-token'
import { sendPasswordResetEmail } from '@/lib/email'
import { rateLimitPasswordReset } from '@/lib/auth-rate-limit'
import { logPasswordResetRequested } from '@/lib/auth-audit-logger'

/**
 * POST /api/auth/forgot-password
 * 
 * Request password reset for a user account
 * 
 * Requirements:
 * - 4.1: Display password reset request form
 * - 4.2: Send password reset email with time-limited token (1 hour)
 * - 4.3: Always show success message (prevent email enumeration)
 * - 4.7: Rate limit to 3 requests per hour per user
 * - 8.7: Use cryptographically secure random tokens (32 bytes)
 */
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      // Still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      })
    }

    // Apply rate limiting (3 requests per hour per email)
    // Requirement 4.7: Rate limit password reset requests
    const rateLimitResult = await rateLimitPasswordReset(email)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many password reset requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
          },
        }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Requirement 4.3: Always return success to prevent email enumeration
    // But only send email if user exists
    if (user) {
      // Invalidate any existing password reset tokens
      await invalidatePasswordResetTokens(email)

      // Requirement 8.7: Generate cryptographically secure reset token (32 bytes)
      const token = await generatePasswordResetToken(email)

      // Build reset URL
      const baseURL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
      const resetUrl = `${baseURL}/reset-password?token=${token}`

      // Extract IP address for security information
      const forwardedFor = request.headers.get('x-forwarded-for')
      const realIp = request.headers.get('x-real-ip')
      let ipAddress = 'Unknown'
      if (forwardedFor) {
        ipAddress = forwardedFor.split(',')[0]?.trim() || 'Unknown'
      } else if (realIp) {
        ipAddress = realIp
      }

      // Requirement 4.2: Send password reset email with 1-hour token
      // User model has firstName/lastName, not name - construct display name
      const displayName = [user!.firstName, user!.lastName].filter(Boolean).join(' ') || 'User'
      await sendPasswordResetEmail({
        name: displayName,
        email,
        resetUrl,
        expiresIn: '1 hour',
        ipAddress,
      })
      
      // Log password reset request
      const userAgent = request.headers.get('user-agent') || 'unknown'
      await logPasswordResetRequested(email, ipAddress, userAgent, {
        userId: user.id,
      })
    }

    // Requirement 4.3: Always return success message to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    })
  } catch (error) {
    console.error('Password reset request error:', error)
    
    // Still return success to prevent information leakage
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    })
  }
}
