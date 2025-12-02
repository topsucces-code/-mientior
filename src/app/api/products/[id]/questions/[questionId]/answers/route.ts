import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// POST /api/products/[id]/questions/[questionId]/answers - Submit an answer
const answerSchema = z.object({
  answer: z.string().min(10, 'Answer must be at least 10 characters'),
  userId: z.string().optional(),
  vendorId: z.string().optional(),
  isOfficial: z.boolean().default(false),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const { questionId } = params
    const body = await request.json()

    // Validate input
    const validation = answerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { answer, userId, vendorId, isOfficial } = validation.data

    // Verify question exists and is approved
    const question = await prisma.productQuestion.findUnique({
      where: { id: questionId },
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    if (question.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Cannot answer unapproved questions' },
        { status: 400 }
      )
    }

    // Create answer
    const newAnswer = await prisma.productAnswer.create({
      data: {
        questionId,
        userId,
        vendorId,
        answer,
        isOfficial,
      },
    })

    return NextResponse.json(
      {
        message: 'Answer submitted successfully',
        answer: newAnswer,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating answer:', error)
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    )
  }
}
