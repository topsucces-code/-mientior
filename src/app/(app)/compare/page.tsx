/**
 * Product Comparison Page
 * Compare up to 4 products side by side
 */

import { Metadata } from 'next'
import { Suspense } from 'react'
import { ComparePageClient } from './compare-client'

export const metadata: Metadata = {
  title: 'Compare Products | Mientior',
  description: 'Compare products side by side to find the best one for you',
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-platinum-50">
      <div className="container mx-auto px-4 py-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            </div>
          }
        >
          <ComparePageClient />
        </Suspense>
      </div>
    </div>
  )
}
