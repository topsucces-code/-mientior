/**
 * Product Detail Page (PDP)
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PDPClient } from './pdp-client'
import { ProductSchema } from '@/components/products/product-schema'
import type { ProductImage, Review } from '@/types'

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

interface ProductSEO {
  title?: string
  description?: string
  keywords?: string[]
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await prisma.product.findUnique({
    where: { slug },
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

  const seo = product.seo as ProductSEO | null

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
  const { slug } = await params
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: {
        include: {
          parent: true,
        },
      },
      images: {
        orderBy: { order: 'asc' },
      },
      variants: true,
      tags: {
        include: {
          tag: true,
        },
      },
      vendor: {
        select: {
          id: true,
          businessName: true,
          slug: true,
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
    // thumbnail field exists in schema but may need to be explicitly selected in the Prisma query
    // TODO: Add videoUrl and frames fields to ProductImage schema when video/360 support is fully implemented
  }))

  // Fetch bundle products (frequently bought together)
  const bundleProducts = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products/${product.id}/bundle`,
    { cache: 'no-store' }
  )
    .then((res) => (res.ok ? res.json() : { bundleProducts: [] }))
    .then((data) => data.bundleProducts || [])
    .catch(() => [])

  // Fetch Q&A data (using global FAQs as placeholder until product-specific Q&A is implemented)
  const faqs = await prisma.fAQ.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    take: 5,
  }).catch(() => [])

  // Transform FAQs to Q&A format
  const qa = faqs.map((faq) => ({
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
    helpful: 0, // FAQ model doesn't have helpful field, default to 0
    notHelpful: 0,
    createdAt: faq.createdAt,
  }))

  // Prepare shipping info
  const shippingInfo = {
    options: [
      {
        name: 'Standard',
        price: 0,
        estimatedDays: 5,
        description: 'Gratuit dès 25€',
      },
      {
        name: 'Express',
        price: 9.99,
        estimatedDays: 2,
        description: 'Livraison rapide',
      },
    ],
    freeShippingThreshold: 25,
    internationalShipping: true,
    returnPolicy: 'Retours gratuits sous 30 jours',
  }

  // Fetch reviews and review stats
  const reviewsResponse = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/reviews/products/${slug}/reviews?page=1&sort=recent`,
    { cache: 'no-store' }
  )
    .then((res) => (res.ok ? res.json() : { reviews: [], stats: undefined }))
    .catch(() => ({ reviews: [], stats: undefined }))

  const reviews: Review[] = reviewsResponse.reviews || []
  const reviewStats = reviewsResponse.stats

  // Prepare product data for client component
  const productData = {
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
      // TODO: Add image field to ProductVariant schema if needed
    })),
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
      isActive: product.category.isActive,
      parent: product.category.parent ? {
        name: product.category.parent.name,
        slug: product.category.parent.slug,
      } : undefined,
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
    vendor: product.vendor ? {
      id: product.vendor.id,
      businessName: product.vendor.businessName,
      slug: product.vendor.slug,
    } : undefined,
  }

  return (
    <div className="min-h-screen bg-white">
      <ProductSchema product={productData} reviews={reviews} />
      <div className="container mx-auto px-4 py-8">
        <PDPClient
          product={productData}
          images={images}
          has360View={product.images.some((img) => img.type === 'THREE_SIXTY')}
          hasVideo={product.images.some((img) => img.type === 'VIDEO')}
          bundleProducts={bundleProducts}
          reviews={reviews}
          reviewStats={reviewStats}
          qa={qa}
          shippingInfo={shippingInfo}
        />
      </div>
    </div>
  )
}
