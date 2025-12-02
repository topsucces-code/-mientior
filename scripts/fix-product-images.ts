import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Real product images from Unsplash (reliable CDN)
const productImages: Record<string, string[]> = {
  'macbook-pro-16-m3-max': [
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&h=800&fit=crop&q=80',
  ],
  'iphone-15-pro': [
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&h=800&fit=crop&q=80',
  ],
  'organic-cotton-premium-t-shirt': [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=800&fit=crop&q=80',
  ],
  'floral-summer-dress': [
    'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=800&fit=crop&q=80',
  ],
  'smart-speaker-voice-assistant': [
    'https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=800&h=800&fit=crop&q=80',
  ],
  'casque-audio-sans-fil-premium': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop&q=80',
  ],
  'montre-connectee-sport': [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=800&fit=crop&q=80',
  ],
  'sneakers-urban-style': [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&h=800&fit=crop&q=80',
  ],
  'sac-a-main-cuir-elegant': [
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=800&fit=crop&q=80',
  ],
  'lampe-bureau-led-design': [
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&h=800&fit=crop&q=80',
  ],
  'ecouteurs-bluetooth-sport': [
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&h=800&fit=crop&q=80',
  ],
  'tablette-graphique-pro': [
    'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&h=800&fit=crop&q=80',
  ],
  'veste-jean-vintage': [
    'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop&q=80',
  ],
  'robe-soiree-elegante': [
    'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=800&fit=crop&q=80',
  ],
  'cafetiere-automatique': [
    'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=800&fit=crop&q=80',
  ],
}

async function fixProductImages() {
  console.log('🔧 Fixing product images...\n')

  // Get all products
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      images: {
        select: {
          id: true,
          url: true,
          order: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  })

  let updatedCount = 0

  for (const product of products) {
    const newImages = productImages[product.slug]
    
    if (newImages && newImages.length > 0) {
      // Delete existing images
      await prisma.productImage.deleteMany({
        where: { productId: product.id },
      })

      // Create new images
      await prisma.productImage.createMany({
        data: newImages.map((url, index) => ({
          productId: product.id,
          url,
          alt: `${product.name} - Image ${index + 1}`,
          type: 'IMAGE',
          order: index,
        })),
      })

      console.log(`✅ Updated images for: ${product.name}`)
      updatedCount++
    } else {
      // For products without predefined images, use generic real images from Unsplash
      if (product.images.length === 0 || product.images[0].url.includes('placehold') || product.images[0].url.includes('picsum')) {
        await prisma.productImage.deleteMany({
          where: { productId: product.id },
        })

        // Generic product images from Unsplash based on category keywords
        const genericProductImages = [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop&q=80', // Watch/product
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop&q=80', // Headphones
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop&q=80', // Sneakers
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=800&fit=crop&q=80', // Camera
          'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&h=800&fit=crop&q=80', // Cosmetics
          'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&h=800&fit=crop&q=80', // Sunglasses
          'https://images.unsplash.com/photo-1491553895911-0055uj6a7?w=800&h=800&fit=crop&q=80', // Bag
          'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=800&fit=crop&q=80', // Clothes
        ]
        
        // Select images based on product name hash
        const hash = product.name.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
        const imageIndex = Math.abs(hash) % genericProductImages.length
        
        const genericImages = [
          genericProductImages[imageIndex],
          genericProductImages[(imageIndex + 1) % genericProductImages.length],
        ]

        await prisma.productImage.createMany({
          data: genericImages.map((url, index) => ({
            productId: product.id,
            url,
            alt: `${product.name} - Image ${index + 1}`,
            type: 'IMAGE',
            order: index,
          })),
        })

        console.log(`✅ Added generic images for: ${product.name}`)
        updatedCount++
      }
    }
  }

  console.log(`\n🎉 Updated ${updatedCount} products with new images!`)
  await prisma.$disconnect()
}

fixProductImages().catch(console.error)
