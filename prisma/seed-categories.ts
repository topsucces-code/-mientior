import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCategories() {
  console.log('🌱 Seeding categories...')

  const categories = [
    {
      id: 'cat-electronique',
      name: 'Électronique',
      slug: 'electronique',
      description: 'Smartphones, ordinateurs, tablettes et accessoires high-tech',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800',
      order: 1,
      isActive: true,
    },
    {
      id: 'cat-mode',
      name: 'Mode',
      slug: 'mode',
      description: 'Vêtements, chaussures et accessoires pour homme et femme',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
      order: 2,
      isActive: true,
    },
    {
      id: 'cat-maison',
      name: 'Maison & Jardin',
      slug: 'maison',
      description: 'Mobilier, décoration, jardinage et équipement maison',
      image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800',
      order: 3,
      isActive: true,
    },
    {
      id: 'cat-sports',
      name: 'Sports & Loisirs',
      slug: 'sports',
      description: 'Équipements sportifs, fitness et activités de plein air',
      image: 'https://images.unsplash.com/photo-1461896836934- voices-of-the-game?w=800',
      order: 4,
      isActive: true,
    },
    {
      id: 'cat-beaute',
      name: 'Beauté & Santé',
      slug: 'beaute',
      description: 'Cosmétiques, soins, parfums et produits de bien-être',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
      order: 5,
      isActive: true,
    },
    {
      id: 'cat-livres',
      name: 'Livres & Médias',
      slug: 'livres',
      description: 'Livres, musique, films et jeux vidéo',
      image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800',
      order: 6,
      isActive: true,
    },
    {
      id: 'cat-jouets',
      name: 'Jouets & Enfants',
      slug: 'jouets',
      description: 'Jouets, jeux éducatifs et articles pour bébés',
      image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=800',
      order: 7,
      isActive: true,
    },
    {
      id: 'cat-electromenager',
      name: 'Électroménager',
      slug: 'electromenager',
      description: 'Gros et petit électroménager pour la cuisine et la maison',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      order: 8,
      isActive: true,
    },
    // Subcategories
    {
      id: 'cat-smartphones',
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Téléphones mobiles et accessoires',
      parentId: 'cat-electronique',
      order: 1,
      isActive: true,
    },
    {
      id: 'cat-ordinateurs',
      name: 'Ordinateurs',
      slug: 'ordinateurs',
      description: 'PC portables, de bureau et accessoires informatiques',
      parentId: 'cat-electronique',
      order: 2,
      isActive: true,
    },
    {
      id: 'cat-homme',
      name: 'Homme',
      slug: 'homme',
      description: 'Mode masculine',
      parentId: 'cat-mode',
      order: 1,
      isActive: true,
    },
    {
      id: 'cat-femme',
      name: 'Femme',
      slug: 'femme',
      description: 'Mode féminine',
      parentId: 'cat-mode',
      order: 2,
      isActive: true,
    },
    {
      id: 'cat-accessoires',
      name: 'Accessoires',
      slug: 'accessoires',
      description: 'Sacs, bijoux, montres et accessoires de mode',
      parentId: 'cat-mode',
      order: 3,
      isActive: true,
    },
  ]

  // Create parent categories first
  const parentCategories = categories.filter(c => !c.parentId)
  for (const cat of parentCategories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        order: cat.order,
        isActive: cat.isActive,
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        order: cat.order,
        isActive: cat.isActive,
      },
    })
  }

  console.log(`✅ Created ${parentCategories.length} parent categories`)

  // Create subcategories
  const subCategories = categories.filter(c => c.parentId)
  for (const cat of subCategories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        order: cat.order,
        isActive: cat.isActive,
        parentId: cat.parentId,
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        order: cat.order,
        isActive: cat.isActive,
        parentId: cat.parentId,
      },
    })
  }

  console.log(`✅ Created ${subCategories.length} subcategories`)
  console.log('✨ Categories seeding completed!')
}

seedCategories()
  .catch((e) => {
    console.error('❌ Error seeding categories:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
