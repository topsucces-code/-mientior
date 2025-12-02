import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * CMS Blog Posts API
 * GET /api/cms/blog - Fetch blog posts
 * POST /api/cms/blog - Create a new blog post
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const categorySlug = searchParams.get('category')
    const tag = searchParams.get('tag')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const featured = searchParams.get('featured') === 'true'

    const where: Record<string, unknown> = {}

    // Default to published posts for public access
    if (status) {
      where.status = status
    } else {
      where.status = 'PUBLISHED'
    }

    if (categorySlug) {
      where.category = { slug: categorySlug }
    }

    if (tag) {
      where.tags = {
        some: {
          tag: { slug: tag }
        }
      }
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: featured 
          ? [{ views: 'desc' }, { publishedAt: 'desc' }]
          : { publishedAt: 'desc' },
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
      prisma.blogPost.count({ where })
    ])

    // Transform tags for cleaner response
    const transformedPosts = posts.map(post => ({
      ...post,
      tags: post.tags.map(t => t.tag)
    }))

    return NextResponse.json({
      success: true,
      data: transformedPosts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + posts.length < total
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })

  } catch (error) {
    console.error('[CMS Blog] Error fetching posts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      status = 'DRAFT',
      authorId,
      authorName,
      authorAvatar,
      categoryId,
      tags = [],
      seo,
      readTime
    } = body

    // Validate required fields
    if (!title || !slug || !content) {
      return NextResponse.json(
        { success: false, error: 'Title, slug, and content are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existing = await prisma.blogPost.findUnique({
      where: { slug }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A blog post with this slug already exists' },
        { status: 409 }
      )
    }

    // Create post with tags
    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        featuredImage,
        status: status as 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED',
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        authorId,
        authorName,
        authorAvatar,
        categoryId,
        seo,
        readTime,
        tags: tags.length > 0 ? {
          create: tags.map((tagId: string) => ({
            tag: { connect: { id: tagId } }
          }))
        } : undefined
      },
      include: {
        category: true,
        tags: {
          include: { tag: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: post
    }, { status: 201 })

  } catch (error) {
    console.error('[CMS Blog] Error creating post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create blog post' },
      { status: 500 }
    )
  }
}
