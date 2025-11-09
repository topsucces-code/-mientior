'use client'

import * as React from 'react'
import { Shield, Truck, Award, Users, CreditCard, Headphones } from 'lucide-react'
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
    icon: <Users className="h-5 w-5" />,
    text: '10 000+ clients satisfaits',
  },
  {
    id: '2',
    icon: <Shield className="h-5 w-5" />,
    text: 'Paiement 100% sécurisé',
  },
  {
    id: '3',
    icon: <Truck className="h-5 w-5" />,
    text: 'Livraison rapide & gratuite',
  },
  {
    id: '4',
    icon: <Award className="h-5 w-5" />,
    text: 'Garantie satisfaction',
  },
  {
    id: '5',
    icon: <CreditCard className="h-5 w-5" />,
    text: 'Paiement en plusieurs fois',
  },
  {
    id: '6',
    icon: <Headphones className="h-5 w-5" />,
    text: 'Support 7j/7',
  },
]

interface SocialProofBarProps extends React.HTMLAttributes<HTMLDivElement> {
  indicators?: TrustIndicator[]
  variant?: 'default' | 'gradient'
  speed?: 'slow' | 'normal' | 'fast'
}

export default function SocialProofBar({
  indicators = defaultIndicators,
  variant = 'default',
  speed = 'normal',
  className,
  ...props
}: SocialProofBarProps) {
  const prefersReducedMotion = useReducedMotion()
  const scrollerRef = React.useRef<HTMLDivElement>(null)

  // Duplicate indicators for seamless loop
  const duplicatedIndicators = [...indicators, ...indicators]

  // Animation speed mapping
  const animationDuration = {
    slow: '60s',
    normal: '40s',
    fast: '20s',
  }[speed]

  return (
    <div
      className={cn(
        'relative overflow-hidden border-y border-platinum-300',
        variant === 'gradient'
          ? 'bg-gradient-to-r from-orange-50 via-white to-blue-50'
          : 'bg-white',
        className
      )}
      {...props}
    >
      {/* Gradient fade on edges */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-white to-transparent" />

      {/* Scrolling container */}
      <div
        ref={scrollerRef}
        className={cn(
          'flex gap-12 py-4',
          !prefersReducedMotion && 'animate-scroll-infinite'
        )}
        style={{
          animationDuration: !prefersReducedMotion ? animationDuration : undefined,
        }}
      >
        {duplicatedIndicators.map((indicator, index) => (
          <div
            key={`${indicator.id}-${index}`}
            className="flex min-w-max items-center gap-3 px-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              {indicator.icon}
            </div>
            <span className="whitespace-nowrap font-medium text-anthracite-500">
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
