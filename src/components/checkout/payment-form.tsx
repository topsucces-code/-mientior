'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Lock, ShieldCheck, Award, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  validateFrenchPostalCode,
  validateFrenchPhone,
} from '@/lib/checkout-utils'
import { PaystackPaymentForm } from '@/components/checkout/paystack-payment-form'
import { FlutterwavePaymentForm } from '@/components/checkout/flutterwave-payment-form'
import { getAvailableGateways, type PaymentGateway } from '@/lib/payment-gateways'
import type { Address } from '@/types'

// Payment form validation schema with billing address
const paymentSchema = z.object({
  paymentGateway: z.enum(['PAYSTACK', 'FLUTTERWAVE'] as const),

  // Billing address
  billingAddressSameAsShipping: z.boolean(),

  // Billing address fields (only required if different from shipping)
  billingFirstName: z.string().optional(),
  billingLastName: z.string().optional(),
  billingLine1: z.string().optional(),
  billingLine2: z.string().optional(),
  billingCity: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),
  billingPhone: z.string().optional(),

  // Terms and conditions
  acceptTerms: z.boolean(),
  acceptNewsletter: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.billingAddressSameAsShipping) {
    return
  }

  const requiredFields: Array<{
    field:
      | 'billingFirstName'
      | 'billingLastName'
      | 'billingLine1'
      | 'billingCity'
      | 'billingPostalCode'
      | 'billingCountry'
      | 'billingPhone'
    label: string
    minLength?: number
  }> = [
    { field: 'billingFirstName', label: 'Prénom', minLength: 2 },
    { field: 'billingLastName', label: 'Nom', minLength: 2 },
    { field: 'billingLine1', label: 'Adresse', minLength: 2 },
    { field: 'billingCity', label: 'Ville', minLength: 2 },
    { field: 'billingPostalCode', label: 'Code postal' },
    { field: 'billingCountry', label: 'Pays' },
    { field: 'billingPhone', label: 'Téléphone' },
  ]

  requiredFields.forEach(({ field, label, minLength }) => {
    const value = (data[field] as string | undefined)?.trim() ?? ''
    if (!value) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: `${label} requis`,
      })
      return
    }

    if (minLength && value.length < minLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: `${label} doit contenir au moins ${minLength} caractères`,
      })
    }
  })

  const postalCode = data.billingPostalCode?.trim()
  if (postalCode && !validateFrenchPostalCode(postalCode)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['billingPostalCode'],
      message: 'Code postal invalide (5 chiffres FR)',
    })
  }

  const phone = data.billingPhone?.trim()
  if (phone && !validateFrenchPhone(phone)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['billingPhone'],
      message: 'Numéro invalide',
    })
  }
})

type PaymentFormValues = z.infer<typeof paymentSchema>

interface PaymentFormProps {
  onSubmit: (data: {
    paymentGateway: PaymentGateway
    billingAddress?: Address
    paymentMethodId: string // Paystack reference or Flutterwave tx_ref
  }) => void
  onBack?: () => void
  isLoading?: boolean
  className?: string
  shippingAddress?: Address
  total?: number
}

const countries = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Suisse' },
  { value: 'LU', label: 'Luxembourg' },
  { value: 'DE', label: 'Allemagne' },
  { value: 'IT', label: 'Italie' },
  { value: 'ES', label: 'Espagne' },
  { value: 'GB', label: 'Royaume-Uni' },
  { value: 'US', label: 'États-Unis' },
]

