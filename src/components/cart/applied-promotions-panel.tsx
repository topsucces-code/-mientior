import React from 'react'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PromotionBadge } from '@/components/cart/promotion-badge'
import { Info, TrendingDown, Tag, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/currency'
import { formatPromotionExpiry, isPromotionExpiringSoon } from '@/lib/promotion-utils'
import type { AppliedPromotion } from '@/types'
import { Button } from '@/components/ui/button'

interface AppliedPromotionsPanelProps {
  promotions: AppliedPromotion[]
  totalSavings: number
  className?: string
}

export function AppliedPromotionsPanel({
  promotions,
  totalSavings,
  className
}: AppliedPromotionsPanelProps) {
  if (!promotions || promotions.length === 0) {
    return (
      <Card className={cn("p-4 bg-platinum-50 border-dashed border-platinum-300", className)}>
        <div className="flex flex-col items-center text-center space-y-2">
          <Tag className="w-8 h-8 text-nuanced-400" />
          <p className="text-sm text-nuanced-600 font-medium">
            Aucune promotion active
          </p>
          <p className="text-xs text-nuanced-500">
            Profitez de nos offres exclusives pour économiser sur votre commande.
          </p>
          <Button variant="link" size="sm" className="text-orange-600 h-auto p-0 text-xs">
            Découvrir les offres
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {promotions.map((promo, index) => {
        const isExpiring = isPromotionExpiringSoon(promo.expiresAt)
        
        return (
          <Card 
            key={promo.id} 
            className={cn(
              "p-3 border transition-all animate-in fade-in slide-in-from-bottom-2",
              promo.type === 'manual' ? 'border-green-200 bg-green-50/30' : 'border-platinum-200 bg-white'
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <PromotionBadge 
                    type={promo.type} 
                    label={promo.label} 
                    size="sm"
                  />
                  {promo.code && (
                    <span className="text-xs font-mono bg-platinum-100 px-1.5 py-0.5 rounded text-anthracite-600 border border-platinum-200">
                      {promo.code}
                    </span>
                  )}
                </div>
                
                {promo.description && (
                  <p className="text-sm text-anthracite-700">
                    {promo.description}
                  </p>
                )}
                
                {promo.expiresAt && (
                  <div className={cn(
                    "flex items-center gap-1.5 text-xs",
                    isExpiring ? "text-orange-600 font-medium" : "text-nuanced-500"
                  )}>
                    <Calendar className="w-3 h-3" />
                    <span>{formatPromotionExpiry(promo.expiresAt)}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="font-bold text-green-600 whitespace-nowrap">
                  -{formatCurrency(promo.discount)}
                </span>
                
                {promo.conditions && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help p-1 hover:bg-platinum-100 rounded-full transition-colors">
                          <Info className="w-3.5 h-3.5 text-nuanced-400" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">{promo.conditions}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </Card>
        )
      })}

      {/* Total Savings Summary */}
      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
        <div className="flex items-center gap-2 text-green-700">
          <TrendingDown className="w-4 h-4" />
          <span className="font-medium text-sm">Total des économies</span>
        </div>
        <span className="text-lg font-bold text-green-700">
          -{formatCurrency(totalSavings)}
        </span>
      </div>
    </div>
  )
}
