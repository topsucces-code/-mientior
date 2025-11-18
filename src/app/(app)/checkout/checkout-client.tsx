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
import type { Address, ShippingOption, PaymentMethod, CartItem } from '@/types'

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

// Mock shipping options
const mockShippingOptions: ShippingOption[] = [
  {
    id: 'standard',
    name: 'Livraison Standard',
    price: 0, // Free
    estimatedDays: 5,
    carrier: 'Colissimo',
    description: 'Livraison gratuite sous 5 jours ouvrés',
  },
  {
    id: 'express',
    name: 'Livraison Express',
    price: 990, // 9.90€
    estimatedDays: 2,
    carrier: 'Chronopost',
    description: 'Livraison rapide en 2 jours ouvrés',
  },
  {
    id: 'relay',
    name: 'Point Relais',
    price: 490, // 4.90€
    estimatedDays: 3,
    carrier: 'Mondial Relay',
    description: 'Retrait en point relais sous 3 jours',
  },
]

export function CheckoutPageClient({ userEmail, isAuthenticated = false }: CheckoutPageClientProps) {
  const router = useRouter()
  const { items, clearCart, getTotalPrice } = useCartStore()

  const [currentStep, setCurrentStep] = React.useState<CheckoutStep>('shipping')
  const [completedSteps, setCompletedSteps] = React.useState<CheckoutStep[]>([])

  // Form data
  const [shippingAddress, setShippingAddress] = React.useState<Address | null>(null)
  const [selectedShippingOption, setSelectedShippingOption] = React.useState<string>('')
  const [orderId, setOrderId] = React.useState<string | null>(null)

  // Promo code state
  const [appliedCoupon, setAppliedCoupon] = React.useState<string | null>(null)
  const [discount, setDiscount] = React.useState(0) // in cents
  // Store promo code ID for order creation
  const promoCodeIdRef = React.useRef<string | null>(null)

  const [isLoading, setIsLoading] = React.useState(false)

  const subtotal = getTotalPrice()

  // Calculate costs (in cents)
  const shippingCost = mockShippingOptions.find((opt) => opt.id === selectedShippingOption)?.price || 0
  const taxRate = 0.2 // 20% TVA in France
  const tax = Math.round(subtotal * taxRate)
  const total = subtotal + shippingCost + tax - discount // Apply discount

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
          subtotal,
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
                      options={mockShippingOptions}
                      selectedOption={selectedShippingOption}
                      onSelect={handleShippingOptionSelect}
                      onContinue={handleShippingOptionContinue}
                      isLoading={isLoading}
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
              subtotal={subtotal / 100} // Convert to euros
              shippingCost={shippingCost / 100}
              discount={discount / 100} // Convert to euros
              tax={tax / 100}
              total={total / 100}
              appliedCoupon={appliedCoupon || undefined}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
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
          subtotal={subtotal / 100}
          shippingCost={shippingCost / 100}
          discount={discount / 100}
          tax={tax / 100}
          total={total / 100}
          appliedCoupon={appliedCoupon || undefined}
          onApplyCoupon={handleApplyCoupon}
          onRemoveCoupon={handleRemoveCoupon}
        />
      </MobileStickyBar>
    </div>
  )
}
