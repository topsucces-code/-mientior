import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as submitReview } from '@/app/api/reviews/products/[slug]/reviews/route'
import { POST as voteReview } from '@/app/api/reviews/[id]/vote/route'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    review: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    order: {
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    media: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth-server', () => ({
  getSession: vi.fn(() => Promise.resolve({ user: { id: 'user-123', email: 'test@example.com' } })),
}))

describe('Review Submission API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should submit a review successfully', async () => {
    const mockProduct = { id: 'prod-1', name: 'Test Product' }
    const mockUser = { id: 'user-123', email: 'test@example.com', firstName: 'John', lastName: 'Doe' }
    const mockReview = { id: 'review-1', rating: 5, title: 'Great!', comment: 'Excellent product' }

    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
    vi.mocked(prisma.order.findFirst).mockResolvedValue({ id: 'order-1' } as any)
    vi.mocked(prisma.review.create).mockResolvedValue(mockReview as any)

    const formData = new FormData()
    formData.append('rating', '5')
    formData.append('title', 'Great!')
    formData.append('comment', 'Excellent product')

    const request = new Request('http://localhost:3000/api/reviews/products/test-product/reviews', {
      method: 'POST',
      body: formData,
    })

    const response = await submitReview(request, { params: { slug: 'test-product' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(prisma.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          rating: 5,
          title: 'Great!',
          comment: 'Excellent product',
          verified: true,
        }),
      })
    )
  })

  it('should reject invalid rating', async () => {
    const formData = new FormData()
    formData.append('rating', '6') // Invalid
    formData.append('title', 'Test')
    formData.append('comment', 'Test comment')

    const request = new Request('http://localhost:3000/api/reviews/products/test-product/reviews', {
      method: 'POST',
      body: formData,
    })

    const response = await submitReview(request, { params: { slug: 'test-product' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid rating')
  })
})

describe('Review Vote API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should record helpful vote', async () => {
    const mockReview = { id: 'review-1', helpful: 5, notHelpful: 2 }
    vi.mocked(prisma.review.findUnique).mockResolvedValue(mockReview as any)
    vi.mocked(prisma.review.update).mockResolvedValue({ ...mockReview, helpful: 6 } as any)

    const request = new Request('http://localhost:3000/api/reviews/review-1/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voteType: 'helpful' }),
    })

    const response = await voteReview(request, { params: { id: 'review-1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.helpful).toBe(6)
    expect(prisma.review.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { helpful: 6 },
      })
    )
  })

  it('should record notHelpful vote', async () => {
    const mockReview = { id: 'review-1', helpful: 5, notHelpful: 2 }
    vi.mocked(prisma.review.findUnique).mockResolvedValue(mockReview as any)
    vi.mocked(prisma.review.update).mockResolvedValue({ ...mockReview, notHelpful: 3 } as any)

    const request = new Request('http://localhost:3000/api/reviews/review-1/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voteType: 'notHelpful' }),
    })

    const response = await voteReview(request, { params: { id: 'review-1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.notHelpful).toBe(3)
    expect(prisma.review.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { notHelpful: 3 },
      })
    )
  })

  it('should reject invalid voteType', async () => {
    const mockReview = { id: 'review-1', helpful: 5, notHelpful: 2 }
    vi.mocked(prisma.review.findUnique).mockResolvedValue(mockReview as any)

    const request = new Request('http://localhost:3000/api/reviews/review-1/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voteType: 'invalid' }),
    })

    const response = await voteReview(request, { params: { id: 'review-1' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('should return 404 for non-existent review', async () => {
    vi.mocked(prisma.review.findUnique).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/reviews/review-1/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voteType: 'helpful' }),
    })

    const response = await voteReview(request, { params: { id: 'review-1' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('not found')
  })

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null)

    const request = new Request('http://localhost:3000/api/reviews/review-1/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voteType: 'helpful' }),
    })

    const response = await voteReview(request, { params: { id: 'review-1' } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Authentication required')
  })
})

describe('Review Submission - Additional Validations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject empty comment', async () => {
    const formData = new FormData()
    formData.append('rating', '5')
    formData.append('title', 'Test')
    formData.append('comment', '')

    const request = new Request('http://localhost:3000/api/reviews/products/test-product/reviews', {
      method: 'POST',
      body: formData,
    })

    const response = await submitReview(request, { params: { slug: 'test-product' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('comment is required')
  })

  it('should reject comment longer than 2000 characters', async () => {
    const longComment = 'a'.repeat(2001)
    const formData = new FormData()
    formData.append('rating', '5')
    formData.append('title', 'Test')
    formData.append('comment', longComment)

    const request = new Request('http://localhost:3000/api/reviews/products/test-product/reviews', {
      method: 'POST',
      body: formData,
    })

    const response = await submitReview(request, { params: { slug: 'test-product' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('too long')
  })

  it('should return 404 for non-existent product', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null)

    const formData = new FormData()
    formData.append('rating', '5')
    formData.append('title', 'Test')
    formData.append('comment', 'Test comment')

    const request = new Request('http://localhost:3000/api/reviews/products/non-existent/reviews', {
      method: 'POST',
      body: formData,
    })

    const response = await submitReview(request, { params: { slug: 'non-existent' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('Product not found')
  })

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null)

    const formData = new FormData()
    formData.append('rating', '5')
    formData.append('title', 'Test')
    formData.append('comment', 'Test comment')

    const request = new Request('http://localhost:3000/api/reviews/products/test-product/reviews', {
      method: 'POST',
      body: formData,
    })

    const response = await submitReview(request, { params: { slug: 'test-product' } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Authentication required')
  })

  it('should mark review as unverified if user has not purchased the product', async () => {
    const mockProduct = { id: 'prod-1', name: 'Test Product' }
    const mockUser = { id: 'user-123', email: 'test@example.com', firstName: 'John', lastName: 'Doe' }
    const mockReview = { id: 'review-1', rating: 5, title: 'Great!', comment: 'Excellent product', verified: false, status: 'PENDING' }

    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
    vi.mocked(prisma.order.findFirst).mockResolvedValue(null) // No order found
    vi.mocked(prisma.review.create).mockResolvedValue(mockReview as any)

    const formData = new FormData()
    formData.append('rating', '5')
    formData.append('title', 'Great!')
    formData.append('comment', 'Excellent product')

    const request = new Request('http://localhost:3000/api/reviews/products/test-product/reviews', {
      method: 'POST',
      body: formData,
    })

    const response = await submitReview(request, { params: { slug: 'test-product' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(prisma.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          verified: false,
        }),
      })
    )
  })
})
