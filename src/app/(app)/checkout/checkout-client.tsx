'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cart.store'
import { ProgressStepper, type CheckoutStep } from '@/components/checkout/progress-stepper'
import { CheckoutHeader } from '@/components/checkout/checkout-header'
import { OrderSummarySidebar } from '@/components/checkout/order-summary-sidebar'
import { MobileStickyBar } from '@/components/checkout/mobile-sticky-bar'
import { Card, CardContent } from '@/components/ui/card'
import { useCheckoutAnalytics } from '@/hooks/use-checkout-analytics'
import type { Address, ShippingOption, PaymentMethod, CartItem, TotalsCalculationResult } from '@/types'

// Lazy load step components for better performance
const ShippingForm = dynamic(() => import('@/components/checkout/shipping-form').then(mod => ({ default: mod.ShippingForm })), {
  loading: () => <StepSkeleton />,
  ssr: false,
})

const ShippingOptions = dynamic(() => import('@/components/checkout/shipping-options').then(mod => ({ default: mod.ShippingOptions })), {
  loading: () => <StepSkeleton />,
  ssr: false,
})

const PaymentForm = dynamic(() => import('@/components/checkout/payment-form').then(mod => ({ default: mod.PaymentForm })), {
  loading: () => <StepSkeleton />,
  ssr: false,
})

const ExpressCheckout = dynamic(() => import('@/components/checkout/express-checkout').then(mod => ({ default: mod.ExpressCheckout })), {
  loading: () => <div className="h-32 animate-pulse bg-platinum-100 rounded-lg" />,
  ssr: false,
})

