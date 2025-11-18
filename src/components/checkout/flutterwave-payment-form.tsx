'use client'

import * as React from 'react'
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3'
import { Loader2, CreditCard, ShieldCheck, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Address } from '@/types'

interface FlutterwavePaymentFormProps {
  email: string
  amount: number // In currency unit (e.g., 100.00 NGN)
  txRef: string
  onSuccess: (reference: string) => void
  onClose: () => void
  metadata?: Record<string, unknown>
  shippingAddress?: Address
}

export function FlutterwavePaymentForm({
  email,
  amount,
  txRef,
  onSuccess,
  onClose,
  metadata = {},
  shippingAddress,
}: FlutterwavePaymentFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const config = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY!,
    tx_ref: txRef,
    amount,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd,banktransfer',
    customer: {
      email,
      name: shippingAddress
        ? `${shippingAddress.firstName} ${shippingAddress.lastName}`
        : '',
      phone_number: shippingAddress?.phone || '',
    },
    customizations: {
      title: 'Mientior Marketplace',
      description: 'Paiement de votre commande',
      logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
    },
    meta: metadata,
  }

  const handleFlutterPayment = useFlutterwave(config)

  const handlePayment = () => {
    setIsLoading(true)
    handleFlutterPayment({
      callback: (response) => {
        console.log('Flutterwave payment response:', response)
        if (response.status === 'successful') {
          onSuccess(response.tx_ref)
        }
        closePaymentModal()
        setIsLoading(false)
      },
      onClose: () => {
        console.log('Flutterwave payment closed')
        onClose()
        setIsLoading(false)
      },
    })
  }

  return (
    <Card className="shadow-elevation-2">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
            <Smartphone className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-anthracite-700">Paiement Flutterwave</h3>
            <p className="text-sm text-nuanced-600">
              Carte, Mobile Money (MTN, Airtel), USSD
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-platinum-300 bg-platinum-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-nuanced-600">Montant à payer</span>
            <span className="text-lg font-bold text-anthracite-700">
              {amount.toFixed(2)} NGN
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-anthracite-700">Méthodes disponibles :</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 rounded-md border border-platinum-300 bg-white p-2">
              <CreditCard className="h-4 w-4 text-nuanced-600" />
              <span className="text-xs text-nuanced-700">Carte bancaire</span>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-platinum-300 bg-white p-2">
              <Smartphone className="h-4 w-4 text-nuanced-600" />
              <span className="text-xs text-nuanced-700">Mobile Money</span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-md border border-success/20 bg-success/5 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-success" />
          <p className="text-xs text-success-foreground">
            Paiement sécurisé par Flutterwave. Vos données sont cryptées.
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
              <Smartphone className="mr-2 h-4 w-4" />
              Payer avec Flutterwave
            </>
          )}
        </Button>

        <p className="text-center text-xs text-nuanced-500">
          En cliquant, vous serez redirigé vers la page de paiement sécurisée Flutterwave
        </p>
      </CardContent>
    </Card>
  )
}
