'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export interface AccountSidebarProps {
  className?: string
  onSignOut?: () => void
}

const navigationItems = [
  {
    title: 'Account Overview',
    href: '/account',
    icon: User,
  },
  {
    title: 'Orders',
    href: '/account/orders',
    icon: ShoppingBag,
  },
  {
    title: 'Wishlist',
    href: '/account/wishlist',
    icon: Heart,
  },
  {
    title: 'Addresses',
    href: '/account/addresses',
    icon: MapPin,
  },
  {
    title: 'Payment Methods',
    href: '/account/payment-methods',
    icon: CreditCard,
  },
  {
    title: 'Loyalty Program',
    href: '/account/loyalty',
    icon: Trophy,
  },
  {
    title: 'Rewards',
    href: '/account/rewards',
    icon: Gift,
  },
  {
    title: 'Settings',
    href: '/account/settings',
    icon: Settings,
  },
]

export function AccountSidebar({ className, onSignOut }: AccountSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex flex-col gap-4 rounded-lg border border-platinum-300 bg-white p-6',
        className
      )}
    >
      <div>
        <h2 className="text-lg font-semibold text-anthracite-700">My Account</h2>
        <p className="text-sm text-nuanced-500">Manage your account settings</p>
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
        Sign Out
      </Button>
    </aside>
  )
}
