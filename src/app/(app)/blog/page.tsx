import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { BlogList } from './blog-list'

export const metadata: Metadata = {
  title: 'Blog | Mientior',
  description: 'Découvrez nos derniers articles, conseils et actualités',
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface BlogPageProps {
  searchParams: Promise<{
    category?: string
    tag?: string
    page?: string
  }>
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 12
  const offset = (page - 1) * limit

  // Build where clause
  const where: Record<string, unknown> = {
    status: 'PUBLISHED'
  }

  if (params.category) {
    where.category = { slug: params.category }
  }

  if (params.tag) {
    where.tags = {
      some: { tag: { slug: params.tag } }
    }
  }

  // Fetch posts and categories in parallel
  const [posts, total, categories] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        tags: {
          include: {
            tag: { select: { id: true, name: true, slug: true } }
          }
        }
      }
    }),
    prisma.blogPost.count({ where }),
    prisma.blogCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { posts: true } }
      }
    })
  ])

  // Transform posts for cleaner data
  const transformedPosts = posts.map(post => ({
    ...post,
    tags: post.tags.map(t => t.tag)
  }))

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-orange-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Notre Blog
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            Découvrez nos derniers articles, conseils shopping et actualités de la mode
          </p>
        </div>
      </section>

      {/* Blog Content */}
      <BlogList 
        posts={transformedPosts}
        categories={categories}
        currentCategory={params.category}
        currentTag={params.tag}
        pagination={{
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }}
      />
    </main>
  )
}
