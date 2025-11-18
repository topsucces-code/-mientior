'use client'

import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/currency'

interface MobileStickyBarProps {
  total: number
  itemCount: number
  onCheckout: () => void
  disabled?: boolean
  className?: string
}

export function MobileStickyBar({ total, itemCount, onCheckout, disabled = false, className }: MobileStickyBarProps) {
  if (itemCount === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-platinum-300 shadow-elevation-3 md:hidden',
        'animate-in slide-in-from-bottom duration-300',
        'pb-safe', // Safe area for iOS
        className
      )}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Total */}
          <div>
            <p className="text-xs text-nuanced-500">Total ({itemCount} {itemCount > 1 ? 'articles' : 'article'})</p>
            <p className="text-lg font-bold text-orange-500">
              {formatCurrency(total)}
            </p>
          </div>

          {/* Checkout Button */}
          <Button
            variant="gradient"
            size="lg"
            onClick={onCheckout}
            disabled={disabled}
            className="flex-1 max-w-[200px]"
          >
            <Lock className="h-4 w-4 mr-2" />
            Commander
          </Button>
        </div>
      </div>
    </div>
  )
}
