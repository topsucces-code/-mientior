import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
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

    // Use Better Auth to verify credentials and create session
    let authResponse
    try {
      authResponse = await auth.api.signInEmail({
        body: { email, password },
        headers: request.headers,
      })
    } catch (authError: unknown) {
      // Better Auth throws an error for invalid credentials
      // Track failed login attempt
      const shouldLock = await trackFailedLoginAttempt(email)
      
      // Log failed login attempt
      await logLoginFailed(
        email,
        ipAddress,
        userAgent,
        'Invalid credentials',
        { shouldLock }
      )
      
      if (shouldLock) {
        // Account is now locked
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

    if (!authResponse || !authResponse.user) {
      // Track failed login attempt
      const shouldLock = await trackFailedLoginAttempt(email)
      
      // Log failed login attempt
      await logLoginFailed(
        email,
        ipAddress,
        userAgent,
        'Invalid credentials',
        { shouldLock }
      )
      
      if (shouldLock) {
        // Account is now locked
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

    // Clear lockout and failed attempts on successful login
    await clearAccountLockout(email)
    await clearFailedLoginAttempts(email)

    // Check email verification status (emailVerified is on BetterAuthUser, not User)
    const betterAuthUser = await prisma.betterAuthUser.findUnique({
      where: { id: authResponse.user.id },
      select: { emailVerified: true, email: true },
    })

    if (!betterAuthUser?.emailVerified) {
      // Return a specific error for unverified email
      return NextResponse.json(
        { 
          error: 'Email not verified',
          code: 'EMAIL_NOT_VERIFIED',
          email: betterAuthUser?.email || email,
        },
        { status: 403 }
      )
    }

    // Update login metadata (IP address, user agent, timestamp)
    if (authResponse.token) {
      await updateLoginMetadata(
        authResponse.user.id,
        authResponse.token,
        request
      )

      // Detect new device/location and send security alert if needed
      // This runs asynchronously and doesn't block the login response
      detectAndAlertNewDevice(
        authResponse.user.id,
        request,
        authResponse.token
      ).catch((error) => {
        console.error('Error in new device detection:', error)
      })
    }

    // If rememberMe is true, update the session expiry to 30 days
    if (rememberMe && authResponse.token) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

      // Update the session in the database using the token
      await prisma.session.update({
        where: { token: authResponse.token },
        data: { expiresAt },
      })
    }
    
    // Log successful login
    await logLoginSuccess(
      authResponse.user.id,
      authResponse.user.email,
      ipAddress,
      userAgent,
      { rememberMe }
    )

    // Return the auth response
    return NextResponse.json({
      user: authResponse.user,
      token: authResponse.token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
