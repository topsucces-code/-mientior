import { Metadata } from 'next'
import { MapPin, Clock, Phone, Navigation, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Points de Retrait | Mientior',
  description: 'Trouvez un point de retrait Mientior près de chez vous. Retrait gratuit de vos commandes dans plus de 500 points partenaires en Afrique.',
}

const pickupPoints = [
  {
    id: '1',
    name: 'Mientior Store - Plateau',
    address: 'Avenue Chardy, Plateau, Abidjan',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    phone: '+225 27 20 21 22 23',
    hours: 'Lun-Sam: 8h-20h, Dim: 9h-14h',
    type: 'store',
    services: ['Retrait gratuit', 'Paiement sur place', 'Essayage'],
  },
  {
    id: '2',
    name: 'Point Relais - Cocody',
    address: 'Rue des Jardins, Cocody, Abidjan',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    phone: '+225 27 22 44 55 66',
    hours: 'Lun-Sam: 9h-19h',
    type: 'relay',
    services: ['Retrait gratuit', 'Paiement sur place'],
  },
  {
    id: '3',
    name: 'Mientior Store - Dakar',
    address: 'Avenue Cheikh Anta Diop, Dakar',
    city: 'Dakar',
    country: 'Sénégal',
    phone: '+221 33 820 21 22',
    hours: 'Lun-Sam: 8h-20h, Dim: 10h-14h',
    type: 'store',
    services: ['Retrait gratuit', 'Paiement sur place', 'Essayage', 'SAV'],
  },
  {
    id: '4',
    name: 'Point Relais - Almadies',
    address: 'Route des Almadies, Dakar',
    city: 'Dakar',
    country: 'Sénégal',
    phone: '+221 33 820 33 44',
    hours: 'Lun-Sam: 9h-18h',
    type: 'relay',
    services: ['Retrait gratuit'],
  },
  {
    id: '5',
    name: 'Mientior Store - Douala',
    address: 'Boulevard de la Liberté, Douala',
    city: 'Douala',
    country: 'Cameroun',
    phone: '+237 233 42 21 22',
    hours: 'Lun-Sam: 8h-19h',
    type: 'store',
    services: ['Retrait gratuit', 'Paiement sur place', 'Essayage'],
  },
  {
    id: '6',
    name: 'Point Relais - Yaoundé',
    address: 'Avenue Kennedy, Yaoundé',
    city: 'Yaoundé',
    country: 'Cameroun',
    phone: '+237 222 23 45 67',
    hours: 'Lun-Ven: 9h-18h, Sam: 9h-14h',
    type: 'relay',
    services: ['Retrait gratuit', 'Paiement sur place'],
  },
]

const countries = ['Tous', 'Côte d\'Ivoire', 'Sénégal', 'Cameroun', 'Ghana', 'Nigeria']

export default function PointsRetraitPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-turquoise-700 text-white py-16 md:py-20">
        <div className="max-w-[1200px] mx-auto px-4 md:px-[4%] text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4">
            Points de Retrait
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Récupérez vos commandes gratuitement dans l'un de nos 500+ points partenaires en Afrique
          </p>
          
          {/* Stats */}
          <div className="flex justify-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black">500+</div>
              <div className="text-sm text-white/80">Points de retrait</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black">28</div>
              <div className="text-sm text-white/80">Pays couverts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black">Gratuit</div>
              <div className="text-sm text-white/80">Retrait</div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-[1200px] mx-auto px-4 md:px-[4%]">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par ville, adresse ou code postal..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-turquoise-500 transition-colors"
              />
            </div>
            
            {/* Country Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {countries.map((country) => (
                <button
                  key={country}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium whitespace-nowrap hover:bg-turquoise-100 hover:text-turquoise-600 transition-colors"
                >
                  {country}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Points List */}
      <section className="py-12 md:py-16">
        <div className="max-w-[1200px] mx-auto px-4 md:px-[4%]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pickupPoints.map((point) => (
              <div
                key={point.id}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow border border-gray-100"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span
                      className={`inline-block px-3 py-1 text-xs font-bold uppercase rounded-full mb-2 ${
                        point.type === 'store'
                          ? 'bg-turquoise-100 text-turquoise-600'
                          : 'bg-orange-100 text-orange-600'
                      }`}
                    >
                      {point.type === 'store' ? 'Boutique' : 'Point Relais'}
                    </span>
                    <h3 className="font-bold text-gray-800">{point.name}</h3>
                  </div>
                  <button className="w-10 h-10 bg-turquoise-50 rounded-full flex items-center justify-center text-turquoise-600 hover:bg-turquoise-100 transition-colors">
                    <Navigation className="w-5 h-5" />
                  </button>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3 mb-3 text-gray-600">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p>{point.address}</p>
                    <p className="text-sm text-gray-500">{point.city}, {point.country}</p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-center gap-3 mb-3 text-gray-600">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <p className="text-sm">{point.hours}</p>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3 mb-4 text-gray-600">
                  <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <a href={`tel:${point.phone}`} className="text-sm hover:text-turquoise-600 transition-colors">
                    {point.phone}
                  </a>
                </div>

                {/* Services */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                  {point.services.map((service) => (
                    <span
                      key={service}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="mt-10 text-center">
            <button className="px-8 py-4 bg-turquoise-600 text-white font-bold rounded-xl hover:bg-turquoise-700 transition-colors">
              Voir plus de points de retrait
            </button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 md:px-[4%]">
          <h2 className="text-2xl md:text-3xl font-black text-center text-gray-800 mb-12">
            Pourquoi choisir le retrait en point relais ?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-turquoise-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">100% Gratuit</h3>
              <p className="text-gray-600">
                Le retrait en point relais est toujours gratuit, quelle que soit la valeur de votre commande.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⏰</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Horaires flexibles</h3>
              <p className="text-gray-600">
                Récupérez votre colis quand vous voulez, selon les horaires d'ouverture du point relais.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Sécurisé</h3>
              <p className="text-gray-600">
                Votre colis est conservé en toute sécurité jusqu'à votre passage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-orange-600 text-white">
        <div className="max-w-[800px] mx-auto px-4 md:px-[4%] text-center">
          <h2 className="text-2xl md:text-3xl font-black mb-4">
            Vous êtes commerçant ?
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Devenez point relais Mientior et générez des revenus supplémentaires tout en attirant de nouveaux clients dans votre boutique.
          </p>
          <button className="px-8 py-4 bg-white text-orange-600 font-bold rounded-xl hover:bg-gray-100 transition-colors">
            Devenir partenaire
          </button>
        </div>
      </section>
    </div>
  )
}
