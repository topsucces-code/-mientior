/**
 * Update ALL product images to use valid URLs
 * Run with: npx tsx scripts/update-all-product-images.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Using picsum.photos for placeholder images
const getProductImage = (seed: string, width = 800, height = 800) => 
  `https://picsum.photos/seed/${seed}/${width}/${height}`

async function main() {
  console.log('🖼️  Updating all product images...\n')

  // Get all products
  const products = await prisma.product.findMany({
    include: { images: true },
  })

  console.log(`Found ${products.length} products\n`)

  let updated = 0
  let created = 0

  for (const product of products) {
    // Generate unique seed based on product slug
    const seed = product.slug.replace(/[^a-z0-9]/g, '')

    if (product.images.length === 0) {
      // Create images for products without any
      await prisma.productImage.createMany({
        data: [
          { productId: product.id, url: getProductImage(`${seed}1`), alt: `${product.name} - Image 1`, order: 0 },
          { productId: product.id, url: getProductImage(`${seed}2`), alt: `${product.name} - Image 2`, order: 1 },
        ],
      })
      created++
      console.log(`✅ Created images for: ${product.name}`)
    } else {
      // Update existing images with valid URLs
      for (let i = 0; i < product.images.length; i++) {
        const image = product.images[i]
        
        // Only update if it's a local path (not http)
        if (!image.url.startsWith('http')) {
          await prisma.productImage.update({
            where: { id: image.id },
            data: { 
              url: getProductImage(`${seed}${i + 1}`),
              alt: image.alt || `${product.name} - Image ${i + 1}`,
            },
          })
          updated++
        }
      }
      console.log(`🔄 Updated images for: ${product.name}`)
    }
  }

  console.log(`\n✨ Done! Created: ${created}, Updated: ${updated}`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
