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
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&q=80',
  },
  {
    name: 'Mode & Accessoires',
    slug: 'mode-accessoires',
    description: 'Les dernières tendances en matière de mode et d\'accessoires',
    isActive: true,
    order: 2,
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=80',
  },
  {
    name: 'Maison & Jardin',
    slug: 'maison-jardin',
    description: 'Tout pour embellir votre maison et votre jardin',
    isActive: true,
    order: 3,
    image: 'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=1200&q=80',
  },
  {
    name: 'Sports & Loisirs',
    slug: 'sports-loisirs',
    description: 'Équipements sportifs et articles de loisirs',
    isActive: true,
    order: 4,
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=80',
  },
  {
    name: 'Beauté & Santé',
    slug: 'beaute-sante',
    description: 'Produits de beauté et de santé pour votre bien-être',
    isActive: true,
    order: 5,
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&q=80',
  },
  {
    name: 'Livres & Médias',
    slug: 'livres-medias',
    description: 'Livres, films, musique et plus encore',
    isActive: true,
    order: 6,
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=1200&q=80',
  },
  {
    name: 'Jouets & Enfants',
    slug: 'jouets-enfants',
    description: 'Jouets et articles pour enfants de tous âges',
    isActive: true,
    order: 7,
    image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=1200&q=80',
  },
  {
    name: 'Alimentation & Boissons',
    slug: 'alimentation-boissons',
    description: 'Produits alimentaires et boissons de qualité',
    isActive: true,
    order: 8,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80',
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
