import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCategories() {
  console.log('🌱 Seeding categories...')

  const categories = [
    // Main navigation categories (from CategoryNavBar)
    {
      id: 'cat-nouveautes',
      name: 'Nouveautés',
      slug: 'nouveautes',
      description: 'Découvrez nos dernières arrivées et les tendances du moment',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      order: 1,
      isActive: true,
    },
    {
      id: 'cat-vetements',
      name: 'Vêtements',
      slug: 'vetements',
      description: 'Mode homme et femme : t-shirts, robes, pantalons, vestes et plus',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
      order: 2,
      isActive: true,
    },
    {
      id: 'cat-chaussures',
      name: 'Chaussures',
      slug: 'chaussures',
      description: 'Sneakers, sandales, escarpins, bottes et chaussures de sport',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
      order: 3,
      isActive: true,
    },
    {
      id: 'cat-accessoires',
      name: 'Accessoires',
      slug: 'accessoires',
      description: 'Sacs, bijoux, montres, lunettes et accessoires de mode',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
      order: 4,
      isActive: true,
    },
    {
      id: 'cat-marques',
      name: 'Marques',
      slug: 'marques',
      description: 'Découvrez toutes nos marques partenaires',
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
      order: 5,
      isActive: true,
    },
    {
      id: 'cat-soldes',
      name: 'Soldes',
      slug: 'soldes',
      description: 'Profitez de nos meilleures offres et réductions',
      image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800',
      order: 6,
      isActive: true,
    },
    // Additional main categories
    {
      id: 'cat-electronique',
      name: 'Électronique',
      slug: 'electronique',
      description: 'Smartphones, ordinateurs, tablettes et accessoires high-tech',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800',
      order: 7,
      isActive: true,
    },
    {
      id: 'cat-maison',
      name: 'Maison & Jardin',
      slug: 'maison',
      description: 'Mobilier, décoration, jardinage et équipement maison',
      image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800',
      order: 8,
      isActive: true,
    },
    {
      id: 'cat-beaute',
      name: 'Beauté & Santé',
      slug: 'beaute',
      description: 'Cosmétiques, soins, parfums et produits de bien-être',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
      order: 9,
      isActive: true,
    },
    {
      id: 'cat-sports',
      name: 'Sports & Loisirs',
      slug: 'sports',
      description: 'Équipements sportifs, fitness et activités de plein air',
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
      order: 10,
      isActive: true,
    },
    // Subcategories for Vêtements
    {
      id: 'cat-vetements-homme',
      name: 'Homme',
      slug: 'vetements-homme',
      description: 'Mode masculine : chemises, pantalons, costumes',
      parentId: 'cat-vetements',
      order: 1,
      isActive: true,
    },
    {
      id: 'cat-vetements-femme',
      name: 'Femme',
      slug: 'vetements-femme',
      description: 'Mode féminine : robes, jupes, tops',
      parentId: 'cat-vetements',
      order: 2,
      isActive: true,
    },
    {
      id: 'cat-vetements-enfant',
      name: 'Enfant',
      slug: 'vetements-enfant',
      description: 'Mode enfant : vêtements pour garçons et filles',
      parentId: 'cat-vetements',
      order: 3,
      isActive: true,
    },
    // Subcategories for Chaussures
    {
      id: 'cat-chaussures-sneakers',
      name: 'Sneakers',
      slug: 'sneakers',
      description: 'Baskets et chaussures de sport tendance',
      parentId: 'cat-chaussures',
      order: 1,
      isActive: true,
    },
    {
      id: 'cat-chaussures-sandales',
      name: 'Sandales',
      slug: 'sandales',
      description: 'Sandales et tongs pour l\'été',
      parentId: 'cat-chaussures',
      order: 2,
      isActive: true,
    },
    {
      id: 'cat-chaussures-bottes',
      name: 'Bottes',
      slug: 'bottes',
      description: 'Bottes et bottines pour toutes les saisons',
      parentId: 'cat-chaussures',
      order: 3,
      isActive: true,
    },
    // Subcategories for Accessoires
    {
      id: 'cat-accessoires-sacs',
      name: 'Sacs',
      slug: 'sacs',
      description: 'Sacs à main, sacs à dos et pochettes',
      parentId: 'cat-accessoires',
      order: 1,
      isActive: true,
    },
    {
      id: 'cat-accessoires-bijoux',
      name: 'Bijoux',
      slug: 'bijoux',
      description: 'Colliers, bracelets, bagues et boucles d\'oreilles',
      parentId: 'cat-accessoires',
      order: 2,
      isActive: true,
    },
    {
      id: 'cat-accessoires-montres',
      name: 'Montres',
      slug: 'montres',
      description: 'Montres classiques et connectées',
      parentId: 'cat-accessoires',
      order: 3,
      isActive: true,
    },
    // Subcategories for Électronique
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
      id: 'cat-audio',
      name: 'Audio',
      slug: 'audio',
      description: 'Écouteurs, casques et enceintes',
      parentId: 'cat-electronique',
      order: 3,
      isActive: true,
    },
  ]

  // Create parent categories first
  const parentCategories = categories.filter(c => !c.parentId)
  for (const cat of parentCategories) {
    await prisma.categories.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        order: cat.order,
        isActive: cat.isActive,
        updatedAt: new Date(),
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        order: cat.order,
        isActive: cat.isActive,
        updatedAt: new Date(),
      },
    })
  }

  console.log(`✅ Created ${parentCategories.length} parent categories`)

  // Create subcategories
  const subCategories = categories.filter(c => c.parentId)
  for (const cat of subCategories) {
    await prisma.categories.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        order: cat.order,
        isActive: cat.isActive,
        parentId: cat.parentId,
        updatedAt: new Date(),
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        order: cat.order,
        isActive: cat.isActive,
        parentId: cat.parentId!,
        updatedAt: new Date(),
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
