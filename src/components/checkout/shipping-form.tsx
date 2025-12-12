'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import useSWR from 'swr'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
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
import { useFieldValidation, validationRules } from '@/lib/checkout-validation'
import type { Address, SavedAddress as SavedAddressType } from '@/types'

// Fetcher for SWR with caching
const fetcher = (url: string) => fetch(url).then(res => res.json())

// SWR config for caching saved addresses
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60000, // 1 minute
}

// Address validation schema - international support
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
  // Flexible postal code validation (some African countries don't use postal codes)
  postalCode: z.string().max(20).optional().or(z.literal('')),
  country: z.string().min(1, 'Le pays est requis'),
  // Flexible phone validation for international numbers
  phone: z.string().min(8, 'Le téléphone doit contenir au moins 8 chiffres').max(20),

  // Save address option
  saveAddress: z.boolean(),

  // Order notes
  orderNotes: z.string().max(500, 'Les notes ne peuvent pas dépasser 500 caractères').optional(),
})

type AddressFormValues = z.infer<typeof addressSchema>

interface ShippingFormProps {
  defaultValues?: Partial<Address & { email?: string }>
  onSubmit: (data: Address) => void // Address now includes orderNotes
  onBack?: () => void
  isLoading?: boolean
  className?: string
  userEmail?: string
  isAuthenticated?: boolean
}

const countries = [
  // Europe
  { value: 'FR', label: 'France', phonePrefix: '+33', region: 'europe' },
  { value: 'BE', label: 'Belgique', phonePrefix: '+32', region: 'europe' },
  { value: 'CH', label: 'Suisse', phonePrefix: '+41', region: 'europe' },
  { value: 'LU', label: 'Luxembourg', phonePrefix: '+352', region: 'europe' },
  { value: 'DE', label: 'Allemagne', phonePrefix: '+49', region: 'europe' },
  { value: 'IT', label: 'Italie', phonePrefix: '+39', region: 'europe' },
  { value: 'ES', label: 'Espagne', phonePrefix: '+34', region: 'europe' },
  { value: 'GB', label: 'Royaume-Uni', phonePrefix: '+44', region: 'europe' },
  { value: 'US', label: 'États-Unis', phonePrefix: '+1', region: 'americas' },
  
  // Afrique de l'Ouest
  { value: 'CI', label: "Côte d'Ivoire", phonePrefix: '+225', region: 'africa' },
  { value: 'SN', label: 'Sénégal', phonePrefix: '+221', region: 'africa' },
  { value: 'ML', label: 'Mali', phonePrefix: '+223', region: 'africa' },
  { value: 'BF', label: 'Burkina Faso', phonePrefix: '+226', region: 'africa' },
  { value: 'BJ', label: 'Bénin', phonePrefix: '+229', region: 'africa' },
  { value: 'TG', label: 'Togo', phonePrefix: '+228', region: 'africa' },
  { value: 'NE', label: 'Niger', phonePrefix: '+227', region: 'africa' },
  { value: 'GN', label: 'Guinée', phonePrefix: '+224', region: 'africa' },
  { value: 'GH', label: 'Ghana', phonePrefix: '+233', region: 'africa' },
  { value: 'NG', label: 'Nigeria', phonePrefix: '+234', region: 'africa' },
  
  // Afrique Centrale
  { value: 'CM', label: 'Cameroun', phonePrefix: '+237', region: 'africa' },
  { value: 'GA', label: 'Gabon', phonePrefix: '+241', region: 'africa' },
  { value: 'CG', label: 'Congo', phonePrefix: '+242', region: 'africa' },
  { value: 'CD', label: 'RD Congo', phonePrefix: '+243', region: 'africa' },
  { value: 'TD', label: 'Tchad', phonePrefix: '+235', region: 'africa' },
  { value: 'CF', label: 'Centrafrique', phonePrefix: '+236', region: 'africa' },
  
  // Afrique du Nord
  { value: 'MA', label: 'Maroc', phonePrefix: '+212', region: 'africa' },
  { value: 'TN', label: 'Tunisie', phonePrefix: '+216', region: 'africa' },
  { value: 'DZ', label: 'Algérie', phonePrefix: '+213', region: 'africa' },
  
  // Afrique de l'Est
  { value: 'RW', label: 'Rwanda', phonePrefix: '+250', region: 'africa' },
  { value: 'BI', label: 'Burundi', phonePrefix: '+257', region: 'africa' },
  { value: 'MG', label: 'Madagascar', phonePrefix: '+261', region: 'africa' },
  { value: 'MU', label: 'Maurice', phonePrefix: '+230', region: 'africa' },
]

