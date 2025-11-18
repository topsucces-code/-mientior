/**
 * Shopping Cart Page - Enhanced with conversion optimization features
 * Displays cart items, saved for later, recommendations, and checkout flow
 */

import { Metadata } from 'next'
import { getSession } from '@/lib/auth-server'
import { CartPageClient } from './cart-client'

export const metadata: Metadata = {
  title: 'Mon Panier | Mientior',
  description: 'Consultez votre panier et procédez au paiement sécurisé',
}

export default async function CartPage() {
  // Get authentication status
  const session = await getSession()
  const isAuthenticated = !!session?.user

  return (
    <div className="min-h-screen bg-platinum-50">
      <CartPageClient isAuthenticated={isAuthenticated} />
    </div>
  )
}
