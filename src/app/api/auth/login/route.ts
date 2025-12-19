import { NextRequest, NextResponse } from 'next/server'
// import { auth } from '@/lib/auth' // Not used - using direct Prisma auth
import { prisma } from '@/lib/prisma'
import {
  checkAccountLockout,
  trackFailedLoginAttempt,
  clearAccountLockout,
  clearFailedLoginAttempts,
} from '@/lib/auth-rate-limit'
import { updateLoginMetadata } from '@/lib/login-metadata'
import { detectAndAlertNewDevice } from '@/lib/new-device-detection'
import { logLoginSuccess, logLoginFailed } from '@/lib/auth-audit-logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, rememberMe } = body
    
    // Extract IP and user agent for audit logging
    const ipAddress = 
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if account is locked
    const lockoutStatus = await checkAccountLockout(email)
    if (lockoutStatus.isLocked) {
      return NextResponse.json(
        {
          error: 'Account temporarily locked due to too many failed attempts',
          code: 'ACCOUNT_LOCKED',
          lockedUntil: lockoutStatus.lockedUntil?.toISOString(),
          remainingSeconds: lockoutStatus.remainingSeconds,
        },
        { status: 429 }
      )
    }

    // Find user account with password
    const account = await prisma.accounts.findFirst({
      where: {
        accountId: email,
        providerId: 'credential',
      },
      include: {
        better_auth_users: true,
      },
    })

    if (!account || !account.password) {
      const shouldLock = await trackFailedLoginAttempt(email)
      await logLoginFailed(email, ipAddress, userAgent, 'User not found', { shouldLock })
      
      if (shouldLock) {
        const newLockoutStatus = await checkAccountLockout(email)
        return NextResponse.json(
          {
            error: 'Account temporarily locked due to too many failed attempts',
            code: 'ACCOUNT_LOCKED',
            lockedUntil: newLockoutStatus.lockedUntil?.toISOString(),
            remainingSeconds: newLockoutStatus.remainingSeconds,
          },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const bcrypt = await import('bcryptjs')
    const isValidPassword = await bcrypt.compare(password, account.password)

    if (!isValidPassword) {
      const shouldLock = await trackFailedLoginAttempt(email)
      await logLoginFailed(email, ipAddress, userAgent, 'Invalid password', { shouldLock })
      
      if (shouldLock) {
        const newLockoutStatus = await checkAccountLockout(email)
        return NextResponse.json(
          {
            error: 'Account temporarily locked due to too many failed attempts',
            code: 'ACCOUNT_LOCKED',
            lockedUntil: newLockoutStatus.lockedUntil?.toISOString(),
            remainingSeconds: newLockoutStatus.remainingSeconds,
          },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const betterAuthUser = account.better_auth_users

    // Clear lockout and failed attempts on successful login
    await clearAccountLockout(email)
    await clearFailedLoginAttempts(email)

    // Check application user profile for 2FA status
    const userProfile = await prisma.users.findUnique({
      where: { email: betterAuthUser.email },
      select: { two_factor_enabled: true }
    })

    // Create session token
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7))

    // Create session in database
    await prisma.sessions.create({
      data: {
        id: crypto.randomUUID(),
        userId: betterAuthUser.id,
        token: sessionToken,
        expiresAt,
        updatedAt: new Date(),
      },
    })

    // If 2FA is enabled, return a pending status and require 2FA verification
    if (userProfile?.two_factor_enabled) {
      await logLoginSuccess(
        betterAuthUser.id,
        betterAuthUser.email,
        ipAddress,
        userAgent,
        { rememberMe, requires2FA: true }
      )

      return NextResponse.json({
        code: 'REQUIRES_2FA',
        userId: betterAuthUser.id,
        tempToken: sessionToken,
        message: '2FA verification required',
      }, { status: 200 })
    }

    // Update login metadata
    await updateLoginMetadata(betterAuthUser.id, sessionToken, request)

    // Detect new device/location asynchronously
    detectAndAlertNewDevice(betterAuthUser.id, request, sessionToken).catch((error) => {
      console.error('Error in new device detection:', error)
    })
    
    // Log successful login
    await logLoginSuccess(
      betterAuthUser.id,
      betterAuthUser.email,
      ipAddress,
      userAgent,
      { rememberMe }
    )

    // Set session cookie
    const response = NextResponse.json({
      user: {
        id: betterAuthUser.id,
        email: betterAuthUser.email,
        name: betterAuthUser.name,
      },
      token: sessionToken,
    })

    response.cookies.set('better-auth.session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
