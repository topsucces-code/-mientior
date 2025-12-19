/**
 * Vendors List Page
 * Browse all approved vendors
 */

import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { Store, Star, Package, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Our Vendors | Mientior',
  description: 'Discover our trusted vendors and their products',
}

export const revalidate = 300 // Revalidate every 5 minutes

async function getVendors() {
  const vendors = await prisma.vendor.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  })

  return vendors.map(vendor => ({
    id: vendor.id,
    name: vendor.businessName,
    slug: vendor.slug,
    description: vendor.description,
    logo: vendor.logo,
    productCount: vendor.totalProducts,
    rating: vendor.rating,
  }))
}

export default async function VendorsPage() {
  const vendors = await getVendors()

  return (
    <div className="min-h-screen bg-platinum-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-anthracite-700">Our Vendors</h1>
          <p className="mt-2 text-nuanced-600">
            Discover trusted sellers and their unique products
          </p>
        </div>

        {/* Vendors Grid */}
        {vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-platinum-200 bg-white py-16 text-center">
            <Store className="mb-4 h-16 w-16 text-platinum-400" />
            <h2 className="text-xl font-medium text-anthracite-700">No vendors yet</h2>
            <p className="text-nuanced-600">Check back soon for new vendors</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {vendors.map((vendor) => (
              <Link
                key={vendor.id}
                href={`/vendors/${vendor.slug}`}
                className="group overflow-hidden rounded-lg border border-platinum-200 bg-white transition-shadow hover:shadow-lg"
              >
                {/* Logo */}
                <div className="relative h-32 bg-platinum-100">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {vendor.logo ? (
                      <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-md">
                        <Image
                          src={vendor.logo}
                          alt={vendor.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white shadow-md">
                        <Store className="h-10 w-10 text-platinum-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-anthracite-700 group-hover:text-orange-600">
                    {vendor.name}
                  </h3>

                  {vendor.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-nuanced-600">
                      {vendor.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      {vendor.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{vendor.rating.toFixed(1)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-nuanced-500">
                        <Package className="h-4 w-4" />
                        <span>{vendor.productCount}</span>
                      </div>
                    </div>

                    <span className="flex items-center text-orange-600 opacity-0 transition-opacity group-hover:opacity-100">
                      View <ArrowRight className="ml-1 h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
