import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTestUser() {
  try {
    const email = 'test@mientior.com'
    
    // Check better_auth_users
    const authUser = await prisma.better_auth_users.findUnique({
      where: { email },
    })
    
    console.log('better_auth_users record:')
    console.log(authUser)
    console.log('')
    
    // Check User
    const user = await prisma.user.findUnique({
      where: { email },
    })
    
    console.log('User record:')
    console.log(user)
    console.log('')
    
    // Check Account
    if (authUser) {
      const account = await prisma.account.findFirst({
        where: { userId: authUser.id },
      })
      
      console.log('Account record:')
      console.log(account)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTestUser()
