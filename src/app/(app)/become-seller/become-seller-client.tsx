'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { 
  Store, 
  Users, 
  TrendingUp, 
  Shield, 
  Globe, 
  Smartphone,
  CheckCircle,
  ArrowRight,
  Building2,
  Package,
  CreditCard,
  Headphones,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

const benefitIcons = [
  { icon: Globe, key: 'clients' },
  { icon: Smartphone, key: 'mobileMoney' },
  { icon: Shield, key: 'protection' },
  { icon: TrendingUp, key: 'growth' },
  { icon: Headphones, key: 'support' },
  { icon: Package, key: 'logistics' },
]

const stepKeys = ['register', 'verification', 'setup', 'sell']

const countries = [
  { value: 'CI', label: "Côte d'Ivoire" },
  { value: 'SN', label: 'Sénégal' },
  { value: 'ML', label: 'Mali' },
  { value: 'BF', label: 'Burkina Faso' },
  { value: 'BJ', label: 'Bénin' },
  { value: 'TG', label: 'Togo' },
  { value: 'NE', label: 'Niger' },
  { value: 'GN', label: 'Guinée' },
  { value: 'GH', label: 'Ghana' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'CM', label: 'Cameroun' },
  { value: 'GA', label: 'Gabon' },
  { value: 'CG', label: 'Congo' },
  { value: 'CD', label: 'RD Congo' },
  { value: 'MA', label: 'Maroc' },
  { value: 'TN', label: 'Tunisie' },
  { value: 'DZ', label: 'Algérie' },
]

const businessTypeKeys = ['individual', 'company', 'cooperative', 'artisan', 'manufacturer']
const productCategoryKeys = ['fashion', 'electronics', 'beauty', 'home', 'food', 'health', 'sports', 'kids', 'art', 'other']
const productEstimateKeys = ['1-10', '11-50', '51-100', '101-500', '500+']

