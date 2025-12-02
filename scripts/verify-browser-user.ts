import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyBrowserUser() {
  try {
    await prisma.better_auth_users.update({
      where: { email: 'browsertest@mientior.com' },
      data: { emailVerified: true },
    })
    
    console.log('✅ Email verified for browsertest@mientior.com')
    console.log('You can now try to login with:')
    console.log('Email: browsertest@mientior.com')
    console.log('Password: SecureBrowserTest2024!#Pass')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyBrowserUser()
