import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { voteType } = await request.json()

    if (!['helpful', 'notHelpful'].includes(voteType)) {
      return NextResponse.json(
        { error: 'Invalid vote type' },
        { status: 400 }
      )
    }

    const reviewId = params.id

    // Vérifier que l'avis existe
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, helpful: true, notHelpful: true }
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Incrémenter le compteur approprié
    const updateData = voteType === 'helpful'
      ? { helpful: review.helpful + 1 }
      : { notHelpful: review.notHelpful + 1 }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
      select: { helpful: true, notHelpful: true }
    })

    return NextResponse.json({
      success: true,
      helpful: updatedReview.helpful,
      notHelpful: updatedReview.notHelpful
    })
  } catch (error) {
    console.error('Vote error:', error)
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    )
  }
}
