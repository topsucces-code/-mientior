import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUser() {
  const testEmail = 'test@mientior.com'
  const testPassword = 'TestPassword123!'
  const testName = 'Test User'

  try {
    // Check if user already exists
    const existingUser = await prisma.better_auth_users.findUnique({
      where: { email: testEmail },
    })

    if (existingUser) {
      console.log('✅ Test user already exists!')
      console.log('Email:', testEmail)
      console.log('Password:', testPassword)
      return
    }

    // Hash password
    const passwordHash = await bcrypt.hash(testPassword, 12)
    const userId = crypto.randomUUID()

    // Create user in better_auth_users table with email verified
    await prisma.better_auth_users.create({
      data: {
        id: userId,
        email: testEmail,
        name: testName,
        emailVerified: true, // Mark as verified so login works immediately
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Create corresponding User record
    await prisma.user.create({
      data: {
        id: userId,
        email: testEmail,
        firstName: 'Test',
        lastName: 'User',
      },
    })

    // Create Account record with password
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId: userId,
        accountId: userId,
        providerId: 'credential',
        password: passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    console.log('✅ Test user created successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Email:', testEmail)
    console.log('Password:', testPassword)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('You can now login at http://localhost:3001/login')
  } catch (error) {
    console.error('Error creating test user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
