
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const totalProducts = await prisma.product.count()
  const activeProducts = await prisma.product.count({ where: { status: 'ACTIVE' } })
  const productsWithImages = await prisma.product.count({
    where: {
      status: 'ACTIVE',
      images: {
        some: {}
      }
    }
  })
  
  const featuredWithImages = await prisma.product.count({
    where: {
      status: 'ACTIVE',
      featured: true,
      images: {
        some: {}
      }
    }
  })
  
  const featuredTotal = await prisma.product.count({
    where: {
      status: 'ACTIVE',
      featured: true,
    }
  })

  console.log('--- Product Image Check ---')
  console.log(`Total Products: ${totalProducts}`)
  console.log(`Active Products: ${activeProducts}`)
  console.log(`Active Products with Images: ${productsWithImages}`)
  console.log(`Featured Products Total: ${featuredTotal}`)
  console.log(`Featured Products with Images: ${featuredWithImages}`)
  
  if (featuredTotal > 0 && featuredWithImages === 0) {
      console.log('\nWARNING: No featured products have images!')
  }

  // List a few featured products without images
  const noImageFeatured = await prisma.product.findMany({
      where: {
          status: 'ACTIVE',
          featured: true,
          images: {
              none: {}
          }
      },
      take: 5,
      select: {
          id: true,
          name: true,
          slug: true
      }
  })

  if (noImageFeatured.length > 0) {
      console.log('\nSample Featured Products WITHOUT Images:')
      console.log(JSON.stringify(noImageFeatured, null, 2))
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
