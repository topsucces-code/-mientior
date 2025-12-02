import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// POST /api/products/[id]/questions/[questionId]/vote - Vote on a question
const voteSchema = z.object({
  voteType: z.enum(['helpful', 'notHelpful']),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const { questionId } = params
    const body = await request.json()

    // Validate input
    const validation = voteSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { voteType } = validation.data

    // Verify question exists
    const question = await prisma.productQuestion.findUnique({
      where: { id: questionId },
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    // Update vote count
    const updatedQuestion = await prisma.productQuestion.update({
      where: { id: questionId },
      data: {
        helpful:
          voteType === 'helpful' ? { increment: 1 } : question.helpful,
        notHelpful:
          voteType === 'notHelpful'
            ? { increment: 1 }
            : question.notHelpful,
      },
    })

    return NextResponse.json({
      message: 'Vote recorded successfully',
      question: updatedQuestion,
    })
  } catch (error) {
    console.error('Error recording vote:', error)
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    )
  }
}