// Step loading skeleton component
function StepSkeleton() {
  return (
    <Card className="shadow-elevation-2">
      <CardContent className="pt-6">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-platinum-200 rounded w-1/3" />
          <div className="space-y-4">
            <div className="h-12 bg-platinum-100 rounded" />
            <div className="h-12 bg-platinum-100 rounded" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-platinum-100 rounded" />
              <div className="h-12 bg-platinum-100 rounded" />
            </div>
            <div className="h-12 bg-platinum-100 rounded" />
          </div>
          <div className="flex gap-3 pt-6">
            <div className="h-12 bg-platinum-100 rounded flex-1" />
            <div className="h-12 bg-platinum-100 rounded flex-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface CheckoutPageClientProps {
  userEmail: string
  isAuthenticated?: boolean
}

export function CheckoutPageClient({ userEmail, isAuthenticated = false }: CheckoutPageClientProps) {
  const router = useRouter()
  const { items, clearCart, getTotalPrice } = useCartStore()

  const [currentStep, setCurrentStep] = React.useState<CheckoutStep>('shipping')
  const [completedSteps, setCompletedSteps] = React.useState<CheckoutStep[]>([])

  // Form data
  const [shippingAddress, setShippingAddress] = React.useState<Address | null>(null)
  const [selectedShippingOption, setSelectedShippingOption] = React.useState<string>('')
  const [orderId, setOrderId] = React.useState<string | null>(null)
  const [orderNotes, setOrderNotes] = React.useState<string | null>(null)

  // Promo code state
  const [appliedCoupon, setAppliedCoupon] = React.useState<string | null>(null)
  const [discount, setDiscount] = React.useState(0) // in cents
  // Store promo code ID for order creation
  const promoCodeIdRef = React.useRef<string | null>(null)

  const [isLoading, setIsLoading] = React.useState(false)

  // Real-time totals calculation state
  const [calculatedTotals, setCalculatedTotals] = React.useState<TotalsCalculationResult | null>(null)
  const [isCalculating, setIsCalculating] = React.useState(false)
  const [calculationError, setCalculationError] = React.useState<string | null>(null)
  const [availableShippingOptions, setAvailableShippingOptions] = React.useState<ShippingOption[]>([])
  const [isLoadingShippingOptions, setIsLoadingShippingOptions] = React.useState(false)

  const cartTotalEstimate = getTotalPrice()

  // Calculate local subtotal estimate (items only)
  const localSubtotalEstimate = React.useMemo(() => {
    return items.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0)
  }, [items])

  // Use calculated totals if available, otherwise fall back to local estimates
  const shippingCost = calculatedTotals?.shipping.cost ?? 0
  const tax = calculatedTotals?.tax.taxAmount ?? 0
  const total = calculatedTotals?.total ?? cartTotalEstimate
  const displaySubtotal = calculatedTotals?.subtotal ?? localSubtotalEstimate

  // Convert for sidebar (CartItem format)
  const cartItemsForSidebar: CartItem[] = items.map((item) => {
    // Convert variant object to display string if it exists
    let variantDisplay: string | undefined = undefined
    if (item.variant && typeof item.variant === 'object') {
      const parts: string[] = []
      const variantObj = item.variant as { size?: string; color?: string }
      if (variantObj.size) parts.push(variantObj.size)
      if (variantObj.color) parts.push(variantObj.color)
      variantDisplay = parts.join(' - ')
    } else if (typeof item.variant === 'string') {
      variantDisplay = item.variant
    }

    return {
      ...item,
      name: item.name || item.productName || '',
      productName: item.name || item.productName || '',
      image: item.image || item.productImage || '',
      productImage: item.image || item.productImage || '',
      productSlug: item.productSlug || '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      variant: variantDisplay as any, // Convert to string for display
    }
  })

  // Analytics tracking
  const {
    trackShippingMethod,
    trackPaymentMethod,
    trackError: trackCheckoutError,
  } = useCheckoutAnalytics({
    step: currentStep,
    items: cartItemsForSidebar,
    total: total / 100, // Convert cents to euros
  })

  // Redirect to cart if empty
  React.useEffect(() => {
    if (items.length === 0) {
      router.push('/cart')
    }
  }, [items, router])

  // Prefetch next step components for better UX
  React.useEffect(() => {
    if (currentStep === 'shipping' && shippingAddress) {
      // Prefetch payment step components when shipping is complete
      import('@/components/checkout/payment-form').catch(() => {})
      import('@/components/checkout/express-checkout').catch(() => {})
    }
  }, [currentStep, shippingAddress])

  // Fetch shipping options when address is set
  React.useEffect(() => {
    const fetchShippingOptions = async () => {
      if (!shippingAddress) return

      setIsLoadingShippingOptions(true)
      try {
        const response = await fetch('/api/checkout/shipping-options', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address: shippingAddress,
            items: items.map(item => ({
              productId: item.productId || item.id,
              quantity: item.quantity,
            })),
          }),
        })

        const data = await response.json()
        if (data.success) {
          setAvailableShippingOptions(data.data)
        }
      } catch (error) {
        console.error('Error fetching shipping options:', error)
      } finally {
        setIsLoadingShippingOptions(false)
      }
    }

    if (shippingAddress) {
      fetchShippingOptions()
    }
  }, [shippingAddress, items])

  // Calculate totals in real-time when address or shipping option changes
  const calculateTotals = React.useCallback(async () => {
    if (!shippingAddress || !selectedShippingOption || items.length === 0) {
      // Not ready to calculate yet
      return
    }

    setIsCalculating(true)
    setCalculationError(null)

    try {
      const response = await fetch('/api/checkout/calculate-totals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId || item.id,
            quantity: item.quantity,
            variantId: item.variant?.sku,
          })),
          address: shippingAddress,
          shippingOptionId: selectedShippingOption,
          couponCode: appliedCoupon || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to calculate totals')
      }

      setCalculatedTotals(result.data)
      setDiscount(result.data.discount) // Update discount from server calculation
    } catch (error) {
      console.error('[Checkout] Error calculating totals:', error)
      setCalculationError(error instanceof Error ? error.message : 'Erreur de calcul')
    } finally {
      setIsCalculating(false)
    }
  }, [shippingAddress, selectedShippingOption, appliedCoupon, items])

  // Debounced totals calculation
  React.useEffect(() => {
    if (!shippingAddress || !selectedShippingOption) {
      return
    }

    // Debounce: wait 500ms after last change before calculating
    const timeoutId = setTimeout(() => {
      calculateTotals()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [shippingAddress, selectedShippingOption, appliedCoupon, calculateTotals])

  // Handle coupon application
  const handleApplyCoupon = async (code: string) => {
    try {
      const response = await fetch('/api/checkout/apply-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          subtotal: localSubtotalEstimate,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Code promo invalide')
      }

      // Update state with discount
      setAppliedCoupon(code)
      setDiscount(data.discount)
      promoCodeIdRef.current = data.promoCodeId
    } catch (error) {
      // Re-throw to let OrderSummarySidebar handle the error display
      throw error
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setDiscount(0)
    promoCodeIdRef.current = null
  }

  const handleStepChange = (step: CheckoutStep) => {
    // Only allow going back to completed steps
    if (completedSteps.includes(step)) {
      setCurrentStep(step)
    }
  }

  const handleShippingSubmit = (address: Address) => {
    // Extract and store order notes
    setOrderNotes(address.orderNotes || null)
    setShippingAddress(address)
    setCompletedSteps((prev) => {
      const newSteps = new Set([...prev, 'shipping' as CheckoutStep])
      return Array.from(newSteps)
    })
    // Move to shipping options selection (we'll show it right after)
    setCurrentStep('shipping')
  }

  const handleShippingOptionSelect = (optionId: string) => {
    setSelectedShippingOption(optionId)
    trackShippingMethod(optionId)
  }

  const handleShippingOptionContinue = async () => {
    if (!selectedShippingOption) {
      alert('Veuillez sélectionner une option de livraison')
      return
    }

    if (!shippingAddress) {
      alert('Adresse de livraison manquante')
      return
    }

    setIsLoading(true)

    try {
      // Create provisional order before payment
      const response = await fetch('/api/orders/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId || item.id,
            variantId: item.variant?.sku,
            quantity: item.quantity,
          })),
          shippingAddress,
          shippingOption: selectedShippingOption,
          email: shippingAddress.email || userEmail,
          orderNotes: orderNotes || undefined,
          totals: calculatedTotals ? {
            subtotal: calculatedTotals.subtotal,
            shippingCost: calculatedTotals.shipping.cost,
            tax: calculatedTotals.tax.taxAmount,
            discount: calculatedTotals.discount,
            total: calculatedTotals.total
          } : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize order')
      }

      // Store orderId for later use
      setOrderId(data.orderId)
      sessionStorage.setItem('provisional_order_id', data.orderId)

      setCompletedSteps((prev) => {
        const newSteps = new Set([...prev, 'shipping' as CheckoutStep])
        return Array.from(newSteps)
      })
      setCurrentStep('payment')
    } catch (error) {
      console.error('Error initializing order:', error)
      trackCheckoutError(error instanceof Error ? error.message : 'Unknown error')
      alert('Échec d\'initialisation de la commande. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSubmit = async (data: {
    paymentGateway: 'PAYSTACK' | 'FLUTTERWAVE'
    billingAddress?: Address
    paymentMethodId: string // Paystack reference or Flutterwave tx_ref
  }) => {
    trackPaymentMethod('card' as unknown as PaymentMethod)

    setIsLoading(true)

    try {
      const provisionalOrderId = orderId || sessionStorage.getItem('provisional_order_id')

      if (!provisionalOrderId) {
        throw new Error('No provisional order found')
      }

      // Complete the provisional order with payment info
      const response = await fetch(`/api/orders/${provisionalOrderId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentReference: data.paymentMethodId,
          paymentGateway: data.paymentGateway,
          billingAddress: data.billingAddress || shippingAddress,
          orderNotes: orderNotes || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to complete order')
      }

      // Clear cart and redirect to confirmation
      clearCart()
      router.push(`/checkout/confirmation/${provisionalOrderId}`)
    } catch (error) {
      console.error('Error completing order:', error)
      trackCheckoutError(error instanceof Error ? error.message : 'Unknown error')
      alert('Échec de finalisation de la commande. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToShipping = () => {
    setCurrentStep('shipping')
  }

  // Handle mobile CTA click based on current step
  const handleMobileCtaClick = async () => {
    if (currentStep === 'shipping') {
      await handleShippingOptionContinue()
    } else if (currentStep === 'payment') {
      // Payment submission is handled by PaymentForm component
      // This is just to prevent re-initialization
      return
    }
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-platinum-50">
      {/* Checkout Header */}
      <CheckoutHeader onBack={() => router.push('/cart')} />

      {/* Main Content */}
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Progress Stepper */}
        <div className="mb-8">
          <ProgressStepper
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepChange}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Main Content */}
          <div>
            {/* Shipping Step */}
            {currentStep === 'shipping' && (
              <div className="space-y-6">
                {!shippingAddress && (
                  <ShippingForm
                    defaultValues={{
                      email: userEmail,
                    }}
                    onSubmit={handleShippingSubmit}
                    isLoading={isLoading}
                    userEmail={userEmail}
                    isAuthenticated={isAuthenticated}
                  />
                )}

                {shippingAddress && (
                  <>
                    {/* Show completed address */}
                    <Card className="shadow-elevation-2">
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-anthracite-700">
                              Adresse de livraison
                            </h3>
                            <button
                              onClick={() => setShippingAddress(null)}
                              className="text-sm text-orange-500 hover:underline"
                            >
                              Modifier
                            </button>
                          </div>
                          <div className="text-sm text-nuanced-600">
                            <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
                            <p>{shippingAddress.line1}</p>
                            {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
                            <p>{shippingAddress.city}, {shippingAddress.postalCode}</p>
                            <p>{shippingAddress.country}</p>
                            <p>{shippingAddress.phone}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Shipping Options */}
                    <ShippingOptions
                      options={availableShippingOptions}
                      selectedOption={selectedShippingOption}
                      onSelect={handleShippingOptionSelect}
                      onContinue={handleShippingOptionContinue}
                      isLoading={isLoading || isLoadingShippingOptions}
                    />
                  </>
                )}
              </div>
            )}

            {/* Payment Step */}
            {currentStep === 'payment' && (
              <div className="space-y-6">
                {/* Express Checkout */}
                <ExpressCheckout
                  total={total / 100} // Convert to euros
                  items={cartItemsForSidebar}
                  onSuccess={(data) => {
                    console.log('Express checkout success:', data)
                    // Handle express checkout success
                  }}
                />

                {/* Payment Form - Paystack/Flutterwave */}
                <PaymentForm
                  onSubmit={handlePaymentSubmit}
                  onBack={handleBackToShipping}
                  isLoading={isLoading}
                  shippingAddress={shippingAddress || undefined}
                  total={total}
                />
              </div>
            )}

          </div>

          {/* Order Summary Sidebar (Desktop) */}
          <div className="hidden lg:block">
            <OrderSummarySidebar
              items={cartItemsForSidebar}
              subtotal={displaySubtotal / 100} // Convert to euros
              shippingCost={shippingCost / 100}
              discount={discount / 100} // Convert to euros
              tax={tax / 100}
              total={total / 100}
              appliedCoupon={appliedCoupon || undefined}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              isCalculating={isCalculating}
              calculationError={calculationError || undefined}
            />
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bar */}
      <MobileStickyBar
        total={total / 100} // Convert to euros
        itemCount={items.length}
        onContinue={handleMobileCtaClick}
        ctaLabel={currentStep === 'payment' ? 'Payer' : 'Continuer'}
        disabled={isLoading || (currentStep === 'shipping' && !selectedShippingOption)}
      >
        {/* Order summary content shown in mobile drawer */}
        <OrderSummarySidebar
          items={cartItemsForSidebar}
          subtotal={displaySubtotal / 100}
          shippingCost={shippingCost / 100}
          discount={discount / 100}
          tax={tax / 100}
          total={total / 100}
          appliedCoupon={appliedCoupon || undefined}
          onApplyCoupon={handleApplyCoupon}
          onRemoveCoupon={handleRemoveCoupon}
          isCalculating={isCalculating}
          calculationError={calculationError || undefined}
        />
      </MobileStickyBar>
    </div>
  )
}
