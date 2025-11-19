import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function createDefaultAdmin() {
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@mientior.com'
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@2024!'

  console.log('🔧 Creating default admin user...')

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: adminEmail },
    })

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', adminEmail)
      return
    }

    // Hash the password
    const hashedPassword = await hash(adminPassword, 10)

    // Create BetterAuth user first
    const authUser = await prisma.betterAuthUser.create({
      data: {
        name: 'Admin',
        email: adminEmail,
        emailVerified: true,
      },
    })

    // Create associated Account with password
    await prisma.account.create({
      data: {
        userId: authUser.id,
        accountId: authUser.email,
        providerId: 'credential',
        password: hashedPassword,
      },
    })

    // Create AdminUser linked to BetterAuthUser
    const adminUser = await prisma.adminUser.create({
      data: {
        email: adminEmail,
        authUserId: authUser.id,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        permissions: null,
        isActive: true,
      },
    })

    console.log('✅ Default admin created successfully!')
    console.log('📧 Email:', adminEmail)
    console.log('🔑 Password:', adminPassword)
    console.log('⚠️  Please change the password after first login!')
    console.log('')
    console.log('Admin User ID:', adminUser.id)
    console.log('Auth User ID:', authUser.id)
  } catch (error) {
    console.error('❌ Error creating admin:', error)
    throw error
  }
}

createDefaultAdmin()
  .then(() => {
    console.log('✅ Seed completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
