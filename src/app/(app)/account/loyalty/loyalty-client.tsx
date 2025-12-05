'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Award, Gift, Star, TrendingUp, ArrowLeft, ShoppingBag, Clock, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Tier {
  name: string
  minPoints: number
  benefits: string[]
}

interface LoyaltyTransaction {
  id: string
  type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST'
  points: number
  description: string
  orderId?: string
  createdAt: string
}

interface LoyaltyData {
  points: number
  level: string
  currentTier: Tier
  nextTier?: Tier
  pointsToNextTier: number
  transactions: LoyaltyTransaction[]
  tiers: Tier[]
}

interface LoyaltyPageClientProps {
  data: LoyaltyData | null
}

export function LoyaltyPageClient({ data }: LoyaltyPageClientProps) {
  const router = useRouter()

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Award className="mb-4 h-16 w-16 text-platinum-400" />
        <h1 className="mb-2 text-2xl font-bold text-anthracite-700">Loyalty Program</h1>
        <p className="mb-6 text-nuanced-600">Start earning points with your first purchase!</p>
        <Button onClick={() => router.push('/products')}>
          <ShoppingBag className="mr-2 h-4 w-4" />
          Shop Now
        </Button>
      </div>
    )
  }

  const progressPercent = data.nextTier 
    ? ((data.points - data.currentTier.minPoints) / (data.nextTier.minPoints - data.currentTier.minPoints)) * 100
    : 100

  const getTierColor = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'bronze': return 'from-amber-600 to-amber-800'
      case 'silver': return 'from-gray-400 to-gray-600'
      case 'gold': return 'from-yellow-400 to-yellow-600'
      case 'platinum': return 'from-purple-400 to-purple-600'
      default: return 'from-orange-400 to-orange-600'
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'EARN': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'REDEEM': return <Gift className="h-4 w-4 text-orange-500" />
      case 'EXPIRE': return <Clock className="h-4 w-4 text-red-500" />
      default: return <Star className="h-4 w-4 text-blue-500" />
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
          Back to Account
        </button>
        <h1 className="text-2xl font-bold text-anthracite-700">Loyalty Program</h1>
        <p className="text-nuanced-600">Earn points and unlock exclusive rewards</p>
      </div>

      {/* Points Card */}
      <div className={`mb-8 rounded-2xl bg-gradient-to-br ${getTierColor(data.level)} p-6 text-white shadow-lg`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-80">Your Points</p>
            <p className="text-4xl font-bold">{data.points.toLocaleString()}</p>
          </div>
          <div className="rounded-full bg-white/20 p-3">
            <Award className="h-8 w-8" />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{data.currentTier.name}</span>
            {data.nextTier && <span className="opacity-80">{data.nextTier.name}</span>}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/30">
            <div 
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          {data.nextTier && (
            <p className="mt-2 text-sm opacity-80">
              {data.pointsToNextTier.toLocaleString()} points to {data.nextTier.name}
            </p>
          )}
        </div>
      </div>

      {/* Current Benefits */}
      <div className="mb-8 rounded-lg border border-platinum-200 bg-white p-6">
        <h2 className="mb-4 flex items-center text-lg font-semibold text-anthracite-700">
          <Gift className="mr-2 h-5 w-5 text-orange-500" />
          Your {data.currentTier.name} Benefits
        </h2>
        <ul className="space-y-3">
          {data.currentTier.benefits.map((benefit, idx) => (
            <li key={idx} className="flex items-center text-nuanced-600">
              <Check className="mr-3 h-5 w-5 text-green-500" />
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      {/* All Tiers */}
      <div className="mb-8 rounded-lg border border-platinum-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-anthracite-700">All Tiers</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.tiers.map((tier) => {
            const isCurrentTier = tier.name === data.currentTier.name
            const isUnlocked = data.points >= tier.minPoints
            
            return (
              <div 
                key={tier.name}
                className={`rounded-lg border p-4 ${
                  isCurrentTier 
                    ? 'border-orange-300 bg-orange-50' 
                    : isUnlocked 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-platinum-200 bg-platinum-50'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className={`font-semibold ${isCurrentTier ? 'text-orange-700' : 'text-anthracite-700'}`}>
                    {tier.name}
                  </span>
                  {isCurrentTier && (
                    <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs text-white">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm text-nuanced-600">
                  {tier.minPoints.toLocaleString()} points
                </p>
                <ul className="mt-2 space-y-1">
                  {tier.benefits.slice(0, 2).map((benefit, idx) => (
                    <li key={idx} className="text-xs text-nuanced-500">
                      • {benefit}
                    </li>
                  ))}
                  {tier.benefits.length > 2 && (
                    <li className="text-xs text-nuanced-400">
                      +{tier.benefits.length - 2} more
                    </li>
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      {/* Transaction History */}
      <div className="rounded-lg border border-platinum-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-anthracite-700">Points History</h2>
        
        {data.transactions.length === 0 ? (
          <div className="py-8 text-center text-nuanced-600">
            <Clock className="mx-auto mb-2 h-8 w-8 text-platinum-400" />
            <p>No transactions yet</p>
            <p className="text-sm">Start shopping to earn points!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.transactions.map((tx) => (
              <div 
                key={tx.id}
                className="flex items-center justify-between rounded-lg border border-platinum-100 p-3"
              >
                <div className="flex items-center gap-3">
                  {getTransactionIcon(tx.type)}
                  <div>
                    <p className="font-medium text-anthracite-700">{tx.description}</p>
                    <p className="text-sm text-nuanced-500">
                      {new Date(tx.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${tx.type === 'EARN' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'EARN' ? '+' : '-'}{tx.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How to Earn */}
      <div className="mt-8 rounded-lg border border-platinum-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-anthracite-700">How to Earn Points</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <ShoppingBag className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-medium text-anthracite-700">Shop</h3>
            <p className="text-sm text-nuanced-600">Earn 1 point per €1 spent</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Star className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-medium text-anthracite-700">Review</h3>
            <p className="text-sm text-nuanced-600">50 points per review</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <Gift className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-medium text-anthracite-700">Refer</h3>
            <p className="text-sm text-nuanced-600">200 points per referral</p>
          </div>
        </div>
      </div>
    </div>
  )
}
