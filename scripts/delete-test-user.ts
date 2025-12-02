import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteTestUser() {
  const email = 'test@mientior.com'
  
  try {
    // Find the user first
    const authUser = await prisma.better_auth_users.findUnique({
      where: { email },
    })
    
    if (!authUser) {
      console.log('Test user does not exist')
      return
    }
    
    console.log('Deleting test user...')
    
    // Delete in reverse order of creation
    await prisma.account.deleteMany({
      where: { userId: authUser.id },
    })
    
    await prisma.user.delete({
      where: { id: authUser.id },
    })
    
    await prisma.better_auth_users.delete({
      where: { id: authUser.id },
    })
    
    console.log('✅ Test user deleted successfully')
  } catch (error) {
    console.error('Error deleting test user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteTestUser()
