'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ShieldCheck, RotateCcw, Award, Lock, Loader2, Gift, CreditCard, Sparkles, Info, TrendingDown, Tag } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
import { toast } from 'sonner'
import { useCartAnalytics } from '@/hooks/use-cart-analytics'
import { formatCurrency } from '@/lib/currency'
import { AppliedPromotionsPanel } from '@/components/cart/applied-promotions-panel'
import { SavingsSummary } from '@/components/cart/savings-summary'
import { calculateDiscountPercentage } from '@/lib/promotion-utils'

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
  const cartStore = useCartStore()
  const { appliedCoupon, applyCoupon, removeCoupon, getAllPromotions, getTotalSavings } = cartStore
  const { trackCouponApplied } = useCartAnalytics()
  const [couponCode, setCouponCode] = React.useState('')
  const [isValidating, setIsValidating] = React.useState(false)
  const [couponError, setCouponError] = React.useState<string | null>(null)
  const [showConfetti, setShowConfetti] = React.useState(false)

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
        
        // Trigger confetti animation
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 100) // Reset to allow re-trigger
        
        // Track analytics event
        const discountAmount = result.coupon.type === 'percentage'
          ? Math.round((subtotal * result.coupon.discount) / 100)
          : result.coupon.discount
        trackCouponApplied(result.coupon.code, discountAmount)

        toast.success('Code promo appliqué !', {
          description: `Vous économisez ${result.coupon.type === 'percentage' ? `${result.coupon.discount}%` : formatCurrency(result.coupon.discount)} sur votre commande.`,
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
    toast.info('Code promo retiré')
  }

  // Get all promotions from store (includes both item-level and cart-level promotions)
  const promotions = getAllPromotions()

  // Get total savings from store (includes all promotion types)
  const totalSavings = getTotalSavings()

  return (
    <TooltipProvider>
      <Card className={cn('shadow-elevation-2 sticky top-24', className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-anthracite-700 flex items-center gap-2">
            Résumé de la commande
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Coupon Code Section */}
          {appliedCoupon ? (
            <div className="relative">
              <AppliedPromotionsPanel
                promotions={promotions}
                totalSavings={totalSavings}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-3 right-3 h-6 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleRemoveCoupon}
              >
                Retirer
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="coupon-code" className="text-sm font-medium text-anthracite-700 flex items-center gap-2">
                <Gift className="w-4 h-4 text-orange-500" />
                Code promo
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
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
                    className={cn("pl-8", couponError && 'border-red-500')}
                  />
                  <Tag className="w-4 h-4 text-nuanced-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <Button
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={isValidating}
                >
                  {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Appliquer'}
                </Button>
              </div>
              {couponError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {couponError}
                </p>
              )}
            </div>
          )}

          {/* Savings Summary */}
          <SavingsSummary 
            subtotal={subtotal}
            discount={discount}
            finalTotal={total}
            showConfetti={showConfetti}
          />

          <Separator />

          <div className="space-y-3">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-nuanced-500">Sous-total</span>
              <span className="font-medium text-anthracite-700">
                {formatCurrency(subtotal)}
              </span>
            </div>

            {/* Shipping */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-nuanced-500">Livraison</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-nuanced-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">La livraison est gratuite à partir d'un certain montant.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-medium text-anthracite-700">
                {shipping === 0 ? (
                  <span className="text-green-600 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Gratuit
                  </span>
                ) : (
                  formatCurrency(shipping)
                )}
              </span>
            </div>

            {/* Tax */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-nuanced-500">TVA (estimée)</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-nuanced-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Le taux de TVA dépend de votre pays de livraison.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-medium text-anthracite-700">
                {formatCurrency(tax)}
              </span>
            </div>

            {/* Discount */}
            {discount > 0 && (
              <div className="flex items-center justify-between text-sm animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center gap-1.5 text-green-600">
                  <TrendingDown className="w-4 h-4" />
                  <span className="font-medium">Réduction</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                    -{calculateDiscountPercentage(subtotal, subtotal - discount)}%
                  </span>
                  <span className="font-bold text-green-600">
                    -{formatCurrency(discount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Total */}
          <div className="flex items-center justify-between text-base">
            <span className="font-semibold text-anthracite-700">Total</span>
            <div className="text-right">
              <span className="text-xl font-bold text-orange-500 block leading-none">
                {formatCurrency(total)}
              </span>
              {discount > 0 && (
                <span className="text-[10px] text-green-600 font-medium mt-1 block">
                  Vous économisez {formatCurrency(discount)}
                </span>
              )}
            </div>
          </div>

          {/* Tax Notice */}
          <p className="text-xs text-nuanced-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
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
    </TooltipProvider>
  )
}
