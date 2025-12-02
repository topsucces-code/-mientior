/**
 * Script to add demo images to products using placeholder image services
 * Run with: npx tsx scripts/seed-product-images.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// High-quality placeholder images from Unsplash (free to use)
const productImages: Record<string, { urls: string[]; alts: string[] }> = {
  // Electronics - Laptops
  'macbook-pro-16-m3-max': {
    urls: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80',
      'https://images.unsplash.com/photo-1541807084-5c52b6b92e2e?w=800&q=80',
    ],
    alts: ['MacBook Pro vue de face', 'MacBook Pro vue latérale', 'MacBook Pro clavier'],
  },
  // Electronics - Smartphones
  'iphone-15-pro': {
    urls: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80',
    ],
    alts: ['iPhone 15 Pro Titanium', 'iPhone caméra', 'iPhone écran'],
  },
  // Fashion - Men's T-Shirt
  'organic-cotton-premium-tshirt': {
    urls: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80',
    ],
    alts: ['T-shirt blanc coton bio', 'T-shirt noir coton bio', 'T-shirt détail'],
  },
  // Fashion - Women's Dress
  'floral-summer-dress': {
    urls: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80',
    ],
    alts: ['Robe fleurie été face', 'Robe fleurie été dos', 'Robe fleurie détail'],
  },
  // Home - Smart Speaker
  'smart-speaker-voice-assistant': {
    urls: [
      'https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80',
      'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=800&q=80',
    ],
    alts: ['Enceinte connectée grise', 'Enceinte connectée en utilisation'],
  },
}

// Additional products to create with images
const additionalProducts = [
  {
    name: 'Casque Audio Sans Fil Premium',
    slug: 'casque-audio-sans-fil-premium',
    description: 'Casque Bluetooth avec réduction de bruit active, autonomie 30h et son Hi-Fi.',
    price: 24999, // 249.99€ in cents
    compareAtPrice: 29999,
    stock: 45,
    rating: 4.7,
    reviewCount: 234,
    badge: 'Best Seller',
    featured: true,
    onSale: true,
    categorySlug: 'accessoires',
    images: [
      { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', alt: 'Casque audio noir premium' },
      { url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80', alt: 'Casque audio porté' },
      { url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80', alt: 'Casque audio détail' },
    ],
  },
  {
    name: 'Montre Connectée Sport',
    slug: 'montre-connectee-sport',
    description: 'Montre intelligente avec GPS, cardiofréquencemètre et 100+ modes sportifs.',
    price: 19999,
    compareAtPrice: 24999,
    stock: 78,
    rating: 4.5,
    reviewCount: 189,
    badge: 'NEW',
    featured: true,
    onSale: true,
    categorySlug: 'accessoires',
    images: [
      { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', alt: 'Montre connectée face' },
      { url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80', alt: 'Montre connectée sport' },
    ],
  },
  {
    name: 'Sneakers Urban Style',
    slug: 'sneakers-urban-style',
    description: 'Baskets tendance et confortables, parfaites pour un look urbain décontracté.',
    price: 8999,
    compareAtPrice: 11999,
    stock: 120,
    rating: 4.6,
    reviewCount: 312,
    featured: true,
    onSale: true,
    categorySlug: 'homme',
    images: [
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', alt: 'Sneakers rouge vue côté' },
      { url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80', alt: 'Sneakers blanc' },
      { url: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&q=80', alt: 'Sneakers détail' },
    ],
  },
  {
    name: 'Sac à Main Cuir Élégant',
    slug: 'sac-main-cuir-elegant',
    description: 'Sac à main en cuir véritable, design intemporel et finitions soignées.',
    price: 14999,
    compareAtPrice: 18999,
    stock: 35,
    rating: 4.8,
    reviewCount: 87,
    badge: 'Premium',
    featured: true,
    onSale: true,
    categorySlug: 'femme',
    images: [
      { url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80', alt: 'Sac à main cuir marron' },
      { url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80', alt: 'Sac à main noir' },
    ],
  },
  {
    name: 'Lampe de Bureau LED Design',
    slug: 'lampe-bureau-led-design',
    description: 'Lampe LED avec variateur tactile, port USB et design minimaliste moderne.',
    price: 4999,
    compareAtPrice: 6999,
    stock: 95,
    rating: 4.4,
    reviewCount: 156,
    featured: false,
    onSale: true,
    categorySlug: 'electromenager',
    images: [
      { url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80', alt: 'Lampe bureau LED blanche' },
      { url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80', alt: 'Lampe bureau en utilisation' },
    ],
  },
  {
    name: 'Écouteurs Bluetooth Sport',
    slug: 'ecouteurs-bluetooth-sport',
    description: 'Écouteurs sans fil résistants à l\'eau, parfaits pour le sport avec 8h d\'autonomie.',
    price: 7999,
    compareAtPrice: 9999,
    stock: 200,
    rating: 4.3,
    reviewCount: 445,
    badge: 'Hot',
    featured: true,
    onSale: true,
    categorySlug: 'accessoires',
    images: [
      { url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80', alt: 'Écouteurs Bluetooth noirs' },
      { url: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&q=80', alt: 'Écouteurs en boîtier' },
    ],
  },
  {
    name: 'Tablette Graphique Pro',
    slug: 'tablette-graphique-pro',
    description: 'Tablette de dessin professionnelle avec stylet sensible à la pression et écran HD.',
    price: 34999,
    compareAtPrice: 39999,
    stock: 28,
    rating: 4.9,
    reviewCount: 67,
    badge: 'Premium',
    featured: true,
    onSale: true,
    categorySlug: 'ordinateurs',
    images: [
      { url: 'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=800&q=80', alt: 'Tablette graphique avec stylet' },
      { url: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80', alt: 'Tablette graphique en utilisation' },
    ],
  },
  {
    name: 'Veste en Jean Vintage',
    slug: 'veste-jean-vintage',
    description: 'Veste en denim délavé style vintage, coupe classique et confortable.',
    price: 6999,
    compareAtPrice: 8999,
    stock: 65,
    rating: 4.5,
    reviewCount: 123,
    featured: false,
    onSale: true,
    categorySlug: 'homme',
    images: [
      { url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&q=80', alt: 'Veste jean bleue' },
      { url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80', alt: 'Veste jean portée' },
    ],
  },
  {
    name: 'Robe de Soirée Élégante',
    slug: 'robe-soiree-elegante',
    description: 'Robe longue élégante parfaite pour les occasions spéciales et soirées.',
    price: 12999,
    compareAtPrice: 15999,
    stock: 40,
    rating: 4.7,
    reviewCount: 78,
    badge: 'NEW',
    featured: true,
    onSale: true,
    categorySlug: 'femme',
    images: [
      { url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80', alt: 'Robe de soirée noire' },
      { url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80', alt: 'Robe de soirée rouge' },
    ],
  },
  {
    name: 'Cafetière Automatique',
    slug: 'cafetiere-automatique',
    description: 'Machine à café automatique avec broyeur intégré et mousseur à lait.',
    price: 29999,
    compareAtPrice: 34999,
    stock: 32,
    rating: 4.6,
    reviewCount: 201,
    badge: 'Best Seller',
    featured: true,
    onSale: true,
    categorySlug: 'electromenager',
    images: [
      { url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80', alt: 'Cafetière automatique noire' },
      { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80', alt: 'Café préparé' },
    ],
  },
]

async function main() {
  console.log('🖼️  Starting product images seed...\n')

  // Step 1: Update existing products with real images
  console.log('📸 Updating existing products with images...')
  
  for (const [slug, imageData] of Object.entries(productImages)) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { images: true },
    })

    if (product) {
      // Delete existing images
      await prisma.productImage.deleteMany({
        where: { productId: product.id },
      })

      // Create new images
      await prisma.productImage.createMany({
        data: imageData.urls.map((url, index) => ({
          productId: product.id,
          url,
          alt: imageData.alts[index] || product.name,
          type: 'IMAGE',
          order: index,
        })),
      })

      console.log(`  ✅ Updated images for: ${product.name}`)
    } else {
      console.log(`  ⚠️  Product not found: ${slug}`)
    }
  }

  // Step 2: Create additional products with images
  console.log('\n📦 Creating additional products with images...')

  for (const productData of additionalProducts) {
    // Check if product already exists
    const existing = await prisma.product.findUnique({
      where: { slug: productData.slug },
    })

    if (existing) {
      console.log(`  ⏭️  Skipping (already exists): ${productData.name}`)
      continue
    }

    // Find category
    const category = await prisma.category.findUnique({
      where: { slug: productData.categorySlug },
    })

    if (!category) {
      console.log(`  ⚠️  Category not found: ${productData.categorySlug}`)
      continue
    }

    // Create product with images
    await prisma.product.create({
      data: {
        name: productData.name,
        slug: productData.slug,
        description: productData.description,
        price: productData.price,
        compareAtPrice: productData.compareAtPrice,
        stock: productData.stock,
        rating: productData.rating,
        reviewCount: productData.reviewCount,
        badge: productData.badge,
        featured: productData.featured,
        onSale: productData.onSale,
        status: 'ACTIVE',
        categoryId: category.id,
        images: {
          create: productData.images.map((img, index) => ({
            url: img.url,
            alt: img.alt,
            type: 'IMAGE',
            order: index,
          })),
        },
      },
    })

    console.log(`  ✅ Created: ${productData.name}`)
  }

  // Step 3: Add images to any products without images
  console.log('\n🔍 Checking for products without images...')
  
  const productsWithoutImages = await prisma.product.findMany({
    where: {
      images: {
        none: {},
      },
    },
  })

  if (productsWithoutImages.length > 0) {
    console.log(`  Found ${productsWithoutImages.length} products without images`)
    
    // Generic placeholder images by category type
    const genericImages = [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',
    ]

    for (const product of productsWithoutImages) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: genericImages[Math.floor(Math.random() * genericImages.length)],
          alt: product.name,
          type: 'IMAGE',
          order: 0,
        },
      })
      console.log(`  ✅ Added placeholder image for: ${product.name}`)
    }
  } else {
    console.log('  ✅ All products have images')
  }

  // Summary
  const totalProducts = await prisma.product.count()
  const totalImages = await prisma.productImage.count()
  
  console.log('\n✨ Product images seed completed!')
  console.log(`   📦 Total products: ${totalProducts}`)
  console.log(`   🖼️  Total images: ${totalImages}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding product images:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
