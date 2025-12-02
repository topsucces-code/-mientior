import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function testSignUp() {
  try {
    console.log('Testing Better Auth SignUp...')
    
    const email = 'script-test@mientior.com'
    const password = 'ScriptTest2024!#Secure'
    const name = 'Script Test User'
    
    // Clean up if exists
    await prisma.user.deleteMany({
      where: { email }
    })
    
    console.log('Attempting to sign up...')
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      }
    })
    
    console.log('SignUp Result:', JSON.stringify(result, null, 2))
    
    if (result?.user) {
      console.log('User created successfully!')
      
      // Verify user in DB
      const user = await prisma.user.findUnique({
        where: { id: result.user.id }
      })
      console.log('User in DB:', user)
    }
    
  } catch (error) {
    console.error('SignUp Failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSignUp()
