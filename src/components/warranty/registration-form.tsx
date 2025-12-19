'use client'

import { useState } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'

export function WarrantyRegistrationForm() {
  const [formData, setFormData] = useState({
    orderId: '',
    productName: '',
    serialNumber: '',
    purchaseDate: '',
    email: '',
    firstName: '',
    lastName: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      if (formData.orderId.length < 5) {
        setError('Numéro de commande invalide')
        setSuccess(false)
      } else {
        setSuccess(true)
        setError('')
      }
      setLoading(false)
    }, 1500)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (success) {
    return (
      <div className="text-center py-8 animate-slide-down">
        <div className="w-20 h-20 bg-turquoise-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-turquoise-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Produit Enregistré avec Succès !
        </h3>
        <p className="text-gray-600 mb-6">
          Votre garantie est maintenant active. Vous recevrez un email de confirmation avec tous les
          détails.
        </p>
        <div className="bg-turquoise-50 border border-turquoise-200 rounded-lg p-4 text-left">
          <h4 className="font-semibold text-gray-900 mb-2">Informations de garantie</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p>
              <strong>Produit:</strong> {formData.productName}
            </p>
            <p>
              <strong>Numéro de série:</strong> {formData.serialNumber}
            </p>
            <p>
              <strong>Date d'achat:</strong> {new Date(formData.purchaseDate).toLocaleDateString('fr-FR')}
            </p>
            <p>
              <strong>Expiration:</strong>{' '}
              {new Date(
                new Date(formData.purchaseDate).getTime() + 2 * 365 * 24 * 60 * 60 * 1000
              ).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setSuccess(false)
            setFormData({
              orderId: '',
              productName: '',
              serialNumber: '',
              purchaseDate: '',
              email: '',
              firstName: '',
              lastName: '',
            })
          }}
          className="mt-6 text-turquoise-600 hover:text-turquoise-700 font-medium"
        >
          Enregistrer un autre produit
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de Commande</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de Commande *
            </label>
            <input
              type="text"
              id="orderId"
              name="orderId"
              value={formData.orderId}
              onChange={handleChange}
              placeholder="Ex: ORD-123456"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-turquoise-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-2">
              Date d'Achat *
            </label>
            <input
              type="date"
              id="purchaseDate"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-turquoise-500 focus:border-transparent"
              required
            />
          </div>
        </div>
      </div>

      {/* Product Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du Produit</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-2">
              Nom du Produit *
            </label>
            <input
              type="text"
              id="productName"
              name="productName"
              value={formData.productName}
              onChange={handleChange}
              placeholder="Ex: iPhone 15 Pro"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-turquoise-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de Série
            </label>
            <input
              type="text"
              id="serialNumber"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleChange}
              placeholder="Ex: SN123456789"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-turquoise-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vos Informations</h3>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                Prénom *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Votre prénom"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-turquoise-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Nom *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Votre nom"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-turquoise-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="votre.email@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-turquoise-500 focus:border-transparent"
              required
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-turquoise-50 border border-turquoise-200 rounded-lg p-4 text-sm text-gray-600">
        <p>
          <strong>Note:</strong> L'enregistrement de votre produit facilite le traitement de vos
          réclamations et vous permet de bénéficier d'avantages exclusifs.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-turquoise-600 hover:bg-turquoise-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Enregistrement en cours...
          </>
        ) : (
          'Enregistrer mon Produit'
        )}
      </button>
    </form>
  )
}
