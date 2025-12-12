'use client'

import * as React from 'react'
import { Truck, RotateCcw, CreditCard, Headphones } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface TrustBadge {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
}

const defaultBadges: TrustBadge[] = [
  {
    id: '1',
    icon: <Truck className="h-8 w-8 md:h-10 md:w-10" />,
    title: 'Livraison Gratuite',
    description: 'Dès 50€ d\'achat',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    id: '2',
    icon: <RotateCcw className="h-8 w-8 md:h-10 md:w-10" />,
    title: 'Retours 30 Jours',
    description: 'Satisfait ou remboursé',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    id: '3',
    icon: <CreditCard className="h-8 w-8 md:h-10 md:w-10" />,
    title: 'Paiement Sécurisé',
    description: 'Cryptage SSL 256-bit',
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    id: '4',
    icon: <Headphones className="h-8 w-8 md:h-10 md:w-10" />,
    title: 'Support 24/7',
    description: 'Assistance à votre écoute',
    gradient: 'from-orange-500 to-orange-600',
  },
]

interface TrustBadgesProps extends React.HTMLAttributes<HTMLElement> {
  badges?: TrustBadge[]
  variant?: 'default' | 'compact'
}

export default function TrustBadges({
  badges: customBadges,
  variant = 'default',
  className,
  ...props
}: TrustBadgesProps) {
  const t = useTranslations('home.trustBadges')
  const { ref: sectionRef, isIntersecting: isVisible } = useIntersectionObserver({ threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()

  // Use translated badges
  const translatedBadges: TrustBadge[] = [
    {
      id: '1',
      icon: <Truck className="h-8 w-8 md:h-10 md:w-10" />,
      title: t('freeShipping'),
      description: t('freeShippingDesc'),
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      id: '2',
      icon: <RotateCcw className="h-8 w-8 md:h-10 md:w-10" />,
      title: t('returns'),
      description: t('returnsDesc'),
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      id: '3',
      icon: <CreditCard className="h-8 w-8 md:h-10 md:w-10" />,
      title: t('securePayment'),
      description: t('securePaymentDesc'),
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      id: '4',
      icon: <Headphones className="h-8 w-8 md:h-10 md:w-10" />,
      title: t('support'),
      description: t('supportDesc'),
      gradient: 'from-orange-500 to-orange-600',
    },
  ]

  const badges = customBadges || translatedBadges

  if (!badges || badges.length === 0) {
    return null
  }

  return (
    <section
      ref={sectionRef}
      className={cn(
        'py-8 md:py-12',
        variant === 'default' ? 'bg-gradient-to-br from-platinum-50 via-white to-platinum-50' : 'bg-white',
        className
      )}
      {...props}
    >
      <div className="container mx-auto px-3 md:px-4 lg:px-6">
        <div
          className={cn(
            'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
            variant === 'compact' && 'gap-3'
          )}
        >
          {badges.map((badge, index) => (
            <TrustBadgeCard
              key={badge.id}
              badge={badge}
              variant={variant}
              className={cn(
                !prefersReducedMotion && isVisible && 'animate-fade-in-up'
              )}
              style={{
                animationDelay: !prefersReducedMotion ? `${index * 75}ms` : undefined,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

interface TrustBadgeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  badge: TrustBadge
  variant?: 'default' | 'compact'
}

function TrustBadgeCard({ badge, variant = 'default', className, style, ...props }: TrustBadgeCardProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl bg-white transition-all duration-300',
        variant === 'default'
          ? 'border border-platinum-300 p-6 hover:shadow-elevation-3 hover:-translate-y-1'
          : 'border border-platinum-200 p-4',
        className
      )}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {/* Separator Line (between badges) - Only for desktop */}
      {variant === 'default' && (
        <div className="absolute right-0 top-1/2 hidden h-16 w-px -translate-y-1/2 bg-platinum-300 last:hidden lg:block" />
      )}

      {/* Content */}
      <div className="relative flex flex-col items-center text-center">
        {/* Icon with Gradient Background */}
        <div
          className={cn(
            'mb-4 flex items-center justify-center rounded-full bg-gradient-to-br p-3 shadow-elevation-1 transition-all duration-300',
            badge.gradient,
            isHovered && 'scale-110 shadow-elevation-2',
            variant === 'compact' ? 'h-14 w-14' : 'h-16 w-16 md:h-20 md:w-20'
          )}
        >
          <div className={cn('text-white', isHovered && 'animate-bounce')}>
            {badge.icon}
          </div>
        </div>

        {/* Title */}
        <h3
          className={cn(
            'mb-1 font-display font-bold text-anthracite-700 transition-colors duration-300',
            variant === 'compact' ? 'text-base' : 'text-lg md:text-xl',
            isHovered && 'text-orange-500'
          )}
        >
          {badge.title}
        </h3>

        {/* Description */}
        <p
          className={cn(
            'text-nuanced-500',
            variant === 'compact' ? 'text-xs' : 'text-sm md:text-base'
          )}
        >
          {badge.description}
        </p>

        {/* Hover Effect - Bottom Accent Line */}
        <div
          className={cn(
            'absolute bottom-0 left-1/2 h-1 -translate-x-1/2 rounded-full bg-gradient-to-r transition-all duration-300',
            badge.gradient,
            isHovered ? 'w-full opacity-100' : 'w-0 opacity-0'
          )}
        />
      </div>
    </div>
  )
}
