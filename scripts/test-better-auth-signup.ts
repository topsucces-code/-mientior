import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testSignUp() {
  try {
    console.log('Testing Better Auth SignUp...')
    
    const email = 'script-test@mientior.com'
    const name = 'Script Test User'
    
    // Clean up if exists
    await prisma.user.deleteMany({
      where: { email }
    })
    
    console.log('Note: This script cannot test auth.api.signUpEmail directly.')
    console.log('Please use the API endpoint /api/auth/register instead.')
    console.log('')
    console.log('To test signup:')
    console.log(`curl -X POST http://localhost:3000/api/auth/register \\
      -H "Content-Type: application/json" \\
      -d '{"email":"${email}","password":"ScriptTest2024!#Secure","name":"${name}"}'`)
    
  } catch (error) {
    console.error('Test Failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSignUp()
