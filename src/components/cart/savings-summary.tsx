import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Sparkles, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/currency'
import { calculateDiscountPercentage } from '@/lib/promotion-utils'
import type { SavingsSummaryProps } from '@/types'

export function SavingsSummary({
  subtotal,
  discount,
  showConfetti = false,
  className
}: SavingsSummaryProps) {
  const [progressValue, setProgressValue] = useState(0)
  
  // Calculate percentage (use 0 if no discount to avoid NaN)
  const hasDiscount = discount && discount > 0
  const percentage = hasDiscount ? calculateDiscountPercentage(subtotal, subtotal - discount) : 0
  
  // Animate progress bar on mount
  useEffect(() => {
    if (!hasDiscount) return
    const timer = setTimeout(() => {
      setProgressValue(percentage)
    }, 300)
    return () => clearTimeout(timer)
  }, [percentage, hasDiscount])

  // Trigger confetti animation
  useEffect(() => {
    if (showConfetti && hasDiscount) {
      import('canvas-confetti').then((confettiModule) => {
        const runConfetti = confettiModule.default
        runConfetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#FF6B00', '#10B981', '#FFC107'],
          disableForReducedMotion: true,
          zIndex: 9999,
        })
      })
    }
  }, [showConfetti, hasDiscount])

  // Don't render if no discount
  if (!hasDiscount) return null

  return (
    <Card className={cn(
      "overflow-hidden border-green-100 bg-gradient-to-br from-green-50/50 to-emerald-50/30 animate-in zoom-in-95 duration-300",
      className
    )}>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-green-700 font-medium">
              {showConfetti ? (
                <PartyPopper className="w-5 h-5 animate-bounce" />
              ) : (
                <Sparkles className="w-5 h-5 text-green-600" />
              )}
              <h3>Économies réalisées</h3>
            </div>
            <p className="text-sm text-green-600/90">
              Bravo ! Vous économisez <span className="font-bold">{percentage}%</span> sur cette commande
            </p>
          </div>
          
          <div className="text-right">
            <span className="block text-2xl font-bold text-green-600 tracking-tight">
              -{formatCurrency(discount)}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-nuanced-500">
            <span>0%</span>
            <span>{percentage}% d'économie</span>
          </div>
          <Progress 
            value={progressValue} 
            className="h-2.5 bg-green-100" 
            indicatorClassName="bg-gradient-to-r from-green-400 to-green-600"
          />
        </div>
      </div>
    </Card>
  )
}
