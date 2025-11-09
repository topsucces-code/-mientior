/**
 * Product Detail Page (PDP)
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProductGallery } from '@/components/products/product-gallery'
import { ProductInfo } from '@/components/products/product-info'
import type { ProductImage } from '@/types'

interface ProductPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      description: true,
      seo: true,
      images: {
        orderBy: { order: 'asc' },
        take: 1,
      },
    },
  })

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  const seo = product.seo as any

  return {
    title: seo?.title || product.name,
    description: seo?.description || product.description,
    keywords: seo?.keywords?.join(', '),
    openGraph: {
      title: product.name,
      description: product.description || '',
      images: product.images.map((img) => ({
        url: img.url,
      })),
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      images: {
        orderBy: { order: 'asc' },
      },
      variants: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
  })

  if (!product) {
    notFound()
  }

  // Transform images for gallery
  const images: ProductImage[] = product.images.map((img) => ({
    url: img.url,
    alt: img.alt,
    type: img.type === 'THREE_SIXTY' ? '360' : img.type.toLowerCase() as 'image' | 'video' | '360',
    thumbnail: img.thumbnail || undefined,
  }))

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[60%_40%] gap-8 mb-12">
          {/* Gallery */}
          <ProductGallery
            images={images}
            productName={product.name}
            has360View={product.images.some((img) => img.type === 'THREE_SIXTY')}
            hasVideo={product.images.some((img) => img.type === 'VIDEO')}
          />

          {/* Product Info */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <ProductInfo
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                compareAtPrice: product.compareAtPrice || undefined,
                images,
                variants: product.variants.map((v) => ({
                  id: v.id,
                  size: v.size || undefined,
                  color: v.color || undefined,
                  sku: v.sku,
                  stock: v.stock,
                  priceModifier: v.priceModifier || undefined,
                  image: v.image || undefined,
                })),
                category: {
                  id: product.category.id,
                  name: product.category.name,
                  slug: product.category.slug,
                  isActive: product.category.isActive,
                },
                tags: product.tags.map((pt) => ({
                  id: pt.tag.id,
                  name: pt.tag.name,
                  slug: pt.tag.slug,
                })),
                rating: product.rating,
                reviewCount: product.reviewCount,
                stock: product.stock,
                badge: product.badge || undefined,
                featured: product.featured,
                onSale: product.onSale,
                description: product.description || undefined,
              }}
              selectedVariant={null}
              onVariantChange={() => {}}
            />
          </div>
        </div>

        {/* Additional sections would go here: Tabs, Recommendations, etc. */}
      </div>
    </div>
  )
}
