/**
 * Checkout Page
 * Multi-step checkout flow with shipping, payment, and review
 */

import { Metadata } from 'next'
import { getSession } from '@/lib/auth-server'
import { CheckoutPageClient } from './checkout-client'

export const metadata: Metadata = {
  title: 'Checkout | Mientior',
  description: 'Complete your order securely',
}

export default async function CheckoutPage() {
  // Check authentication
  const session = await getSession()

  // TEMPORARY: Allow guest checkout for testing Stripe integration
  // TODO: Uncomment this once /login page is created
  // if (!session) {
  //   redirect('/login?redirect=/checkout')
  // }

  return (
    <div className="min-h-screen bg-platinum-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-anthracite-700 mb-2">
            Checkout
          </h1>
          <p className="text-nuanced-600">
            Complete your purchase securely
          </p>
        </div>

        {/* Checkout Flow */}
        <CheckoutPageClient userEmail={session?.user?.email || undefined} />
      </div>
    </div>
  )
}