export function BecomeSellerClient() {
  const t = useTranslations('becomeSeller')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)

  const sellerFormSchema = React.useMemo(() => z.object({
    businessName: z.string().min(2, t('validation.businessNameMin')),
    businessType: z.string().min(1, t('validation.businessTypeRequired')),
    registrationNumber: z.string().optional(),
    firstName: z.string().min(2, t('validation.firstNameMin')),
    lastName: z.string().min(2, t('validation.lastNameMin')),
    email: z.string().email(t('validation.emailInvalid')),
    phone: z.string().min(8, t('validation.phoneMin')),
    country: z.string().min(1, t('validation.countryRequired')),
    city: z.string().min(2, t('validation.cityRequired')),
    productCategory: z.string().min(1, t('validation.categoryRequired')),
    productDescription: z.string().min(20, t('validation.descriptionMin')),
    estimatedProducts: z.string().min(1, t('validation.estimateRequired')),
    acceptTerms: z.boolean().refine(val => val === true, t('validation.termsRequired')),
    acceptCommission: z.boolean().refine(val => val === true, t('validation.commissionRequired')),
  }), [t])

  type SellerFormValues = z.infer<typeof sellerFormSchema>

  const form = useForm<SellerFormValues>({
    resolver: zodResolver(sellerFormSchema),
    defaultValues: {
      businessName: '',
      businessType: '',
      registrationNumber: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      country: '',
      city: '',
      productCategory: '',
      productDescription: '',
      estimatedProducts: '',
      acceptTerms: false,
      acceptCommission: false,
    },
  })

  const onSubmit = async (data: SellerFormValues) => {
    setIsSubmitting(true)
    
    try {
      console.log('Seller application:', data)
      await new Promise(resolve => setTimeout(resolve, 2000))
      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting application:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-turquoise-50">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-success/10">
                <CheckCircle className="h-12 w-12 text-success" />
              </div>
            </div>
            <h1 className="mb-4 text-3xl font-bold text-anthracite-700">
              {t('success.title')}
            </h1>
            <p className="mb-8 text-lg text-nuanced-600">
              {t('success.message')}
            </p>
            <div className="space-y-4">
              <p className="text-sm text-nuanced-500">
                {t('success.emailSent')}
              </p>
              <Link href="/">
                <Button variant="gradient" size="lg">
                  {t('success.backHome')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-turquoise-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-turquoise-700 py-16 text-white md:py-24">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Store className="h-5 w-5" />
              <span className="text-sm font-medium">{t('hero.badge')}</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl">
              {t('hero.title')}
            </h1>
            <p className="mb-8 text-lg text-turquoise-100 md:text-xl">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
                <Users className="h-5 w-5" />
                <span>{t('hero.stats.clients')}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
                <Globe className="h-5 w-5" />
                <span>{t('hero.stats.countries')}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
                <CreditCard className="h-5 w-5" />
                <span>{t('hero.stats.payments')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-anthracite-700">
              {t('benefits.title')}
            </h2>
            <p className="mx-auto max-w-2xl text-nuanced-600">
              {t('benefits.subtitle')}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {benefitIcons.map((benefit) => {
              const Icon = benefit.icon
              return (
                <Card key={benefit.key} className="border-0 shadow-elevation-2 transition-all hover:shadow-elevation-3">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-turquoise-100">
                      <Icon className="h-6 w-6 text-turquoise-600" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-anthracite-700">
                      {t(`benefits.items.${benefit.key}.title`)}
                    </h3>
                    <p className="text-sm text-nuanced-600">
                      {t(`benefits.items.${benefit.key}.description`)}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-platinum-50 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-anthracite-700">
              {t('howItWorks.title')}
            </h2>
            <p className="mx-auto max-w-2xl text-nuanced-600">
              {t('howItWorks.subtitle')}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {stepKeys.map((stepKey, index) => (
              <div key={stepKey} className="relative">
                {index < stepKeys.length - 1 && (
                  <div className="absolute left-1/2 top-8 hidden h-0.5 w-full bg-turquoise-200 lg:block" />
                )}
                <div className="relative flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-turquoise-600 text-2xl font-bold text-white">
                    {t(`howItWorks.steps.${stepKey}.number`)}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-anthracite-700">
                    {t(`howItWorks.steps.${stepKey}.title`)}
                  </h3>
                  <p className="text-sm text-nuanced-600">
                    {t(`howItWorks.steps.${stepKey}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section className="py-16" id="inscription">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <h2 className="mb-4 text-3xl font-bold text-anthracite-700">
                {t('form.title')}
              </h2>
              <p className="text-nuanced-600">
                {t('form.subtitle')}
              </p>
            </div>

            <Card className="shadow-elevation-3">
              <CardContent className="p-6 md:p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Business Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-platinum-200 pb-2">
                        <Building2 className="h-5 w-5 text-turquoise-600" />
                        <h3 className="text-lg font-semibold text-anthracite-700">
                          {t('form.sections.business')}
                        </h3>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('form.fields.businessName')} *</FormLabel>
                              <FormControl>
                                <Input placeholder="Ma Boutique" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="businessType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('form.fields.businessType')} *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('form.select')} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {businessTypeKeys.map((typeKey) => (
                                    <SelectItem key={typeKey} value={typeKey}>
                                      {t(`form.businessTypes.${typeKey}`)}
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
                        name="registrationNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('form.fields.registrationNumber')}</FormLabel>
                            <FormControl>
                              <Input placeholder="RCCM, NIF, etc." {...field} />
                            </FormControl>
                            <FormDescription>
                              {t('form.fields.registrationNumberHint')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-platinum-200 pb-2">
                        <Users className="h-5 w-5 text-turquoise-600" />
                        <h3 className="text-lg font-semibold text-anthracite-700">
                          {t('form.sections.contact')}
                        </h3>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('form.fields.firstName')} *</FormLabel>
                              <FormControl>
                                <Input placeholder="Amadou" {...field} />
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
                              <FormLabel>{t('form.fields.lastName')} *</FormLabel>
                              <FormControl>
                                <Input placeholder="Diallo" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('form.fields.email')} *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="amadou@exemple.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('form.fields.phone')} *</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="+225 07 07 12 34 56" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('form.fields.country')} *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('form.selectCountry')} />
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

                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('form.fields.city')} *</FormLabel>
                              <FormControl>
                                <Input placeholder="Abidjan" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Products Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-platinum-200 pb-2">
                        <Package className="h-5 w-5 text-turquoise-600" />
                        <h3 className="text-lg font-semibold text-anthracite-700">
                          {t('form.sections.products')}
                        </h3>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="productCategory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('form.fields.productCategory')} *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('form.selectCategory')} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {productCategoryKeys.map((catKey) => (
                                    <SelectItem key={catKey} value={catKey}>
                                      {t(`form.productCategories.${catKey}`)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="estimatedProducts"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('form.fields.estimatedProducts')} *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('form.select')} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {productEstimateKeys.map((estKey) => (
                                    <SelectItem key={estKey} value={estKey}>
                                      {t(`form.productEstimates.${estKey}`)}
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
                        name="productDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('form.fields.productDescription')} *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={t('form.fields.productDescriptionPlaceholder')}
                                rows={4}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {t('form.fields.productDescriptionHint')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Terms */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="acceptTerms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-normal">
                                {t.rich('form.terms.acceptTerms', {
                                  termsLink: (chunks) => (
                                    <Link href="/legal#terms" className="text-turquoise-600 hover:underline">
                                      {chunks}
                                    </Link>
                                  ),
                                  privacyLink: (chunks) => (
                                    <Link href="/legal#privacy" className="text-turquoise-600 hover:underline">
                                      {chunks}
                                    </Link>
                                  ),
                                })}
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="acceptCommission"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-normal">
                                {t('form.terms.acceptCommission')}
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      variant="gradient"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('form.submitting')}
                        </>
                      ) : (
                        <>
                          {t('form.submit')}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-platinum-50 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <h2 className="mb-4 text-3xl font-bold text-anthracite-700">
                {t('faq.title')}
              </h2>
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('faq.questions.cost.question')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-nuanced-600">
                    {t('faq.questions.cost.answer')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('faq.questions.payment.question')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-nuanced-600">
                    {t('faq.questions.payment.answer')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('faq.questions.delivery.question')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-nuanced-600">
                    {t('faq.questions.delivery.answer')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
