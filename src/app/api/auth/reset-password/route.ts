import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  validatePasswordResetToken, 
  deletePasswordResetToken 
} from '@/lib/verification-token'
import { 
  validatePasswordComprehensive, 
  hashPassword 
} from '@/lib/password-validation'
import { 
  isPasswordReused, 
  addPasswordToHistory 
} from '@/lib/password-history'
import { logPasswordResetCompleted, logPasswordChanged } from '@/lib/auth-audit-logger'
import { 
  invalidateUserSessions, 
  extractSessionToken 
} from '@/lib/session-invalidation'

/**
 * POST /api/auth/reset-password
 * 
 * Complete password reset with new password
 * 
 * Requirements:
 * - 4.4: Validate token on page load
 * - 4.5: Validate new password meets requirements
 * - 4.6: Check token expiry (1 hour)
 * - 6.6: Invalidate all sessions except current one
 * - 10.2: Validate password meets all requirements (8+ chars, mixed case, numbers, special chars)
 * - 10.3: Check password against Have I Been Pwned API
 * - 10.4: Update password hash with bcrypt cost 12
 * - 10.5: Check password against last 5 password hashes in PasswordHistory
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    // Validate required fields
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    // Requirement 4.6: Validate reset token and check expiry (1 hour)
    const email = await validatePasswordResetToken(token)

    if (!email) {
      return NextResponse.json(
        { 
          error: 'Invalid or expired reset token',
          code: 'TOKEN_INVALID',
        },
        { status: 400 }
      )
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // Requirement 10.2 & 10.3: Validate new password meets all requirements
    // This includes checking against Have I Been Pwned API
    const passwordValidation = await validatePasswordComprehensive(password)

    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet requirements',
          code: 'PASSWORD_INVALID',
          details: passwordValidation.errors,
        },
        { status: 400 }
      )
    }

    // Requirement 10.5: Check password against last 5 password hashes
    const isReused = await isPasswordReused(user.id, password)

    if (isReused) {
      return NextResponse.json(
        { 
          error: 'Please choose a password you haven\'t used recently',
          code: 'PASSWORD_REUSED',
        },
        { status: 400 }
      )
    }

    // Get the current password hash before updating (for password history)
    const currentAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: 'credential',
      },
    })

    // Requirement 10.4: Hash password using bcrypt with cost factor 12
    const newPasswordHash = await hashPassword(password)

    // Update password in Account table (Better Auth stores passwords here)
    await prisma.account.updateMany({
      where: {
        userId: user.id,
        providerId: 'credential',
      },
      data: {
        password: newPasswordHash,
      },
    })

    // Store old password hash in PasswordHistory (if it exists)
    if (currentAccount?.password) {
      await addPasswordToHistory(user.id, currentAccount.password)
    }

    // Requirement 6.6: Invalidate all sessions except current one
    // Get current session token from cookie
    const cookieHeader = request.headers.get('cookie') || ''
    const currentSessionToken = extractSessionToken(cookieHeader)

    // Invalidate all sessions except the current one (clears both DB and Redis)
    await invalidateUserSessions(user.id, currentSessionToken)

    // Delete the used reset token
    await deletePasswordResetToken(token)
    
    // Log password reset completion
    const ipAddress = 
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    await logPasswordResetCompleted(user.id, user.email, ipAddress, userAgent)
    await logPasswordChanged(user.id, user.email, ipAddress, userAgent, {
      method: 'password_reset',
    })

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    })
  } catch (error) {
    console.error('Password reset completion error:', error)
    
    return NextResponse.json(
      { 
        error: 'An error occurred while resetting your password',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
