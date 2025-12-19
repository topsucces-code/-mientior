'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MessageCircle, CheckCircle2 } from 'lucide-react'

interface AskQuestionModalProps {
  productId: string
  productName?: string
}

export function AskQuestionModal({
  productId,
  productName,
}: AskQuestionModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate question length
    if (question.trim().length < 10) {
      setError('Question must be at least 10 characters long')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/products/${productId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit question')
      }

      // Show success state
      setIsSuccess(true)

      // Reset form after delay
      setTimeout(() => {
        setQuestion('')
        setIsSuccess(false)
        setIsOpen(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit question')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setIsOpen(false)
      setQuestion('')
      setError('')
      setIsSuccess(false)
    }
  }

  const characterCount = question.length
  const isValid = characterCount >= 10

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageCircle className="h-4 w-4" />
          Ask a Question
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
            <DialogTitle className="text-center">
              Question Submitted!
            </DialogTitle>
            <DialogDescription className="text-center">
              Your question has been submitted for moderation and will appear
              once approved.
            </DialogDescription>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Ask a Question</DialogTitle>
              <DialogDescription>
                {productName
                  ? `Ask a question about ${productName}`
                  : 'Ask a question about this product'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="question">Your Question</Label>
                <Textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What would you like to know about this product?"
                  className="min-h-[120px]"
                  disabled={isSubmitting}
                />
                <div className="flex items-center justify-between text-sm">
                  <span
                    className={
                      isValid ? 'text-green-600' : 'text-gray-500'
                    }
                  >
                    {characterCount} / 10 characters minimum
                  </span>
                  {error && <span className="text-red-600">{error}</span>}
                </div>
              </div>

              <div className="bg-turquoise-50 border border-turquoise-200 rounded-lg p-3 text-sm text-turquoise-800">
                <p className="font-medium mb-1">Before you ask:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Check if your question has already been answered</li>
                  <li>Be specific and clear in your question</li>
                  <li>Questions are reviewed before being published</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!isValid || isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Question'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
