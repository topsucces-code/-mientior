import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📦 Checking products in database...\n')
  
  const products = await prisma.product.findMany({
    take: 10,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
    }
  })
  
  console.log(`Found ${products.length} products:\n`)
  
  products.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name}`)
    console.log(`   Slug: ${product.slug}`)
    console.log(`   Description: ${product.description?.substring(0, 100)}...`)
    console.log()
  })
  
  await prisma.$disconnect()
}

main().catch(console.error)