// Major cities by country (for African countries mainly)
const citiesByCountry: Record<string, string[]> = {
  // Côte d'Ivoire
  CI: [
    'Abidjan', 'Yamoussoukro', 'Bouaké', 'San-Pédro', 'Daloa', 
    'Korhogo', 'Man', 'Gagnoa', 'Divo', 'Grand-Bassam',
    'Abengourou', 'Agboville', 'Bondoukou', 'Séguéla', 'Odienné',
    'Ferkessédougou', 'Soubré', 'Issia', 'Sassandra', 'Duékoué'
  ],
  // Sénégal
  SN: [
    'Dakar', 'Thiès', 'Saint-Louis', 'Kaolack', 'Ziguinchor',
    'Rufisque', 'Mbour', 'Diourbel', 'Tambacounda', 'Matam'
  ],
  // Mali
  ML: [
    'Bamako', 'Sikasso', 'Koutiala', 'Mopti', 'Ségou',
    'Kayes', 'Gao', 'Tombouctou', 'Kidal', 'Niono'
  ],
  // Burkina Faso
  BF: [
    'Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya',
    'Kaya', 'Tenkodogo', 'Fada N\'Gourma', 'Dédougou', 'Ziniaré'
  ],
  // Cameroun
  CM: [
    'Douala', 'Yaoundé', 'Garoua', 'Bamenda', 'Maroua',
    'Bafoussam', 'Ngaoundéré', 'Bertoua', 'Kribi', 'Limbé'
  ],
  // Nigeria
  NG: [
    'Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt',
    'Benin City', 'Enugu', 'Kaduna', 'Onitsha', 'Jos'
  ],
  // Ghana
  GH: [
    'Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Ashaiman',
    'Cape Coast', 'Tema', 'Sunyani', 'Ho', 'Koforidua'
  ],
  // Maroc
  MA: [
    'Casablanca', 'Rabat', 'Fès', 'Marrakech', 'Tanger',
    'Agadir', 'Meknès', 'Oujda', 'Salé', 'Tétouan'
  ],
  // Tunisie
  TN: [
    'Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte',
    'Gabès', 'Ariana', 'Gafsa', 'Monastir', 'Ben Arous'
  ],
  // Gabon
  GA: [
    'Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda',
    'Mouila', 'Lambaréné', 'Tchibanga', 'Koulamoutou', 'Makokou'
  ],
  // Congo
  CG: [
    'Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Ouesso',
    'Madingou', 'Owando', 'Sibiti', 'Impfondo', 'Mossendjo'
  ],
  // RD Congo
  CD: [
    'Kinshasa', 'Lubumbashi', 'Mbuji-Mayi', 'Kananga', 'Kisangani',
    'Bukavu', 'Goma', 'Tshikapa', 'Kolwezi', 'Likasi'
  ],
  // Bénin
  BJ: [
    'Cotonou', 'Porto-Novo', 'Parakou', 'Djougou', 'Bohicon',
    'Abomey-Calavi', 'Natitingou', 'Lokossa', 'Kandi', 'Ouidah'
  ],
  // Togo
  TG: [
    'Lomé', 'Sokodé', 'Kara', 'Kpalimé', 'Atakpamé',
    'Bassar', 'Tsévié', 'Aného', 'Mango', 'Dapaong'
  ],
}

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
      country: defaultValues?.country || 'CI', // Default to Côte d'Ivoire
      phone: defaultValues?.phone || '',
      email: defaultValues?.email || userEmail || '',
      emailOffers: false,
      saveAddress: false,
      orderNotes: defaultValues?.orderNotes || '',
    },
  })

  // Watch country to show city dropdown
  const selectedCountry = form.watch('country')
  const availableCities = citiesByCountry[selectedCountry] || []
  const hasPresetCities = availableCities.length > 0

  // Reset city when country changes
  React.useEffect(() => {
    if (hasPresetCities) {
      form.setValue('city', '')
    }
  }, [selectedCountry, hasPresetCities, form])

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
  const { data: addressesData } = useSWR<{ data: SavedAddressType[], success: boolean }>(
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
      orderNotes: data.orderNotes,
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

                {/* Country, City, Postal Code */}
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Country - First so city dropdown updates */}
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pays *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un pays" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-80">
                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">Europe</div>
                            {countries.filter(c => c.region === 'europe').map((country) => (
                              <SelectItem key={country.value} value={country.value}>
                                {country.label}
                              </SelectItem>
                            ))}
                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">Afrique de l&apos;Ouest</div>
                            {countries.filter(c => c.region === 'africa' && ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GN', 'GH', 'NG'].includes(c.value)).map((country) => (
                              <SelectItem key={country.value} value={country.value}>
                                {country.label}
                              </SelectItem>
                            ))}
                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">Afrique Centrale</div>
                            {countries.filter(c => c.region === 'africa' && ['CM', 'GA', 'CG', 'CD', 'TD', 'CF'].includes(c.value)).map((country) => (
                              <SelectItem key={country.value} value={country.value}>
                                {country.label}
                              </SelectItem>
                            ))}
                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">Afrique du Nord</div>
                            {countries.filter(c => c.region === 'africa' && ['MA', 'TN', 'DZ'].includes(c.value)).map((country) => (
                              <SelectItem key={country.value} value={country.value}>
                                {country.label}
                              </SelectItem>
                            ))}
                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">Autres</div>
                            {countries.filter(c => c.region === 'americas' || ['RW', 'BI', 'MG', 'MU'].includes(c.value)).map((country) => (
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

                  {/* City - Dropdown for African countries, input for others */}
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville *</FormLabel>
                        {hasPresetCities ? (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une ville" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-60">
                              {availableCities.map((city) => (
                                <SelectItem key={city} value={city}>
                                  {city}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <FormControl>
                            <Input placeholder="Votre ville" {...field} />
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Postal Code - Optional for African countries */}
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code postal {hasPresetCities ? '(optionnel)' : '*'}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={hasPresetCities ? 'BP 1234' : '75001'} 
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
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

                {/* Order Notes */}
                <FormField
                  control={form.control}
                  name="orderNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions de livraison (Optionnel)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Laisser devant la porte, Appeler avant livraison..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {field.value?.length || 0}/500
                      </FormDescription>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-platinum-100"
                          onClick={() => form.setValue('orderNotes', 'Laisser devant la porte')}
                        >
                          Laisser devant la porte
                        </Badge>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-platinum-100"
                          onClick={() => form.setValue('orderNotes', 'Appeler avant livraison')}
                        >
                          Appeler avant livraison
                        </Badge>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-platinum-100"
                          onClick={() => form.setValue('orderNotes', 'Sonner à l\'interphone')}
                        >
                          Sonner à l&apos;interphone
                        </Badge>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-platinum-100"
                          onClick={() => form.setValue('orderNotes', 'Livraison en point relais préférée')}
                        >
                          Livraison en point relais préférée
                        </Badge>
                      </div>
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
