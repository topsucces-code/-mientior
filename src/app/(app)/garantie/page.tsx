import { Metadata } from 'next'
import { Shield, CheckCircle, FileText, Clock, Award, HelpCircle } from 'lucide-react'
import { WarrantyRegistrationForm } from '@/components/warranty/registration-form'

export const metadata: Metadata = {
  title: 'Garantie | Mientior',
  description: 'Informations sur la garantie légale de 2 ans, garantie étendue, et processus de réclamation. Protection complète de vos achats.',
}

export default function WarrantyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-turquoise-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6 backdrop-blur-sm">
              <Shield className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Garantie 2 Ans sur Tous Vos Achats
            </h1>
            <p className="text-xl text-green-100 mb-8">
              Protection complète • Processus simple • Service client dédié
            </p>
          </div>
        </div>
      </section>

      {/* Warranty Coverage */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre Garantie</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Tous les produits vendus sur Mientior bénéficient d'une garantie légale de conformité de 2 ans
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Legal Warranty */}
              <div className="bg-turquoise-50 rounded-xl p-8 border-2 border-turquoise-200">
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mb-6 mx-auto">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                  Garantie Légale
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  2 ans de garantie légale de conformité sur tous les produits
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Défauts de fabrication</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Non-conformité du produit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Vices cachés</span>
                  </li>
                </ul>
              </div>

              {/* Extended Warranty */}
              <div className="bg-turquoise-50 rounded-xl p-8 border-2 border-turquoise-200">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mb-6 mx-auto">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                  Garantie Étendue
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  Extension de garantie jusqu'à 5 ans disponible
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Protection prolongée</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Assistance prioritaire</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Remplacement express</span>
                  </li>
                </ul>
              </div>

              {/* Satisfaction Guarantee */}
              <div className="bg-orange-50 rounded-xl p-8 border-2 border-orange-200">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mb-6 mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                  Satisfait ou Remboursé
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  30 jours pour changer d'avis sans justification
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span>Retour gratuit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span>Remboursement intégral</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span>Aucune question posée</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Enregistrer un Produit</h2>
                  <p className="text-gray-600">Activez votre garantie en quelques clics</p>
                </div>
              </div>
              <WarrantyRegistrationForm />
            </div>
          </div>
        </div>
      </section>

      {/* Claim Process */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Comment Faire une Réclamation
              </h2>
              <p className="text-lg text-gray-600">
                Processus simple et rapide en 4 étapes
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Step 1 */}
              <div className="bg-turquoise-50 rounded-xl p-6 border border-turquoise-200">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Contactez-nous
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Contactez notre service client par téléphone, email ou chat en ligne
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="text-blue-600 font-medium">📞 01 23 45 67 89</div>
                      <div className="text-blue-600 font-medium">✉️ garantie@mientior.com</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-turquoise-50 rounded-xl p-6 border border-turquoise-200">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Fournissez les Documents
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Préparez les documents nécessaires pour votre réclamation
                    </p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Facture d'achat</li>
                      <li>• Photos du défaut</li>
                      <li>• Numéro de série</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Évaluation
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Notre équipe technique évalue votre demande sous 48h
                    </p>
                    <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                      <Clock className="w-4 h-4" />
                      <span>Réponse sous 2 jours ouvrés</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    4
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Solution
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Réparation, remplacement ou remboursement selon le cas
                    </p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Réparation gratuite</li>
                      <li>• Produit de remplacement</li>
                      <li>• Remboursement intégral</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Covered */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Ce qui est Couvert
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Covered */}
              <div className="bg-white rounded-xl p-6 border-2 border-green-200">
                <h3 className="text-xl font-bold text-green-600 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  Couvert par la Garantie
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">Défauts de fabrication</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">Pannes sans cause externe</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">Dysfonctionnements matériels</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">Pièces défectueuses</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">Problèmes logiciels (produits électroniques)</span>
                  </li>
                </ul>
              </div>

              {/* Not Covered */}
              <div className="bg-white rounded-xl p-6 border-2 border-red-200">
                <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                  <HelpCircle className="w-6 h-6" />
                  Non Couvert
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">Dommages accidentels</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">Usure normale</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">Mauvaise utilisation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">Modifications non autorisées</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">Dégâts des eaux ou feu</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Questions Fréquentes
            </h2>
            <div className="space-y-4">
              <details className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  Quelle est la durée de la garantie légale ?
                </summary>
                <p className="mt-4 text-gray-600">
                  La garantie légale de conformité est de 2 ans à compter de la date d'achat pour tous
                  les produits neufs vendus sur Mientior. Cette garantie est automatique et gratuite.
                </p>
              </details>

              <details className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  Dois-je enregistrer mon produit pour bénéficier de la garantie ?
                </summary>
                <p className="mt-4 text-gray-600">
                  L'enregistrement n'est pas obligatoire pour la garantie légale, mais il est fortement
                  recommandé car il facilite et accélère le traitement de vos réclamations. De plus,
                  certains fabricants offrent des avantages supplémentaires aux produits enregistrés.
                </p>
              </details>

              <details className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  Que faire si mon produit tombe en panne après 2 ans ?
                </summary>
                <p className="mt-4 text-gray-600">
                  Après 2 ans, vous pouvez souscrire à notre garantie étendue qui prolonge la protection
                  jusqu'à 5 ans. Si vous n'avez pas de garantie étendue, nous proposons un service de
                  réparation payant avec des tarifs préférentiels pour nos clients.
                </p>
              </details>

              <details className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  Combien de temps prend le processus de réclamation ?
                </summary>
                <p className="mt-4 text-gray-600">
                  Nous nous engageons à traiter votre réclamation sous 48h ouvrées. Le délai total
                  dépend de la solution retenue (réparation, remplacement ou remboursement), mais nous
                  faisons tout notre possible pour résoudre votre problème dans les 7 jours.
                </p>
              </details>

              <details className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  Puis-je obtenir un remboursement au lieu d'une réparation ?
                </summary>
                <p className="mt-4 text-gray-600">
                  Si la réparation n'est pas possible ou si le produit présente plusieurs défauts, vous
                  avez le droit de demander un remboursement intégral ou un remplacement par un produit
                  équivalent. La décision finale dépend de l'évaluation technique du défaut.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
