/**
 * Product Reviews API Route
 * GET: Fetch reviews for a product with pagination and filters
 * POST: Submit a new review for a product
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-server'
import type { ReviewStats } from '@/types'
import { Prisma } from '@prisma/client'

// GET /api/products/[slug]/reviews
export async function GET(
  request: NextRequest,
  { params }: { params: Record<string, string> }
) {
  try {
    const { slug } = params
    const searchParams = request.nextUrl.searchParams

    const page = parseInt(searchParams.get('page') || '1')
    const sort = searchParams.get('sort') || 'recent'
    const withPhotos = searchParams.get('withPhotos') === 'true'
    const verified = searchParams.get('verified') === 'true'
    const rating = searchParams.get('rating')

    // First, get the product by slug to get its ID
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, rating: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const productId = product.id

    // Build query for reviews
    // Build query for reviews
    const where: Prisma.ReviewWhereInput = {
      productId,
      status: 'APPROVED', // Only show approved reviews
    }

    if (withPhotos) {
      where.images = { not: [] }
    }

    if (verified) {
      where.verified = true
    }

    if (rating) {
      where.rating = parseInt(rating)
    }

    // Sort mapping
    // Sort mapping
    const orderBy: Prisma.ReviewOrderByWithRelationInput = { createdAt: 'desc' }
    switch (sort) {
      case 'recent':
        orderBy.createdAt = 'desc'
        break
      case 'helpful':
        orderBy.helpful = 'desc'
        break
      case 'rating':
        orderBy.rating = 'desc'
        break
    }

    const skip = (page - 1) * 10

    // Fetch reviews
    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy,
        skip,
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ])

    // Calculate review stats
    const allReviewsCount = await prisma.review.count({
      where: {
        productId,
        status: 'APPROVED',
      },
    })

    // Get rating distribution using groupBy
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: {
        productId,
        status: 'APPROVED',
      },
      _count: {
        rating: true,
      },
    })

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    ratingDistribution.forEach((r) => {
      distribution[r.rating] = r._count.rating
    })

    const stats: ReviewStats = {
      average: product.rating,
      total: allReviewsCount,
      distribution: {
        5: distribution[5] || 0,
        4: distribution[4] || 0,
        3: distribution[3] || 0,
        2: distribution[2] || 0,
        1: distribution[1] || 0,
      },
    }

    // Transform reviews to match frontend types
    const transformedReviews = reviews.map((review) => ({
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      userName: review.userName,
      userAvatar: review.userAvatar || undefined,
      rating: review.rating,
      title: review.title || undefined,
      comment: review.comment,
      images: review.images,
      verified: review.verified,
      helpful: review.helpful,
      notHelpful: review.notHelpful,
      createdAt: review.createdAt,
      response: review.response ? review.response : undefined,
    }))

    return NextResponse.json({
      reviews: transformedReviews,
      stats,
      totalCount,
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// POST /api/products/[slug]/reviews
export async function POST(
  request: NextRequest,
  { params }: { params: Record<string, string> }
) {
  try {
    const { slug } = params
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get product by slug
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, name: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const productId = product.id

    // Parse form data
    const formData = await request.formData()
    const rating = parseInt(formData.get('rating') as string)
    const title = formData.get('title') as string
    const comment = formData.get('comment') as string

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating. Must be between 1 and 5.' },
        { status: 400 }
      )
    }

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Review comment is required.' },
        { status: 400 }
      )
    }

    if (comment.length > 2000) {
      return NextResponse.json(
        { error: 'Review comment is too long. Maximum 2000 characters.' },
        { status: 400 }
      )
    }

    // Check if user has purchased this product (verified purchase)
    const purchasedOrder = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        paymentStatus: 'PAID',
        items: {
          some: {
            productId,
          },
        },
      },
    })

    const verified = !!purchasedOrder

    // Handle image uploads (optional)
    const images: string[] = []
    const imageFiles: File[] = []

    formData.forEach((value, key) => {
      if (key.startsWith('images[') && value instanceof File) {
        imageFiles.push(value)
      }
    })

    // Upload images to media collection if any
    if (imageFiles.length > 0) {
      for (const file of imageFiles.slice(0, 5)) {
        // Max 5 images
        // Create media entry
        const media = await prisma.media.create({
          data: {
            url: '', // Placeholder - in production, upload to cloud storage
            alt: `Review image for ${product.name}`,
            type: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
          },
        })

        // In production, upload the file to cloud storage and update the URL
        // For now, we just store the media ID as placeholder
        images.push(media.id)
      }
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, firstName: true, lastName: true },
    })

    const userName = user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email || 'Utilisateur anonyme'

    // Create review
    const review = await prisma.review.create({
      data: {
        productId,
        userId: session.user.id,
        userName,
        userAvatar: undefined,
        rating,
        title: title || undefined,
        comment,
        images,
        verified,
        helpful: 0,
        notHelpful: 0,
        status: 'PENDING', // Reviews start as pending for moderation
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: review.id,
        status: 'pending',
        message: 'Your review has been submitted and is pending approval.',
      },
    })
  } catch (error) {
    console.error('Error submitting review:', error)
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    )
  }
}
