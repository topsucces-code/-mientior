/**
 * Temporary API route to fix product images
 * Run once by visiting /api/fix-images
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
  'organic-cotton-premium-tshirt': [
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
}

// Generic product images for products not in the map
const genericProductImages = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&h=800&fit=crop&q=80',
  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=800&fit=crop&q=80',
]

export async function GET() {
  try {
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
    const updates: string[] = []

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

        updates.push(`✅ Updated images for: ${product.name}`)
        updatedCount++
      } else {
        // For products without predefined images, use generic real images from Unsplash
        if (
          product.images.length === 0 || 
          product.images[0]?.url.includes('placehold') || 
          product.images[0]?.url.includes('picsum') ||
          product.images[0]?.url.startsWith('/images/')
        ) {
          await prisma.productImage.deleteMany({
            where: { productId: product.id },
          })

          // Select images based on product name hash
          const hash = product.name.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
          const imageIndex = Math.abs(hash) % genericProductImages.length
          
          const selectedImages = [
            genericProductImages[imageIndex]!,
            genericProductImages[(imageIndex + 1) % genericProductImages.length]!,
          ]

          await prisma.productImage.createMany({
            data: selectedImages.map((url, index) => ({
              productId: product.id,
              url,
              alt: `${product.name} - Image ${index + 1}`,
              type: 'IMAGE',
              order: index,
            })),
          })

          updates.push(`✅ Added generic images for: ${product.name}`)
          updatedCount++
        }
      }
    }

    console.log(`\n🎉 Updated ${updatedCount} products with new images!`)

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} products with new images`,
      updates,
    })
  } catch (error) {
    console.error('Error fixing images:', error)
    return NextResponse.json(
      { error: 'Failed to fix images', details: String(error) },
      { status: 500 }
    )
  }
}
