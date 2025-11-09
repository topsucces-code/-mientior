'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface CartSummaryProps {
  subtotal: number
  shipping: number
  tax: number
  discount?: number
  total: number
  onCheckout?: () => void
  checkoutDisabled?: boolean
  showCheckoutButton?: boolean
  className?: string
}

export function CartSummary({
  subtotal,
  shipping,
  tax,
  discount = 0,
  total,
  onCheckout,
  checkoutDisabled = false,
  showCheckoutButton = true,
  className,
}: CartSummaryProps) {
  return (
    <Card className={cn('shadow-elevation-2', className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-anthracite-700">
          Order Summary
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-nuanced-500">Subtotal</span>
          <span className="font-medium text-anthracite-700">
            ${(subtotal / 100).toFixed(2)}
          </span>
        </div>

        {/* Shipping */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-nuanced-500">Shipping</span>
          <span className="font-medium text-anthracite-700">
            {shipping === 0 ? (
              <span className="text-success">Free</span>
            ) : (
              `$${(shipping / 100).toFixed(2)}`
            )}
          </span>
        </div>

        {/* Tax */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-nuanced-500">Tax</span>
          <span className="font-medium text-anthracite-700">
            ${(tax / 100).toFixed(2)}
          </span>
        </div>

        {/* Discount */}
        {discount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-nuanced-500">Discount</span>
            <span className="font-medium text-success">
              -${(discount / 100).toFixed(2)}
            </span>
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between text-base">
          <span className="font-semibold text-anthracite-700">Total</span>
          <span className="text-xl font-bold text-orange-500">
            ${(total / 100).toFixed(2)}
          </span>
        </div>

        {/* Tax Notice */}
        <p className="text-xs text-nuanced-500">
          Tax calculated at checkout based on your location
        </p>
      </CardContent>

      {showCheckoutButton && (
        <CardFooter className="flex flex-col gap-2">
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            onClick={onCheckout}
            disabled={checkoutDisabled}
          >
            Proceed to Checkout
          </Button>
          <p className="text-center text-xs text-nuanced-500">
            Secure checkout with end-to-end encryption
          </p>
        </CardFooter>
      )}
    </Card>
  )
}
