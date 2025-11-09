'use client'

import * as React from 'react'
import { FAQSection, type FAQ } from '@/components/support/faq-section'

interface FAQPageClientProps {
  faqs: FAQ[]
}

export function FAQPageClient({ faqs }: FAQPageClientProps) {
  const handleVoteHelpful = async (faqId: string) => {
    try {
      // Call API to record helpful vote
      await fetch(`/api/faqs/${faqId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'helpful' }),
      })
    } catch (error) {
      console.error('Error voting helpful:', error)
    }
  }

  const handleVoteNotHelpful = async (faqId: string) => {
    try {
      // Call API to record not helpful vote
      await fetch(`/api/faqs/${faqId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'not-helpful' }),
      })
    } catch (error) {
      console.error('Error voting not helpful:', error)
    }
  }

  return (
    <FAQSection
      faqs={faqs}
      onVoteHelpful={handleVoteHelpful}
      onVoteNotHelpful={handleVoteNotHelpful}
    />
  )
}
