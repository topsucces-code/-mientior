'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cart.store'
import { ProgressStepper, type CheckoutStep } from '@/components/checkout/progress-stepper'
import { ShippingForm } from '@/components/checkout/shipping-form'
import { ShippingOptions } from '@/components/checkout/shipping-options'
import { PaymentForm } from '@/components/checkout/payment-form'
import { OrderSummary } from '@/components/checkout/order-summary'
import { Card, CardContent } from '@/components/ui/card'
import type { Address, ShippingOption, PaymentMethod, OrderItem } from '@/types'

interface CheckoutPageClientProps {
  userEmail: string
}

// Mock shipping options
const mockShippingOptions: ShippingOption[] = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    price: 0, // Free
    estimatedDays: 5,
    carrier: 'USPS',
    description: 'Free standard shipping on all orders',
  },
  {
    id: 'express',
    name: 'Express Shipping',
    price: 1500, // $15
    estimatedDays: 2,
    carrier: 'FedEx',
    description: 'Fast delivery in 2 business days',
  },
  {
    id: 'overnight',
    name: 'Overnight Shipping',
    price: 3000, // $30
    estimatedDays: 1,
    carrier: 'FedEx',
    description: 'Next day delivery',
    cutoffTime: '3:00 PM',
  },
]

export function CheckoutPageClient({ userEmail }: CheckoutPageClientProps) {
  const router = useRouter()
  const { items, clearCart, getTotalPrice } = useCartStore()

  const [currentStep, setCurrentStep] = React.useState<CheckoutStep>('shipping')
  const [completedSteps, setCompletedSteps] = React.useState<CheckoutStep[]>([])

  // Form data
  const [shippingAddress, setShippingAddress] = React.useState<Address | null>(null)
  const [selectedShippingOption, setSelectedShippingOption] = React.useState<string>('')
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('card')

  const [isLoading, setIsLoading] = React.useState(false)

  const subtotal = getTotalPrice()

  // Calculate costs
  const shippingOption = mockShippingOptions.find((opt) => opt.id === selectedShippingOption)
  const shippingCost = shippingOption?.price || 0
  const taxRate = 0.1
  const tax = Math.round(subtotal * taxRate)
  const total = subtotal + shippingCost + tax

  // Convert cart items to order items
  const orderItems: OrderItem[] = items.map((item) => ({
    productId: item.id,
    productName: item.name,
    productImage: item.image || '',
    variant: item.variant,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.price * item.quantity,
  }))

  // Redirect to cart if empty
  React.useEffect(() => {
    if (items.length === 0) {
      router.push('/cart')
    }
  }, [items, router])

  const handleStepChange = (step: CheckoutStep) => {
    // Only allow going back to completed steps
    if (completedSteps.includes(step)) {
      setCurrentStep(step)
    }
  }

  const handleShippingSubmit = (address: Address) => {
    setShippingAddress(address)
    setCompletedSteps((prev) => [...new Set([...prev, 'shipping'])])
    // Move to shipping options selection (we'll show it right after)
    setCurrentStep('shipping')
  }

  const handleShippingOptionSelect = (optionId: string) => {
    setSelectedShippingOption(optionId)
  }

  const handleShippingOptionContinue = () => {
    setCompletedSteps((prev) => [...new Set([...prev, 'shipping'])])
    setCurrentStep('payment')
  }

  const handlePaymentSubmit = (data: { paymentMethod: PaymentMethod }) => {
    setPaymentMethod(data.paymentMethod)
    setCompletedSteps((prev) => [...new Set([...prev, 'payment'])])
    setCurrentStep('review')
  }

  const handlePlaceOrder = async () => {
    setIsLoading(true)

    try {
      // Here you would call your order creation API
      // For now, we'll simulate it
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Clear the cart
      clearCart()

      // Redirect to order confirmation
      router.push('/order/confirmation')
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToShipping = () => {
    setCurrentStep('shipping')
  }

  const handleBackToPayment = () => {
    setCurrentStep('payment')
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Progress Stepper */}
      <ProgressStepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepChange}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
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
                            Shipping Address
                          </h3>
                          <button
                            onClick={() => setShippingAddress(null)}
                            className="text-sm text-orange-500 hover:underline"
                          >
                            Edit
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
            <PaymentForm
              onSubmit={handlePaymentSubmit}
              onBack={handleBackToShipping}
              isLoading={isLoading}
            />
          )}

          {/* Review Step */}
          {currentStep === 'review' && shippingAddress && shippingOption && (
            <OrderSummary
              items={orderItems}
              shippingAddress={shippingAddress}
              shippingOption={shippingOption}
              paymentMethod={paymentMethod}
              subtotal={subtotal}
              shippingCost={shippingCost}
              tax={tax}
              total={total}
              onPlaceOrder={handlePlaceOrder}
              onBack={handleBackToPayment}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <Card className="shadow-elevation-2">
            <CardContent className="space-y-4 pt-6">
              <h3 className="text-lg font-semibold text-anthracite-700">
                Order Summary
              </h3>

              {/* Items Preview */}
              <div className="space-y-2">
                {items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <div className="h-8 w-8 flex-shrink-0 rounded bg-platinum-100" />
                    <span className="flex-1 text-nuanced-600 line-clamp-1">
                      {item.name}
                    </span>
                    <span className="font-medium text-anthracite-700">
                      ${(item.price * item.quantity / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
                {items.length > 3 && (
                  <p className="text-xs text-nuanced-500">
                    +{items.length - 3} more {items.length - 3 === 1 ? 'item' : 'items'}
                  </p>
                )}
              </div>

              <div className="h-px bg-platinum-300" />

              {/* Price Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-nuanced-500">Subtotal</span>
                  <span className="font-medium text-anthracite-700">
                    ${(subtotal / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-nuanced-500">Shipping</span>
                  <span className="font-medium text-anthracite-700">
                    {shippingCost === 0 ? (
                      <span className="text-success">Free</span>
                    ) : (
                      `$${(shippingCost / 100).toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-nuanced-500">Tax</span>
                  <span className="font-medium text-anthracite-700">
                    ${(tax / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="h-px bg-platinum-300" />

              {/* Total */}
              <div className="flex justify-between text-base">
                <span className="font-semibold text-anthracite-700">Total</span>
                <span className="text-xl font-bold text-orange-500">
                  ${(total / 100).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
