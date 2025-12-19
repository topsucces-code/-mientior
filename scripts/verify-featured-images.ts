/**
 * Verify that featured products have images
 * Run with: npx tsx scripts/verify-featured-images.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking featured products...\n')

  // Get all featured products
  const featuredProducts = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      featured: true,
    },
    include: {
      images: {
        orderBy: {
          order: 'asc',
        },
      },
      category: {
        select: {
          name: true,
        },
      },
    },
  })

  console.log(`Total featured products: ${featuredProducts.length}\n`)

  if (featuredProducts.length === 0) {
    console.log('⚠️  No featured products found!')
    console.log('💡 Marking some products as featured...\n')

    // Mark some products as featured
    const someProducts = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
      },
      take: 12,
    })

    for (const product of someProducts) {
      await prisma.product.update({
        where: { id: product.id },
        data: { featured: true },
      })
      console.log(`✅ Marked as featured: ${product.name}`)
    }

    console.log('\n✨ Done! Re-checking...\n')

    // Re-fetch featured products
    const newFeatured = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        featured: true,
      },
      include: {
        images: true,
      },
    })

    console.log(`New total featured products: ${newFeatured.length}\n`)

    // Check images
    let withImages = 0
    let withoutImages = 0

    for (const product of newFeatured) {
      if (product.images.length > 0) {
        withImages++
        console.log(`✅ ${product.name} (${product.images.length} image(s))`)
      } else {
        withoutImages++
        console.log(`❌ ${product.name} (NO IMAGES)`)
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   Featured products with images: ${withImages}`)
    console.log(`   Featured products without images: ${withoutImages}`)
  } else {
    // Check which featured products have images
    let withImages = 0
    let withoutImages = 0

    featuredProducts.forEach((product) => {
      if (product.images.length > 0) {
        withImages++
        console.log(`✅ ${product.name} - ${product.category.name} (${product.images.length} image(s))`)
        console.log(`   First image: ${product.images[0]?.url.substring(0, 60)}...`)
      } else {
        withoutImages++
        console.log(`❌ ${product.name} - ${product.category.name} (NO IMAGES)`)
      }
      console.log('')
    })

    console.log(`📊 Summary:`)
    console.log(`   Featured products with images: ${withImages}`)
    console.log(`   Featured products without images: ${withoutImages}`)

    if (withoutImages > 0) {
      console.log('\n⚠️  Some featured products are missing images!')
      console.log('💡 Run: npx tsx scripts/seed-product-images.ts')
    } else {
      console.log('\n✅ All featured products have images!')
    }
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
