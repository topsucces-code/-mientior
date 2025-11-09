'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { RippleButton } from '@/components/ui/ripple-button'
import { Trophy, Clock, Users, Flame, Target } from 'lucide-react'

export interface ChallengeCardProps {
  id: string
  title: string
  description: string
  type: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
  pointsReward: number
  progress: number
  target: number
  unit?: string
  timeRemaining?: string
  participantCount?: number
  featured?: boolean
  badgeIcon?: string
  onAccept?: (id: string) => void
  onClaim?: (id: string) => void
  status?: 'available' | 'in-progress' | 'completed' | 'expired'
  className?: string
}

const difficultyConfig = {
  EASY: { color: 'bg-success', label: 'Facile', icon: '⭐' },
  MEDIUM: { color: 'bg-aurore-500', label: 'Moyen', icon: '⭐⭐' },
  HARD: { color: 'bg-orange-500', label: 'Difficile', icon: '⭐⭐⭐' },
  EXPERT: { color: 'bg-error', label: 'Expert', icon: '⭐⭐⭐⭐' },
}

export function ChallengeCard({
  id,
  title,
  description,
  type,
  difficulty,
  pointsReward,
  progress,
  target,
  unit = 'actions',
  timeRemaining,
  participantCount,
  featured = false,
  badgeIcon,
  onAccept,
  onClaim,
  status = 'available',
  className,
}: ChallengeCardProps) {
  const progressPercentage = Math.min((progress / target) * 100, 100)
  const isCompleted = status === 'completed' || progress >= target
  const isExpired = status === 'expired'
  const isInProgress = status === 'in-progress'

  const difficultyInfo = difficultyConfig[difficulty]

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border-2 bg-white transition-all duration-300',
        featured && 'border-aurore-500 shadow-elevation-3',
        !featured && 'border-platinum-300 hover:border-orange-500 hover:shadow-elevation-2',
        isExpired && 'opacity-60 grayscale',
        className
      )}
    >
      {/* Featured Ribbon */}
      {featured && (
        <div className="absolute right-0 top-0 z-10">
          <div className="flex items-center gap-1 bg-gradient-to-r from-aurore-500 to-aurore-600 px-4 py-1 text-xs font-bold uppercase text-white shadow-lg">
            <Flame className="h-3 w-3" />
            Vedette
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant={isCompleted ? 'success' : isExpired ? 'error' : 'trending'}
                size="sm"
              >
                {isCompleted ? 'Terminé' : isExpired ? 'Expiré' : difficultyInfo.label}
              </Badge>
              {isInProgress && (
                <Badge variant="warning" size="sm">
                  En cours
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-bold text-anthracite-500">{title}</h3>
            <p className="mt-1 text-sm text-nuanced-500">{description}</p>
          </div>

          {/* Badge Icon */}
          {badgeIcon && (
            <div className="relative h-16 w-16 flex-shrink-0">
              <Image
                src={badgeIcon}
                alt="Challenge badge"
                fill
                className="object-contain"
              />
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-anthracite-500">
              Progression: {progress} / {target} {unit}
            </span>
            <span className="font-bold text-orange-500">{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-platinum-200">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isCompleted
                  ? 'bg-gradient-to-r from-success to-success-dark'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600'
              )}
              style={{ width: `${progressPercentage}%` }}
            />
            {/* Shimmer effect */}
            {isInProgress && !isCompleted && (
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent bg-[length:200%_100%]" />
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-3 gap-4">
          {/* Points Reward */}
          <div className="flex items-center gap-2 rounded-lg bg-platinum-100 p-3">
            <Trophy className="h-5 w-5 text-aurore-500" />
            <div>
              <p className="text-xs text-nuanced-500">Récompense</p>
              <p className="font-bold text-anthracite-500">{pointsReward} pts</p>
            </div>
          </div>

          {/* Time Remaining */}
          {timeRemaining && (
            <div className="flex items-center gap-2 rounded-lg bg-platinum-100 p-3">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-xs text-nuanced-500">Temps restant</p>
                <p className="font-bold text-anthracite-500">{timeRemaining}</p>
              </div>
            </div>
          )}

          {/* Participants */}
          {participantCount !== undefined && (
            <div className="flex items-center gap-2 rounded-lg bg-platinum-100 p-3">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-nuanced-500">Participants</p>
                <p className="font-bold text-anthracite-500">
                  {participantCount > 1000
                    ? `${(participantCount / 1000).toFixed(1)}k`
                    : participantCount}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex gap-2">
          {isCompleted && (
            <RippleButton
              variant="gradient"
              className="w-full"
              onClick={() => onClaim?.(id)}
            >
              <Trophy className="h-4 w-4" />
              Réclamer la récompense
            </RippleButton>
          )}

          {!isCompleted && !isExpired && !isInProgress && (
            <RippleButton
              variant="default"
              className="w-full"
              onClick={() => onAccept?.(id)}
            >
              <Target className="h-4 w-4" />
              Accepter le défi
            </RippleButton>
          )}

          {isInProgress && !isCompleted && (
            <RippleButton variant="outline" className="w-full" disabled>
              <Clock className="h-4 w-4" />
              En cours...
            </RippleButton>
          )}

          {isExpired && (
            <RippleButton variant="outline" className="w-full" disabled>
              Expiré
            </RippleButton>
          )}
        </div>
      </div>

      {/* Completion Celebration Overlay */}
      {isCompleted && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-success/10 to-transparent" />
      )}
    </div>
  )
}

