'use client'

import * as React from 'react'
import { Truck, Award, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface TrustIndicator {
  id: string
  icon: React.ReactNode
  text: string
}

const defaultIndicators: TrustIndicator[] = []

interface SocialProofBarProps extends React.HTMLAttributes<HTMLDivElement> {
  indicators?: TrustIndicator[]
  variant?: 'default' | 'gradient'
  speed?: 'slow' | 'normal' | 'fast'
}

export default function SocialProofBar({
  indicators: customIndicators,
  speed = 'normal',
  className,
  ...props
}: SocialProofBarProps) {
  const t = useTranslations('home.socialProof')
  const prefersReducedMotion = useReducedMotion()
  const scrollerRef = React.useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = React.useState(false)

  // Create translated indicators
  const translatedIndicators: TrustIndicator[] = [
    {
      id: '1',
      icon: <Users className="h-4 w-4" />,
      text: t('ordersToday', { count: 2847 }),
    },
    {
      id: '2',
      icon: <Award className="h-4 w-4" />,
      text: t('ratingText', { rating: '4.9/5', count: '120k' }),
    },
    {
      id: '3',
      icon: <Truck className="h-4 w-4" />,
      text: t('delivery'),
    },
  ]

  const indicators = customIndicators || translatedIndicators

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
      aria-label={t('ariaLabel')}
      aria-live="polite"
      {...props}
    >
      {/* Gradient fade on edges */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-orange-50/50" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-orange-50/50" />

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
        aria-label={isPaused ? t('ariaLabelPaused') : t('ariaLabel')}
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
