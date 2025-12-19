'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Trophy, Star, Crown, Gem, Zap } from 'lucide-react'

export interface LoyaltyLevel {
  name: string
  minPoints: number
  maxPoints: number
  color: string
  icon: React.ReactNode
  perks: string[]
}

export interface LoyaltyProgressProps {
  currentPoints: number
  levels?: LoyaltyLevel[]
  className?: string
}

const defaultLevels: LoyaltyLevel[] = [
  {
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 999,
    color: 'bg-amber-800',
    icon: <Star className="h-6 w-6" />,
    perks: ['5% de réduction', 'Livraison standard gratuite'],
  },
  {
    name: 'Argent',
    minPoints: 1000,
    maxPoints: 4999,
    color: 'bg-gray-600',
    icon: <Trophy className="h-6 w-6" />,
    perks: ['10% de réduction', 'Livraison express gratuite', 'Accès anticipé aux ventes'],
  },
  {
    name: 'Or',
    minPoints: 5000,
    maxPoints: 14999,
    color: 'bg-aurore-600',
    icon: <Crown className="h-6 w-6" />,
    perks: ['15% de réduction', 'Livraison prioritaire', 'Cadeaux exclusifs', 'Support VIP'],
  },
  {
    name: 'Platine',
    minPoints: 15000,
    maxPoints: Infinity,
    color: 'bg-purple-700',
    icon: <Gem className="h-6 w-6" />,
    perks: [
      '20% de réduction',
      'Livraison gratuite illimitée',
      'Événements exclusifs',
      'Concierge personnel',
      'Produits en édition limitée',
    ],
  },
]

export function LoyaltyProgress({
  currentPoints,
  levels = defaultLevels,
  className,
}: LoyaltyProgressProps) {
  const currentLevel = levels.find(
    (level) => currentPoints >= level.minPoints && currentPoints <= level.maxPoints
  ) ?? levels[0]!

  const currentLevelIndex = levels.indexOf(currentLevel)
  const nextLevel = levels[currentLevelIndex + 1]
  const isMaxLevel = !nextLevel

  const progressToNextLevel = isMaxLevel
    ? 100
    : ((currentPoints - currentLevel.minPoints) /
      (nextLevel.minPoints - currentLevel.minPoints)) *
    100

  const pointsToNextLevel = isMaxLevel ? 0 : nextLevel.minPoints - currentPoints

  return (
    <div className={cn('rounded-xl bg-white p-6 shadow-elevation-2', className)}>
      {/* Current Level Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full text-white shadow-elevation-2',
              currentLevel.color
            )}
          >
            {currentLevel.icon}
          </div>
          <div>
            <p className="text-sm font-medium text-nuanced-500">Niveau actuel</p>
            <h3 className="text-2xl font-bold text-anthracite-500">{currentLevel.name}</h3>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm font-medium text-nuanced-500">Points totaux</p>
          <p className="font-display text-3xl font-extrabold text-orange-500" style={{ fontFeatureSettings: '"tnum"' }}>
            {currentPoints.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Progress to Next Level */}
      {!isMaxLevel && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-anthracite-500">
              Progression vers {nextLevel.name}
            </span>
            <span className="font-bold text-orange-500">
              {pointsToNextLevel.toLocaleString()} points restants
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-4 overflow-hidden rounded-full bg-platinum-200">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                currentLevel.color
              )}
              style={{ width: `${progressToNextLevel}%` }}
            />
            {/* Shimmer effect */}
            {/* Shimmer removed for solid colors */}
          </div>

          {/* Milestones */}
          <div className="mt-4 flex justify-between">
            {levels.slice(0, -1).map((level, index) => {
              const isPassed = currentPoints >= level.minPoints
              const isCurrent = level.name === currentLevel.name

              return (
                <div key={level.name} className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                      isPassed
                        ? `border-transparent ${level.color} text-white shadow-elevation-1`
                        : 'border-platinum-400 bg-white text-platinum-400',
                      isCurrent && 'ring-4 ring-orange-500/30 scale-110'
                    )}
                  >
                    {React.isValidElement(level.icon) &&
                      React.cloneElement(level.icon, {
                        className: 'h-5 w-5',
                      } as any)}
                  </div>
                  <p
                    className={cn(
                      'text-xs font-medium',
                      isPassed ? 'text-anthracite-500' : 'text-nuanced-500'
                    )}
                  >
                    {level.name}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Max Level Achievement */}
      {isMaxLevel && (
        <div className="mb-6 rounded-lg bg-aurore-600 p-4 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Zap className="h-5 w-5 text-white" />
            <p className="font-bold text-white">Niveau Maximum Atteint !</p>
            <Zap className="h-5 w-5 text-white" />
          </div>
          <p className="text-sm text-anthracite-500">
            Vous avez débloqué tous les avantages premium
          </p>
        </div>
      )}

      {/* Current Level Perks */}
      <div>
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-anthracite-500">
          <Star className="h-4 w-4 text-aurore-500" />
          Vos avantages actuels
        </h4>
        <div className="grid gap-2">
          {currentLevel.perks.map((perk, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg bg-platinum-100 p-3 transition-all hover:bg-platinum-200"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-white">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-anthracite-500">{perk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next Level Preview */}
      {nextLevel && (
        <div className="mt-6 rounded-lg border-2 border-dashed border-platinum-300 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-nuanced-500">
            <Trophy className="h-4 w-4" />
            Débloquez au niveau {nextLevel.name}
          </h4>
          <div className="grid gap-2">
            {nextLevel.perks.slice(currentLevel.perks.length).map((perk, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg bg-platinum-50 p-3 opacity-60"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-platinum-400">
                  <svg
                    className="h-4 w-4 text-platinum-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-nuanced-500">{perk}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

