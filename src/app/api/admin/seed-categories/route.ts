import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CATEGORIES = [
  // Main navigation categories (from CategoryNavBar)
  {
    id: 'cat-nouveautes',
    name: 'Nouveautés',
    slug: 'nouveautes',
    description: 'Découvrez nos dernières arrivées et les tendances du moment',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
    order: 1,
  },
  {
    id: 'cat-vetements',
    name: 'Vêtements',
    slug: 'vetements',
    description: 'Mode homme et femme : t-shirts, robes, pantalons, vestes et plus',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
    order: 2,
  },
  {
    id: 'cat-chaussures',
    name: 'Chaussures',
    slug: 'chaussures',
    description: 'Sneakers, sandales, escarpins, bottes et chaussures de sport',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    order: 3,
  },
  {
    id: 'cat-accessoires',
    name: 'Accessoires',
    slug: 'accessoires',
    description: 'Sacs, bijoux, montres, lunettes et accessoires de mode',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    order: 4,
  },
  {
    id: 'cat-marques',
    name: 'Marques',
    slug: 'marques',
    description: 'Découvrez toutes nos marques partenaires',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
    order: 5,
  },
  {
    id: 'cat-soldes',
    name: 'Soldes',
    slug: 'soldes',
    description: 'Profitez de nos meilleures offres et réductions',
    image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800',
    order: 6,
  },
  // Additional main categories
  {
    id: 'cat-electronique',
    name: 'Électronique',
    slug: 'electronique',
    description: 'Smartphones, ordinateurs, tablettes et accessoires high-tech',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800',
    order: 7,
  },
  {
    id: 'cat-beaute',
    name: 'Beauté & Santé',
    slug: 'beaute',
    description: 'Cosmétiques, soins, parfums et produits de bien-être',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
    order: 8,
  },
]

const SUBCATEGORIES = [
  // Subcategories for Vêtements
  { id: 'cat-vetements-homme', name: 'Homme', slug: 'vetements-homme', parentId: 'cat-vetements', order: 1 },
  { id: 'cat-vetements-femme', name: 'Femme', slug: 'vetements-femme', parentId: 'cat-vetements', order: 2 },
  { id: 'cat-vetements-enfant', name: 'Enfant', slug: 'vetements-enfant', parentId: 'cat-vetements', order: 3 },
  // Subcategories for Chaussures
  { id: 'cat-sneakers', name: 'Sneakers', slug: 'sneakers', parentId: 'cat-chaussures', order: 1 },
  { id: 'cat-sandales', name: 'Sandales', slug: 'sandales', parentId: 'cat-chaussures', order: 2 },
  { id: 'cat-bottes', name: 'Bottes', slug: 'bottes', parentId: 'cat-chaussures', order: 3 },
  // Subcategories for Accessoires
  { id: 'cat-sacs', name: 'Sacs', slug: 'sacs', parentId: 'cat-accessoires', order: 1 },
  { id: 'cat-bijoux', name: 'Bijoux', slug: 'bijoux', parentId: 'cat-accessoires', order: 2 },
  { id: 'cat-montres', name: 'Montres', slug: 'montres', parentId: 'cat-accessoires', order: 3 },
]

export async function POST() {
  try {
    const results = { created: 0, updated: 0, errors: [] as string[] }

    // Create parent categories
    for (const cat of CATEGORIES) {
      try {
        await prisma.category.upsert({
          where: { slug: cat.slug },
          update: {
            name: cat.name,
            description: cat.description,
            image: cat.image,
            order: cat.order,
            isActive: true,
            updatedAt: new Date(),
          },
          create: {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            image: cat.image,
            order: cat.order,
            isActive: true,
            updatedAt: new Date(),
          },
        })
        results.created++
      } catch (err) {
        results.errors.push(`Failed to create ${cat.name}: ${err}`)
      }
    }

    // Create subcategories
    for (const sub of SUBCATEGORIES) {
      try {
        await prisma.category.upsert({
          where: { slug: sub.slug },
          update: {
            name: sub.name,
            parentId: sub.parentId,
            order: sub.order,
            isActive: true,
            updatedAt: new Date(),
          },
          create: {
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            parentId: sub.parentId,
            order: sub.order,
            isActive: true,
            updatedAt: new Date(),
          },
        })
        results.created++
      } catch (err) {
        results.errors.push(`Failed to create ${sub.name}: ${err}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created/updated ${results.created} categories`,
      errors: results.errors,
    })
  } catch (error) {
    console.error('Error seeding categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to seed categories' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { order: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json({ success: true, categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
