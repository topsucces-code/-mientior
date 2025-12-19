import { Metadata } from 'next'
import { Truck, Package, MapPin, Clock, Shield, Search } from 'lucide-react'
import { DeliveryTrackingForm } from '@/components/delivery/tracking-form'
import { DeliveryOptions } from '@/components/delivery/delivery-options'

export const metadata: Metadata = {
  title: 'Livraison | Mientior',
  description: 'Informations sur la livraison, options de livraison et suivi de commande. Livraison gratuite dès 25 000 FCFA.',
}

export default function DeliveryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-turquoise-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6 backdrop-blur-sm">
              <Truck className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Livraison Rapide et Sécurisée
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Livraison gratuite dès 25 000 FCFA • Suivi en temps réel • Retours faciles
            </p>
          </div>
        </div>
      </section>

      {/* Track Your Order Section */}
      <section className="py-12 -mt-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Suivre ma commande</h2>
                  <p className="text-gray-600">Entrez votre numéro de suivi</p>
                </div>
              </div>
              <DeliveryTrackingForm />
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Options */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Options de Livraison</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choisissez l'option qui vous convient le mieux
            </p>
          </div>
          <DeliveryOptions />
        </div>
      </section>

      {/* Delivery Zones */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Zones de Livraison</h2>
              <p className="text-lg text-gray-600">Nous livrons dans toute l'Afrique</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Afrique de l'Ouest (UEMOA) */}
              <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <MapPin className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                  Afrique de l'Ouest (UEMOA)
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    Livraison 3-7 jours
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    Gratuite dès 25 000 FCFA
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    Express disponible
                  </li>
                </ul>
              </div>

              {/* Afrique Centrale */}
              <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <Package className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Afrique Centrale</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                    Livraison 5-10 jours
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                    Tarifs préférentiels
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                    Suivi en temps réel
                  </li>
                </ul>
              </div>

              {/* Afrique du Nord & Est */}
              <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <Truck className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Afrique du Nord & Est</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                    Maghreb: 5-7 jours
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                    Afrique de l'Est: 7-12 jours
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                    Frais de douane inclus
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Info */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Delivery Process */}
              <div className="bg-turquoise-50 rounded-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-8 h-8 text-blue-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Processus de Livraison</h3>
                </div>
                <ol className="space-y-4">
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Préparation</h4>
                      <p className="text-gray-600 text-sm">
                        Votre commande est préparée avec soin dans nos entrepôts
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Expédition</h4>
                      <p className="text-gray-600 text-sm">
                        Prise en charge par notre transporteur partenaire
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Livraison</h4>
                      <p className="text-gray-600 text-sm">
                        Réception à votre domicile ou en point relais
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Guarantees */}
              <div className="bg-turquoise-50 rounded-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-8 h-8 text-green-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Nos Garanties</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Colis sécurisé</h4>
                      <p className="text-gray-600 text-sm">
                        Emballage soigné pour protéger vos produits
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Suivi en temps réel</h4>
                      <p className="text-gray-600 text-sm">
                        Suivez votre colis à chaque étape
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Retours gratuits</h4>
                      <p className="text-gray-600 text-sm">
                        30 jours pour changer d'avis
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Questions Fréquentes
            </h2>
            <div className="space-y-4">
              <details className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  Quand vais-je recevoir ma commande ?
                </summary>
                <p className="mt-4 text-gray-600">
                  Les délais de livraison varient selon l'option choisie : 3-5 jours pour la livraison
                  standard, 1-2 jours pour l'express. Vous recevrez un email avec le numéro de suivi dès
                  l'expédition.
                </p>
              </details>

              <details className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  Comment suivre ma commande ?
                </summary>
                <p className="mt-4 text-gray-600">
                  Utilisez le formulaire de suivi en haut de cette page avec votre numéro de commande ou
                  de suivi. Vous pouvez également suivre votre commande depuis votre compte client.
                </p>
              </details>

              <details className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  Que faire si je ne suis pas là lors de la livraison ?
                </summary>
                <p className="mt-4 text-gray-600">
                  Le transporteur laissera un avis de passage et votre colis sera disponible en point
                  relais ou une nouvelle tentative de livraison sera programmée.
                </p>
              </details>

              <details className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  Les frais de livraison sont-ils remboursés en cas de retour ?
                </summary>
                <p className="mt-4 text-gray-600">
                  Les frais de livraison initiaux ne sont pas remboursés, sauf en cas de produit
                  défectueux ou d'erreur de notre part. Les retours sont gratuits dans tous les cas.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
