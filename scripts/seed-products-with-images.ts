/**
 * Seed Products with Real Images
 * Run with: npx tsx scripts/seed-products-with-images.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Using picsum.photos for placeholder images
const getProductImage = (id: number, width = 800, height = 800) => 
  `https://picsum.photos/seed/product${id}/${width}/${height}`

const products = [
  {
    name: 'MacBook Pro 14"',
    slug: 'macbook-pro-14',
    description: 'Le MacBook Pro 14 pouces avec puce M3 Pro offre des performances exceptionnelles pour les professionnels créatifs.',
    price: 2499.00,
    compareAtPrice: 2699.00,
    stock: 25,
    category: 'Électronique',
    images: [1, 2, 3],
  },
  {
    name: 'iPhone 15 Pro Max',
    slug: 'iphone-15-pro-max',
    description: 'L\'iPhone 15 Pro Max avec titane, puce A17 Pro et système photo révolutionnaire.',
    price: 1479.00,
    compareAtPrice: null,
    stock: 50,
    category: 'Électronique',
    images: [4, 5, 6],
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    slug: 'samsung-galaxy-s24-ultra',
    description: 'Le Galaxy S24 Ultra avec Galaxy AI, S Pen intégré et appareil photo 200MP.',
    price: 1469.00,
    compareAtPrice: 1569.00,
    stock: 35,
    category: 'Électronique',
    images: [7, 8, 9],
  },
  {
    name: 'Sony WH-1000XM5',
    slug: 'sony-wh-1000xm5',
    description: 'Casque sans fil à réduction de bruit leader du marché avec 30h d\'autonomie.',
    price: 379.00,
    compareAtPrice: 419.00,
    stock: 100,
    category: 'Électronique',
    images: [10, 11],
  },
  {
    name: 'Nike Air Max 90',
    slug: 'nike-air-max-90',
    description: 'Les légendaires Air Max 90, confort et style iconique depuis 1990.',
    price: 149.00,
    compareAtPrice: null,
    stock: 200,
    category: 'Mode',
    images: [12, 13, 14],
  },
  {
    name: 'Adidas Ultraboost 23',
    slug: 'adidas-ultraboost-23',
    description: 'Chaussures de running avec technologie Boost pour un retour d\'énergie maximal.',
    price: 189.00,
    compareAtPrice: 210.00,
    stock: 150,
    category: 'Mode',
    images: [15, 16],
  },
  {
    name: 'Dyson V15 Detect',
    slug: 'dyson-v15-detect',
    description: 'Aspirateur sans fil avec laser révélateur de poussière et écran LCD.',
    price: 699.00,
    compareAtPrice: 799.00,
    stock: 40,
    category: 'Maison',
    images: [17, 18],
  },
  {
    name: 'Apple Watch Series 9',
    slug: 'apple-watch-series-9',
    description: 'La montre connectée la plus avancée avec Double Tap et écran toujours allumé.',
    price: 449.00,
    compareAtPrice: null,
    stock: 75,
    category: 'Électronique',
    images: [19, 20],
  },
  {
    name: 'PlayStation 5',
    slug: 'playstation-5',
    description: 'Console de jeu nouvelle génération avec SSD ultra-rapide et manette DualSense.',
    price: 549.00,
    compareAtPrice: null,
    stock: 20,
    category: 'Électronique',
    images: [21, 22, 23],
  },
  {
    name: 'iPad Pro 12.9"',
    slug: 'ipad-pro-12-9',
    description: 'iPad Pro avec puce M2, écran Liquid Retina XDR et compatibilité Apple Pencil.',
    price: 1329.00,
    compareAtPrice: 1449.00,
    stock: 30,
    category: 'Électronique',
    images: [24, 25],
  },
  {
    name: 'Sac à dos Fjällräven Kånken',
    slug: 'fjallraven-kanken',
    description: 'Le sac à dos iconique suédois, durable et intemporel.',
    price: 95.00,
    compareAtPrice: null,
    stock: 300,
    category: 'Mode',
    images: [26, 27],
  },
  {
    name: 'Machine à café Nespresso Vertuo',
    slug: 'nespresso-vertuo',
    description: 'Machine à café avec technologie Centrifusion pour un café parfait.',
    price: 199.00,
    compareAtPrice: 249.00,
    stock: 60,
    category: 'Maison',
    images: [28, 29],
  },
]

async function main() {
  console.log('🌱 Seeding products with images...\n')

  // Get or create categories
  const categoryMap = new Map<string, string>()
  
  const categoryData = [
    { name: 'Électronique', slug: 'electronique' },
    { name: 'Mode', slug: 'mode' },
    { name: 'Maison', slug: 'maison' },
  ]
  
  for (const cat of categoryData) {
    let category = await prisma.category.findFirst({
      where: { OR: [{ name: cat.name }, { slug: cat.slug }] },
    })

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          description: `Catégorie ${cat.name}`,
        },
      })
      console.log(`✅ Created category: ${cat.name}`)
    } else {
      console.log(`📁 Using existing category: ${category.name}`)
    }
    
    categoryMap.set(cat.name, category.id)
  }

  // Create products
  for (const productData of products) {
    const categoryId = categoryMap.get(productData.category)
    
    if (!categoryId) {
      console.log(`❌ Category not found: ${productData.category}`)
      continue
    }

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { slug: productData.slug },
    })

    if (existing) {
      // Update images for existing product
      await prisma.productImage.deleteMany({
        where: { productId: existing.id },
      })

      for (let i = 0; i < productData.images.length; i++) {
        await prisma.productImage.create({
          data: {
            productId: existing.id,
            url: getProductImage(productData.images[i]),
            alt: `${productData.name} - Image ${i + 1}`,
            order: i,
          },
        })
      }

      console.log(`🔄 Updated images for: ${productData.name}`)
    } else {
      // Create new product with images
      const product = await prisma.product.create({
        data: {
          name: productData.name,
          slug: productData.slug,
          description: productData.description,
          price: productData.price,
          compareAtPrice: productData.compareAtPrice,
          stock: productData.stock,
          categoryId,
          status: 'ACTIVE',
          featured: Math.random() > 0.7,
          onSale: productData.compareAtPrice !== null,
          images: {
            create: productData.images.map((imgId, index) => ({
              url: getProductImage(imgId),
              alt: `${productData.name} - Image ${index + 1}`,
              order: index,
            })),
          },
        },
      })

      console.log(`✅ Created product: ${product.name}`)
    }
  }

  console.log('\n✨ Seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
