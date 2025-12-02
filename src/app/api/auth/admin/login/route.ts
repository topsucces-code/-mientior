import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
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

    // First, authenticate with Better Auth
    let authResult
    try {
      authResult = await auth.api.signInEmail({
        body: {
          email,
          password,
        },
        headers: await headers(),
      })
    } catch (authError) {
      // Better Auth throws an error for invalid credentials
      // Log failed admin login attempt
      await logLoginFailed(email, ipAddress, userAgent, 'Invalid credentials - admin login', {
        isAdminAttempt: true,
      })
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Get the authenticated user
    const user = authResult?.user
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if AdminUser record exists
    const adminUser = await prisma.adminUser.findFirst({
      where: {
        OR: [
          { email: user.email },
          { authUserId: user.id },
        ],
      },
    })

    if (!adminUser) {
      // User authenticated but is not an admin
      // Log them out
      await auth.api.signOut({
        headers: await headers(),
      })

      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    // Check if admin account is active
    if (!adminUser.isActive) {
      // Log them out
      await auth.api.signOut({
        headers: await headers(),
      })

      return NextResponse.json(
        { error: 'Account is deactivated. Please contact support.' },
        { status: 403 }
      )
    }

    // Update lastLoginAt timestamp
    await prisma.adminUser.update({
      where: { id: adminUser.id },
      data: { lastLoginAt: new Date() },
    })

    // Link authUserId if not already linked
    if (!adminUser.authUserId) {
      await prisma.adminUser.update({
        where: { id: adminUser.id },
        data: { authUserId: user.id },
      })
    }
    
    // Log successful admin login
    await logAdminLogin(adminUser.id, adminUser.email, ipAddress, userAgent, {
      role: adminUser.role,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
    })

    // Return success with admin user info
    return NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role,
      },
    })
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
