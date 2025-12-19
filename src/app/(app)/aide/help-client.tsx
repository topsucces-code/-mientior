'use client'

import { useState } from 'react'
import { Search, Mail, Phone, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

interface FAQItem {
  question: string
  answer: string
  category: string
}

const FAQ_DATA: FAQItem[] = [
  {
    category: 'Commandes',
    question: 'Comment passer une commande ?',
    answer: 'Pour passer une commande, ajoutez simplement les produits souhaités à votre panier, puis cliquez sur "Passer la commande". Suivez les étapes de paiement et de livraison pour finaliser votre achat.'
  },
  {
    category: 'Commandes',
    question: 'Puis-je modifier ma commande après validation ?',
    answer: 'Vous pouvez modifier votre commande dans les 2 heures suivant sa validation en contactant notre service client. Passé ce délai, la commande est en préparation et ne peut plus être modifiée.'
  },
  {
    category: 'Livraison',
    question: 'Quels sont les délais de livraison ?',
    answer: 'La livraison standard prend 3-5 jours ouvrables. La livraison express (1-2 jours) est disponible moyennant un supplément. Les délais peuvent varier selon votre localisation.'
  },
  {
    category: 'Livraison',
    question: 'La livraison est-elle gratuite ?',
    answer: 'Oui ! La livraison est gratuite pour toute commande supérieure à 50€. En dessous de ce montant, des frais de livraison de 5,99€ s\'appliquent.'
  },
  {
    category: 'Paiement',
    question: 'Quels moyens de paiement acceptez-vous ?',
    answer: 'Nous acceptons les cartes bancaires (Visa, Mastercard, American Express), PayPal, et les virements bancaires. Tous les paiements sont sécurisés via SSL.'
  },
  {
    category: 'Paiement',
    question: 'Mes données bancaires sont-elles sécurisées ?',
    answer: 'Absolument. Nous utilisons le cryptage SSL et ne stockons jamais vos informations bancaires. Les paiements sont traités par des prestataires certifiés PCI-DSS.'
  },
  {
    category: 'Retours',
    question: 'Quelle est votre politique de retour ?',
    answer: 'Vous disposez de 30 jours pour retourner un produit. Les articles doivent être dans leur état d\'origine avec les étiquettes. Les frais de retour sont à votre charge sauf en cas de produit défectueux.'
  },
  {
    category: 'Retours',
    question: 'Comment effectuer un retour ?',
    answer: 'Connectez-vous à votre compte, accédez à "Mes commandes", sélectionnez la commande concernée et cliquez sur "Retourner un article". Suivez les instructions pour imprimer votre étiquette de retour.'
  },
  {
    category: 'Compte',
    question: 'Comment créer un compte ?',
    answer: 'Cliquez sur "Compte" dans le header, puis sur "Créer un compte". Remplissez le formulaire avec vos informations et validez. Vous recevrez un email de confirmation.'
  },
  {
    category: 'Compte',
    question: 'J\'ai oublié mon mot de passe, que faire ?',
    answer: 'Cliquez sur "Mot de passe oublié ?" sur la page de connexion. Entrez votre email et vous recevrez un lien pour réinitialiser votre mot de passe.'
  },
]

export default function HelpClient() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  // Filter FAQs based on search query
  const filteredFAQs = FAQ_DATA.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group FAQs by category
  const faqsByCategory = filteredFAQs.reduce((acc, faq, index) => {
    if (!acc[faq.category]) {
      acc[faq.category] = []
    }
    acc[faq.category]!.push({ ...faq, originalIndex: index })
    return acc
  }, {} as Record<string, Array<FAQItem & { originalIndex: number }>>)

  return (
    <div className="min-h-screen bg-platinum-50">
      {/* Hero Section */}
      <div className="bg-orange-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-center">
            Comment pouvons-nous vous aider ?
          </h1>
          <p className="text-xl text-center mb-8 text-orange-100">
            Trouvez rapidement des réponses à vos questions
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher dans l'aide..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-300 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          {/* Sidebar - Contact */}
          <aside className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="font-display text-xl font-bold mb-4 text-anthracite-700">
                Besoin d'aide ?
              </h2>
              <div className="space-y-4">
                <Link
                  href="mailto:support@mientior.com"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-orange-50 transition-colors group"
                >
                  <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                    <Mail className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-anthracite-700">Email</p>
                    <p className="text-xs text-nuanced-600">support@mientior.com</p>
                  </div>
                </Link>

                <Link
                  href="tel:+33123456789"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group"
                >
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-anthracite-700">Téléphone</p>
                    <p className="text-xs text-nuanced-600">27 20 00 00 00</p>
                  </div>
                </Link>

                <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors group w-full">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm text-anthracite-700">Chat en direct</p>
                    <p className="text-xs text-nuanced-600">Disponible 9h-18h</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-display text-lg font-bold mb-4 text-anthracite-700">
                Liens utiles
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/livraison" className="text-sm text-nuanced-600 hover:text-orange-600 transition-colors">
                    Informations de livraison
                  </Link>
                </li>
                <li>
                  <Link href="/garantie" className="text-sm text-nuanced-600 hover:text-orange-600 transition-colors">
                    Garantie et SAV
                  </Link>
                </li>
                <li>
                  <Link href="/cgv" className="text-sm text-nuanced-600 hover:text-orange-600 transition-colors">
                    Conditions générales
                  </Link>
                </li>
                <li>
                  <Link href="/confidentialite" className="text-sm text-nuanced-600 hover:text-orange-600 transition-colors">
                    Politique de confidentialité
                  </Link>
                </li>
              </ul>
            </div>
          </aside>

          {/* FAQ Section */}
          <div>
            <h2 className="font-display text-3xl font-bold mb-6 text-anthracite-700">
              Questions fréquentes
            </h2>

            {Object.keys(faqsByCategory).length > 0 ? (
              <div className="space-y-8">
                {Object.entries(faqsByCategory).map(([category, faqs]) => (
                  <div key={category}>
                    <h3 className="font-display text-xl font-bold mb-4 text-anthracite-700 flex items-center gap-2">
                      <span className="w-1 h-6 bg-orange-500 rounded-full" />
                      {category}
                    </h3>
                    <div className="space-y-3">
                      {faqs.map((faq) => (
                        <div
                          key={faq.originalIndex}
                          className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                          <button
                            onClick={() => toggleItem(faq.originalIndex)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-medium text-anthracite-700 pr-4">
                              {faq.question}
                            </span>
                            {expandedItems.has(faq.originalIndex) ? (
                              <ChevronUp className="w-5 h-5 text-nuanced-600 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-nuanced-600 flex-shrink-0" />
                            )}
                          </button>
                          {expandedItems.has(faq.originalIndex) && (
                            <div className="px-6 pb-4 text-nuanced-600 border-t border-gray-100 pt-4">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-anthracite-700 mb-2">
                  Aucun résultat trouvé
                </p>
                <p className="text-nuanced-600">
                  Essayez avec d'autres mots-clés ou contactez notre support
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
