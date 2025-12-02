import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true, isActive: true },
    orderBy: { name: 'asc' }
  })
  
  console.log('Categories in database:')
  console.log(JSON.stringify(categories, null, 2))
  
  await prisma.$disconnect()
}

main()
