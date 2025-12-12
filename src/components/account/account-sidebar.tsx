'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  User,
  ShoppingBag,
  Heart,
  MapPin,
  CreditCard,
  Settings,
  LogOut,
  Trophy,
  Gift,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export interface AccountSidebarProps {
  className?: string
  onSignOut?: () => void
}

export function AccountSidebar({ className, onSignOut }: AccountSidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('account.sidebar')

  const navigationItems = [
    {
      title: t('nav.myAccount'),
      href: '/account',
      icon: User,
    },
    {
      title: t('nav.orders'),
      href: '/account/orders',
      icon: ShoppingBag,
    },
    {
      title: t('nav.wishlist'),
      href: '/account/wishlist',
      icon: Heart,
    },
    {
      title: t('nav.addresses'),
      href: '/account/addresses',
      icon: MapPin,
    },
    {
      title: t('nav.paymentMethods'),
      href: '/account/payment-methods',
      icon: CreditCard,
    },
    {
      title: t('nav.security'),
      href: '/account/security',
      icon: Shield,
    },
    {
      title: t('nav.loyalty'),
      href: '/account/loyalty',
      icon: Trophy,
    },
    {
      title: t('nav.rewards'),
      href: '/account/rewards',
      icon: Gift,
    },
    {
      title: t('nav.settings'),
      href: '/account/settings',
      icon: Settings,
    },
  ]

  return (
    <aside
      className={cn(
        'flex flex-col gap-4 rounded-lg border border-platinum-300 bg-white p-6',
        className
      )}
    >
      <div>
        <h2 className="text-lg font-semibold text-anthracite-700">{t('title')}</h2>
        <p className="text-sm text-nuanced-500">{t('subtitle')}</p>
      </div>

      <Separator />

      <nav className="flex flex-col gap-1">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-anthracite-600 hover:bg-platinum-100 hover:text-anthracite-700'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          )
        })}
      </nav>

      <Separator />

      <Button
        variant="ghost"
        className="justify-start gap-3 text-error hover:bg-error/10 hover:text-error"
        onClick={onSignOut}
      >
        <LogOut className="h-5 w-5" />
        {t('signOut')}
      </Button>
    </aside>
  )
}
