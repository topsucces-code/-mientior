import { prisma } from '@/lib/prisma'

/**
 * Authentication audit logging
 * 
 * Requirements:
 * - 8.1: Track failed login attempts
 * - 8.6: Log security-relevant events
 * 
 * Events logged:
 * - Successful logins (user, IP, timestamp)
 * - Failed login attempts (email, IP, timestamp)
 * - Password changes (user, IP, timestamp)
 * - Email verifications (user, timestamp)
 * - Admin logins (admin, IP, timestamp)
 */

export interface AuthAuditLogParams {
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'PASSWORD_CHANGED' | 'EMAIL_VERIFIED' | 'ADMIN_LOGIN' | 'LOGOUT' | 'REGISTRATION' | 'PASSWORD_RESET_REQUESTED' | 'PASSWORD_RESET_COMPLETED' | '2FA_VERIFICATION_SUCCESS' | '2FA_VERIFICATION_FAILED' | '2FA_BACKUP_CODE_USED'
  userId?: string
  email?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
  success: boolean
  errorMessage?: string
}

/**
 * Log an authentication event
 */
export async function logAuthEvent(params: AuthAuditLogParams): Promise<void> {
  try {
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        action: params.action,
        resource: 'AUTH',
        resourceId: params.userId,
        adminUserId: params.action === 'ADMIN_LOGIN' ? params.userId : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: {
          email: params.email,
          success: params.success,
          errorMessage: params.errorMessage,
          ...params.metadata,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      },
    })
  } catch (error) {
    // Log error but don't throw to avoid breaking the main operation
    console.error('Failed to create auth audit log:', error)
  }
}

/**
 * Log a successful login
 */
export async function logLoginSuccess(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuthEvent({
    action: 'LOGIN_SUCCESS',
    userId,
    email,
    ipAddress,
    userAgent,
    metadata,
    success: true,
  })
}

/**
 * Log a failed login attempt
 */
export async function logLoginFailed(
  email: string,
  ipAddress: string,
  userAgent: string,
  errorMessage: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuthEvent({
    action: 'LOGIN_FAILED',
    email,
    ipAddress,
    userAgent,
    errorMessage,
    metadata,
    success: false,
  })
}

/**
 * Log a password change
 */
export async function logPasswordChanged(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuthEvent({
    action: 'PASSWORD_CHANGED',
    userId,
    email,
    ipAddress,
    userAgent,
    metadata,
    success: true,
  })
}

/**
 * Log an email verification
 */
export async function logEmailVerified(
  userId: string,
  email: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuthEvent({
    action: 'EMAIL_VERIFIED',
    userId,
    email,
    metadata,
    success: true,
  })
}

/**
 * Log an admin login
 */
export async function logAdminLogin(
  adminUserId: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuthEvent({
    action: 'ADMIN_LOGIN',
    userId: adminUserId,
    email,
    ipAddress,
    userAgent,
    metadata,
    success: true,
  })
}

/**
 * Log a logout
 */
export async function logLogout(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuthEvent({
    action: 'LOGOUT',
    userId,
    email,
    ipAddress,
    userAgent,
    metadata,
    success: true,
  })
}

/**
 * Log a registration
 */
export async function logRegistration(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuthEvent({
    action: 'REGISTRATION',
    userId,
    email,
    ipAddress,
    userAgent,
    metadata,
    success: true,
  })
}

/**
 * Log a password reset request
 */
export async function logPasswordResetRequested(
  email: string,
  ipAddress: string,
  userAgent: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuthEvent({
    action: 'PASSWORD_RESET_REQUESTED',
    email,
    ipAddress,
    userAgent,
    metadata,
    success: true,
  })
}

/**
 * Log a password reset completion
 */
export async function logPasswordResetCompleted(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuthEvent({
    action: 'PASSWORD_RESET_COMPLETED',
    userId,
    email,
    ipAddress,
    userAgent,
    metadata,
    success: true,
  })
}
