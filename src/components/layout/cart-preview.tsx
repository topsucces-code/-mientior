'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, X, Plus, Minus, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/stores/cart.store'
import { RippleButton } from '@/components/ui/ripple-button'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface CartPreviewProps {
  className?: string
}

export function CartPreview({ className }: CartPreviewProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const { items, removeItem, updateQuantity, getTotalItems, getTotalPrice } = useCartStore()

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Cart Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 items-center gap-2 rounded-lg px-3 transition-colors hover:bg-platinum-100"
        aria-label={`Shopping cart with ${totalItems} items`}
        aria-expanded={isOpen}
      >
        <ShoppingCart className="h-5 w-5 text-anthracite-700" />
        {totalItems > 0 && (
          <span
            className={cn(
              'absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white',
              !prefersReducedMotion && 'animate-scale-in'
            )}
          >
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
        <span className="hidden text-sm font-medium text-anthracite-700 md:block">
          ${(totalPrice / 100).toFixed(2)}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full z-50 mt-2 w-96 max-w-[calc(100vw-2rem)]',
            'rounded-lg border border-platinum-300 bg-white shadow-elevation-4',
            !prefersReducedMotion && 'animate-fade-in'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-platinum-200 p-4">
            <h3 className="text-lg font-semibold text-anthracite-700">
              Shopping Cart ({totalItems})
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-platinum-100 transition-colors"
              aria-label="Close cart"
            >
              <X className="h-5 w-5 text-nuanced-500" />
            </button>
          </div>

          {/* Cart Items */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-8">
              <ShoppingCart className="h-16 w-16 text-platinum-400" />
              <p className="text-sm text-nuanced-600">Your cart is empty</p>
              <Link href="/products">
                <RippleButton
                  size="sm"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Continue Shopping
                </RippleButton>
              </Link>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="max-h-96 overflow-y-auto p-4">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      {/* Image */}
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-platinum-100">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingCart className="h-8 w-8 text-platinum-300" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex flex-1 flex-col gap-1">
                        <h4 className="line-clamp-2 text-sm font-medium text-anthracite-700">
                          {item.name}
                        </h4>
                        {item.variant && Object.keys(item.variant).length > 0 && (
                          <p className="text-xs text-nuanced-500">
                            {Object.entries(item.variant)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(', ')}
                          </p>
                        )}

                        {/* Quantity Controls & Price */}
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, Math.max(1, item.quantity - 1))
                              }
                              className="flex h-6 w-6 items-center justify-center rounded border border-platinum-300 hover:bg-platinum-100 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="flex h-6 w-6 items-center justify-center rounded border border-platinum-300 hover:bg-platinum-100 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-orange-500">
                            ${((item.price * item.quantity) / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full hover:bg-error/10 transition-colors"
                        aria-label="Remove item"
                      >
                        <X className="h-4 w-4 text-error" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-platinum-200 p-4">
                {/* Subtotal */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-nuanced-600">Subtotal</span>
                  <span className="text-xl font-bold text-anthracite-700">
                    ${(totalPrice / 100).toFixed(2)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Link href="/checkout">
                    <RippleButton
                      variant="gradient"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => setIsOpen(false)}
                    >
                      Proceed to Checkout
                      <ArrowRight className="h-4 w-4" />
                    </RippleButton>
                  </Link>
                  <Link href="/cart">
                    <RippleButton
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsOpen(false)}
                    >
                      View Cart
                    </RippleButton>
                  </Link>
                </div>

                {/* Shipping Info */}
                <p className="mt-3 text-center text-xs text-nuanced-500">
                  Shipping and taxes calculated at checkout
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
