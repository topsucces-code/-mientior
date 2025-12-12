'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { MapPin, Plus, Edit2, Trash2, Check, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

interface Address {
  id: string
  firstName: string
  lastName: string
  line1: string
  line2?: string | null
  city: string
  postalCode: string
  country: string
  phone: string
  isDefault: boolean
}

interface AddressFormData {
  firstName: string
  lastName: string
  line1: string
  line2: string
  city: string
  postalCode: string
  country: string
  phone: string
  isDefault: boolean
}

interface AddressesPageClientProps {
  initialAddresses: Address[]
}

const emptyForm: AddressFormData = {
  firstName: '',
  lastName: '',
  line1: '',
  line2: '',
  city: '',
  postalCode: '',
  country: 'FR',
  phone: '',
  isDefault: false,
}

const countries = [
  { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
]

export function AddressesPageClient({ initialAddresses }: AddressesPageClientProps) {
  const router = useRouter()
  const t = useTranslations('account.addresses')
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<AddressFormData>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleEdit = (address: Address) => {
    setEditingId(address.id)
    setFormData({
      firstName: address.firstName,
      lastName: address.lastName,
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone || '',
      isDefault: address.isDefault,
    })
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData(emptyForm)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingId 
        ? `/api/account/addresses/${editingId}` 
        : '/api/account/addresses'
      const method = editingId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const savedAddress = await response.json()

        if (editingId) {
          setAddresses(prev => prev.map(a => a.id === editingId ? savedAddress : a))
          toast({ title: t('messages.updated'), description: t('messages.updatedDescription') })
        } else {
          setAddresses(prev => [...prev, savedAddress])
          toast({ title: t('messages.added'), description: t('messages.addedDescription') })
        }

        handleCancel()
        router.refresh()
      } else {
        throw new Error('Failed to save address')
      }
    } catch {
      toast({
        title: t('messages.error'),
        description: t('messages.errorDescription'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('messages.confirmDelete'))) return

    setDeleting(id)
    try {
      const response = await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' })

      if (response.ok) {
        setAddresses(prev => prev.filter(a => a.id !== id))
        toast({ title: t('messages.deleted'), description: t('messages.deletedDescription') })
        router.refresh()
      } else {
        throw new Error('Failed to delete')
      }
    } catch {
      toast({
        title: t('messages.error'),
        description: t('messages.errorDescription'),
        variant: 'destructive',
      })
    } finally {
      setDeleting(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/account/addresses/${id}/default`, { method: 'POST' })

      if (response.ok) {
        setAddresses(prev => prev.map(a => ({
          ...a,
          isDefault: a.id === id,
        })))
        toast({ title: t('messages.setDefault'), description: t('messages.setDefaultDescription') })
        router.refresh()
      }
    } catch {
      toast({
        title: t('messages.error'),
        description: t('messages.errorDescription'),
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/account')}
          className="mb-4 flex items-center text-sm text-nuanced-600 hover:text-anthracite-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('backToAccount')}
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-anthracite-700">{t('title')}</h1>
            <p className="text-nuanced-600">{t('subtitle')}</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('addAddress')}
            </Button>
          )}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8 rounded-lg border border-platinum-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-anthracite-700">
            {editingId ? t('editAddress') : t('newAddress')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-anthracite-700">
                  {t('form.firstName')} *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-platinum-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-anthracite-700">
                  {t('form.lastName')} *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-platinum-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-anthracite-700">
                {t('form.line1')} *
              </label>
              <input
                type="text"
                name="line1"
                value={formData.line1}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-platinum-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-anthracite-700">
                {t('form.line2')}
              </label>
              <input
                type="text"
                name="line2"
                value={formData.line2}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-platinum-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-anthracite-700">
                  {t('form.city')} *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-platinum-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-anthracite-700">
                  {t('form.postalCode')} *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-platinum-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-anthracite-700">
                  {t('form.country')} *
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-platinum-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                >
                  {countries.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-anthracite-700">
                  {t('form.phone')}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-platinum-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-platinum-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-anthracite-700">{t('form.setDefault')}</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? t('actions.saving') : (editingId ? t('actions.update') : t('actions.save'))}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                {t('actions.cancel')}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Address List */}
      {addresses.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-platinum-200 bg-white py-16 text-center">
          <div className="mb-4 rounded-full bg-platinum-100 p-4">
            <MapPin className="h-8 w-8 text-platinum-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-anthracite-700">{t('empty.title')}</h3>
          <p className="mb-4 text-nuanced-600">{t('empty.subtitle')}</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('addAddress')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`relative rounded-lg border bg-white p-4 ${
                address.isDefault ? 'border-orange-300 ring-1 ring-orange-100' : 'border-platinum-200'
              }`}
            >
              {/* Default Badge */}
              {address.isDefault && (
                <div className="absolute right-2 top-2">
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                    <Check className="mr-1 h-3 w-3" />
                    {t('default.badge')}
                  </span>
                </div>
              )}

              {/* Address Details */}
              <div className="mb-4 space-y-1 text-sm">
                <p className="font-medium text-anthracite-700">
                  {address.firstName} {address.lastName}
                </p>
                <p className="text-nuanced-600">{address.line1}</p>
                {address.line2 && (
                  <p className="text-nuanced-600">{address.line2}</p>
                )}
                <p className="text-nuanced-600">
                  {address.city} {address.postalCode}
                </p>
                <p className="text-nuanced-600">
                  {countries.find(c => c.code === address.country)?.name || address.country}
                </p>
                {address.phone && (
                  <p className="text-nuanced-600">{address.phone}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(address)}
                >
                  <Edit2 className="mr-1 h-3 w-3" />
                  {t('actions.edit')}
                </Button>
                {!address.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(address.id)}
                  >
                    {t('actions.setDefault')}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(address.id)}
                  disabled={deleting === address.id}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
