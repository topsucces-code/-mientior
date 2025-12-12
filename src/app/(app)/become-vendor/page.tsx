'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Store, CheckCircle, Package, TrendingUp, Users, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const benefits = [
  {
    icon: Package,
    title: 'Gestion des produits',
    description: 'Ajoutez et gérez vos produits facilement avec notre interface intuitive.',
  },
  {
    icon: TrendingUp,
    title: 'Analytics avancés',
    description: 'Suivez vos ventes et performances avec des tableaux de bord détaillés.',
  },
  {
    icon: Users,
    title: 'Accès à des millions de clients',
    description: 'Vendez à travers toute l\'Afrique avec notre réseau de clients.',
  },
  {
    icon: Shield,
    title: 'Paiements sécurisés',
    description: 'Recevez vos paiements de manière sécurisée via Mobile Money ou virement.',
  },
]

export default function BecomeVendorPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    description: '',
    phone: '',
    city: '',
    country: 'SN',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/vendor/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la soumission')
      }

      toast.success('Demande envoyée !', {
        description: 'Votre demande de compte vendeur a été soumise. Nous vous contacterons sous 48h.',
      })

      router.push('/account')
    } catch (error) {
      toast.error('Erreur', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-12">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-turquoise-100 p-4">
            <Store className="h-12 w-12 text-turquoise-600" />
          </div>
        </div>
        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          Devenez vendeur sur Mientior
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          Rejoignez notre marketplace et vendez vos produits à des millions de clients à travers l'Afrique.
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {benefits.map((benefit) => (
          <Card key={benefit.title} className="text-center">
            <CardHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-turquoise-100">
                <benefit.icon className="h-6 w-6 text-turquoise-600" />
              </div>
              <CardTitle className="text-lg">{benefit.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{benefit.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Application Form */}
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Formulaire de candidature</CardTitle>
            <CardDescription>
              Remplissez ce formulaire pour soumettre votre demande de compte vendeur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Nom de l'entreprise *</Label>
                  <Input
                    id="businessName"
                    placeholder="Ma Boutique"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType">Type d'activité *</Label>
                  <Input
                    id="businessType"
                    placeholder="Mode, Électronique, etc."
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description de votre activité *</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre activité et les produits que vous souhaitez vendre..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+221 77 123 45 67"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    placeholder="Dakar"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Pays *</Label>
                <select
                  id="country"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                >
                  <option value="SN">Sénégal</option>
                  <option value="CI">Côte d'Ivoire</option>
                  <option value="CM">Cameroun</option>
                  <option value="NG">Nigeria</option>
                  <option value="GH">Ghana</option>
                  <option value="KE">Kenya</option>
                  <option value="ZA">Afrique du Sud</option>
                  <option value="MA">Maroc</option>
                  <option value="TN">Tunisie</option>
                  <option value="DZ">Algérie</option>
                </select>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900">Conditions d'acceptation</p>
                    <ul className="mt-2 list-inside list-disc space-y-1">
                      <li>Avoir une activité commerciale légale</li>
                      <li>Fournir des produits de qualité</li>
                      <li>Respecter les délais de livraison</li>
                      <li>Accepter les conditions générales de vente</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Envoi en cours...' : 'Soumettre ma candidature'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
