import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
// import { auth } from '@/lib/auth' // Not used - using direct Prisma auth
// import { headers } from 'next/headers'
import { logAdminLogin, logLoginFailed } from '@/lib/auth-audit-logger'

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = adminLoginSchema.parse(body)
    
    // Extract IP and user agent for audit logging
    const ipAddress = 
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

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
      await logLoginFailed(email, ipAddress, userAgent, 'User not found - admin login', {
        isAdminAttempt: true,
      })
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const bcrypt = await import('bcryptjs')
    const isValidPassword = await bcrypt.compare(password, account.password)

    if (!isValidPassword) {
      await logLoginFailed(email, ipAddress, userAgent, 'Invalid password - admin login', {
        isAdminAttempt: true,
      })
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const user = account.better_auth_users

    // Check if AdminUser record exists
    const adminUser = await prisma.admin_users.findFirst({
      where: {
        OR: [
          { email: user.email },
          { auth_user_id: user.id },
        ],
      },
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    // Check if admin account is active
    if (!adminUser.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact support.' },
        { status: 403 }
      )
    }

    // Update lastLoginAt timestamp
    await prisma.admin_users.update({
      where: { id: adminUser.id },
      data: { lastLoginAt: new Date() },
    })

    // Link auth_user_id if not already linked
    if (!adminUser.auth_user_id) {
      await prisma.admin_users.update({
        where: { id: adminUser.id },
        data: { auth_user_id: user.id },
      })
    }

    // Create session for admin
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await prisma.sessions.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        token: sessionToken,
        expiresAt,
        ipAddress,
        userAgent,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role,
      },
    })

    response.cookies.set('better-auth.session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    })
    
    // Log successful admin login
    await logAdminLogin(adminUser.id, adminUser.email, ipAddress, userAgent, {
      role: adminUser.role,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
    })

    // Return response with session cookie
    return response
  } catch (error) {
    console.error('Admin login error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
