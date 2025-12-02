/**
 * Script to seed test products for MeiliSearch verification
 * Run with: npx tsx scripts/seed-test-products.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding test products...')

  // Ensure categories exist
  const electronics = await prisma.category.upsert({
    where: { slug: 'electronique' },
    update: {},
    create: {
      name: 'Électronique',
      slug: 'electronique',
      description: 'Test Electronics Category',
      isActive: true,
    },
  })

  const fashion = await prisma.category.upsert({
    where: { slug: 'mode-accessoires' },
    update: {},
    create: {
      name: 'Mode & Accessoires',
      slug: 'mode-accessoires',
      description: 'Test Fashion Category',
      isActive: true,
    },
  })

  // Create test products
  const products = [
    {
      name: 'Sony WH-1000XM5 Wireless Headphones',
      slug: 'sony-wh-1000xm5',
      description: 'Industry-leading noise canceling headphones with Auto NC Optimizer, 30-hour battery life, and crystal clear hands-free calling.',
      price: 348.00,
      stock: 50,
      status: 'ACTIVE',
      categoryId: electronics.id,
      images: {
        create: [{ url: '/images/sony-xm5.jpg', alt: 'Sony XM5 Headphones', type: 'IMAGE', order: 0 }]
      },
      tags: {
        create: [{ tag: { connectOrCreate: { where: { slug: 'audio' }, create: { name: 'Audio', slug: 'audio' } } } }]
      }
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-s24-ultra',
      description: 'AI-powered smartphone with 200MP camera, S Pen, and long-lasting battery. The ultimate Android experience.',
      price: 1299.00,
      stock: 25,
      status: 'ACTIVE',
      categoryId: electronics.id,
      images: {
        create: [{ url: '/images/s24-ultra.jpg', alt: 'Samsung S24 Ultra', type: 'IMAGE', order: 0 }]
      },
      tags: {
        create: [{ tag: { connectOrCreate: { where: { slug: 'smartphone' }, create: { name: 'Smartphone', slug: 'smartphone' } } } }]
      }
    },
    {
      name: 'Vintage Denim Jacket',
      slug: 'vintage-denim-jacket',
      description: 'Classic blue denim jacket with a vintage wash. Perfect for casual layering.',
      price: 89.99,
      stock: 15,
      status: 'ACTIVE',
      categoryId: fashion.id,
      images: {
        create: [{ url: '/images/denim-jacket.jpg', alt: 'Denim Jacket', type: 'IMAGE', order: 0 }]
      },
      tags: {
        create: [{ tag: { connectOrCreate: { where: { slug: 'vintage' }, create: { name: 'Vintage', slug: 'vintage' } } } }]
      }
    },
    {
      name: 'Running Shoes - Speed Pro',
      slug: 'running-shoes-speed-pro',
      description: 'Lightweight running shoes designed for marathon training. Breathable mesh and responsive cushioning.',
      price: 120.00,
      stock: 100,
      status: 'ACTIVE',
      categoryId: fashion.id,
      images: {
        create: [{ url: '/images/running-shoes.jpg', alt: 'Speed Pro Shoes', type: 'IMAGE', order: 0 }]
      },
      tags: {
        create: [{ tag: { connectOrCreate: { where: { slug: 'sports' }, create: { name: 'Sports', slug: 'sports' } } } }]
      }
    }
  ]

  for (const product of products) {
    // Check if product exists to avoid unique constraint errors on slug
    const existing = await prisma.product.findUnique({ where: { slug: product.slug } })
    
    if (existing) {
      console.log(`🔄 Product ${product.name} already exists, skipping...`)
      continue
    }

    await prisma.product.create({
      data: product as any // Using any to bypass complex nested create types for simplicity in seed script
    })
    console.log(`✅ Created product: ${product.name}`)
  }

  console.log('✨ Test products seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding test products:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
