'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react'
import { QASearch } from './qa-search'
import { AskQuestionModal } from './ask-question-modal'

interface ProductAnswer {
  id: string
  answer: string
  userId?: string
  vendorId?: string
  isOfficial: boolean
  createdAt: string
}

interface ProductQuestion {
  id: string
  question: string
  helpful: number
  notHelpful: number
  helpfulnessScore: number
  verified: boolean
  createdAt: string
  answers: ProductAnswer[]
}

interface ProductQASectionProps {
  productId: string
}

export function ProductQASection({ productId }: ProductQASectionProps) {
  const [questions, setQuestions] = useState<ProductQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [votedQuestions, setVotedQuestions] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true)
      const url = new URL(`/api/products/${productId}/questions`, window.location.origin)
      if (searchQuery) {
        url.searchParams.set('search', searchQuery)
      }

      const response = await fetch(url.toString())
      if (!response.ok) throw new Error('Failed to fetch questions')

      const data = await response.json()
      setQuestions(data.questions || [])
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }, [productId, searchQuery])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const handleVote = async (questionId: string, voteType: 'helpful' | 'notHelpful') => {
    // Prevent duplicate voting
    if (votedQuestions.has(questionId)) {
      return
    }

    try {
      const response = await fetch(
        `/api/products/${productId}/questions/${questionId}/vote`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voteType }),
        }
      )

      if (!response.ok) throw new Error('Failed to vote')

      // Mark as voted
      setVotedQuestions((prev) => new Set(prev).add(questionId))

      // Refresh questions to get updated counts and re-sort
      await fetchQuestions()
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-24 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with search and ask button */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <QASearch onSearchChange={setSearchQuery} />
        </div>
        <AskQuestionModal productId={productId} />
      </div>

      {/* Empty state */}
      {questions.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          {searchQuery
            ? 'No questions found matching your search.'
            : 'No questions yet. Be the first to ask!'}
        </div>
      )}

      {/* Questions list */}
      {questions.map((question) => (
        <div
          key={question.id}
          className="border rounded-lg p-4 space-y-4"
        >
          {/* Question */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-medium text-lg">{question.question}</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Asked {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                </p>
              </div>
              {question.verified && (
                <Badge variant="secondary" className="shrink-0">
                  Verified Purchase
                </Badge>
              )}
            </div>

            {/* Vote buttons */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote(question.id, 'helpful')}
                disabled={votedQuestions.has(question.id)}
                className="gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                <span>Helpful ({question.helpful})</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote(question.id, 'notHelpful')}
                disabled={votedQuestions.has(question.id)}
                className="gap-2"
              >
                <ThumbsDown className="h-4 w-4" />
                <span>Not Helpful ({question.notHelpful})</span>
              </Button>
            </div>
          </div>

          {/* Answers */}
          {question.answers.length > 0 && (
            <div className="pl-6 border-l-2 border-gray-200 space-y-4">
              {question.answers.map((answer) => (
                <div key={answer.id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MessageCircle className="h-4 w-4 text-gray-400 mt-1 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {answer.isOfficial && (
                          <Badge variant="default" className="bg-turquoise-600">
                            Official Response
                          </Badge>
                        )}
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-gray-700">{answer.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
