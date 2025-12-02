import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function compareBothUsers() {
  try {
    // Check test user
    const testUser = await prisma.better_auth_users.findUnique({
      where: { email: 'test@mientior.com' },
    })
    
    const testAccount = testUser ? await prisma.account.findFirst({
      where: { userId: testUser.id },
    }) : null
    
    // Check browser user
    const browserUser = await prisma.better_auth_users.findUnique({
      where: { email: 'browsertest@mientior.com' },
    })
    
    const browserAccount = browserUser ? await prisma.account.findFirst({
      where: { userId: browserUser.id },
    }) : null
    
    console.log('=== TEST USER (test@mientior.com) ===')
    console.log('better_auth_users:', testUser)
    console.log('Account:', testAccount)
    console.log('')
    
    console.log('=== BROWSER USER (browsertest@mientior.com) ===')
    console.log('better_auth_users:', browserUser)
    console.log('Account:', browserAccount)
    console.log('')
    
    if (testAccount && browserAccount) {
      console.log('=== COMPARISON ===')
      console.log('Test password hash:', testAccount.password)
      console.log('Browser password hash:', browserAccount.password)
      console.log('')
      console.log('Test providerId:', testAccount.providerId)
      console.log('Browser providerId:', browserAccount.providerId)
      console.log('')
      console.log('Test accountId:', testAccount.accountId)
      console.log('Browser accountId:', browserAccount.accountId)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

compareBothUsers()
