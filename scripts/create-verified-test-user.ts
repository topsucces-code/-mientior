/**
 * Script to create a test user via the registration API
 * and then mark the email as verified
 */

async function createVerifiedTestUser() {
  const testEmail = 'test@mientior.com'
  const testPassword = 'Mientior2024!SecureTest#Pass'
  const testName = 'Test User'

  try {
    console.log('Creating test user via registration API...')
    
    // Step 1: Register the user via the API
    const registerResponse = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: testName,
      }),
    })

    const registerResult = await registerResponse.json()

    if (!registerResponse.ok) {
      if (registerResult.error?.includes('already exists')) {
        console.log('⚠️  User already exists, marking as verified...')
      } else {
        throw new Error(registerResult.error || 'Registration failed')
      }
    } else {
      console.log('✅ User registered successfully')
    }

    // Step 2: Mark email as verified using Prisma
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      await prisma.better_auth_users.update({
        where: { email: testEmail },
        data: { emailVerified: true },
      })

      console.log('✅ Email marked as verified')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('Email:', testEmail)
      console.log('Password:', testPassword)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('You can now login at http://localhost:3001/login')
    } finally {
      await prisma.$disconnect()
    }
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

createVerifiedTestUser()
