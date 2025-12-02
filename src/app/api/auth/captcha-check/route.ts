import { NextRequest, NextResponse } from 'next/server'
import { isCaptchaRequired } from '@/lib/captcha-requirement'

/**
 * Check if CAPTCHA is required for registration from this IP
 * 
 * GET /api/auth/captcha-check
 * 
 * Returns:
 * - captchaRequired: boolean - Whether CAPTCHA is needed
 * - registrationCount: number - Number of registrations from this IP in last 24h
 */
export async function GET(request: NextRequest) {
  try {
    // Extract IP address
    const ipAddress = 
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'
    
    // Check if CAPTCHA is required
    const captchaRequired = await isCaptchaRequired(ipAddress)
    
    return NextResponse.json({
      captchaRequired,
      message: captchaRequired 
        ? 'CAPTCHA verification required for registration'
        : 'CAPTCHA not required'
    })
  } catch (error) {
    console.error('Error checking CAPTCHA requirement:', error)
    
    // Fail open - don't block registration if check fails
    return NextResponse.json({
      captchaRequired: false,
      message: 'CAPTCHA check unavailable'
    })
  }
}
