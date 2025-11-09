'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/ui/product-card'
import { FortuneWheel, type WheelSegment } from '@/components/gamification/fortune-wheel'
import { ChallengeCard } from '@/components/gamification/challenge-card'
import { LoyaltyProgress } from '@/components/gamification/loyalty-progress'
import { Sparkles, Flame, TrendingUp } from 'lucide-react'

export default function DesignShowcasePage() {
  const [wheelResult, setWheelResult] = React.useState<WheelSegment | null>(null)

  const wheelSegments: WheelSegment[] = [
    { id: '1', label: '10% OFF', value: 'Réduction de 10%', color: '#FF6B00', probability: 0.25 },
    { id: '2', label: 'Livraison Gratuite', value: 'Livraison gratuite', color: '#2563EB', probability: 0.3 },
    { id: '3', label: '20% OFF', value: 'Réduction de 20%', color: '#FFC107', probability: 0.15 },
    { id: '4', label: 'Cadeau Mystère', value: 'Cadeau surprise', color: '#10b981', probability: 0.1 },
    { id: '5', label: '5% OFF', value: 'Réduction de 5%', color: '#8B5CF6', probability: 0.2 },
  ]

  return (
    <div className="min-h-screen bg-platinum-100 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 font-display text-5xl font-extrabold text-anthracite-500">
            Système de Design Mientior
          </h1>
          <p className="text-lg text-nuanced-500">
            Expérience e-commerce sophistiquée avec gamification intégrée
          </p>
        </div>

        {/* Badges Section */}
        <section className="mb-16">
          <h2 className="mb-6 text-3xl font-bold text-anthracite-500">
            Système de Badges Hiérarchique
          </h2>
          <div className="rounded-xl bg-white p-8 shadow-elevation-2">
            <div className="space-y-6">
              {/* Tier 1 - Urgence */}
              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-nuanced-500">
                  Tier 1 - Urgence
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="flash" icon={<Flame className="h-3 w-3" />}>
                    Vente Flash
                  </Badge>
                  <Badge variant="urgent">Dernières Pièces</Badge>
                  <Badge variant="flash" pulse>
                    Offre Limitée
                  </Badge>
                </div>
              </div>

              {/* Tier 2 - Performance */}
              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-nuanced-500">
                  Tier 2 - Performance
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="bestseller" icon={<Flame className="h-3 w-3" />}>
                    Bestseller
                  </Badge>
                  <Badge variant="trending" icon={<TrendingUp className="h-3 w-3" />}>
                    Trending
                  </Badge>
                </div>
              </div>

              {/* Tier 3 - Nouveauté */}
              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-nuanced-500">
                  Tier 3 - Nouveauté
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="new" icon={<Sparkles className="h-3 w-3" />}>
                    Nouveau
                  </Badge>
                  <Badge variant="new">Juste Arrivé</Badge>
                </div>
              </div>

              {/* Autres */}
              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-nuanced-500">
                  Autres Variantes
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="success">En Stock</Badge>
                  <Badge variant="warning">Stock Limité</Badge>
                  <Badge variant="error">Épuisé</Badge>
                  <Badge variant="default">Standard</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Cards Section */}
        <section className="mb-16">
          <h2 className="mb-6 text-3xl font-bold text-anthracite-500">
            Cards Produits Sophistiquées
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ProductCard
              id="1"
              name="Montre Élégante Premium"
              slug="montre-elegante-premium"
              price={199.99}
              compareAtPrice={399.99}
              image="/placeholder-product.jpg"
              rating={4.8}
              reviewCount={12300}
              badge={{ text: "Vente Flash", variant: "flash" }}
              freeShipping={true}
              inStock={true}
            />
            <ProductCard
              id="2"
              name="Sac à Main Designer"
              slug="sac-a-main-designer"
              price={149.99}
              image="/placeholder-product.jpg"
              rating={4.5}
              reviewCount={8500}
              badge={{ text: "Bestseller", variant: "bestseller" }}
              freeShipping={true}
              inStock={true}
            />
            <ProductCard
              id="3"
              name="Lunettes de Soleil Tendance"
              slug="lunettes-soleil-tendance"
              price={89.99}
              compareAtPrice={129.99}
              image="/placeholder-product.jpg"
              rating={4.9}
              reviewCount={5200}
              badge={{ text: "Nouveau", variant: "new" }}
              inStock={true}
            />
            <ProductCard
              id="4"
              name="Chaussures Sport Premium"
              slug="chaussures-sport-premium"
              price={179.99}
              image="/placeholder-product.jpg"
              rating={4.7}
              reviewCount={15600}
              badge={{ text: "Trending", variant: "trending" }}
              freeShipping={true}
              inStock={false}
            />
          </div>
        </section>

        {/* Gamification Section */}
        <section className="mb-16">
          <h2 className="mb-6 text-3xl font-bold text-anthracite-500">
            Gamification - Roue de la Fortune
          </h2>
          <div className="rounded-xl bg-white p-8 shadow-elevation-2">
            <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center">
              <div className="flex-shrink-0">
                <FortuneWheel
                  segments={wheelSegments}
                  spinsRemaining={3}
                  onComplete={(result) => {
                    setWheelResult(result)
                    console.log('Résultat:', result)
                  }}
                />
              </div>
              {wheelResult && (
                <div className="max-w-md rounded-lg bg-platinum-100 p-6">
                  <h3 className="mb-4 text-xl font-bold text-anthracite-500">
                    Dernier Résultat
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-nuanced-500">
                      <span className="font-semibold">Label:</span> {wheelResult.label}
                    </p>
                    <p className="text-sm text-nuanced-500">
                      <span className="font-semibold">Valeur:</span> {wheelResult.value}
                    </p>
                    <div
                      className="mt-4 h-12 w-12 rounded-full"
                      style={{ backgroundColor: wheelResult.color }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Challenges Section */}
        <section className="mb-16">
          <h2 className="mb-6 text-3xl font-bold text-anthracite-500">
            Défis Quotidiens
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChallengeCard
              id="1"
              title="Shopping Spree"
              description="Effectuez 3 achats ce mois-ci pour débloquer des points bonus"
              type="PURCHASE_COUNT"
              difficulty="MEDIUM"
              pointsReward={500}
              progress={2}
              target={3}
              unit="achats"
              timeRemaining="15 jours"
              participantCount={12500}
              status="in-progress"
            />
            <ChallengeCard
              id="2"
              title="Critique Expert"
              description="Laissez 5 avis détaillés sur vos produits préférés"
              type="PRODUCT_REVIEW"
              difficulty="EASY"
              pointsReward={250}
              progress={5}
              target={5}
              unit="avis"
              participantCount={8300}
              status="completed"
            />
            <ChallengeCard
              id="3"
              title="Ambassadeur Social"
              description="Partagez 10 produits sur vos réseaux sociaux"
              type="SOCIAL_SHARE"
              difficulty="HARD"
              pointsReward={1000}
              progress={3}
              target={10}
              unit="partages"
              timeRemaining="7 jours"
              participantCount={3200}
              featured={true}
              status="in-progress"
            />
            <ChallengeCard
              id="4"
              title="Connexion Quotidienne"
              description="Connectez-vous pendant 7 jours consécutifs"
              type="DAILY_LOGIN"
              difficulty="EASY"
              pointsReward={150}
              progress={4}
              target={7}
              unit="jours"
              timeRemaining="3 jours"
              participantCount={25000}
              status="in-progress"
            />
          </div>
        </section>

        {/* Loyalty Program Section */}
        <section className="mb-16">
          <h2 className="mb-6 text-3xl font-bold text-anthracite-500">
            Programme de Fidélité
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <LoyaltyProgress currentPoints={750} />
            <LoyaltyProgress currentPoints={8500} />
          </div>
        </section>
      </div>
    </div>
  )
}

