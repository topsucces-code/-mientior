'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CreditCard, Lock, Apple, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import type { PaymentMethod } from '@/types'

// Payment form validation schema
const paymentSchema = z.object({
  paymentMethod: z.enum(['card', 'paypal', 'apple-pay', 'google-pay', 'installments'] as const),
  cardNumber: z.string().optional(),
  cardName: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
}).refine((data) => {
  // If card payment is selected, all card fields are required
  if (data.paymentMethod === 'card') {
    return (
      data.cardNumber &&
      data.cardName &&
      data.expiryDate &&
      data.cvv &&
      data.cardNumber.replace(/\s/g, '').length >= 13 &&
      /^\d{2}\/\d{2}$/.test(data.expiryDate) &&
      data.cvv.length >= 3
    )
  }
  return true
}, {
  message: 'Please fill in all card details',
  path: ['cardNumber'],
})

type PaymentFormValues = z.infer<typeof paymentSchema>

interface PaymentFormProps {
  onSubmit: (data: { paymentMethod: PaymentMethod }) => void
  onBack?: () => void
  isLoading?: boolean
  className?: string
}

const paymentMethods = [
  {
    id: 'card' as const,
    name: 'Credit / Debit Card',
    icon: CreditCard,
    description: 'Pay with Visa, Mastercard, Amex',
  },
  {
    id: 'apple-pay' as const,
    name: 'Apple Pay',
    icon: Apple,
    description: 'Fast and secure checkout',
  },
  {
    id: 'google-pay' as const,
    name: 'Google Pay',
    icon: Smartphone,
    description: 'Pay with your Google account',
  },
]

export function PaymentForm({
  onSubmit,
  onBack,
  isLoading = false,
  className,
}: PaymentFormProps) {
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: 'card',
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: '',
    },
  })

  const selectedMethod = form.watch('paymentMethod')

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(' ')
    } else {
      return value
    }
  }

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`
    }
    return v
  }

  const handleSubmit = (data: PaymentFormValues) => {
    // Note: This is a placeholder. In production, use Stripe Elements or similar
    onSubmit({ paymentMethod: data.paymentMethod })
  }

  return (
    <Card className={cn('shadow-elevation-2', className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-anthracite-700">
          Payment Method
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-nuanced-500">
          <Lock className="h-4 w-4" />
          <span>Your payment information is secure and encrypted</span>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Payment Method Selection */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Payment Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="space-y-3"
                    >
                      {paymentMethods.map((method) => {
                        const Icon = method.icon
                        const isSelected = selectedMethod === method.id

                        return (
                          <div key={method.id}>
                            <Label
                              htmlFor={method.id}
                              className={cn(
                                'flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-all',
                                isSelected
                                  ? 'border-orange-500 bg-orange-50/50 shadow-elevation-1'
                                  : 'border-platinum-300 hover:border-platinum-400 hover:bg-platinum-50'
                              )}
                            >
                              <RadioGroupItem value={method.id} id={method.id} />
                              <div
                                className={cn(
                                  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                                  isSelected
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-platinum-200 text-anthracite-600'
                                )}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-anthracite-700">
                                  {method.name}
                                </p>
                                <p className="text-sm text-nuanced-500">
                                  {method.description}
                                </p>
                              </div>
                            </Label>
                          </div>
                        )
                      })}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Card Details (only shown when card is selected) */}
            {selectedMethod === 'card' && (
              <div className="space-y-4 rounded-lg border border-platinum-300 bg-platinum-50 p-4">
                <p className="text-sm font-medium text-anthracite-700">
                  Card Information
                </p>

                <FormField
                  control={form.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          {...field}
                          onChange={(e) => {
                            const formatted = formatCardNumber(e.target.value)
                            field.onChange(formatted)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cardName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cardholder Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="MM/YY"
                            maxLength={5}
                            {...field}
                            onChange={(e) => {
                              const formatted = formatExpiryDate(e.target.value)
                              field.onChange(formatted)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cvv"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CVV</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="123"
                            maxLength={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <p className="text-xs text-nuanced-500">
                  Note: This is a placeholder form. In production, Stripe Elements will be integrated for secure payment processing.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-between">
              {onBack && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isLoading}
                  className="sm:w-auto"
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                variant="gradient"
                disabled={isLoading}
                className="sm:ml-auto sm:w-auto"
              >
                {isLoading ? 'Processing...' : 'Continue to Review'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
