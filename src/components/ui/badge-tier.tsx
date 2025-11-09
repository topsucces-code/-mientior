'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from './badge'
import { Flame, Star, TrendingUp, Sparkles } from 'lucide-react'

type Tier1Variant = 'flash-sale' | 'last-pieces' | 'limited-time'
type Tier2Variant = 'bestseller' | 'top-rated' | 'trending'
type Tier3Variant = 'new' | 'just-arrived'

type BadgeTier = 1 | 2 | 3

interface BadgeTierProps extends React.HTMLAttributes<HTMLDivElement> {
  tier: BadgeTier
  variant: Tier1Variant | Tier2Variant | Tier3Variant
  timer?: string // For tier 1 countdown
}

const tierIcons = {
  'flash-sale': Flame,
  'last-pieces': Flame,
  'limited-time': Flame,
  'bestseller': Flame,
  'top-rated': Star,
  'trending': TrendingUp,
  'new': Sparkles,
  'just-arrived': Sparkles,
}

const tierLabels = {
  'flash-sale': 'Vente Flash',
  'last-pieces': 'Dernières Pièces',
  'limited-time': 'Offre Limitée',
  'bestseller': 'Bestseller',
  'top-rated': 'Top Noté',
  'trending': 'Tendance',
  'new': 'Nouveau',
  'just-arrived': 'Arrivage',
}

function BadgeTier({ tier, variant, timer, className, ...props }: BadgeTierProps) {
  const Icon = tierIcons[variant]

  const getTierStyles = () => {
    switch (tier) {
      case 1:
        // Urgency - Orange gradient + pulse
        return cn(
          'gradient-orange text-white animate-pulse-subtle',
          'shadow-elevation-2'
        )
      case 2:
        // Performance - Blue + icon
        return cn('bg-blue-500 text-white', 'shadow-elevation-1')
      case 3:
        // Novelty - Aurore gradient
        return cn(
          'gradient-aurore text-anthracite-500',
          'shimmer-effect shadow-elevation-1'
        )
      default:
        return ''
    }
  }

  return (
    <Badge
      className={cn(
        'absolute top-8 left-8 z-10',
        'rounded-sm px-8 py-4',
        'text-[11px] font-semibold uppercase tracking-wider',
        'flex items-center gap-1',
        getTierStyles(),
        className
      )}
      {...props}
    >
      <Icon className="h-3 w-3" />
      <span>{tierLabels[variant]}</span>
      {timer && tier === 1 && (
        <span className="ml-1 font-mono text-[10px]">{timer}</span>
      )}
    </Badge>
  )
}

export { BadgeTier }
export type { BadgeTierProps, Tier1Variant, Tier2Variant, Tier3Variant, BadgeTier }
