'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
import { CartItem } from '@/components/cart/cart-item'
import { CartSummary } from '@/components/cart/cart-summary'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function CartPageClient() {
  const router = useRouter()
  const { items, getTotalPrice, getTotalItems } = useCartStore()

  const subtotal = getTotalPrice()
  const totalItems = getTotalItems()

  // Calculate shipping (free over $5000 / $50)
  const shippingThreshold = 5000 // $50 in cents
  const shipping = subtotal >= shippingThreshold ? 0 : 500 // $5 shipping

  // Calculate tax (example: 10%)
  const taxRate = 0.1
  const tax = Math.round(subtotal * taxRate)

  // Calculate total
  const total = subtotal + shipping + tax

  const handleCheckout = () => {
    router.push('/checkout')
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-6 rounded-full bg-platinum-100 p-6">
              <ShoppingBag className="h-16 w-16 text-nuanced-400" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-anthracite-700">
              Your cart is empty
            </h2>
            <p className="mb-6 text-nuanced-600">
              Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
            </p>
            <Button variant="gradient" size="lg" asChild>
              <Link href="/products">
                Browse Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      {/* Cart Items */}
      <div className="space-y-4">
        {/* Items Header */}
        <div className="flex items-center justify-between rounded-lg border border-platinum-300 bg-white p-4">
          <h2 className="text-lg font-semibold text-anthracite-700">
            Cart Items
          </h2>
          <span className="text-sm text-nuanced-600">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Cart Items List */}
        <div className="space-y-4">
          {items.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>

        {/* Continue Shopping */}
        <div className="pt-4">
          <Button variant="outline" asChild>
            <Link href="/products">
              Continue Shopping
            </Link>
          </Button>
        </div>

        {/* Free Shipping Progress */}
        {shipping > 0 && (
          <Card className="bg-aurore-50 border-aurore-200">
            <CardContent className="py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-anthracite-700">
                    Add ${((shippingThreshold - subtotal) / 100).toFixed(2)} more for free shipping
                  </span>
                  <span className="text-nuanced-600">
                    ${(subtotal / 100).toFixed(2)} / ${(shippingThreshold / 100).toFixed(2)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-platinum-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300"
                    style={{
                      width: `${Math.min((subtotal / shippingThreshold) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Order Summary - Sticky Sidebar */}
      <div className="lg:sticky lg:top-24 lg:h-fit">
        <CartSummary
          subtotal={subtotal}
          shipping={shipping}
          tax={tax}
          total={total}
          onCheckout={handleCheckout}
          checkoutDisabled={items.length === 0}
        />

        {/* Trust Badges */}
        <Card className="mt-4">
          <CardContent className="space-y-3 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-anthracite-700">
                  Secure Checkout
                </p>
                <p className="text-xs text-nuanced-500">
                  SSL encrypted payment
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-anthracite-700">
                  Money Back Guarantee
                </p>
                <p className="text-xs text-nuanced-500">
                  30-day return policy
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <svg
                  className="h-5 w-5 text-purple-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-anthracite-700">
                  Free Shipping
                </p>
                <p className="text-xs text-nuanced-500">
                  On orders over ${(shippingThreshold / 100).toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
