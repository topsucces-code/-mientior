import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

// Only initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Validation schema
const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
  acceptMarketing: z.boolean(),
})

// Rate limiting map (in-memory, consider Redis for production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

/**
 * Extract client IP from request headers
 * Handles x-forwarded-for (multi-IP), x-real-ip, and cf-connecting-ip
 */
function getClientIp(request: NextRequest): string {
  // Try x-forwarded-for first (comma-separated list)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const clientIp = forwarded.split(',')[0]?.trim()
    if (clientIp) {
      return clientIp
    }
  }

  // Fallback to x-real-ip header
  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) {
    return realIp
  }

  // Fallback to Cloudflare connecting IP
  const cfIp = request.headers.get('cf-connecting-ip')?.trim()
  if (cfIp) {
    return cfIp
  }

  // Fallback to request.ip provided by the framework (not typed on NextRequest)
  const requestIp = (request as unknown as { ip?: string }).ip?.trim()
  if (requestIp) {
    return requestIp
  }

  // If all fail, return unknown for audit logging
  return 'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(ip)

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 }) // 1 minute window
    return true
  }

  if (limit.count >= 5) {
    return false
  }

  limit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting and GDPR compliance
    const ip = getClientIp(request)
    
    // Warn if IP couldn't be determined
    if (ip === 'unknown') {
      console.warn('Newsletter subscription: Unable to determine client IP address')
    }

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = newsletterSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { email, acceptMarketing } = validation.data

    // Check if email already exists
    const existingSubscription = await prisma.newsletterSubscription.findUnique({
      where: { email },
    })

    if (existingSubscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'This email is already subscribed to our newsletter.',
        },
        { status: 409 }
      )
    }

    // Store subscription in database
    const subscription = await prisma.newsletterSubscription.create({
      data: {
        email,
        acceptMarketing,
        subscribedAt: new Date(),
        ipAddress: ip,
      },
    })

    // Send confirmation email using Resend
    if (resend) {
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'noreply@mientior.com',
          to: email,
          subject: 'Bienvenue dans notre newsletter ! 🎉',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #FF6B00;">Merci de votre inscription !</h1>
              <p>Vous êtes maintenant inscrit à notre newsletter.</p>
              <p>Vous recevrez régulièrement nos offres exclusives, nouveautés et conseils.</p>
              <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">
                Si vous souhaitez vous désinscrire, 
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(email)}" 
                   style="color: #FF6B00;">cliquez ici</a>.
              </p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError)
        // Don't fail the request if email sending fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully subscribed to newsletter!',
        data: {
          id: subscription.id,
          email: subscription.email,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Newsletter subscription error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while processing your subscription. Please try again later.',
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check subscription status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const subscription = await prisma.newsletterSubscription.findUnique({
      where: { email },
      select: { email: true, subscribedAt: true, acceptMarketing: true },
    })

    if (!subscription) {
      return NextResponse.json(
        { success: false, subscribed: false },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        subscribed: true,
        data: subscription,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Newsletter check error:', error)

    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    )
  }
}
