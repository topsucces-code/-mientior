'use client'

import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  onReset: () => void
  hasActiveFilters: boolean
}

export function EmptyState({ onReset, hasActiveFilters }: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-20 px-4 text-center mx-auto max-w-[500px]',
        !prefersReducedMotion && 'animate-fade-in-up'
      )}
    >
      {/* Icon Illustration */}
      <div className="w-60 h-60 mb-6 rounded-full bg-platinum-200 flex items-center justify-center opacity-60">
        <Search className="w-24 h-24 text-nuanced-400" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-anthracite-700 mb-3">
        Aucun produit ne correspond à vos critères
      </h2>

      {/* Suggestions */}
      {hasActiveFilters && (
        <div className="mb-6">
          <p className="text-base text-nuanced-600 mb-3">Essayez de:</p>
          <ul className="text-left space-y-2 text-base text-nuanced-600">
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span>Élargir vos filtres</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span>Vérifier l'orthographe</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span>Utiliser des termes plus généraux</span>
            </li>
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        {hasActiveFilters && (
          <Button
            onClick={onReset}
            className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-6 py-3"
          >
            RÉINITIALISER LES FILTRES
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => (window.location.href = '/categories')}
          className="font-medium px-6 py-3 border-2"
        >
          PARCOURIR TOUTES LES CATÉGORIES
        </Button>
      </div>
    </div>
  )
}
