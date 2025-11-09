'use client'

import * as React from 'react'
import { Button, ButtonProps } from './button'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { Loader2 } from 'lucide-react'

interface RippleButtonProps extends ButtonProps {
  loading?: boolean
}

interface Ripple {
  x: number
  y: number
  id: number
}

const RippleButton = React.forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ className, children, onClick, loading, disabled, variant, ...props }, ref) => {
    const [ripples, setRipples] = React.useState<Ripple[]>([])
    const prefersReducedMotion = useReducedMotion()

    const addRipple = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (prefersReducedMotion) return

        const button = event.currentTarget
        const rect = button.getBoundingClientRect()

        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        const newRipple: Ripple = {
          x,
          y,
          id: Date.now(),
        }

        setRipples((prev) => [...prev, newRipple])

        // Remove ripple after animation completes
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
        }, 400)
      },
      [prefersReducedMotion]
    )

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      addRipple(event)
      onClick?.(event)
    }

    // Gradient variant
    const isGradient = variant === 'gradient'

    return (
      <Button
        ref={ref}
        className={cn(
          'ripple-effect',
          isGradient && 'gradient-orange text-white hover:opacity-90',
          className
        )}
        onClick={handleClick}
        disabled={disabled || loading}
        variant={isGradient ? undefined : variant}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="pointer-events-none absolute animate-ripple rounded-full bg-white/30"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 20,
              height: 20,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </Button>
    )
  }
)

RippleButton.displayName = 'RippleButton'

export { RippleButton }
export type { RippleButtonProps }
