/**
 * Shopping Cart Page
 * Displays cart items and allows users to update quantities and proceed to checkout
 */

import { Metadata } from 'next'
import { CartPageClient } from './cart-client'

export const metadata: Metadata = {
  title: 'Shopping Cart | Mientior',
  description: 'Review your cart and proceed to checkout',
}

export default function CartPage() {
  return (
    <div className="min-h-screen bg-platinum-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-anthracite-700 mb-2">
            Shopping Cart
          </h1>
          <p className="text-nuanced-600">
            Review your items and proceed to checkout
          </p>
        </div>

        {/* Cart Content */}
        <CartPageClient />
      </div>
    </div>
  )
}
