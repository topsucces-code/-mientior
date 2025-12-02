/**
 * Review Media Upload API
 * POST /api/reviews/[id]/media/upload
 * 
 * Handles uploading images and videos for product reviews
 * - Validates file types and sizes
 * - Compresses and optimizes images
 * - Stores media URLs in review JSON
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-server'

// Maximum file sizes
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

// Maximum media counts
const MAX_IMAGES = 5
const MAX_VIDEOS = 3

interface UploadResponse {
  success: boolean
  images?: string[]
  videos?: string[]
  error?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<UploadResponse>> {
  try {
    // Check authentication
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const reviewId = params.id

    // Verify review exists and belongs to user
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
        images: true,
        videos: true
      }
    })

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }

    if (review.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    // Separate images and videos
    const imageFiles: File[] = []
    const videoFiles: File[] = []

    for (const file of files) {
      if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
        imageFiles.push(file)
      } else if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
        videoFiles.push(file)
      } else {
        return NextResponse.json(
          { success: false, error: `Invalid file type: ${file.type}` },
          { status: 400 }
        )
      }
    }

    // Get existing media
    const existingImages = (review.images as string[]) || []
    const existingVideos = (review.videos as string[]) || []

    // Check limits
    if (existingImages.length + imageFiles.length > MAX_IMAGES) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_IMAGES} images allowed` },
        { status: 400 }
      )
    }

    if (existingVideos.length + videoFiles.length > MAX_VIDEOS) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_VIDEOS} videos allowed` },
        { status: 400 }
      )
    }

    // Validate file sizes
    for (const file of imageFiles) {
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { success: false, error: `Image ${file.name} exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB limit` },
          { status: 400 }
        )
      }
    }

    for (const file of videoFiles) {
      if (file.size > MAX_VIDEO_SIZE) {
        return NextResponse.json(
          { success: false, error: `Video ${file.name} exceeds ${MAX_VIDEO_SIZE / 1024 / 1024}MB limit` },
          { status: 400 }
        )
      }
    }

    // In a real implementation, you would:
    // 1. Upload files to cloud storage (S3, Cloudinary, etc.)
    // 2. Compress and optimize images
    // 3. Generate thumbnails for videos
    // 4. Return the URLs
    
    // For now, we'll simulate the upload process
    const uploadedImageUrls: string[] = []
    const uploadedVideoUrls: string[] = []

    // Simulate image uploads
    for (const file of imageFiles) {
      // In production, upload to cloud storage and get URL
      const simulatedUrl = `/uploads/reviews/${reviewId}/images/${Date.now()}-${file.name}`
      uploadedImageUrls.push(simulatedUrl)
    }

    // Simulate video uploads
    for (const file of videoFiles) {
      // In production, upload to cloud storage and get URL
      const simulatedUrl = `/uploads/reviews/${reviewId}/videos/${Date.now()}-${file.name}`
      uploadedVideoUrls.push(simulatedUrl)
    }

    // Update review with new media URLs
    const updatedImages = [...existingImages, ...uploadedImageUrls]
    const updatedVideos = [...existingVideos, ...uploadedVideoUrls]

    await prisma.review.update({
      where: { id: reviewId },
      data: {
        images: updatedImages,
        videos: updatedVideos
      }
    })

    return NextResponse.json({
      success: true,
      images: updatedImages,
      videos: updatedVideos
    })

  } catch (error) {
    console.error('Review media upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove media from review
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<UploadResponse>> {
  try {
    // Check authentication
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const reviewId = params.id
    const { searchParams } = new URL(request.url)
    const mediaUrl = searchParams.get('url')
    const mediaType = searchParams.get('type') as 'image' | 'video' | null

    if (!mediaUrl || !mediaType) {
      return NextResponse.json(
        { success: false, error: 'Missing url or type parameter' },
        { status: 400 }
      )
    }

    // Verify review exists and belongs to user
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
        images: true,
        videos: true
      }
    })

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }

    if (review.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Remove media URL from appropriate array
    let updatedImages = (review.images as string[]) || []
    let updatedVideos = (review.videos as string[]) || []

    if (mediaType === 'image') {
      updatedImages = updatedImages.filter(url => url !== mediaUrl)
    } else if (mediaType === 'video') {
      updatedVideos = updatedVideos.filter(url => url !== mediaUrl)
    }

    // Update review
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        images: updatedImages,
        videos: updatedVideos
      }
    })

    // In production, also delete the file from cloud storage

    return NextResponse.json({
      success: true,
      images: updatedImages,
      videos: updatedVideos
    })

  } catch (error) {
    console.error('Review media deletion error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
