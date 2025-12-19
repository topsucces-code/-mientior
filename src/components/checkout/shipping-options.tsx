'use client'

import * as React from 'react'
import { Clock, Package, Truck, Zap, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import type { ShippingOption } from '@/types'

interface ShippingOptionsProps {
  options: ShippingOption[]
  selectedOption?: string
  onSelect: (optionId: string) => void
  onContinue: () => void
  onBack?: () => void
  isLoading?: boolean
  className?: string
  currency?: string
}

const getShippingIcon = (name: string) => {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('express') || lowerName.includes('overnight')) {
    return Zap
  }
  if (lowerName.includes('standard')) {
    return Package
  }
  return Truck
}

export function ShippingOptions({
  options,
  selectedOption,
  onSelect,
  onContinue,
  onBack,
  isLoading = false,
  className,
  currency = 'XOF',
}: ShippingOptionsProps) {
  const [selected, setSelected] = React.useState<string>(selectedOption || '')

  const handleSelect = (value: string) => {
    setSelected(value)
    onSelect(value)
  }

  const handleContinue = () => {
    if (selected) {
      onContinue()
    }
  }

  const selectedOptionData = options.find((opt) => opt.id === selected)

  return (
    <Card className={cn('shadow-elevation-2', className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-anthracite-700">
          Mode de livraison
        </CardTitle>
        <p className="text-sm text-nuanced-500">
          Choisissez votre option de livraison préférée
        </p>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {isLoading && options.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 rounded-lg border-2 border-platinum-300 p-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <div className="flex flex-1 items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-center gap-2 py-4 text-nuanced-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Chargement des options de livraison...</span>
            </div>
          </div>
        )}

        {/* No Options Available */}
        {!isLoading && options.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <AlertCircle className="h-12 w-12 text-orange-400" />
            <div>
              <p className="font-medium text-anthracite-700">
                Aucune option de livraison disponible
              </p>
              <p className="mt-1 text-sm text-nuanced-500">
                Veuillez vérifier votre adresse ou réessayer plus tard.
              </p>
            </div>
          </div>
        )}

        {/* Shipping Options List */}
        <RadioGroup value={selected} onValueChange={handleSelect} className={cn("space-y-3", options.length === 0 && "hidden")}>
          {options.map((option) => {
            const Icon = getShippingIcon(option.name)
            const isSelected = selected === option.id
            const isFree = option.price === 0

            return (
              <div key={option.id}>
                <Label
                  htmlFor={option.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-all',
                    isSelected
                      ? 'border-orange-500 bg-orange-50/50 shadow-elevation-1'
                      : 'border-platinum-300 hover:border-platinum-400 hover:bg-platinum-50'
                  )}
                >
                  <RadioGroupItem value={option.id} id={option.id} className="mt-1" />

                  <div className="flex flex-1 items-start gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                        isSelected ? 'bg-orange-500 text-white' : 'bg-platinum-200 text-anthracite-600'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-anthracite-700">
                            {option.name}
                          </p>
                          {option.carrier && (
                            <p className="text-xs text-nuanced-500">
                              via {option.carrier}
                            </p>
                          )}
                        </div>
                        <p className="flex-shrink-0 text-right font-semibold">
                          {isFree ? (
                            <span className="text-success">Gratuit</span>
                          ) : (
                            <span className="text-anthracite-700">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency }).format(option.price / 100)}
                            </span>
                          )}
                        </p>
                      </div>

                      {option.description && (
                        <p className="text-sm text-nuanced-500">{option.description}</p>
                      )}

                      <div className="flex items-center gap-1 text-xs text-nuanced-600">
                        <Clock className="h-3 w-3" />
                        <span>
                          {option.estimatedDays === 1
                            ? '1 jour ouvré'
                            : `${option.estimatedDays} jours ouvrés`}
                        </span>
                        {option.cutoffTime && (
                          <span className="text-nuanced-500">
                            (Commander avant {option.cutoffTime})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            )
          })}
        </RadioGroup>

        {/* Selected Option Summary */}
        {selectedOptionData && (
          <div className="mt-4 rounded-lg bg-platinum-100 p-4">
            <p className="text-sm font-medium text-anthracite-700">
              Livraison sélectionnée : {selectedOptionData.name}
            </p>
            <p className="mt-1 text-xs text-nuanced-500">
              Délai estimé : {selectedOptionData.estimatedDays === 1 ? '1 jour' : `${selectedOptionData.estimatedDays} jours`}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-between">
          {onBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isLoading}
              className="sm:w-auto"
            >
              Retour
            </Button>
          )}
          <Button
            type="button"
            variant="gradient"
            onClick={handleContinue}
            disabled={!selected || isLoading}
            className="sm:ml-auto sm:w-auto"
          >
            {isLoading ? 'Traitement...' : 'Continuer vers le paiement'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
