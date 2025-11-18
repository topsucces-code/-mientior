'use client'

import * as React from 'react'
import { usePaystackPayment } from 'react-paystack'
import { Loader2, CreditCard, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Address } from '@/types'

interface PaystackPaymentFormProps {
  email: string
  amount: number // In kobo (100 kobo = 1 NGN)
  reference: string
  onSuccess: (reference: string) => void
  onClose: () => void
  metadata?: Record<string, unknown>
  shippingAddress?: Address
}

export function PaystackPaymentForm({
  email,
  amount,
  reference,
  onSuccess,
  onClose,
  metadata = {},
  shippingAddress,
}: PaystackPaymentFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const config = {
    reference,
    email,
    amount,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    currency: 'NGN' as const,
    metadata: {
      ...metadata,
      custom_fields: [
        {
          display_name: 'Customer Name',
          variable_name: 'customer_name',
          value: shippingAddress
            ? `${shippingAddress.firstName} ${shippingAddress.lastName}`
            : '',
        },
        {
          display_name: 'Phone',
          variable_name: 'phone',
          value: shippingAddress?.phone || '',
        },
      ],
    },
  }

  const initializePayment = usePaystackPayment(config)

  const handlePayment = () => {
    setIsLoading(true)
    initializePayment(
      (response: { reference: string }) => {
        // Payment successful
        console.log('Paystack payment success:', response)
        onSuccess(response.reference)
        setIsLoading(false)
      },
      () => {
        // Payment closed/cancelled
        console.log('Paystack payment closed')
        onClose()
        setIsLoading(false)
      }
    )
  }

  return (
    <Card className="shadow-elevation-2">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
            <CreditCard className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-anthracite-700">Paiement Paystack</h3>
            <p className="text-sm text-nuanced-600">
              Carte bancaire, Mobile Money, Virement
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-platinum-300 bg-platinum-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-nuanced-600">Montant à payer</span>
            <span className="text-lg font-bold text-anthracite-700">
              {(amount / 100).toFixed(2)} NGN
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-md border border-success/20 bg-success/5 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-success" />
          <p className="text-xs text-success-foreground">
            Paiement sécurisé par Paystack. Vos données sont cryptées.
          </p>
        </div>

        <Button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full"
          variant="gradient"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Chargement...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Payer avec Paystack
            </>
          )}
        </Button>

        <p className="text-center text-xs text-nuanced-500">
          En cliquant, vous serez redirigé vers la page de paiement sécurisée Paystack
        </p>
      </CardContent>
    </Card>
  )
}
