import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// GET /api/products/[id]/questions - Get all questions for a product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: productId } = params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Build where clause
    const where: any = {
      productId,
      status: 'APPROVED', // Only show approved questions
    }

    // Add search filter if provided
    if (search) {
      where.OR = [
        { question: { contains: search, mode: 'insensitive' } },
        {
          answers: {
            some: {
              answer: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ]
    }

    // Fetch questions with answers
    const questions = await prisma.productQuestion.findMany({
      where,
      include: {
        answers: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [
        // Sort by helpfulness score (helpful - notHelpful)
        { helpful: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Calculate helpfulness score for sorting
    const questionsWithScore = questions.map((q) => ({
      ...q,
      helpfulnessScore: q.helpful - q.notHelpful,
    }))

    // Sort by helpfulness score
    questionsWithScore.sort((a, b) => b.helpfulnessScore - a.helpfulnessScore)

    return NextResponse.json({ questions: questionsWithScore })
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    )
  }
}

// POST /api/products/[id]/questions - Submit a new question
const questionSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters'),
  userId: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: productId } = params
    const body = await request.json()

    // Validate input
    const validation = questionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { question, userId } = validation.data

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Create question with PENDING status for moderation
    const newQuestion = await prisma.productQuestion.create({
      data: {
        productId,
        userId,
        question,
        status: 'PENDING',
      },
    })

    return NextResponse.json(
      {
        message: 'Question submitted for moderation',
        question: newQuestion,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json(
      { error: 'Failed to submit question' },
      { status: 500 }
    )
  }
}
