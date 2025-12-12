'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Loader2, Save, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { createUpdateProfileSchema } from '@/lib/validations/profile'

interface Profile {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  locale: string | null
  countryCode: string | null
  currency: string | null
  loyaltyLevel: string | null
  loyaltyPoints: number
}

interface ProfilePageClientProps {
  initialProfile: Profile
}

export function ProfilePageClient({ initialProfile }: ProfilePageClientProps) {
  const router = useRouter()
  const t = useTranslations('account.profile')
  const tValidation = useTranslations('account.profile.validation')
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)

  // Create the validation schema with translations
  const profileSchema = React.useMemo(
    () => createUpdateProfileSchema(tValidation),
    [tValidation]
  )

  type ProfileFormData = z.infer<typeof profileSchema>

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: initialProfile.firstName || '',
      lastName: initialProfile.lastName || '',
      phone: initialProfile.phone || '',
      locale: (initialProfile.locale as 'fr' | 'en' | 'ar') || 'fr',
      countryCode: initialProfile.countryCode || 'FR',
      currency: (initialProfile.currency as any) || 'EUR',
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update profile')
      }

      toast({
        title: t('messages.success'),
        description: t('messages.successDescription'),
      })

      // Refresh the page to get updated data
      router.refresh()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: t('messages.error'),
        description:
          error instanceof Error
            ? error.message
            : t('messages.errorDescription'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-anthracite-900 mb-2">
          {t('title')}
        </h1>
        <p className="text-nuanced-600">
          {t('subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('personalInfo.title')}
            </CardTitle>
            <CardDescription>
              {t('personalInfo.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('personalInfo.firstName')}</Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  placeholder={t('personalInfo.firstNamePlaceholder')}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">{t('personalInfo.lastName')}</Label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                  placeholder={t('personalInfo.lastNamePlaceholder')}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('personalInfo.email')}</Label>
              <Input
                id="email"
                type="email"
                value={initialProfile.email}
                disabled
                className="bg-platinum-100"
              />
              <p className="text-sm text-nuanced-500">
                {t('personalInfo.emailHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('personalInfo.phone')}</Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                placeholder={t('personalInfo.phonePlaceholder')}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
              <p className="text-sm text-nuanced-500">
                {t('personalInfo.phoneHint')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>{t('preferences.title')}</CardTitle>
            <CardDescription>
              {t('preferences.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locale">{t('preferences.language')}</Label>
                <select
                  id="locale"
                  {...register('locale')}
                  className="w-full px-3 py-2 border border-platinum-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
                {errors.locale && (
                  <p className="text-sm text-red-600">{errors.locale.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="countryCode">{t('preferences.country')}</Label>
                <select
                  id="countryCode"
                  {...register('countryCode')}
                  className="w-full px-3 py-2 border border-platinum-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="FR">France</option>
                  <option value="SN">Sénégal</option>
                  <option value="CI">Côte d'Ivoire</option>
                  <option value="CM">Cameroun</option>
                  <option value="MA">Maroc</option>
                  <option value="NG">Nigeria</option>
                  <option value="KE">Kenya</option>
                  <option value="ZA">Afrique du Sud</option>
                  <option value="GH">Ghana</option>
                </select>
                {errors.countryCode && (
                  <p className="text-sm text-red-600">
                    {errors.countryCode.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">{t('preferences.currency')}</Label>
                <select
                  id="currency"
                  {...register('currency')}
                  className="w-full px-3 py-2 border border-platinum-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="XOF">XOF (FCFA)</option>
                  <option value="XAF">XAF (FCFA)</option>
                  <option value="NGN">NGN (₦)</option>
                  <option value="KES">KES (KSh)</option>
                  <option value="ZAR">ZAR (R)</option>
                  <option value="MAD">MAD (د.م.)</option>
                  <option value="GHS">GHS (₵)</option>
                </select>
                {errors.currency && (
                  <p className="text-sm text-red-600">
                    {errors.currency.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loyalty Information */}
        {initialProfile.loyaltyLevel && (
          <Card>
            <CardHeader>
              <CardTitle>{t('loyalty.title')}</CardTitle>
              <CardDescription>
                {t('loyalty.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-platinum-50 rounded-lg">
                  <p className="text-sm text-nuanced-600 mb-1">{t('loyalty.level')}</p>
                  <p className="text-2xl font-bold text-anthracite-900">
                    {initialProfile.loyaltyLevel}
                  </p>
                </div>
                <div className="p-4 bg-platinum-50 rounded-lg">
                  <p className="text-sm text-nuanced-600 mb-1">{t('loyalty.points')}</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {initialProfile.loyaltyPoints.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            {t('actions.cancel')}
          </Button>
          <Button type="submit" disabled={loading || !isDirty}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('actions.saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t('actions.save')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
