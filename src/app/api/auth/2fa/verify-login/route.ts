import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTOTP } from '@/lib/two-factor-service'
import { updateLoginMetadata } from '@/lib/login-metadata'
import { detectAndAlertNewDevice } from '@/lib/new-device-detection'
import { logAuditEvent } from '@/lib/auth-audit-logger'
import {
  checkAccountLockout,
  trackFailedLoginAttempt,
  clearFailedLoginAttempts,
} from '@/lib/auth-rate-limit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, tempToken, code, rememberMe } = body

    // Extract IP and user agent
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Validate input
    if (!userId || !tempToken || !code) {
      return NextResponse.json(
        { error: 'User ID, token, and code are required' },
        { status: 400 }
      )
    }

    // Get user from database with 2FA secret and backup codes
    const user = await prisma.betterAuthUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
        twoFactorEnabled: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA is not enabled for this account' },
        { status: 400 }
      )
    }

    // Check if account is locked (applies to 2FA attempts too)
    const lockoutStatus = await checkAccountLockout(user.email)
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

    // Verify the session token exists
    const session = await prisma.session.findUnique({
      where: { token: tempToken },
      select: { userId: true, expiresAt: true },
    })

    if (!session || session.userId !== userId) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    if (new Date() > session.expiresAt) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      )
    }

    // Try to verify TOTP code first
    const isValidTOTP = verifyTOTP(user.twoFactorSecret, code)

    // If TOTP fails, check if it's a valid backup code
    let isValidBackupCode = false
    let usedBackupCode: string | null = null

    if (!isValidTOTP && user.twoFactorBackupCodes) {
      const bcrypt = require('bcrypt')
      const backupCodes = JSON.parse(user.twoFactorBackupCodes as string)

      for (const hashedCode of backupCodes) {
        const isMatch = await bcrypt.compare(code, hashedCode)
        if (isMatch) {
          isValidBackupCode = true
          usedBackupCode = hashedCode
          break
        }
      }
    }

    if (!isValidTOTP && !isValidBackupCode) {
      // Track failed 2FA attempt
      const shouldLock = await trackFailedLoginAttempt(user.email)

      // Log failed 2FA verification
      await logAuditEvent({
        userId: user.id,
        email: user.email,
        action: '2FA_VERIFICATION_FAILED',
        ipAddress,
        userAgent,
        details: { shouldLock },
      })

      if (shouldLock) {
        const newLockoutStatus = await checkAccountLockout(user.email)
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
        { error: 'Invalid 2FA code' },
        { status: 401 }
      )
    }

    // If a backup code was used, remove it from the list
    if (isValidBackupCode && usedBackupCode) {
      const backupCodes = JSON.parse(user.twoFactorBackupCodes as string)
      const updatedBackupCodes = backupCodes.filter(
        (code: string) => code !== usedBackupCode
      )

      await prisma.betterAuthUser.update({
        where: { id: user.id },
        data: {
          twoFactorBackupCodes: JSON.stringify(updatedBackupCodes),
        },
      })

      // Log backup code usage
      await logAuditEvent({
        userId: user.id,
        email: user.email,
        action: '2FA_BACKUP_CODE_USED',
        ipAddress,
        userAgent,
        details: { remainingCodes: updatedBackupCodes.length },
      })
    }

    // Clear failed attempts on successful 2FA verification
    await clearFailedLoginAttempts(user.email)

    // Update login metadata
    await updateLoginMetadata(userId, tempToken, request)

    // Detect new device/location and send security alert if needed
    detectAndAlertNewDevice(userId, request, tempToken).catch((error) => {
      console.error('Error in new device detection:', error)
    })

    // If rememberMe is true, update session expiry to 30 days
    if (rememberMe) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      await prisma.session.update({
        where: { token: tempToken },
        data: { expiresAt },
      })
    }

    // Log successful 2FA verification
    await logAuditEvent({
      userId: user.id,
      email: user.email,
      action: '2FA_VERIFICATION_SUCCESS',
      ipAddress,
      userAgent,
      details: {
        method: isValidBackupCode ? 'backup_code' : 'totp',
        rememberMe,
      },
    })

    // Return success with user data
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      token: tempToken,
    })
  } catch (error) {
    console.error('2FA login verification error:', error)
    return NextResponse.json(
      { error: 'An error occurred during 2FA verification' },
      { status: 500 }
    )
  }
}
