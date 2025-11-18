'use client'

import * as React from 'react'
import { Shield, Truck, Award, Users, CreditCard, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface TrustIndicator {
  id: string
  icon: React.ReactNode
  text: string
}

const defaultIndicators: TrustIndicator[] = [
  {
    id: '1',
    icon: <Users className="h-4 w-4" />,
    text: '🔥 2,847 commandes aujourd\'hui',
  },
  {
    id: '2',
    icon: <Award className="h-4 w-4" />,
    text: '⭐ 4.9/5 (120k avis)',
  },
  {
    id: '3',
    icon: <Truck className="h-4 w-4" />,
    text: '🚚 Livraison 48h',
  },
  {
    id: '4',
    icon: <Shield className="h-4 w-4" />,
    text: '✓ +2M clients',
  },
  {
    id: '5',
    icon: <CreditCard className="h-4 w-4" />,
    text: '💳 Paiement sécurisé',
  },
  {
    id: '6',
    icon: <RotateCcw className="h-4 w-4" />,
    text: '↩️ Retours 30j',
  },
]

interface SocialProofBarProps extends React.HTMLAttributes<HTMLDivElement> {
  indicators?: TrustIndicator[]
  variant?: 'default' | 'gradient'
  speed?: 'slow' | 'normal' | 'fast'
}

export default function SocialProofBar({
  indicators = defaultIndicators,
  speed = 'normal',
  className,
  ...props
}: SocialProofBarProps) {
  const prefersReducedMotion = useReducedMotion()
  const scrollerRef = React.useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = React.useState(false)

  // Duplicate indicators for seamless loop
  const duplicatedIndicators = [...indicators, ...indicators]

  // Animation speed mapping
  const animationDuration = {
    slow: '60s',
    normal: '40s',
    fast: '20s',
  }[speed]

  // Handle pause on focus or hover
  const handlePause = React.useCallback(() => {
    setIsPaused(true)
    scrollerRef.current?.style.setProperty('animation-play-state', 'paused')
  }, [])

  const handleResume = React.useCallback(() => {
    setIsPaused(false)
    scrollerRef.current?.style.setProperty('animation-play-state', 'running')
  }, [])

  return (
    <div
      className={cn(
        'sticky z-50 h-12 overflow-hidden',
        'border-t border-b',
        'bg-[rgba(255,107,0,0.05)]',
        'border-t-[rgba(255,107,0,0.1)] border-b-[rgba(255,107,0,0.1)]',
        className
      )}
      style={{ top: 'var(--header-height, 0px)' }}
      role="region"
      aria-label="Trust indicators"
      aria-live="polite"
      {...props}
    >
      {/* Gradient fade on edges */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-[rgba(255,107,0,0.05)] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-[rgba(255,107,0,0.05)] to-transparent" />

      {/* Scrolling container */}
      <div
        ref={scrollerRef}
        className={cn(
          'flex gap-8 h-full items-center',
          !prefersReducedMotion && 'animate-scroll-infinite'
        )}
        style={{
          animationDuration: !prefersReducedMotion ? animationDuration : undefined,
        }}
        onMouseEnter={handlePause}
        onMouseLeave={handleResume}
        onFocus={handlePause}
        onBlur={handleResume}
        tabIndex={0}
        role="marquee"
        aria-label={`Trust indicators${isPaused ? ' (paused)' : ''}`}
      >
        {duplicatedIndicators.map((indicator, index) => (
          <div
            key={`${indicator.id}-${index}`}
            className="flex min-w-max items-center gap-2 px-3"
          >
            <span className="text-anthracite-600" style={{ width: '16px', height: '16px' }}>
              {indicator.icon}
            </span>
            <span className="whitespace-nowrap text-sm font-semibold text-anthracite-600">
              {indicator.text}
            </span>
          </div>
        ))}
      </div>

      {/* Add CSS for infinite scroll animation */}
      <style jsx>{`
        @keyframes scroll-infinite {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-infinite {
          animation: scroll-infinite linear infinite;
        }
      `}</style>
    </div>
  )
}
