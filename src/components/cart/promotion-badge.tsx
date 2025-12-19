import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PromotionBadgeProps, PromotionType } from '@/types'
import { getPromotionIcon } from '@/lib/promotion-utils'

export function PromotionBadge({
  type,
  label,
  discount,
  icon,
  size = 'md',
  className
}: PromotionBadgeProps) {
  const Icon = icon || getPromotionIcon(type)
  
  const getVariantStyles = (type: PromotionType) => {
    switch (type) {
      case 'automatic':
        return 'bg-turquoise-100 text-turquoise-700 hover:bg-turquoise-200 border-turquoise-200'
      case 'manual':
        return 'bg-turquoise-100 text-turquoise-700 hover:bg-turquoise-200 border-turquoise-200'
      case 'sale':
        return 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200'
      case 'new':
        return 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200'
      default:
        return 'bg-platinum-100 text-anthracite-700 hover:bg-platinum-200 border-platinum-200'
    }
  }

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-0.5 text-xs h-6',
    lg: 'px-3 py-1 text-sm h-7'
  }
  
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium flex items-center gap-1.5 transition-all hover:scale-105 hover:shadow-sm border',
        getVariantStyles(type),
        sizeStyles[size],
        className
      )}
    >
      {React.isValidElement(Icon) ? (
        Icon
      ) : (
        // @ts-expect-error - Icon can be a component
        <Icon className={cn('w-3 h-3', size === 'lg' && 'w-4 h-4')} />
      )}
      <span>{label}</span>
      {discount && (
        <span className="font-bold ml-0.5">{discount}</span>
      )}
    </Badge>
  )
}
