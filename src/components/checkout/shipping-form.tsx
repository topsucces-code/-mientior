'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import useSWR from 'swr'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
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
  Mail,
  Package,
  Truck,
  MapPin,
  Loader2
} from 'lucide-react'
import { validateFrenchPhone, validateFrenchPostalCode } from '@/lib/checkout-utils'
import { PostalCodeAutocomplete } from './postal-code-autocomplete'
import { useFieldValidation, validationRules } from '@/lib/checkout-validation'
import type { City } from '@/lib/checkout-validation'
import type { Address, SavedAddress as SavedAddressType } from '@/types'

// Fetcher for SWR with caching
const fetcher = (url: string) => fetch(url).then(res => res.json())

// SWR config for caching saved addresses
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60000, // 1 minute
}

// Address validation schema with French validation
const addressSchema = z.object({
  // Contact section
  email: z.string().email('Adresse email invalide'),
  emailOffers: z.boolean(),

  // Address fields
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').max(50),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(50),
  line1: z.string().min(1, 'L\'adresse est requise').max(100),
  line2: z.string().max(100).optional(),
  city: z.string().min(1, 'La ville est requise').max(50),
  postalCode: z.string().min(1, 'Le code postal est requis').refine(
    (val) => validateFrenchPostalCode(val),
    'Code postal invalide (format: 75001)'
  ),
  country: z.string().min(1, 'Le pays est requis'),
  phone: z.string().min(1, 'Le téléphone est requis').refine(
    (val) => validateFrenchPhone(val),
    'Numéro de téléphone invalide (format: 06 12 34 56 78)'
  ),

  // Save address option
  saveAddress: z.boolean(),
})

type AddressFormValues = z.infer<typeof addressSchema>

