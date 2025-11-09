'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressCircularProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  showLabel?: boolean
  color?: 'orange' | 'blue' | 'aurore' | 'success' | 'warning' | 'error'
  backgroundColor?: string
}

function ProgressCircular({
  value,
  size = 100,
  strokeWidth = 8,
  showLabel = false,
  color = 'orange',
  backgroundColor = '#E9ECEF',
  className,
  ...props
}: ProgressCircularProps) {
  const normalizedValue = Math.min(100, Math.max(0, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference

  const colorMap = {
    orange: 'url(#orange-gradient)',
    blue: 'url(#blue-gradient)',
    aurore: 'url(#aurore-gradient)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  }

  const strokeColor = colorMap[color]

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      role="progressbar"
      aria-valuenow={normalizedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ transition: 'transform 0.3s ease' }}
      >
        <defs>
          <linearGradient id="orange-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6B00" />
            <stop offset="100%" stopColor="#FF8C00" />
          </linearGradient>
          <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id="aurore-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFC107" />
            <stop offset="100%" stopColor="#FFD54F" />
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.3s ease',
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-price font-bold">{Math.round(normalizedValue)}%</span>
        </div>
      )}
    </div>
  )
}

export { ProgressCircular }
export type { ProgressCircularProps }
