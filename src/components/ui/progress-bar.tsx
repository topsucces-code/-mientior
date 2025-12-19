'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number // 0-100
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
  animated?: boolean
}

function ProgressBar({
  value,
  showLabel = false,
  size = 'md',
  variant = 'default',
  animated = false,
  className,
  ...props
}: ProgressBarProps) {
  const normalizedValue = Math.min(100, Math.max(0, value))

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  const variantClasses = {
    default: 'gradient-orange',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  }

  return (
    <div
      className={cn('w-full', className)}
      role="progressbar"
      aria-valuenow={normalizedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <div className={cn('relative w-full overflow-hidden rounded-full bg-platinum-200', sizeClasses[size])}>
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out',
            variantClasses[variant],
            animated && 'relative overflow-hidden'
          )}
          style={{ width: `${normalizedValue}%` }}
        >
          {/* Shimmer removed for solid colors */}
        </div>
      </div>
      {showLabel && (
        <div className="mt-1 text-right text-xs text-nuanced-500">
          {Math.round(normalizedValue)}%
        </div>
      )}
    </div>
  )
}

export { ProgressBar }
export type { ProgressBarProps }
