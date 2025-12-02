'use client'

import { useState, useEffect } from 'react'

interface LockoutCountdownProps {
  lockedUntil: string // ISO timestamp
  onExpire?: () => void
}

export function LockoutCountdown({ lockedUntil, onExpire }: LockoutCountdownProps) {
  const [remainingTime, setRemainingTime] = useState<{
    minutes: number
    seconds: number
  } | null>(null)

  useEffect(() => {
    const calculateRemainingTime = () => {
      const now = Date.now()
      const expiry = new Date(lockedUntil).getTime()
      const diff = expiry - now

      if (diff <= 0) {
        setRemainingTime(null)
        onExpire?.()
        return
      }

      const totalSeconds = Math.ceil(diff / 1000)
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60

      setRemainingTime({ minutes, seconds })
    }

    // Calculate immediately
    calculateRemainingTime()

    // Update every second
    const interval = setInterval(calculateRemainingTime, 1000)

    return () => clearInterval(interval)
  }, [lockedUntil, onExpire])

  if (!remainingTime) {
    return null
  }

  return (
    <span className="font-medium">
      {remainingTime.minutes} {remainingTime.minutes === 1 ? 'minute' : 'minutes'}{' '}
      {remainingTime.seconds} {remainingTime.seconds === 1 ? 'second' : 'seconds'}
    </span>
  )
}
