import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...')
  await prisma.productTag.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.review.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.user.deleteMany()
  await prisma.fAQ.deleteMany()

  // Create users
  console.log('👥 Creating users...')
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        loyaltyLevel: 'GOLD',
        loyaltyPoints: 500,
        totalOrders: 8,
        totalSpent: 2450.00,
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        loyaltyLevel: 'PLATINUM',
        loyaltyPoints: 1200,
        totalOrders: 15,
        totalSpent: 5800.00,
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob.wilson@example.com',
        firstName: 'Bob',
        lastName: 'Wilson',
        loyaltyLevel: 'BRONZE',
        loyaltyPoints: 50,
        totalOrders: 2,
        totalSpent: 340.00,
      },
    }),
  ])
  console.log(`✅ Created ${users.length} users`)

  // Create categories (hierarchical) - French localization
  console.log('📁 Creating categories...')
  
  // Main Category: Électronique
  const electronique = await prisma.category.create({
    data: {
      name: 'Électronique',
      slug: 'electronique',
      description: 'Tous vos appareils électroniques',
      order: 1,
      isActive: true,
    },
  })

  // Électronique > Ordinateurs
  const ordinateurs = await prisma.category.create({
    data: {
      name: 'Ordinateurs',
      slug: 'ordinateurs',
      description: 'PC portables, de bureau et tablettes',
      parentId: electronique.id,
      order: 1,
      isActive: true,
    },
  })

  // Électronique > Smartphones
  const smartphones = await prisma.category.create({
    data: {
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Téléphones mobiles et accessoires',
      parentId: electronique.id,
      order: 2,
      isActive: true,
    },
  })

  // Électronique > Accessoires
  const accessoires = await prisma.category.create({
    data: {
      name: 'Accessoires',
      slug: 'accessoires',
      description: 'Écouteurs, chargeurs et coques',
      parentId: electronique.id,
      order: 3,
      isActive: true,
    },
  })

  // Main Category: Mode
  const mode = await prisma.category.create({
    data: {
      name: 'Mode',
      slug: 'mode',
      description: 'Vêtements et accessoires de mode',
      order: 2,
      isActive: true,
    },
  })

  // Mode > Homme
  const homme = await prisma.category.create({
    data: {
      name: 'Homme',
      slug: 'homme',
      description: 'Vêtements pour homme',
      parentId: mode.id,
      order: 1,
      isActive: true,
    },
  })

  // Mode > Femme
  const femme = await prisma.category.create({
    data: {
      name: 'Femme',
      slug: 'femme',
      description: 'Vêtements pour femme',
      parentId: mode.id,
      order: 2,
      isActive: true,
    },
  })

  // Main Category: Maison & Jardin
  const maison = await prisma.category.create({
    data: {
      name: 'Maison & Jardin',
      slug: 'maison',
      description: 'Meubles, décoration et électroménager',
      order: 3,
      isActive: true,
    },
  })

  // Maison > Électroménager
  const electromenager = await prisma.category.create({
    data: {
      name: 'Électroménager',
      slug: 'electromenager',
      description: 'Appareils pour la maison',
      parentId: maison.id,
      order: 1,
      isActive: true,
    },
  })

  // Main Category: Sports & Loisirs
  const sports = await prisma.category.create({
    data: {
      name: 'Sports & Loisirs',
      slug: 'sports',
      description: 'Équipements sportifs et loisirs',
      order: 4,
      isActive: true,
    },
  })

  // Main Category: Beauté & Santé
  const beaute = await prisma.category.create({
    data: {
      name: 'Beauté & Santé',
      slug: 'beaute',
      description: 'Produits de beauté et santé',
      order: 5,
      isActive: true,
    },
  })

  // Main Category: Livres & Médias
  const livres = await prisma.category.create({
    data: {
      name: 'Livres & Médias',
      slug: 'livres',
      description: 'Livres, musique et films',
      order: 6,
      isActive: true,
    },
  })

  // Main Category: Jouets & Enfants
  const jouets = await prisma.category.create({
    data: {
      name: 'Jouets & Enfants',
      slug: 'jouets',
      description: 'Jouets et articles pour enfants',
      order: 7,
      isActive: true,
    },
  })

  // Main Category: Auto & Moto
  const auto = await prisma.category.create({
    data: {
      name: 'Auto & Moto',
      slug: 'auto',
      description: 'Pièces et accessoires auto',
      order: 8,
      isActive: true,
    },
  })

  console.log('✅ Created 14 categories (8 main + 6 subcategories)')

  // Create tags
  console.log('🏷️  Creating tags...')
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'New Arrival', slug: 'new-arrival' } }),
    prisma.tag.create({ data: { name: 'Best Seller', slug: 'best-seller' } }),
    prisma.tag.create({ data: { name: 'Limited Edition', slug: 'limited-edition' } }),
    prisma.tag.create({ data: { name: 'Eco-Friendly', slug: 'eco-friendly' } }),
    prisma.tag.create({ data: { name: 'Premium', slug: 'premium' } }),
  ])
  console.log(`✅ Created ${tags.length} tags`)

  // Create products with variants and images
  console.log('📦 Creating products...')
  
  // Product 1: Premium Laptop
  const laptop1 = await prisma.product.create({
    data: {
      name: 'MacBook Pro 16" M3 Max',
      slug: 'macbook-pro-16-m3-max',
      description: 'Powerful laptop with M3 Max chip, perfect for professionals and creatives.',
      price: 2499.00,
      compareAtPrice: 2799.00,
      stock: 25,
      rating: 4.8,
      reviewCount: 127,
      badge: 'Premium',
      featured: true,
      onSale: true,
      status: 'ACTIVE',
      categoryId: ordinateurs.id,
      images: {
        create: [
          { url: '/images/macbook-pro-1.jpg', alt: 'MacBook Pro front view', type: 'IMAGE', order: 0 },
          { url: '/images/macbook-pro-2.jpg', alt: 'MacBook Pro side view', type: 'IMAGE', order: 1 },
          { url: '/images/macbook-pro-3.jpg', alt: 'MacBook Pro keyboard', type: 'IMAGE', order: 2 },
        ],
      },
      variants: {
        create: [
          { sku: 'MBP-16-M3-32GB-512GB', size: '32GB RAM', color: 'Space Gray', stock: 15, priceModifier: 0 },
          { sku: 'MBP-16-M3-64GB-1TB', size: '64GB RAM', color: 'Space Gray', stock: 8, priceModifier: 500 },
          { sku: 'MBP-16-M3-32GB-512GB-SLV', size: '32GB RAM', color: 'Silver', stock: 12, priceModifier: 0 },
        ],
      },
      tags: {
        create: [
          { tag: { connect: { id: tags[0].id } } }, // New Arrival
          { tag: { connect: { id: tags[4].id } } }, // Premium
        ],
      },
    },
  })

  // Product 2: Smartphone
  const phone1 = await prisma.product.create({
    data: {
      name: 'iPhone 15 Pro',
      slug: 'iphone-15-pro',
      description: 'Latest iPhone with A17 Pro chip, titanium design, and advanced camera system.',
      price: 999.00,
      compareAtPrice: 1099.00,
      stock: 50,
      rating: 4.7,
      reviewCount: 342,
      badge: 'Best Seller',
      featured: true,
      onSale: false,
      status: 'ACTIVE',
      categoryId: smartphones.id,
      images: {
        create: [
          { url: '/images/iphone-15-pro-1.jpg', alt: 'iPhone 15 Pro Natural Titanium', type: 'IMAGE', order: 0 },
          { url: '/images/iphone-15-pro-2.jpg', alt: 'iPhone 15 Pro camera system', type: 'IMAGE', order: 1 },
        ],
      },
      variants: {
        create: [
          { sku: 'IP15P-128GB-NAT', size: '128GB', color: 'Natural Titanium', stock: 20, priceModifier: 0 },
          { sku: 'IP15P-256GB-NAT', size: '256GB', color: 'Natural Titanium', stock: 15, priceModifier: 100 },
          { sku: 'IP15P-128GB-BLU', size: '128GB', color: 'Blue Titanium', stock: 15, priceModifier: 0 },
        ],
      },
      tags: {
        create: [
          { tag: { connect: { id: tags[1].id } } }, // Best Seller
          { tag: { connect: { id: tags[4].id } } }, // Premium
        ],
      },
    },
  })

  // Product 3: Men's T-Shirt
  const tshirt1 = await prisma.product.create({
    data: {
      name: 'Organic Cotton Premium T-Shirt',
      slug: 'organic-cotton-premium-tshirt',
      description: 'Sustainable, comfortable, and stylish t-shirt made from 100% organic cotton.',
      price: 29.99,
      compareAtPrice: 39.99,
      stock: 150,
      rating: 4.5,
      reviewCount: 89,
      featured: false,
      onSale: true,
      status: 'ACTIVE',
      categoryId: homme.id,
      images: {
        create: [
          { url: '/images/tshirt-white-1.jpg', alt: 'White organic cotton t-shirt', type: 'IMAGE', order: 0 },
          { url: '/images/tshirt-black-1.jpg', alt: 'Black organic cotton t-shirt', type: 'IMAGE', order: 1 },
        ],
      },
      variants: {
        create: [
          { sku: 'TSHIRT-ORG-S-WHT', size: 'S', color: 'White', stock: 30, priceModifier: 0 },
          { sku: 'TSHIRT-ORG-M-WHT', size: 'M', color: 'White', stock: 40, priceModifier: 0 },
          { sku: 'TSHIRT-ORG-L-WHT', size: 'L', color: 'White', stock: 35, priceModifier: 0 },
          { sku: 'TSHIRT-ORG-S-BLK', size: 'S', color: 'Black', stock: 25, priceModifier: 0 },
          { sku: 'TSHIRT-ORG-M-BLK', size: 'M', color: 'Black', stock: 20, priceModifier: 0 },
        ],
      },
      tags: {
        create: [
          { tag: { connect: { id: tags[3].id } } }, // Eco-Friendly
        ],
      },
    },
  })

  // Product 4: Women's Dress
  const dress1 = await prisma.product.create({
    data: {
      name: 'Floral Summer Dress',
      slug: 'floral-summer-dress',
      description: 'Beautiful and elegant floral dress perfect for summer occasions.',
      price: 79.99,
      stock: 60,
      rating: 4.6,
      reviewCount: 45,
      featured: true,
      onSale: false,
      status: 'ACTIVE',
      categoryId: femme.id,
      images: {
        create: [
          { url: '/images/dress-floral-1.jpg', alt: 'Floral summer dress front', type: 'IMAGE', order: 0 },
          { url: '/images/dress-floral-2.jpg', alt: 'Floral summer dress back', type: 'IMAGE', order: 1 },
        ],
      },
      variants: {
        create: [
          { sku: 'DRESS-FLR-XS-BLU', size: 'XS', color: 'Blue Floral', stock: 15, priceModifier: 0 },
          { sku: 'DRESS-FLR-S-BLU', size: 'S', color: 'Blue Floral', stock: 20, priceModifier: 0 },
          { sku: 'DRESS-FLR-M-BLU', size: 'M', color: 'Blue Floral', stock: 15, priceModifier: 0 },
          { sku: 'DRESS-FLR-L-BLU', size: 'L', color: 'Blue Floral', stock: 10, priceModifier: 0 },
        ],
      },
      tags: {
        create: [
          { tag: { connect: { id: tags[0].id } } }, // New Arrival
        ],
      },
    },
  })

  // Product 5: Smart Home Device
  const smartSpeaker = await prisma.product.create({
    data: {
      name: 'Smart Speaker with Voice Assistant',
      slug: 'smart-speaker-voice-assistant',
      description: 'Control your smart home with voice commands. Premium sound quality.',
      price: 99.99,
      compareAtPrice: 129.99,
      stock: 80,
      rating: 4.4,
      reviewCount: 156,
      badge: 'Hot',
      featured: false,
      onSale: true,
      status: 'ACTIVE',
      categoryId: electromenager.id,
      images: {
        create: [
          { url: '/images/smart-speaker-1.jpg', alt: 'Smart speaker gray', type: 'IMAGE', order: 0 },
        ],
      },
      variants: {
        create: [
          { sku: 'SPEAKER-V3-GRY', color: 'Gray', stock: 40, priceModifier: 0 },
          { sku: 'SPEAKER-V3-BLK', color: 'Black', stock: 25, priceModifier: 0 },
          { sku: 'SPEAKER-V3-WHT', color: 'White', stock: 15, priceModifier: 0 },
        ],
      },
      tags: {
        create: [
          { tag: { connect: { id: tags[1].id } } }, // Best Seller
        ],
      },
    },
  })

  console.log('✅ Created 5 products with variants and images')

  // Create reviews
  console.log('⭐ Creating reviews...')
  await prisma.review.create({
    data: {
      rating: 5,
      title: 'Amazing laptop!',
      comment: 'Best laptop I have ever owned. The M3 Max chip is incredibly fast.',
      status: 'APPROVED',
      productId: laptop1.id,
      userId: users[1].id,
      userName: 'Jane Smith',
    },
  })

  await prisma.review.create({
    data: {
      rating: 5,
      title: 'Perfect phone',
      comment: 'The camera quality is outstanding. Battery life is excellent.',
      status: 'APPROVED',
      productId: phone1.id,
      userId: users[0].id,
      userName: 'John Doe',
    },
  })

  await prisma.review.create({
    data: {
      rating: 4,
      title: 'Great quality shirt',
      comment: 'Very comfortable and well-made. True to size.',
      status: 'APPROVED',
      productId: tshirt1.id,
      userId: users[2].id,
      userName: 'Bob Wilson',
    },
  })

  console.log('✅ Created 3 reviews')

  // Create orders
  console.log('📋 Creating orders...')
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-2024-0001',
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      subtotal: 2499.00,
      tax: 249.90,
      shipping: 0,
      total: 2748.90,
      userId: users[1].id,
      shippingAddress: {
        firstName: 'Jane',
        lastName: 'Smith',
        line1: '123 Main St',
        city: 'San Francisco',
        postalCode: '94102',
        country: 'USA',
      },
      items: {
        create: [
          {
            quantity: 1,
            price: 2499.00,
            productId: laptop1.id,
          },
        ],
      },
    },
  })

  await prisma.order.create({
    data: {
      orderNumber: 'ORD-2024-0002',
      status: 'PROCESSING',
      paymentStatus: 'PAID',
      subtotal: 1028.99,
      tax: 102.90,
      shipping: 15.00,
      total: 1146.89,
      userId: users[0].id,
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        line1: '456 Oak Ave',
        city: 'Los Angeles',
        postalCode: '90001',
        country: 'USA',
      },
      items: {
        create: [
          {
            quantity: 1,
            price: 999.00,
            productId: phone1.id,
          },
          {
            quantity: 1,
            price: 29.99,
            productId: tshirt1.id,
          },
        ],
      },
    },
  })

  await prisma.order.create({
    data: {
      orderNumber: 'ORD-2024-0003',
      status: 'PENDING',
      paymentStatus: 'PENDING',
      subtotal: 179.98,
      tax: 18.00,
      shipping: 10.00,
      total: 207.98,
      userId: users[2].id,
      shippingAddress: {
        firstName: 'Bob',
        lastName: 'Wilson',
        line1: '789 Pine Rd',
        city: 'Seattle',
        postalCode: '98101',
        country: 'USA',
      },
      items: {
        create: [
          {
            quantity: 1,
            price: 99.99,
            productId: smartSpeaker.id,
          },
          {
            quantity: 1,
            price: 79.99,
            productId: dress1.id,
          },
        ],
      },
    },
  })

  console.log('✅ Created 3 orders')

  // Create FAQs
  console.log('❓ Creating FAQs...')
  await Promise.all([
    prisma.fAQ.create({
      data: {
        question: 'What is your return policy?',
        answer: 'We offer a 30-day money-back guarantee on all products. Items must be in original condition with tags attached.',
        order: 1,
        isActive: true,
      },
    }),
    prisma.fAQ.create({
      data: {
        question: 'How long does shipping take?',
        answer: 'Standard shipping takes 3-5 business days. Express shipping is available for 1-2 business day delivery.',
        order: 2,
        isActive: true,
      },
    }),
    prisma.fAQ.create({
      data: {
        question: 'Do you ship internationally?',
        answer: 'Yes, we ship to over 100 countries worldwide. International shipping times vary by location.',
        order: 3,
        isActive: true,
      },
    }),
  ])

  console.log('✅ Created 3 FAQs')

  console.log('✨ Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