export function PaymentForm({
  onSubmit,
  onBack,
  isLoading = false,
  className,
  shippingAddress,
  total = 0,
}: PaymentFormProps) {
  const [paymentError, setPaymentError] = React.useState<string | null>(null)
  const [initData, setInitData] = React.useState<{
    reference?: string
    tx_ref?: string
    authorization_url?: string
    link?: string
  } | null>(null)
  const [isInitializing, setIsInitializing] = React.useState(false)

  // Get available gateways
  const availableGateways = React.useMemo(() => getAvailableGateways(), [])

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    mode: 'onChange',
    defaultValues: {
      paymentGateway: (availableGateways[0]?.id || 'PAYSTACK') as 'PAYSTACK' | 'FLUTTERWAVE',
      billingAddressSameAsShipping: true,
      billingFirstName: '',
      billingLastName: '',
      billingLine1: '',
      billingLine2: '',
      billingCity: '',
      billingPostalCode: '',
      billingCountry: 'FR',
      billingPhone: '',
      acceptTerms: false,
      acceptNewsletter: false,
    },
  })

  const selectedGateway = form.watch('paymentGateway')
  const sameAsShipping = form.watch('billingAddressSameAsShipping')

  // Initialize payment when gateway changes
  React.useEffect(() => {
    const initializePayment = async () => {
      if (!shippingAddress || !selectedGateway) return

      setIsInitializing(true)
      setPaymentError(null)

      try {
        // Get orderId from sessionStorage (set by provisional order creation)
        const orderId = sessionStorage.getItem('provisional_order_id') || ''

        const response = await fetch('/api/checkout/initialize-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: [], // Items already validated in provisional order
            shippingOption: 'standard', // Already set in provisional order
            email: shippingAddress.email || '',
            orderId,
            gateway: selectedGateway,
            metadata: {
              phone: shippingAddress.phone,
            },
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to initialize payment')
        }

        // Store initialization data
        if (data.gateway === 'PAYSTACK') {
          setInitData({
            reference: data.reference,
            authorization_url: data.authorization_url,
          })
        } else if (data.gateway === 'FLUTTERWAVE') {
          setInitData({
            tx_ref: data.tx_ref,
            link: data.link,
          })
        }
      } catch (error) {
        console.error('Payment initialization error:', error)
        setPaymentError('Échec d\'initialisation du paiement. Veuillez réessayer.')
      } finally {
        setIsInitializing(false)
      }
    }

    initializePayment()
  }, [selectedGateway, shippingAddress])

  const buildBillingAddress = (data: PaymentFormValues): Address | undefined => {
    if (data.billingAddressSameAsShipping) {
      return shippingAddress || undefined
    }

    if (
      !data.billingFirstName?.trim() ||
      !data.billingLastName?.trim() ||
      !data.billingLine1?.trim() ||
      !data.billingCity?.trim() ||
      !data.billingPostalCode?.trim() ||
      !data.billingCountry ||
      !data.billingPhone?.trim()
    ) {
      return undefined
    }

    return {
      firstName: data.billingFirstName.trim(),
      lastName: data.billingLastName.trim(),
      line1: data.billingLine1.trim(),
      line2: data.billingLine2?.trim() || undefined,
      city: data.billingCity.trim(),
      postalCode: data.billingPostalCode.trim(),
      country: data.billingCountry,
      phone: data.billingPhone.trim(),
      email: shippingAddress?.email,
    }
  }

  const handlePaymentSuccess = (reference: string) => {
    const data = form.getValues()
    const billingAddress = buildBillingAddress(data)

    onSubmit({
      paymentGateway: data.paymentGateway,
      billingAddress,
      paymentMethodId: reference,
    })
  }

  const handlePaymentClose = () => {
    setPaymentError('Paiement annulé')
  }

  const handleSubmit = async () => {
    setPaymentError(null)
    
    // The payment gateway components will handle the actual payment
    // and call handlePaymentSuccess when done
  }

  return (
    <Card className={cn('shadow-elevation-2', className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-anthracite-700">
          Moyen de paiement
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-nuanced-500">
          <Lock className="h-4 w-4" />
          <span>Vos informations de paiement sont sécurisées et cryptées</span>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Payment Gateway Selection */}
            <FormField
              control={form.control}
              name="paymentGateway"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Passerelle de paiement</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="space-y-3"
                      role="radiogroup"
                      aria-label="Passerelles de paiement"
                    >
                      {availableGateways.map((gateway) => {
                        const isSelected = selectedGateway === gateway.id

                        return (
                          <div key={gateway.id}>
                            <Label
                              htmlFor={gateway.id}
                              className={cn(
                                'flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-all',
                                isSelected
                                  ? 'border-orange-500 bg-orange-50/50 shadow-elevation-1'
                                  : 'border-platinum-300 hover:border-platinum-400 hover:bg-platinum-50'
                              )}
                            >
                              <RadioGroupItem value={gateway.id} id={gateway.id} />
                              <div
                                className={cn(
                                  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                                  isSelected
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-platinum-200 text-anthracite-600'
                                )}
                              >
                                <Image 
                                  src={gateway.logo} 
                                  alt={gateway.name}
                                  width={24}
                                  height={24}
                                  className="h-6 w-6 object-contain"
                                />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-anthracite-700">
                                  {gateway.name}
                                </p>
                                <p className="text-sm text-nuanced-500">
                                  {gateway.description}
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

            {/* Payment Gateway Components */}
            {selectedGateway === 'PAYSTACK' && shippingAddress && initData?.reference && (
              <PaystackPaymentForm
                email={shippingAddress.email || ''}
                amount={total}
                reference={initData.reference}
                onSuccess={handlePaymentSuccess}
                onClose={handlePaymentClose}
                metadata={{}}
                shippingAddress={shippingAddress}
              />
            )}

            {selectedGateway === 'FLUTTERWAVE' && shippingAddress && initData?.tx_ref && (
              <FlutterwavePaymentForm
                email={shippingAddress.email || ''}
                amount={total / 100} // Flutterwave uses currency unit
                txRef={initData.tx_ref}
                onSuccess={handlePaymentSuccess}
                onClose={handlePaymentClose}
                metadata={{}}
                shippingAddress={shippingAddress}
              />
            )}

            {/* Show loading state while initializing payment */}
            {isInitializing && (
              <div className="rounded-md border border-platinum-300 bg-platinum-50 p-4">
                <p className="text-center text-sm text-nuanced-600">
                  Initialisation du paiement...
                </p>
              </div>
            )}

            {/* Payment-specific error display */}
            {paymentError && (
              <div className="rounded-md border border-red-300 bg-red-50 p-3">
                <p className="flex items-start gap-2 text-sm text-red-600">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{paymentError}</span>
                </p>
              </div>
            )}

            {/* Billing Address Section */}
            <div className="space-y-4 rounded-lg border border-platinum-300 bg-white p-4">
              <h3 className="text-sm font-semibold text-anthracite-700">
                Adresse de facturation
              </h3>

              <FormField
                control={form.control}
                name="billingAddressSameAsShipping"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-nuanced-600">
                      Souhaitez-vous utiliser la même adresse que la livraison ?
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value ? 'same' : 'different'}
                        onValueChange={(value) => field.onChange(value === 'same')}
                        className="grid gap-3 sm:grid-cols-2"
                        role="radiogroup"
                        aria-label="Adresse de facturation"
                      >
                        <Label
                          htmlFor="billing-same"
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-colors',
                            field.value ? 'border-orange-500 bg-orange-50/60 text-anthracite-700' : 'border-platinum-300 bg-white'
                          )}
                        >
                          <RadioGroupItem id="billing-same" value="same" className="sr-only" />
                          Même que la livraison
                        </Label>
                        <Label
                          htmlFor="billing-different"
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-colors',
                            !field.value ? 'border-orange-500 bg-orange-50/60 text-anthracite-700' : 'border-platinum-300 bg-white'
                          )}
                        >
                          <RadioGroupItem id="billing-different" value="different" className="sr-only" />
                          Utiliser une autre adresse
                        </Label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Billing Address Form (only if different from shipping) */}
              {!sameAsShipping && (
                <div className="space-y-4 pt-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="billingFirstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Jean"
                              {...field}
                              className="h-12"
                              aria-invalid={!!form.formState.errors.billingFirstName}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="billingLastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Dupont"
                              {...field}
                              className="h-12"
                              aria-invalid={!!form.formState.errors.billingLastName}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="billingLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Rue de la Paix"
                            {...field}
                            className="h-12"
                            aria-invalid={!!form.formState.errors.billingLine1}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billingLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complément d'adresse (Optionnel)</FormLabel>
                        <FormControl>
                          <Input placeholder="Appartement, bâtiment..." {...field} className="h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="billingPostalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code postal *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="BP 1234"
                              {...field}
                              className="h-12"
                              aria-invalid={!!form.formState.errors.billingPostalCode}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="billingCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ville *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Abidjan"
                              {...field}
                              className="h-12"
                              aria-invalid={!!form.formState.errors.billingCity}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="billingCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pays *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country.value} value={country.value}>
                                  {country.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="billingPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone *</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+225 07 07 12 34 56"
                            {...field}
                            className="h-12"
                            aria-invalid={!!form.formState.errors.billingPhone}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Terms and Newsletter */}
            <div className="space-y-4 rounded-lg border border-platinum-300 bg-platinum-50/50 p-4">
              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-required
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium text-anthracite-700">
                        J'accepte les{' '}
                        <a href="/legal/cgv" target="_blank" className="text-orange-500 hover:underline">
                          conditions générales de vente
                        </a>{' '}
                        et la{' '}
                        <a href="/legal/privacy" target="_blank" className="text-orange-500 hover:underline">
                          politique de confidentialité
                        </a>{' '}
                        *
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acceptNewsletter"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal text-nuanced-600">
                        Je souhaite recevoir les offres et nouveautés par email
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Security Badges */}
            <div className="grid grid-cols-3 gap-4 rounded-lg border border-platinum-300 bg-white p-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <ShieldCheck className="h-6 w-6 text-success" />
                <p className="text-xs font-medium text-nuanced-700">Paiement sécurisé</p>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <Lock className="h-6 w-6 text-success" />
                <p className="text-xs font-medium text-nuanced-700">SSL 256-bit</p>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <Award className="h-6 w-6 text-success" />
                <p className="text-xs font-medium text-nuanced-700">PCI-DSS</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse gap-3 border-t border-platinum-300 pt-6 sm:flex-row sm:justify-between">
              {onBack && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isLoading}
                  className="sm:w-auto"
                >
                  Retour
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
