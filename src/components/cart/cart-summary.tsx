'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ShieldCheck, RotateCcw, Award, Lock, X, Loader2, Gift, CreditCard } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
import { useToast } from '@/hooks/use-toast'
import { useCartAnalytics } from '@/hooks/use-cart-analytics'
import { formatCurrency } from '@/lib/currency'

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
  const { appliedCoupon, applyCoupon, removeCoupon } = useCartStore()
  const { toast } = useToast()
  const { trackCouponApplied } = useCartAnalytics()
  const [couponCode, setCouponCode] = React.useState('')
  const [isValidating, setIsValidating] = React.useState(false)
  const [couponError, setCouponError] = React.useState<string | null>(null)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Veuillez entrer un code promo')
      return
    }

    setIsValidating(true)
    setCouponError(null)

    try {
      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, cartTotal: subtotal })
      })

      const result = await response.json()

      if (result.valid && result.coupon) {
        applyCoupon(result.coupon)
        setCouponCode('')
        
        // Track analytics event
        const discountAmount = result.coupon.type === 'percentage'
          ? Math.round((subtotal * result.coupon.discount) / 100)
          : result.coupon.discount
        trackCouponApplied(result.coupon.code, discountAmount)

        toast({
          title: 'Code promo appliqué',
          description: `Vous économisez ${result.coupon.type === 'percentage' ? `${result.coupon.discount}%` : formatCurrency(result.coupon.discount)}`,
          variant: 'default'
        })
      } else {
        setCouponError(result.message || 'Code promo invalide')
      }
    } catch (error) {
      setCouponError('Erreur lors de la validation du code promo')
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemoveCoupon = () => {
    removeCoupon()
    setCouponCode('')
    setCouponError(null)
    toast({
      title: 'Code promo retiré',
      variant: 'default'
    })
  }

  return (
    <Card className={cn('shadow-elevation-2 sticky top-24', className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-anthracite-700">
          Résumé de la commande
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Coupon Code Section */}
        {!appliedCoupon ? (
          <div className="space-y-2">
            <label htmlFor="coupon-code" className="text-sm font-medium text-anthracite-700">
              Code promo
            </label>
            <div className="flex gap-2">
              <Input
                id="coupon-code"
                placeholder="Entrer le code"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value)
                  setCouponError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyCoupon()
                }}
                className={cn(couponError && 'border-red-500')}
              />
              <Button
                variant="outline"
                onClick={handleApplyCoupon}
                disabled={isValidating}
              >
                {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Appliquer'}
              </Button>
            </div>
            {couponError && (
              <p className="text-xs text-red-600">{couponError}</p>
            )}
          </div>
        ) : (
          <div className="rounded-lg bg-green-50 p-3 border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Code appliqué: {appliedCoupon.code}
                  </p>
                  <p className="text-xs text-green-600">
                    {appliedCoupon.type === 'percentage'
                      ? `${appliedCoupon.discount}% de réduction`
                      : `${formatCurrency(appliedCoupon.discount)} de réduction`}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-green-600 hover:text-green-700"
                onClick={handleRemoveCoupon}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-nuanced-500">Sous-total</span>
          <span className="font-medium text-anthracite-700">
            {formatCurrency(subtotal)}
          </span>
        </div>

        {/* Shipping */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-nuanced-500">Livraison</span>
          <span className="font-medium text-anthracite-700">
            {shipping === 0 ? (
              <span className="text-green-600 font-semibold">Gratuit</span>
            ) : (
              formatCurrency(shipping)
            )}
          </span>
        </div>

        {/* Tax */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-nuanced-500">TVA (20%)</span>
          <span className="font-medium text-anthracite-700">
            {formatCurrency(tax)}
          </span>
        </div>

        {/* Discount */}
        {discount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-nuanced-500">Réduction</span>
            <span className="font-medium text-green-600">
              -{formatCurrency(discount)}
            </span>
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between text-base">
          <span className="font-semibold text-anthracite-700">Total</span>
          <span className="text-xl font-bold text-orange-500">
            {formatCurrency(total)}
          </span>
        </div>

        {/* Tax Notice */}
        <p className="text-xs text-nuanced-500">
          TVA calculée selon votre localisation
        </p>

        <Separator />

        {/* Trust Badges */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-nuanced-600">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <span>Paiement sécurisé</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-nuanced-600">
            <RotateCcw className="h-4 w-4 text-blue-600" />
            <span>Retours gratuits sous 30 jours</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-nuanced-600">
            <Award className="h-4 w-4 text-purple-600" />
            <span>Garantie satisfaction 100%</span>
          </div>
        </div>
      </CardContent>

      {showCheckoutButton && (
        <CardFooter className="flex flex-col gap-3">
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            onClick={onCheckout}
            disabled={checkoutDisabled}
          >
            <Lock className="h-4 w-4 mr-2" />
            Passer la commande
          </Button>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <CreditCard className="h-4 w-4 text-nuanced-400" />
            <span className="text-xs text-nuanced-500">Visa, Mastercard, PayPal, Apple Pay acceptés</span>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
