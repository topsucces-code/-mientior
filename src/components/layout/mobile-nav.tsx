'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Heart, User, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useMediaQuery } from '@/hooks/use-media-query'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/wishlist', label: 'Wishlist', icon: Heart, badge: 'wishlist' },
  { href: '/cart', label: 'Cart', icon: ShoppingCart, badge: 'cart' },
  { href: '/account', label: 'Account', icon: User },
]

export function MobileNav() {
  const pathname = usePathname()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const getTotalItems = useCartStore((state) => state.getTotalItems)
  const wishlistItems = useWishlistStore((state) => state.items)

  const [touchStart, setTouchStart] = React.useState<number | null>(null)
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null)
  const [isVisible, setIsVisible] = React.useState(true)
  const [mounted, setMounted] = React.useState(false)

  // Handle hydration - only show counts after mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const cartCount = mounted ? getTotalItems() : 0
  const wishlistCount = mounted ? wishlistItems.length : 0

  // Minimum swipe distance (in px) to trigger a swipe action
  const minSwipeDistance = 50

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientY)
  }

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isSwipeUp = distance > minSwipeDistance
    const isSwipeDown = distance < -minSwipeDistance

    if (isSwipeUp) {
      setIsVisible(false)
    } else if (isSwipeDown) {
      setIsVisible(true)
    }
  }

  React.useEffect(() => {
    if (!isMobile) return

    document.addEventListener('touchstart', onTouchStart)
    document.addEventListener('touchmove', onTouchMove)
    document.addEventListener('touchend', onTouchEnd)

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [touchStart, touchEnd, isMobile])

  // Don't render on desktop or in admin routes
  if (!isMobile || pathname?.startsWith('/admin')) {
    return null
  }

  const getBadgeCount = (badge?: string) => {
    if (badge === 'cart') return cartCount
    if (badge === 'wishlist') return wishlistCount
    return 0
  }

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 border-t border-platinum-300 bg-white/95 backdrop-blur-md transition-transform duration-300 md:hidden',
        !isVisible && 'translate-y-full'
      )}
      aria-label="Mobile navigation"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          const badgeCount = getBadgeCount(item.badge)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-1 rounded-lg py-2 transition-all',
                isActive
                  ? 'text-orange-500'
                  : 'text-nuanced-500 hover:bg-platinum-100 hover:text-anthracite-700'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'h-6 w-6 transition-transform',
                    isActive && 'scale-110'
                  )}
                />
                {badgeCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium transition-all',
                  isActive && 'font-semibold'
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-orange-500" />
              )}
            </Link>
          )
        })}
      </div>

      {/* Safe area spacer for devices with notches */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
