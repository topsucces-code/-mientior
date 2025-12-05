/**
 * Wishlist Page
 * Display all saved products with actions
 */

import { Metadata } from 'next'
import { Suspense } from 'react'
import { WishlistPageClient } from './wishlist-client'

export const metadata: Metadata = {
  title: 'My Wishlist | Mientior',
  description: 'View and manage your saved products',
}

export default function WishlistPage() {
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
          <WishlistPageClient />
        </Suspense>
      </div>
    </div>
  )
}
