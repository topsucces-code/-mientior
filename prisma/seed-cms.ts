import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCMS() {
  console.log('🌱 Seeding CMS data...')

  // Create Banners
  const banners = await Promise.all([
    prisma.banner.upsert({
      where: { id: 'banner-welcome' },
      update: {},
      create: {
        id: 'banner-welcome',
        title: 'Offre de Bienvenue',
        message: '🎉 Offre spéciale : <strong>-20%</strong> sur tout le site avec le code <span class="bg-white text-purple-600 px-2 py-0.5 rounded font-bold">WELCOME20</span>',
        backgroundColor: 'linear-gradient(to right, #2563eb, #4f46e5, #7c3aed)',
        textColor: '#ffffff',
        link: '/products',
        linkText: 'Découvrir',
        position: 'TOP',
        priority: 1,
        status: 'PUBLISHED',
        dismissible: true,
        showCountdown: false,
      }
    }),
    prisma.banner.upsert({
      where: { id: 'banner-shipping' },
      update: {},
      create: {
        id: 'banner-shipping',
        title: 'Livraison Gratuite',
        message: '🚚 Livraison gratuite dès 50€ d\'achat - Expédition rapide',
        backgroundColor: '#10b981',
        textColor: '#ffffff',
        link: '/shipping',
        linkText: 'En savoir plus',
        position: 'TOP',
        priority: 2,
        status: 'PUBLISHED',
        dismissible: false,
        showCountdown: false,
      }
    }),
    prisma.banner.upsert({
      where: { id: 'banner-flash-sale' },
      update: {},
      create: {
        id: 'banner-flash-sale',
        title: 'Vente Flash',
        message: '⚡ Vente Flash : Jusqu\'à -50% sur une sélection de produits !',
        backgroundColor: 'linear-gradient(to right, #f97316, #ef4444)',
        textColor: '#ffffff',
        link: '/deals',
        linkText: 'Voir les offres',
        position: 'HERO',
        priority: 1,
        status: 'PUBLISHED',
        dismissible: true,
        showCountdown: true,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      }
    }),
  ])

  console.log(`✅ Created ${banners.length} banners`)

  // Create Blog Categories
  const blogCategories = await Promise.all([
    prisma.blogCategory.upsert({
      where: { slug: 'mode' },
      update: {},
      create: {
        name: 'Mode',
        slug: 'mode',
        description: 'Tendances mode et conseils style',
        order: 1,
        isActive: true,
      }
    }),
    prisma.blogCategory.upsert({
      where: { slug: 'lifestyle' },
      update: {},
      create: {
        name: 'Lifestyle',
        slug: 'lifestyle',
        description: 'Art de vivre et bien-être',
        order: 2,
        isActive: true,
      }
    }),
    prisma.blogCategory.upsert({
      where: { slug: 'tech' },
      update: {},
      create: {
        name: 'Tech',
        slug: 'tech',
        description: 'Nouveautés technologiques',
        order: 3,
        isActive: true,
      }
    }),
    prisma.blogCategory.upsert({
      where: { slug: 'conseils' },
      update: {},
      create: {
        name: 'Conseils',
        slug: 'conseils',
        description: 'Guides et astuces shopping',
        order: 4,
        isActive: true,
      }
    }),
  ])

  console.log(`✅ Created ${blogCategories.length} blog categories`)

  // Create Blog Tags
  const blogTags = await Promise.all([
    prisma.blogTag.upsert({
      where: { slug: 'tendances' },
      update: {},
      create: { name: 'Tendances', slug: 'tendances' }
    }),
    prisma.blogTag.upsert({
      where: { slug: 'nouveautes' },
      update: {},
      create: { name: 'Nouveautés', slug: 'nouveautes' }
    }),
    prisma.blogTag.upsert({
      where: { slug: 'guide' },
      update: {},
      create: { name: 'Guide', slug: 'guide' }
    }),
    prisma.blogTag.upsert({
      where: { slug: 'promo' },
      update: {},
      create: { name: 'Promo', slug: 'promo' }
    }),
  ])

  console.log(`✅ Created ${blogTags.length} blog tags`)

  // Create Sample Blog Posts
  const blogPosts = await Promise.all([
    prisma.blogPost.upsert({
      where: { slug: 'tendances-mode-hiver-2025' },
      update: {},
      create: {
        title: 'Les tendances mode de l\'hiver 2025',
        slug: 'tendances-mode-hiver-2025',
        excerpt: 'Découvrez les incontournables de la saison : couleurs, matières et styles qui feront sensation cet hiver.',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'L\'hiver 2025 s\'annonce riche en couleurs et en textures. Voici notre sélection des tendances à adopter absolument.' }]
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: '1. Les couleurs de la saison' }]
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Le bordeaux, le vert sapin et le camel dominent les collections. Ces teintes chaudes apportent élégance et confort.' }]
            },
          ]
        },
        featuredImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        authorName: 'Marie Dupont',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
        categoryId: blogCategories[0].id,
        readTime: 5,
        tags: {
          create: [
            { tag: { connect: { id: blogTags[0].id } } },
            { tag: { connect: { id: blogTags[1].id } } },
          ]
        }
      }
    }),
    prisma.blogPost.upsert({
      where: { slug: 'guide-achat-smartphone-2025' },
      update: {},
      create: {
        title: 'Guide d\'achat : Quel smartphone choisir en 2025 ?',
        slug: 'guide-achat-smartphone-2025',
        excerpt: 'Notre comparatif complet des meilleurs smartphones du moment pour vous aider à faire le bon choix.',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Choisir un smartphone peut être compliqué avec toutes les options disponibles. Voici notre guide pour vous aider.' }]
            },
          ]
        },
        featuredImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        authorName: 'Thomas Martin',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        categoryId: blogCategories[2].id,
        readTime: 8,
        tags: {
          create: [
            { tag: { connect: { id: blogTags[2].id } } },
          ]
        }
      }
    }),
  ])

  console.log(`✅ Created ${blogPosts.length} blog posts`)

  // Create CMS Pages
  const pages = await Promise.all([
    prisma.cmsPage.upsert({
      where: { slug: 'about' },
      update: {},
      create: {
        title: 'À propos de Mientior',
        slug: 'about',
        description: 'Découvrez l\'histoire et les valeurs de Mientior',
        template: 'default',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        seo: {
          title: 'À propos | Mientior',
          description: 'Découvrez l\'histoire et les valeurs de Mientior, votre marketplace de confiance.',
        },
        content: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: 'Notre Histoire' }]
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Mientior est né de la passion pour le commerce en ligne et le désir d\'offrir une expérience d\'achat exceptionnelle.' }]
            },
          ]
        }
      }
    }),
    prisma.cmsPage.upsert({
      where: { slug: 'faq' },
      update: {},
      create: {
        title: 'Questions Fréquentes',
        slug: 'faq',
        description: 'Réponses aux questions les plus courantes',
        template: 'faq',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        seo: {
          title: 'FAQ | Mientior',
          description: 'Trouvez les réponses à vos questions sur Mientior.',
        },
      }
    }),
  ])

  console.log(`✅ Created ${pages.length} CMS pages`)

  // Create Snippets
  const snippets = await Promise.all([
    prisma.snippet.upsert({
      where: { key: 'footer-contact' },
      update: {},
      create: {
        name: 'Footer Contact Info',
        key: 'footer-contact',
        type: 'json',
        content: {
          email: 'support@mientior.com',
          phone: '+1 (234) 567-890',
          address: '123 Commerce St, Business District',
        },
        isActive: true,
      }
    }),
    prisma.snippet.upsert({
      where: { key: 'social-links' },
      update: {},
      create: {
        name: 'Social Media Links',
        key: 'social-links',
        type: 'json',
        content: {
          facebook: 'https://facebook.com/mientior',
          instagram: 'https://instagram.com/mientior',
          twitter: 'https://twitter.com/mientior',
          youtube: 'https://youtube.com/mientior',
        },
        isActive: true,
      }
    }),
  ])

  console.log(`✅ Created ${snippets.length} snippets`)

  console.log('✨ CMS seeding completed!')
}

seedCMS()
  .catch((e) => {
    console.error('❌ Error seeding CMS:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