interface ShippingFormProps {
  defaultValues?: Partial<Address & { email?: string }>
  onSubmit: (data: Address) => void
  onBack?: () => void
  isLoading?: boolean
  className?: string
  userEmail?: string
  isAuthenticated?: boolean
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

export function ShippingForm({
  defaultValues,
  onSubmit,
  onBack,
  isLoading = false,
  className,
  userEmail,
  isAuthenticated = false,
}: ShippingFormProps) {
  const [useExistingAddress, setUseExistingAddress] = React.useState(false)
  const [selectedAddressId, setSelectedAddressId] = React.useState<string>('')
  const [isAutoCompleting, setIsAutoCompleting] = React.useState(false)

  // Initialize form BEFORE using it
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: defaultValues?.firstName || '',
      lastName: defaultValues?.lastName || '',
      line1: defaultValues?.line1 || '',
      line2: defaultValues?.line2 || '',
      city: defaultValues?.city || '',
      postalCode: defaultValues?.postalCode || '',
      country: defaultValues?.country || 'FR',
      phone: defaultValues?.phone || '',
      email: defaultValues?.email || userEmail || '',
      emailOffers: false,
      saveAddress: false,
    },
  })

  // Real-time validation with debouncing (800ms) - currently for display, can be extended
  const phoneValue = form.watch('phone')
  const phoneValidation = useFieldValidation({
    fieldName: 'phone',
    value: phoneValue || '',
    rules: {
      rules: [
        validationRules.required(),
        validationRules.phone(),
      ],
    },
  })

  // Show validation error if exists
  React.useEffect(() => {
    if (phoneValidation.error && phoneValue) {
      form.setError('phone', { message: phoneValidation.error })
    }
  }, [phoneValidation.error, phoneValue, form])

  // Fetch saved addresses if user is authenticated (with caching)
  const { data: addressesData, error: addressesError } = useSWR<{ data: SavedAddressType[], success: boolean }>(
    isAuthenticated ? '/api/user/addresses' : null,
    fetcher,
    swrConfig
  )

  const savedAddresses = addressesData?.data || []
  const hasSavedAddresses = savedAddresses.length > 0

  // Handle address selection from saved addresses
  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId)
    const address = savedAddresses.find(a => a.id === addressId)

    if (address) {
      form.setValue('firstName', address.firstName)
      form.setValue('lastName', address.lastName)
      form.setValue('line1', address.line1)
      form.setValue('line2', address.line2 || '')
      form.setValue('city', address.city)
      form.setValue('postalCode', address.postalCode)
      form.setValue('country', address.country)
      form.setValue('phone', address.phone)
    }
  }

  // Auto-complete city when postal code is entered
  const handlePostalCodeChange = async (value: string) => {
    form.setValue('postalCode', value)

    if (value.length === 5 && validateFrenchPostalCode(value)) {
      setIsAutoCompleting(true)
      try {
        const response = await fetch(`/api/checkout/validate-address?postalCode=${value}`)
        const data = await response.json()

        if (data.city) {
          // If single city returned
          if (typeof data.city === 'string') {
            form.setValue('city', data.city)
          } else if (Array.isArray(data.cities) && data.cities.length === 1) {
            form.setValue('city', data.cities[0])
          }
          // If multiple cities, user needs to select manually (could be enhanced with a Select dropdown)
        }
      } catch (error) {
        console.error('Failed to autocomplete city:', error)
      } finally {
        setIsAutoCompleting(false)
      }
    }
  }

  const handleFormSubmit = async (data: AddressFormValues) => {
    // Save address if checkbox is checked and user is authenticated
    if (data.saveAddress && isAuthenticated) {
      try {
        await fetch('/api/user/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            line1: data.line1,
            line2: data.line2,
            city: data.city,
            postalCode: data.postalCode,
            country: data.country,
            phone: data.phone,
            isDefault: false,
          }),
        })
      } catch (error) {
        console.error('Failed to save address:', error)
        // Continue with checkout even if save fails
      }
    }

    // Submit the form
    onSubmit({
      firstName: data.firstName,
      lastName: data.lastName,
      line1: data.line1,
      line2: data.line2,
      city: data.city,
      postalCode: data.postalCode,
      country: data.country,
      phone: data.phone,
      email: data.email,
    })
  }

  return (
    <Card className={cn('shadow-elevation-2', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-anthracite-700">
          <Package className="h-5 w-5 text-orange-500" />
          Informations de livraison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Contact Section */}
            <div className="space-y-4 rounded-lg border border-platinum-300 bg-platinum-50/50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-anthracite-700">
                <Mail className="h-4 w-4 text-orange-500" />
                Contact
              </h3>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jean@exemple.fr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailOffers"
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
                        M'envoyer des offres et promotions par email
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Saved Addresses Toggle (only if authenticated and has saved addresses) */}
            {isAuthenticated && hasSavedAddresses && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUseExistingAddress(!useExistingAddress)}
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  {useExistingAddress ? 'Nouvelle adresse' : 'Utiliser une adresse enregistrée'}
                </Button>
              </div>
            )}

            {/* Saved Addresses List */}
            {isAuthenticated && hasSavedAddresses && useExistingAddress && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-anthracite-700">
                  Sélectionnez une adresse
                </Label>
                <RadioGroup value={selectedAddressId} onValueChange={handleAddressSelect}>
                  {savedAddresses.map((address) => (
                    <div key={address.id}>
                      <Label
                        htmlFor={address.id}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-all',
                          selectedAddressId === address.id
                            ? 'border-orange-500 bg-orange-50/50 shadow-elevation-1'
                            : 'border-platinum-300 hover:border-platinum-400 hover:bg-platinum-50'
                        )}
                      >
                        <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                        <div className="flex-1">
                          <p className="font-semibold text-anthracite-700">
                            {address.firstName} {address.lastName}
                            {address.isDefault && (
                              <span className="ml-2 rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                                Par défaut
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-nuanced-600">
                            {address.line1}
                            {address.line2 && <>, {address.line2}</>}
                          </p>
                          <p className="text-sm text-nuanced-600">
                            {address.postalCode} {address.city}, {address.country}
                          </p>
                          <p className="text-sm text-nuanced-600">{address.phone}</p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Address Form (shown if not using existing address) */}
            {(!useExistingAddress || !hasSavedAddresses) && (
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-anthracite-700">
                  <Truck className="h-4 w-4 text-orange-500" />
                  Adresse de livraison
                </h3>

                {/* Name Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom *</FormLabel>
                        <FormControl>
                          <Input placeholder="Jean" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom *</FormLabel>
                        <FormControl>
                          <Input placeholder="Dupont" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Address Line 1 */}
                <FormField
                  control={form.control}
                  name="line1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse *</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Rue de la Paix" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Address Line 2 */}
                <FormField
                  control={form.control}
                  name="line2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complément d'adresse (Optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Appartement, bâtiment, étage..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Postal Code, City, Country */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code postal *</FormLabel>
                        <FormControl>
                          <PostalCodeAutocomplete
                            value={field.value}
                            onChange={field.onChange}
                            onCitySelect={(city: City) => {
                              // Auto-fill city when selected
                              form.setValue('city', city.name)
                            }}
                            placeholder="75001"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville *</FormLabel>
                        <FormControl>
                          <Input placeholder="Paris" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pays *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un pays" />
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

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="06 12 34 56 78" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Nécessaire pour la livraison
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Save Address Checkbox (only if authenticated) */}
                {isAuthenticated && (
                  <FormField
                    control={form.control}
                    name="saveAddress"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-platinum-300 bg-platinum-50/50 p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium text-anthracite-700">
                            Enregistrer cette adresse pour les prochaines commandes
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

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
              <Button
                type="submit"
                variant="gradient"
                disabled={isLoading}
                className="sm:ml-auto sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  'Continuer vers la livraison'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
