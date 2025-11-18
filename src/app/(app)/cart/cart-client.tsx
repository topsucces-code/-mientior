'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/stores/cart.store'
import { CartItem } from '@/components/cart/cart-item'
import { CartSummary } from '@/components/cart/cart-summary'
import { FreeShippingProgress } from '@/components/cart/free-shipping-progress'
import { SavedForLater } from '@/components/cart/saved-for-later'
import { CartRecommendations } from '@/components/cart/cart-recommendations'
import { EmptyCart } from '@/components/cart/empty-cart'
import { TrustSection } from '@/components/cart/trust-section'
import { MobileStickyBar } from '@/components/cart/mobile-sticky-bar'
import { CartPageSkeleton } from '@/components/cart/cart-skeleton'
import { Button } from '@/components/ui/button'
import { useCartAnalytics } from '@/hooks/use-cart-analytics'
import { useScreenReaderAnnounce } from '@/hooks/use-screen-reader-announce'

interface CartPageClientProps {
  isAuthenticated?: boolean
}

export function CartPageClient({ isAuthenticated = false }: CartPageClientProps) {
  const router = useRouter()
  const {
    items,
    savedForLater,
    getSubtotal,
    getDiscount,
    getShipping,
    getTax,
    getTotal,
    getTotalItems,
    getFreeShippingProgress,
    moveToCart,
    removeSavedItem,
    freeShippingThreshold
  } = useCartStore()

  const { trackViewCart, trackBeginCheckout } = useCartAnalytics()
  const { announce } = useScreenReaderAnnounce()
  const [isLoading, setIsLoading] = React.useState(true)

  // Calculate totals
  const subtotal = getSubtotal()
  const discount = getDiscount()
  const shipping = getShipping()
  const tax = getTax()
  const total = getTotal()
  const totalItems = getTotalItems()
  const freeShippingProgress = getFreeShippingProgress()

  // Track view cart on mount
  React.useEffect(() => {
    setIsLoading(false)
    if (items.length > 0) {
      trackViewCart(items, total)
    }
  }, [items.length, total, trackViewCart, items])

  const handleCheckout = () => {
    announce('Proceeding to checkout', 'polite')
    trackBeginCheckout(items, total)
    router.push('/checkout')
  }

  const handleMoveToCart = (id: string) => {
    moveToCart(id)
    announce('Item moved to cart', 'polite')
  }

  const handleRemoveSaved = (id: string) => {
    removeSavedItem(id)
    announce('Item removed from saved items', 'polite')
  }

  // Loading state
  if (isLoading) {
    return <CartPageSkeleton />
  }

  // Empty cart state
  if (items.length === 0 && savedForLater.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyCart isAuthenticated={isAuthenticated} />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-anthracite-700">Mon Panier</h1>
        <p className="text-nuanced-600 mt-1">
          {totalItems} {totalItems === 1 ? 'article' : 'articles'} dans votre panier
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Free Shipping Progress */}
          {items.length > 0 && !freeShippingProgress.unlocked && (
            <FreeShippingProgress
              currentTotal={subtotal}
              threshold={freeShippingThreshold}
            />
          )}

          {/* Cart Items */}
          {items.length > 0 && (
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          )}

          {/* Continue Shopping Button */}
          {items.length > 0 && (
            <div className="pt-2">
              <Button variant="outline" asChild>
                <Link href="/products">
                  Continuer mes achats
                </Link>
              </Button>
            </div>
          )}

          {/* Saved for Later Section */}
          {savedForLater.length > 0 && (
            <SavedForLater
              items={savedForLater}
              onMoveToCart={handleMoveToCart}
              onRemove={handleRemoveSaved}
              className="mt-8"
            />
          )}

          {/* Recommendations */}
          {items.length > 0 && (
            <CartRecommendations
              cartItems={items}
              className="mt-8"
            />
          )}

          {/* Trust Section */}
          <TrustSection className="mt-8" />
        </div>

        {/* Order Summary - Sticky Sidebar */}
        {items.length > 0 && (
          <div>
            <CartSummary
              subtotal={subtotal}
              shipping={shipping}
              tax={tax}
              discount={discount}
              total={total}
              onCheckout={handleCheckout}
              checkoutDisabled={items.length === 0}
            />
          </div>
        )}
      </div>

      {/* Mobile Sticky Bottom Bar */}
      {items.length > 0 && (
        <MobileStickyBar
          total={total}
          itemCount={totalItems}
          onCheckout={handleCheckout}
        />
      )}
    </div>
  )
}
