import { NextRequest, NextResponse } from 'next/server'
import { validatePassword, isPasswordBreached } from '@/lib/password-validation'

/**
 * Validate password endpoint
 * Checks password strength and breach status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { isValid: false, errors: ['Password is required'] },
        { status: 400 }
      )
    }

    // Validate password requirements
    const validation = validatePassword(password)
    
    if (!validation.isValid) {
      return NextResponse.json({
        isValid: false,
        errors: validation.errors,
      })
    }

    // Check if password has been breached
    const breached = await isPasswordBreached(password)
    
    if (breached) {
      return NextResponse.json({
        isValid: false,
        errors: [
          'Ce mot de passe a été trouvé dans des violations de données. Veuillez en choisir un autre pour votre sécurité.',
        ],
      })
    }

    return NextResponse.json({
      isValid: true,
      errors: [],
    })
  } catch (error) {
    console.error('Password validation error:', error)
    return NextResponse.json(
      { isValid: false, errors: ['Error validating password'] },
      { status: 500 }
    )
  }
}
