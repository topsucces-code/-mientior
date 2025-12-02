/**
 * Script to seed categories into the database
 * Run with: npx tsx scripts/seed-categories.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  {
    name: 'Électronique',
    slug: 'electronique',
    description: 'Découvrez notre sélection de produits électroniques de haute qualité',
    isActive: true,
    order: 1,
    image: '/images/categories/electronique.jpg',
  },
  {
    name: 'Mode & Accessoires',
    slug: 'mode-accessoires',
    description: 'Les dernières tendances en matière de mode et d\'accessoires',
    isActive: true,
    order: 2,
    image: '/images/categories/mode.jpg',
  },
  {
    name: 'Maison & Jardin',
    slug: 'maison-jardin',
    description: 'Tout pour embellir votre maison et votre jardin',
    isActive: true,
    order: 3,
    image: '/images/categories/maison.jpg',
  },
  {
    name: 'Sports & Loisirs',
    slug: 'sports-loisirs',
    description: 'Équipements sportifs et articles de loisirs',
    isActive: true,
    order: 4,
    image: '/images/categories/sports.jpg',
  },
  {
    name: 'Beauté & Santé',
    slug: 'beaute-sante',
    description: 'Produits de beauté et de santé pour votre bien-être',
    isActive: true,
    order: 5,
    image: '/images/categories/beaute.jpg',
  },
  {
    name: 'Livres & Médias',
    slug: 'livres-medias',
    description: 'Livres, films, musique et plus encore',
    isActive: true,
    order: 6,
    image: '/images/categories/livres.jpg',
  },
  {
    name: 'Jouets & Enfants',
    slug: 'jouets-enfants',
    description: 'Jouets et articles pour enfants de tous âges',
    isActive: true,
    order: 7,
    image: '/images/categories/jouets.jpg',
  },
  {
    name: 'Alimentation & Boissons',
    slug: 'alimentation-boissons',
    description: 'Produits alimentaires et boissons de qualité',
    isActive: true,
    order: 8,
    image: '/images/categories/alimentation.jpg',
  },
]

async function main() {
  console.log('🌱 Seeding categories...')

  for (const category of categories) {
    try {
      const result = await prisma.category.upsert({
        where: { slug: category.slug },
        update: category,
        create: category,
      })
      console.log(`✅ Created/Updated category: ${result.name}`)
    } catch (error) {
      console.error(`❌ Error creating category ${category.name}:`, error)
    }
  }

  console.log('✨ Seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding categories:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
