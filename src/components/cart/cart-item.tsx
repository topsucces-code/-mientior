'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useCartStore, type CartItem as CartItemType } from '@/stores/cart.store'

interface CartItemProps {
  item: CartItemType
  className?: string
  showActions?: boolean
}

export function CartItem({ item, className, showActions = true }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore()

  const handleIncrement = () => {
    updateQuantity(item.id, item.quantity + 1)
  }

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1)
    }
  }

  const handleRemove = () => {
    removeItem(item.id)
  }

  const subtotal = item.price * item.quantity

  return (
    <div
      className={cn(
        'flex gap-4 rounded-lg border border-platinum-300 bg-white p-4 transition-all hover:shadow-elevation-1',
        className
      )}
    >
      {/* Product Image */}
      <Link href={`/products/${item.id}`} className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-platinum-100">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover transition-transform hover:scale-110"
            sizes="96px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xs text-nuanced-500">No image</span>
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <Link
              href={`/products/${item.id}`}
              className="text-sm font-medium text-anthracite-700 hover:text-orange-500 transition-colors line-clamp-2"
            >
              {item.name}
            </Link>

            {/* Variant Information */}
            {item.variant && (
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-nuanced-500">
                {item.variant.size && (
                  <span>Size: {item.variant.size}</span>
                )}
                {item.variant.color && (
                  <span>Color: {item.variant.color}</span>
                )}
                {item.variant.sku && (
                  <span>SKU: {item.variant.sku}</span>
                )}
              </div>
            )}
          </div>

          {/* Remove Button */}
          {showActions && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 text-nuanced-500 hover:text-error"
              onClick={handleRemove}
              aria-label="Remove item"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Price and Quantity Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Quantity Controls */}
            {showActions ? (
              <div className="flex items-center gap-2 rounded-md border border-platinum-300 bg-platinum-50">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-platinum-200"
                  onClick={handleDecrement}
                  disabled={item.quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="min-w-[2ch] text-center text-sm font-medium text-anthracite-700">
                  {item.quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-platinum-200"
                  onClick={handleIncrement}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <span className="text-sm text-nuanced-500">Qty: {item.quantity}</span>
            )}

            {/* Unit Price */}
            <span className="text-sm text-nuanced-500">
              ${(item.price / 100).toFixed(2)} each
            </span>
          </div>

          {/* Subtotal */}
          <div className="text-right">
            <p className="text-base font-semibold text-orange-500">
              ${(subtotal / 100).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
