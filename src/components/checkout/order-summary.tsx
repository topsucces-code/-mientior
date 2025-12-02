'use client'

import * as React from 'react'
import Image from 'next/image'
import { MapPin, Truck, CreditCard, Package, Lock, CheckCircle2, Info, TrendingDown, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { Address, OrderItem, ShippingOption, PaymentMethod } from '@/types'
import { PromotionBadge } from '@/components/cart/promotion-badge'
import { AppliedPromotionsPanel } from '@/components/cart/applied-promotions-panel'

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
  orderNotes?: string
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
  orderNotes,
  onPlaceOrder,
  onBack,
  isLoading = false,
  className,
}: OrderSummaryProps) {
  // Helper to construct promotions list for display if discount > 0
  // In a real scenario, we would pass the actual AppliedPromotion[] prop
  const promotions = discount > 0 ? [{
    id: 'manual-discount',
    type: 'manual' as const,
    label: 'Promotion',
    discount: discount,
    discountType: 'fixed' as const,
    scope: 'cart' as const,
    description: 'Réduction appliquée sur la commande'
  }] : []

  return (
    <TooltipProvider>
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
                      alt={item.name}
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
                      {item.name}
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
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-anthracite-700">
                        ${(item.subtotal / 100).toFixed(2)}
                      </span>
                      {/* Note: We don't have compareAtPrice in OrderItem currently, 
                          but logic would go here if we added it to the type */}
                    </div>
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

        {/* Order Notes */}
        {orderNotes && (
          <Card className="shadow-elevation-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-anthracite-700">
                <FileText className="h-5 w-5" />
                Delivery Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-nuanced-600">{orderNotes}</p>
            </CardContent>
          </Card>
        )}

        {/* Applied Promotions Summary */}
        {discount > 0 && (
          <Card className="shadow-elevation-2 border-success/30 bg-success-light/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-anthracite-700">
                <TrendingDown className="h-5 w-5 text-success" />
                Promotions appliquées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AppliedPromotionsPanel 
                promotions={promotions} 
                totalSavings={discount}
              />
            </CardContent>
          </Card>
        )}

        {/* Price Breakdown */}
        <Card className="shadow-elevation-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-anthracite-700">
              Price Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-nuanced-500">Subtotal</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-nuanced-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Prix total des articles avant réductions et frais</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-medium text-anthracite-700">
                ${(subtotal / 100).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-nuanced-500">Shipping</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-nuanced-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Frais de livraison selon votre adresse et mode de livraison</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-medium text-anthracite-700">
                {shippingCost === 0 ? (
                  <span className="text-success">Free</span>
                ) : (
                  `$${(shippingCost / 100).toFixed(2)}`
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-nuanced-500">Tax</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-nuanced-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">TVA calculée selon votre pays de livraison</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-medium text-anthracite-700">
                ${(tax / 100).toFixed(2)}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex items-center justify-between text-sm animate-pulse">
                <div className="flex items-center gap-1.5">
                  <span className="text-nuanced-500">Discount</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-nuanced-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Total des réductions appliquées sur votre commande</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <PromotionBadge type="manual" label="Applied" size="sm" />
                  <span className="font-medium text-success">
                    -${(discount / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between text-base">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-anthracite-700">Total</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-nuanced-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Montant total à payer</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-orange-500 block">
                  ${(total / 100).toFixed(2)}
                </span>
                {discount > 0 && (
                  <span className="text-xs text-success font-medium">
                    Total savings: ${(discount / 100).toFixed(2)}
                  </span>
                )}
              </div>
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
    </TooltipProvider>
  )
}
