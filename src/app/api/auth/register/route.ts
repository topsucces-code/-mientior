import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// import { auth } from '@/lib/auth' // Not used - using direct Prisma auth
import { generateVerificationToken } from '@/lib/verification-token'
import { sendVerificationEmail } from '@/lib/email'
import { validatePassword, isPasswordBreached } from '@/lib/password-validation'
import { 
  isCaptchaRequired, 
  trackRegistration, 
  verifyCaptchaToken 
} from '@/lib/captcha-requirement'
import { logRegistration } from '@/lib/auth-audit-logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, captchaToken } = body
    
    // Extract IP address for CAPTCHA tracking
    const ipAddress = 
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'

    // Check if CAPTCHA is required for this IP
    const captchaRequired = await isCaptchaRequired(ipAddress)
    
    if (captchaRequired) {
      // CAPTCHA is required after 3 registrations from same IP
      if (!captchaToken) {
        return NextResponse.json(
          { 
            error: 'CAPTCHA verification required',
            captchaRequired: true,
            message: 'Please complete the CAPTCHA verification to continue'
          },
          { status: 400 }
        )
      }
      
      // Verify CAPTCHA token
      const captchaValid = await verifyCaptchaToken(captchaToken, ipAddress)
      if (!captchaValid) {
        return NextResponse.json(
          { 
            error: 'Invalid CAPTCHA verification',
            captchaRequired: true,
            message: 'CAPTCHA verification failed. Please try again.'
          },
          { status: 400 }
        )
      }
    }
    
    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password requirements
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join('. ') },
        { status: 400 }
      )
    }

    // Check if password has been breached
    const breached = await isPasswordBreached(password)
    if (breached) {
      return NextResponse.json(
        { 
          error: 'This password has been found in data breaches, please choose a different one' 
        },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { 
          error: 'An account with this email already exists',
          suggestion: 'Please try logging in or use the password reset option if you forgot your password.'
        },
        { status: 409 }
      )
    }

    // Create user directly with Prisma
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 12)
    const nameParts = name.split(' ')
    const firstName = nameParts[0] || name
    const lastName = nameParts.slice(1).join(' ') || ''
    
    const userId = crypto.randomUUID()
    
    // Create better_auth_users entry (required for accounts foreign key)
    await prisma.better_auth_users.create({
      data: {
        id: userId,
        email,
        name,
        emailVerified: false,
        updatedAt: new Date(),
      },
    })
    
    // Create users entry for application data
    await prisma.users.create({
      data: {
        id: userId,
        email,
        name,
        firstName,
        lastName,
        email_verified: false,
        updatedAt: new Date(),
      },
    })
    
    // Store password hash in accounts table
    await prisma.accounts.create({
      data: {
        id: crypto.randomUUID(),
        userId: userId,
        providerId: 'credential',
        accountId: email,
        password: hashedPassword,
        updatedAt: new Date(),
      },
    })

    // Generate verification token
    const token = await generateVerificationToken(email)

    // Build verification URL
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const verificationUrl = `${baseURL}/verify-email?token=${token}`

    // Send verification email
    const emailResult = await sendVerificationEmail({
      name,
      email,
      verificationUrl,
      expiresIn: '24 hours',
    })

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error)
      // Don't fail the registration if email fails, user can resend
    }
    
    // Track successful registration for CAPTCHA requirement
    await trackRegistration(ipAddress)
    
    // Log successful registration
    const userAgent = request.headers.get('user-agent') || 'unknown'
    await logRegistration(userId, email, ipAddress, userAgent, {
      name,
      captchaRequired: await isCaptchaRequired(ipAddress),
    })

    return NextResponse.json({
      success: true,
      message: 'Account created! Please check your email to verify your account.',
      email,
      requiresVerification: true,
    })
  } catch (error) {
    console.error('Registration error:', error)
    
    // Handle Prisma unique constraint errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { 
          error: 'An account with this email already exists',
          suggestion: 'Please try logging in or use the password reset option.'
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    )
  }
}
