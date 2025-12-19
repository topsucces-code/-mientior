'use client'

import { useState } from 'react'
import { Search, Package, Truck, CheckCircle, Clock } from 'lucide-react'

interface TrackingStatus {
  status: 'pending' | 'processing' | 'shipped' | 'in_transit' | 'delivered'
  timeline: {
    date: string
    status: string
    location: string
    completed: boolean
  }[]
  estimatedDelivery: string
  carrier: string
  trackingNumber: string
}

export function DeliveryTrackingForm() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [trackingData, setTrackingData] = useState<TrackingStatus | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      if (trackingNumber.length < 5) {
        setError('Numéro de suivi invalide. Veuillez vérifier et réessayer.')
        setTrackingData(null)
      } else {
        // Mock tracking data
        setTrackingData({
          status: 'in_transit',
          trackingNumber: trackingNumber,
          carrier: 'Colissimo',
          estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(
            'fr-FR',
            {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }
          ),
          timeline: [
            {
              date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
              status: 'Commande confirmée',
              location: 'Mientior - Abidjan',
              completed: true,
            },
            {
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
              status: 'Colis préparé',
              location: 'Entrepôt - Lyon',
              completed: true,
            },
            {
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
              status: 'En transit',
              location: 'Centre de tri - Marseille',
              completed: true,
            },
            {
              date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
              status: 'En cours de livraison',
              location: 'Votre ville',
              completed: false,
            },
            {
              date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
              status: 'Livré',
              location: 'Votre adresse',
              completed: false,
            },
          ],
        })
      }
      setLoading(false)
    }, 1000)
  }

  const getStatusIcon = (status: string) => {
    if (status === 'Livré') return <CheckCircle className="w-5 h-5" />
    if (status === 'En cours de livraison') return <Truck className="w-5 h-5" />
    if (status === 'En transit') return <Package className="w-5 h-5" />
    return <Clock className="w-5 h-5" />
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Numéro de commande ou de suivi"
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-turquoise-600 hover:bg-turquoise-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Recherche en cours...' : 'Suivre ma commande'}
        </button>
      </form>

      {/* Tracking Results */}
      {trackingData && (
        <div className="mt-8 space-y-6 animate-slide-down">
          {/* Status Summary */}
          <div className="bg-turquoise-50 rounded-xl p-6 border border-turquoise-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Suivi de commande #{trackingData.trackingNumber}
                </h3>
                <p className="text-sm text-gray-600">Transporteur: {trackingData.carrier}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Livraison estimée</div>
                <div className="text-lg font-bold text-turquoise-600">
                  {trackingData.estimatedDelivery}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Historique de livraison</h4>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

              {trackingData.timeline.map((event, index) => (
                <div key={index} className="relative flex gap-4 pb-8 last:pb-0">
                  {/* Timeline dot */}
                  <div
                    className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      event.completed
                        ? 'bg-turquoise-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {getStatusIcon(event.status)}
                  </div>

                  {/* Event details */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-start justify-between mb-1">
                      <h5
                        className={`font-semibold ${
                          event.completed ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {event.status}
                      </h5>
                      <span className="text-sm text-gray-500">{event.date}</span>
                    </div>
                    <p className="text-sm text-gray-600">{event.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Besoin d'aide ?</strong> Contactez notre service client au{' '}
              <a href="tel:+22527200000" className="text-blue-600 hover:underline">
                27 20 00 00 00
              </a>{' '}
              ou par{' '}
              <a href="mailto:support@mientior.com" className="text-blue-600 hover:underline">
                email
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
