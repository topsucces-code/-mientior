'use client'

import * as React from 'react'
import Image from 'next/image'
import { MapPin, Truck, CreditCard, Package, Lock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Address, OrderItem, ShippingOption, PaymentMethod } from '@/types'

interface OrderSummaryProps {
  items: OrderItem[]
  shippingAddress: Address
  shippingOption: ShippingOption
  paymentMethod: PaymentMethod
  subtotal: number
  shippingCost: number
  tax: number
  discount?: number
  total: number
  onPlaceOrder: () => void
  onBack?: () => void
  isLoading?: boolean
  className?: string
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  card: 'Credit / Debit Card',
  paypal: 'PayPal',
  'apple-pay': 'Apple Pay',
  'google-pay': 'Google Pay',
  installments: 'Pay in Installments',
}

export function OrderSummary({
  items,
  shippingAddress,
  shippingOption,
  paymentMethod,
  subtotal,
  shippingCost,
  tax,
  discount = 0,
  total,
  onPlaceOrder,
  onBack,
  isLoading = false,
  className,
}: OrderSummaryProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Order Items */}
      <Card className="shadow-elevation-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-anthracite-700">
            <Package className="h-5 w-5" />
            Order Items ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={`${item.productId}-${item.variant?.sku || ''}`} className="flex gap-4">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-platinum-100">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-xs text-nuanced-500">No image</span>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <p className="text-sm font-medium text-anthracite-700 line-clamp-2">
                    {item.productName}
                  </p>
                  {item.variant && (
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-nuanced-500">
                      {item.variant.size && <span>Size: {item.variant.size}</span>}
                      {item.variant.color && <span>Color: {item.variant.color}</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-nuanced-500">Qty: {item.quantity}</span>
                  <span className="font-semibold text-anthracite-700">
                    ${(item.subtotal / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Shipping Address */}
      <Card className="shadow-elevation-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-anthracite-700">
            <MapPin className="h-5 w-5" />
            Shipping Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <p className="font-medium text-anthracite-700">
              {shippingAddress.firstName} {shippingAddress.lastName}
            </p>
            <p className="text-nuanced-600">{shippingAddress.line1}</p>
            {shippingAddress.line2 && (
              <p className="text-nuanced-600">{shippingAddress.line2}</p>
            )}
            <p className="text-nuanced-600">
              {shippingAddress.city}, {shippingAddress.postalCode}
            </p>
            <p className="text-nuanced-600">{shippingAddress.country}</p>
            <p className="text-nuanced-600">{shippingAddress.phone}</p>
            {shippingAddress.email && (
              <p className="text-nuanced-600">{shippingAddress.email}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shipping Method */}
      <Card className="shadow-elevation-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-anthracite-700">
            <Truck className="h-5 w-5" />
            Shipping Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-anthracite-700">{shippingOption.name}</p>
              <p className="text-sm text-nuanced-600">
                Estimated delivery: {shippingOption.estimatedDays === 1 ? '1 day' : `${shippingOption.estimatedDays} days`}
              </p>
              {shippingOption.carrier && (
                <p className="text-xs text-nuanced-500">via {shippingOption.carrier}</p>
              )}
            </div>
            <p className="font-semibold text-anthracite-700">
              {shippingCost === 0 ? (
                <span className="text-success">Free</span>
              ) : (
                `$${(shippingCost / 100).toFixed(2)}`
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="shadow-elevation-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-anthracite-700">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="font-medium text-anthracite-700">
              {paymentMethodLabels[paymentMethod]}
            </p>
            <div className="flex items-center gap-1 text-xs text-success">
              <Lock className="h-3 w-3" />
              <span>Secure</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <Card className="shadow-elevation-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-anthracite-700">
            Price Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-nuanced-500">Subtotal</span>
            <span className="font-medium text-anthracite-700">
              ${(subtotal / 100).toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-nuanced-500">Shipping</span>
            <span className="font-medium text-anthracite-700">
              {shippingCost === 0 ? (
                <span className="text-success">Free</span>
              ) : (
                `$${(shippingCost / 100).toFixed(2)}`
              )}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-nuanced-500">Tax</span>
            <span className="font-medium text-anthracite-700">
              ${(tax / 100).toFixed(2)}
            </span>
          </div>

          {discount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-nuanced-500">Discount</span>
              <span className="font-medium text-success">
                -${(discount / 100).toFixed(2)}
              </span>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between text-base">
            <span className="font-semibold text-anthracite-700">Total</span>
            <span className="text-xl font-bold text-orange-500">
              ${(total / 100).toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card className="shadow-elevation-2">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg bg-orange-50 p-4 text-sm">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-orange-500" />
              <p className="text-nuanced-700">
                By placing this order, you agree to our terms of service and privacy policy.
                Your order will be processed securely.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              {onBack && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isLoading}
                  className="sm:w-auto"
                >
                  Back to Payment
                </Button>
              )}
              <Button
                type="button"
                variant="gradient"
                size="lg"
                onClick={onPlaceOrder}
                disabled={isLoading}
                className="sm:ml-auto sm:w-auto"
              >
                {isLoading ? 'Placing Order...' : 'Place Order'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
