import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

async function main() {
  console.log('🔌 Testing database connection...\n')
  console.log('URL:', process.env.PRISMA_DATABASE_URL?.substring(0, 50) + '...')

  try {
    const count = await prisma.product.count({
      where: {
        status: 'ACTIVE',
        featured: true,
      },
    })
    console.log(`✅ Connection successful!`)
    console.log(`📊 Found ${count} featured products`)
  } catch (error) {
    console.error('❌ Connection failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
