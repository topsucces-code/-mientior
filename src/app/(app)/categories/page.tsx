import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Toutes les catégories | Mientior',
  description: 'Parcourez toutes nos catégories de produits.',
}

// Force dynamic rendering to avoid build-time database queries
export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { products: true },
      },
    },
  })

  return (
    <div className="min-h-screen bg-platinum-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h1 className="mb-4 font-display text-4xl font-bold text-anthracite-900 md:text-5xl">
            Toutes les catégories
          </h1>
          <p className="text-lg text-nuanced-600">
            Explorez notre large sélection de produits par catégorie
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="aspect-[4/3] relative overflow-hidden bg-platinum-100">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-platinum-100 text-nuanced-400">
                    <span className="text-lg font-medium">Pas d'image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-60 transition-opacity group-hover:opacity-70" />
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="mb-2 text-2xl font-bold">{category.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-platinum-200">
                    {category._count.products} produits
                  </span>
                  <span className="flex items-center gap-2 text-sm font-bold opacity-0 transition-all group-hover:translate-x-2 group-hover:opacity-100">
                    Découvrir <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
