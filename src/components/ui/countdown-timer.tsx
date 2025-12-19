'use client'

import * as React from 'react'
import { cn, calculateTimeRemaining } from '@/lib/utils'

interface CountdownTimerProps extends React.HTMLAttributes<HTMLDivElement> {
  targetDate: Date | string
  onComplete?: () => void
  format?: 'full' | 'compact'
  variant?: 'inline' | 'card'
}

function CountdownTimer({
  targetDate,
  onComplete,
  format = 'compact',
  variant = 'inline',
  className,
  ...props
}: CountdownTimerProps) {
  // Initialize with null to avoid hydration mismatch
  // Time-based values differ between server and client
  const [timeRemaining, setTimeRemaining] = React.useState<ReturnType<typeof calculateTimeRemaining> | null>(null)
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
    // Calculate initial value on client only
    setTimeRemaining(calculateTimeRemaining(targetDate))

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(targetDate)
      setTimeRemaining(remaining)

      if (remaining.total <= 0) {
        clearInterval(interval)
        onComplete?.()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate, onComplete])

  // Show placeholder during SSR and initial hydration
  if (!isMounted || !timeRemaining) {
    return (
      <div className={cn('flex gap-2', className)} {...props}>
        <TimeCardSkeleton />
        <TimeCardSkeleton />
        <TimeCardSkeleton />
        <TimeCardSkeleton />
      </div>
    )
  }

  const { days, hours, minutes, seconds, total } = timeRemaining

  if (total <= 0) {
    return null
  }

  const isUrgent = total < 3600000 // Less than 1 hour

  if (variant === 'card') {
    return (
      <div
        className={cn('flex gap-2', className)}
        aria-live="polite"
        aria-atomic="true"
        {...props}
      >
        {days > 0 && (
          <TimeCard value={days} label="j" />
        )}
        <TimeCard value={hours} label="h" />
        <TimeCard value={minutes} label="m" />
        <TimeCard value={seconds} label="s" />
        {isUrgent && (
          <span className="ml-2 h-2 w-2 animate-pulse rounded-full bg-orange-500" />
        )}
      </div>
    )
  }

  // Inline variant
  const formattedTime = format === 'full'
    ? `${days > 0 ? `${days} jours ` : ''}${hours} heures ${minutes} minutes ${seconds} secondes`
    : `${days > 0 ? `${days}j ` : ''}${hours}h ${minutes}m ${seconds}s`

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-price font-mono',
        isUrgent && 'text-orange-500',
        className
      )}
      aria-live="polite"
      aria-atomic="true"
      role="timer"
      aria-label={`Time remaining: ${formattedTime}`}
      {...props}
    >
      <span>{formattedTime}</span>
      {isUrgent && (
        <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
      )}
    </div>
  )
}

function TimeCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="text-price-lg flex h-16 w-14 items-center justify-center rounded-md bg-orange-600 text-white shadow-elevation-2 transition-transform"
        style={{
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value.toString().padStart(2, '0')}
      </div>
      <span className="mt-1 text-xs text-nuanced-500">{label}</span>
    </div>
  )
}

function TimeCardSkeleton() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-16 w-14 items-center justify-center rounded-md bg-orange-600/50 text-white shadow-elevation-2 animate-pulse">
        <span className="text-price-lg">--</span>
      </div>
      <span className="mt-1 text-xs text-nuanced-500">-</span>
    </div>
  )
}

export { CountdownTimer }
export type { CountdownTimerProps }
