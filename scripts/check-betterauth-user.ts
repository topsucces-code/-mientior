import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkBetterAuthUser() {
  try {
    const email = 'betterauth@mientior.com'
    
    // Check betterAuthUser
    const authUser = await prisma.betterAuthUser.findUnique({
      where: { email },
    })
    
    console.log('=== better_auth_users ===')
    console.log(authUser)
    console.log('')
    
    // Check User
    if (authUser) {
      const user = await prisma.user.findUnique({
        where: { id: authUser.id },
      })
      
      console.log('=== User ===')
      console.log(user)
      console.log('')
      
      // Check Account
      const account = await prisma.account.findFirst({
        where: { userId: authUser.id },
      })
      
      console.log('=== Account ===')
      console.log(account)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkBetterAuthUser()
