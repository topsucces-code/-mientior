/**
 * Vendor Profile Page
 * Display vendor information and their products
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { VendorPageClient } from './vendor-client'

interface VendorPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: VendorPageProps): Promise<Metadata> {
  const { slug } = await params
  const vendor = await prisma.vendor.findUnique({
    where: { slug },
    select: { businessName: true, description: true },
  })

  if (!vendor) {
    return { title: 'Vendor Not Found' }
  }

  return {
    title: `${vendor.businessName} | Mientior`,
    description: vendor.description || `Shop products from ${vendor.businessName}`,
  }
}

async function getVendorData(slug: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { slug, status: 'ACTIVE' },
    include: {
      products: {
        where: { status: 'ACTIVE' },
        include: {
          images: {
            select: { url: true },
            orderBy: { order: 'asc' },
            take: 1,
          },
          category: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!vendor) return null

  return {
    id: vendor.id,
    name: vendor.businessName,
    slug: vendor.slug,
    description: vendor.description,
    logo: vendor.logo,
    rating: vendor.rating,
    productCount: vendor.totalProducts,
    createdAt: vendor.createdAt.toISOString(),
    products: vendor.products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      stock: p.stock,
      rating: p.rating,
      reviewCount: p.reviewCount,
      image: p.images[0]?.url,
      category: p.category?.name,
    })),
  }
}

export default async function VendorPage({ params }: VendorPageProps) {
  const { slug } = await params
  const vendor = await getVendorData(slug)

  if (!vendor) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-platinum-50">
      <VendorPageClient vendor={vendor} />
    </div>
  )
}
