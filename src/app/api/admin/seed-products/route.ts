import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'

const testProducts = [
  {
    id: 'prod-macbook-pro',
    name: 'MacBook Pro 16" M3 Max',
    slug: 'macbook-pro-16-m3-max',
    description: 'Le MacBook Pro le plus puissant jamais conçu. Puce M3 Max, écran Liquid Retina XDR, autonomie exceptionnelle.',
    price: 2499,
    compareAtPrice: 2699,
    stock: 25,
    rating: 4.8,
    reviewCount: 342,
    featured: true,
    onSale: true,
    categorySlug: 'electronique',
    images: [
      { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80', alt: 'MacBook Pro 16 pouces' },
    ],
    variants: [
      { sku: 'MBP-16-M3-512', size: '512GB', color: 'Gris sidéral', stock: 10, priceModifier: 0 },
      { sku: 'MBP-16-M3-1TB', size: '1TB', color: 'Gris sidéral', stock: 8, priceModifier: 200 },
      { sku: 'MBP-16-M3-512-S', size: '512GB', color: 'Argent', stock: 7, priceModifier: 0 },
    ],
  },
  {
    id: 'prod-iphone-15-pro',
    name: 'iPhone 15 Pro',
    slug: 'iphone-15-pro',
    description: 'iPhone 15 Pro avec puce A17 Pro, titane de qualité aérospatiale et système photo révolutionnaire.',
    price: 1479,
    compareAtPrice: null,
    stock: 50,
    rating: 4.9,
    reviewCount: 589,
    featured: true,
    onSale: false,
    categorySlug: 'electronique',
    images: [
      { url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80', alt: 'iPhone 15 Pro' },
    ],
    variants: [
      { sku: 'IP15P-128-NAT', size: '128GB', color: 'Titane naturel', stock: 15, priceModifier: 0 },
      { sku: 'IP15P-256-NAT', size: '256GB', color: 'Titane naturel', stock: 12, priceModifier: 100 },
      { sku: 'IP15P-128-BLU', size: '128GB', color: 'Titane bleu', stock: 10, priceModifier: 0 },
    ],
  },
  {
    id: 'prod-casque-premium',
    name: 'Casque Audio Sans Fil Premium',
    slug: 'casque-audio-sans-fil-premium',
    description: 'Casque audio haut de gamme avec réduction de bruit active, son Hi-Res et 30h d\'autonomie.',
    price: 249.99,
    compareAtPrice: 299.99,
    stock: 45,
    rating: 4.7,
    reviewCount: 234,
    featured: true,
    onSale: true,
    categorySlug: 'electronique',
    images: [
      { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', alt: 'Casque audio premium' },
    ],
    variants: [
      { sku: 'CASQUE-NOIR', size: null, color: 'Noir', stock: 20, priceModifier: 0 },
      { sku: 'CASQUE-BLANC', size: null, color: 'Blanc', stock: 15, priceModifier: 0 },
      { sku: 'CASQUE-BLEU', size: null, color: 'Bleu nuit', stock: 10, priceModifier: 10 },
    ],
  },
  {
    id: 'prod-sneakers-urban',
    name: 'Sneakers Urban Style',
    slug: 'sneakers-urban-style',
    description: 'Sneakers tendance au design urbain. Confort optimal et style moderne pour tous les jours.',
    price: 89.99,
    compareAtPrice: 119.99,
    stock: 120,
    rating: 4.6,
    reviewCount: 312,
    featured: true,
    onSale: true,
    categorySlug: 'chaussures',
    images: [
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', alt: 'Sneakers Urban Style' },
    ],
    variants: [
      { sku: 'SNKR-40-BLK', size: '40', color: 'Noir', stock: 15, priceModifier: 0 },
      { sku: 'SNKR-41-BLK', size: '41', color: 'Noir', stock: 20, priceModifier: 0 },
      { sku: 'SNKR-42-BLK', size: '42', color: 'Noir', stock: 25, priceModifier: 0 },
      { sku: 'SNKR-43-BLK', size: '43', color: 'Noir', stock: 20, priceModifier: 0 },
      { sku: 'SNKR-40-WHT', size: '40', color: 'Blanc', stock: 10, priceModifier: 0 },
      { sku: 'SNKR-41-WHT', size: '41', color: 'Blanc', stock: 15, priceModifier: 0 },
    ],
  },
  {
    id: 'prod-sac-cuir',
    name: 'Sac à Main Cuir Élégant',
    slug: 'sac-main-cuir-elegant',
    description: 'Sac à main en cuir véritable, design élégant et intemporel. Parfait pour toutes les occasions.',
    price: 149.99,
    compareAtPrice: 189.99,
    stock: 35,
    rating: 4.8,
    reviewCount: 87,
    featured: true,
    onSale: true,
    categorySlug: 'accessoires',
    images: [
      { url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80', alt: 'Sac à main cuir' },
    ],
    variants: [
      { sku: 'SAC-NOIR', size: null, color: 'Noir', stock: 15, priceModifier: 0 },
      { sku: 'SAC-MARRON', size: null, color: 'Marron', stock: 12, priceModifier: 0 },
      { sku: 'SAC-BEIGE', size: null, color: 'Beige', stock: 8, priceModifier: 0 },
    ],
  },
  {
    id: 'prod-robe-soiree',
    name: 'Robe de Soirée Élégante',
    slug: 'robe-soiree-elegante',
    description: 'Robe de soirée élégante avec coupe flatteuse. Tissu fluide et confortable pour vos événements.',
    price: 129.99,
    compareAtPrice: 159.99,
    stock: 40,
    rating: 4.7,
    reviewCount: 78,
    featured: true,
    onSale: true,
    categorySlug: 'vetements',
    images: [
      { url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80', alt: 'Robe de soirée' },
    ],
    variants: [
      { sku: 'ROBE-S-NOIR', size: 'S', color: 'Noir', stock: 10, priceModifier: 0 },
      { sku: 'ROBE-M-NOIR', size: 'M', color: 'Noir', stock: 12, priceModifier: 0 },
      { sku: 'ROBE-L-NOIR', size: 'L', color: 'Noir', stock: 8, priceModifier: 0 },
      { sku: 'ROBE-S-ROUGE', size: 'S', color: 'Rouge', stock: 5, priceModifier: 10 },
      { sku: 'ROBE-M-ROUGE', size: 'M', color: 'Rouge', stock: 5, priceModifier: 10 },
    ],
  },
  {
    id: 'prod-tshirt-coton',
    name: 'T-Shirt Coton Bio Premium',
    slug: 'tshirt-coton-bio-premium',
    description: 'T-shirt en coton biologique certifié. Coupe moderne et confortable, parfait au quotidien.',
    price: 29.99,
    compareAtPrice: null,
    stock: 150,
    rating: 4.4,
    reviewCount: 423,
    featured: false,
    onSale: false,
    categorySlug: 'vetements',
    images: [
      { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80', alt: 'T-shirt coton bio' },
    ],
    variants: [
      { sku: 'TSH-S-BLC', size: 'S', color: 'Blanc', stock: 25, priceModifier: 0 },
      { sku: 'TSH-M-BLC', size: 'M', color: 'Blanc', stock: 30, priceModifier: 0 },
      { sku: 'TSH-L-BLC', size: 'L', color: 'Blanc', stock: 25, priceModifier: 0 },
      { sku: 'TSH-XL-BLC', size: 'XL', color: 'Blanc', stock: 20, priceModifier: 0 },
      { sku: 'TSH-S-NOR', size: 'S', color: 'Noir', stock: 15, priceModifier: 0 },
      { sku: 'TSH-M-NOR', size: 'M', color: 'Noir', stock: 20, priceModifier: 0 },
      { sku: 'TSH-L-NOR', size: 'L', color: 'Noir', stock: 15, priceModifier: 0 },
    ],
  },
  {
    id: 'prod-montre-sport',
    name: 'Montre Connectée Sport',
    slug: 'montre-connectee-sport',
    description: 'Montre connectée avec GPS intégré, suivi fitness avancé et 7 jours d\'autonomie.',
    price: 199.99,
    compareAtPrice: 249.99,
    stock: 78,
    rating: 4.5,
    reviewCount: 189,
    featured: true,
    onSale: true,
    categorySlug: 'accessoires',
    images: [
      { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', alt: 'Montre connectée sport' },
    ],
    variants: [
      { sku: 'WATCH-BLK', size: null, color: 'Noir', stock: 30, priceModifier: 0 },
      { sku: 'WATCH-SLV', size: null, color: 'Argent', stock: 25, priceModifier: 0 },
      { sku: 'WATCH-GLD', size: null, color: 'Or rose', stock: 23, priceModifier: 20 },
    ],
  },
  {
    id: 'prod-ecouteurs-bt',
    name: 'Écouteurs Bluetooth Sport',
    slug: 'ecouteurs-bluetooth-sport',
    description: 'Écouteurs sans fil résistants à l\'eau, parfaits pour le sport. Son immersif et 8h d\'autonomie.',
    price: 79.99,
    compareAtPrice: 99.99,
    stock: 200,
    rating: 4.3,
    reviewCount: 445,
    featured: false,
    onSale: true,
    categorySlug: 'electronique',
    images: [
      { url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80', alt: 'Écouteurs Bluetooth' },
    ],
    variants: [
      { sku: 'EARB-BLK', size: null, color: 'Noir', stock: 80, priceModifier: 0 },
      { sku: 'EARB-WHT', size: null, color: 'Blanc', stock: 70, priceModifier: 0 },
      { sku: 'EARB-BLU', size: null, color: 'Bleu', stock: 50, priceModifier: 0 },
    ],
  },
  {
    id: 'prod-robe-ete',
    name: 'Robe d\'Été Fleurie',
    slug: 'robe-ete-fleurie',
    description: 'Robe légère à motifs floraux, parfaite pour l\'été. Tissu respirant et coupe fluide.',
    price: 79.99,
    compareAtPrice: null,
    stock: 65,
    rating: 4.5,
    reviewCount: 156,
    featured: false,
    onSale: false,
    categorySlug: 'vetements',
    images: [
      { url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80', alt: 'Robe été fleurie' },
    ],
    variants: [
      { sku: 'ROBE-ETE-S', size: 'S', color: 'Floral', stock: 15, priceModifier: 0 },
      { sku: 'ROBE-ETE-M', size: 'M', color: 'Floral', stock: 20, priceModifier: 0 },
      { sku: 'ROBE-ETE-L', size: 'L', color: 'Floral', stock: 18, priceModifier: 0 },
      { sku: 'ROBE-ETE-XL', size: 'XL', color: 'Floral', stock: 12, priceModifier: 0 },
    ],
  },
  {
    id: 'prod-bijoux-collier',
    name: 'Collier Pendentif Or',
    slug: 'collier-pendentif-or',
    description: 'Collier élégant avec pendentif en or 18 carats. Design minimaliste et raffiné.',
    price: 299.99,
    compareAtPrice: 349.99,
    stock: 20,
    rating: 4.9,
    reviewCount: 45,
    featured: true,
    onSale: true,
    categorySlug: 'accessoires',
    images: [
      { url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80', alt: 'Collier pendentif or' },
    ],
    variants: [
      { sku: 'COLL-40CM', size: '40cm', color: 'Or', stock: 10, priceModifier: 0 },
      { sku: 'COLL-45CM', size: '45cm', color: 'Or', stock: 10, priceModifier: 0 },
    ],
  },
  {
    id: 'prod-parfum-homme',
    name: 'Parfum Homme Intense',
    slug: 'parfum-homme-intense',
    description: 'Eau de parfum masculine aux notes boisées et épicées. Tenue longue durée.',
    price: 89.99,
    compareAtPrice: null,
    stock: 60,
    rating: 4.6,
    reviewCount: 234,
    featured: false,
    onSale: false,
    categorySlug: 'beaute',
    images: [
      { url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80', alt: 'Parfum homme' },
    ],
    variants: [
      { sku: 'PARF-50ML', size: '50ml', color: null, stock: 30, priceModifier: 0 },
      { sku: 'PARF-100ML', size: '100ml', color: null, stock: 30, priceModifier: 40 },
    ],
  },
]

export async function GET() {
  try {
    const createdProducts = []

    for (const productData of testProducts) {
      // Find category by slug
      const category = await prisma.category.findFirst({
        where: { slug: productData.categorySlug },
      })

      if (!category) {
        console.log(`Category not found for slug: ${productData.categorySlug}`)
        continue
      }

      // Create or update product
      const product = await prisma.product.upsert({
        where: { id: productData.id },
        update: {
          name: productData.name,
          slug: productData.slug,
          description: productData.description,
          price: productData.price,
          compareAtPrice: productData.compareAtPrice,
          stock: productData.stock,
          rating: productData.rating,
          reviewCount: productData.reviewCount,
          featured: productData.featured,
          onSale: productData.onSale,
          categoryId: category.id,
          updatedAt: new Date(),
        },
        create: {
          id: productData.id,
          name: productData.name,
          slug: productData.slug,
          description: productData.description,
          price: productData.price,
          compareAtPrice: productData.compareAtPrice,
          stock: productData.stock,
          rating: productData.rating,
          reviewCount: productData.reviewCount,
          featured: productData.featured,
          onSale: productData.onSale,
          categoryId: category.id,
          updatedAt: new Date(),
        },
      })

      // Delete existing images and variants
      await prisma.product_images.deleteMany({ where: { product_id: product.id } })
      await prisma.product_variants.deleteMany({ where: { product_id: product.id } })

      // Create images
      for (let i = 0; i < productData.images.length; i++) {
        const img = productData.images[i]
        if (img) {
          await prisma.product_images.create({
            data: {
              id: `img-${product.id}-${i}`,
              product_id: product.id,
              url: img.url,
              alt: img.alt,
              order: i,
              type: 'IMAGE',
            },
          })
        }
      }

      // Create variants
      for (const variant of productData.variants) {
        await prisma.product_variants.create({
          data: {
            id: `var-${product.id}-${variant.sku}`,
            product_id: product.id,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            stock: variant.stock,
            price_modifier: variant.priceModifier,
            updated_at: new Date(),
          },
        })
      }

      createdProducts.push({
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: category.name,
      })
    }

    return NextResponse.json({
      success: true,
      message: `${createdProducts.length} produits créés avec succès`,
      products: createdProducts,
    })
  } catch (error) {
    console.error('Error seeding products:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
