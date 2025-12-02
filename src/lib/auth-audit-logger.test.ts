import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  logLoginSuccess,
  logLoginFailed,
  logPasswordChanged,
  logEmailVerified,
  logAdminLogin,
  logLogout,
  logRegistration,
  logPasswordResetRequested,
  logPasswordResetCompleted,
} from './auth-audit-logger'

/**
 * Test suite for authentication audit logging
 * 
 * Requirements:
 * - 8.1: Track failed login attempts
 * - 8.6: Log security-relevant events
 */

describe('Authentication Audit Logging', () => {
  const testUserId = 'test-user-id'
  const testEmail = 'test@example.com'
  const testIp = '192.168.1.100'
  const testUserAgent = 'Mozilla/5.0 Test Browser'

  beforeEach(async () => {
    // Clean up test audit logs
    await prisma.auditLog.deleteMany({
      where: {
        resource: 'AUTH',
        ipAddress: testIp,
      },
    })
  })

  it('should log successful login', async () => {
    await logLoginSuccess(testUserId, testEmail, testIp, testUserAgent)

    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'LOGIN_SUCCESS',
        resource: 'AUTH',
        resourceId: testUserId,
      },
    })

    expect(logs.length).toBeGreaterThan(0)
    const log = logs[0]
    expect(log.ipAddress).toBe(testIp)
    expect(log.userAgent).toBe(testUserAgent)
    expect(log.metadata).toMatchObject({
      email: testEmail,
      success: true,
    })
  })

  it('should log failed login attempt', async () => {
    const errorMessage = 'Invalid credentials'
    await logLoginFailed(testEmail, testIp, testUserAgent, errorMessage)

    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'LOGIN_FAILED',
        resource: 'AUTH',
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    })

    expect(logs.length).toBeGreaterThan(0)
    const log = logs[0]
    expect(log.ipAddress).toBe(testIp)
    expect(log.userAgent).toBe(testUserAgent)
    expect(log.metadata).toMatchObject({
      email: testEmail,
      success: false,
      errorMessage,
    })
  })

  it('should log password change', async () => {
    await logPasswordChanged(testUserId, testEmail, testIp, testUserAgent)

    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'PASSWORD_CHANGED',
        resource: 'AUTH',
        resourceId: testUserId,
      },
    })

    expect(logs.length).toBeGreaterThan(0)
    const log = logs[0]
    expect(log.ipAddress).toBe(testIp)
    expect(log.metadata).toMatchObject({
      email: testEmail,
      success: true,
    })
  })

  it('should log email verification', async () => {
    await logEmailVerified(testUserId, testEmail)

    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'EMAIL_VERIFIED',
        resource: 'AUTH',
        resourceId: testUserId,
      },
    })

    expect(logs.length).toBeGreaterThan(0)
    const log = logs[0]
    expect(log.metadata).toMatchObject({
      email: testEmail,
      success: true,
    })
  })

  it('should log admin login', async () => {
    // Create a test admin user first
    const adminUser = await prisma.adminUser.create({
      data: {
        id: testUserId,
        email: testEmail,
        firstName: 'Test',
        lastName: 'Admin',
        role: 'ADMIN',
        isActive: true,
      },
    })

    await logAdminLogin(adminUser.id, testEmail, testIp, testUserAgent)

    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'ADMIN_LOGIN',
        resource: 'AUTH',
        adminUserId: adminUser.id,
      },
    })

    expect(logs.length).toBeGreaterThan(0)
    const log = logs[0]
    expect(log.ipAddress).toBe(testIp)
    expect(log.userAgent).toBe(testUserAgent)
    expect(log.metadata).toMatchObject({
      email: testEmail,
      success: true,
    })
    
    // Clean up
    await prisma.adminUser.delete({ where: { id: adminUser.id } })
  })

  it('should log logout', async () => {
    await logLogout(testUserId, testEmail, testIp, testUserAgent)

    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'LOGOUT',
        resource: 'AUTH',
        resourceId: testUserId,
      },
    })

    expect(logs.length).toBeGreaterThan(0)
    const log = logs[0]
    expect(log.ipAddress).toBe(testIp)
    expect(log.metadata).toMatchObject({
      email: testEmail,
      success: true,
    })
  })

  it('should log registration', async () => {
    await logRegistration(testUserId, testEmail, testIp, testUserAgent)

    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'REGISTRATION',
        resource: 'AUTH',
        resourceId: testUserId,
      },
    })

    expect(logs.length).toBeGreaterThan(0)
    const log = logs[0]
    expect(log.ipAddress).toBe(testIp)
    expect(log.metadata).toMatchObject({
      email: testEmail,
      success: true,
    })
  })

  it('should log password reset request', async () => {
    await logPasswordResetRequested(testEmail, testIp, testUserAgent)

    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'PASSWORD_RESET_REQUESTED',
        resource: 'AUTH',
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    })

    expect(logs.length).toBeGreaterThan(0)
    const log = logs[0]
    expect(log.ipAddress).toBe(testIp)
    expect(log.metadata).toMatchObject({
      email: testEmail,
      success: true,
    })
  })

  it('should log password reset completion', async () => {
    await logPasswordResetCompleted(testUserId, testEmail, testIp, testUserAgent)

    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'PASSWORD_RESET_COMPLETED',
        resource: 'AUTH',
        resourceId: testUserId,
      },
    })

    expect(logs.length).toBeGreaterThan(0)
    const log = logs[0]
    expect(log.ipAddress).toBe(testIp)
    expect(log.metadata).toMatchObject({
      email: testEmail,
      success: true,
    })
  })

  it('should include custom metadata', async () => {
    const customMetadata = {
      rememberMe: true,
      deviceType: 'mobile',
    }

    await logLoginSuccess(testUserId, testEmail, testIp, testUserAgent, customMetadata)

    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'LOGIN_SUCCESS',
        resource: 'AUTH',
        resourceId: testUserId,
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    })

    expect(logs.length).toBeGreaterThan(0)
    const log = logs[0]
    expect(log.metadata).toMatchObject({
      email: testEmail,
      success: true,
      ...customMetadata,
    })
  })
})
