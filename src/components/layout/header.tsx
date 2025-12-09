'use client'

import { HeaderProvider, useHeader } from '@/contexts/header-context'
import { TopBar } from '@/components/header/top-bar'
import { MainHeader } from '@/components/header/main-header'
import { CategoryNavBar } from '@/components/header/category-nav-bar'
import { PromotionalBanner } from '@/components/header/promotional-banner'
import { MobileSearchOverlay } from '@/components/header/mobile-search-overlay'
import { MobileMenuDrawer } from '@/components/header/mobile-menu-drawer'

function HeaderContent() {
  const { isHidden, getVisibleHeight, isCompact } = useHeader()

  // Calculate mobile header height (only MainHeader on mobile)
  const getMobileVisibleHeight = () => {
    return 56 // Mobile header height
  }

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-[100] w-full header-transition ${
          isHidden ? '-translate-y-full' : 'translate-y-0'
        } ${isCompact ? 'shadow-lg' : ''}`}
      >
        {/* NIVEAU 1: Top Bar Utility (36px) - Turquoise clair - Hidden on mobile */}
        <TopBar />

        {/* NIVEAU 2: Main Header (80px desktop / 56px mobile) - Blanc avec accents Turquoise */}
        <MainHeader />

        {/* NIVEAU 3: Category Bar (56px) - Blanc, sticky avec shadow - Hidden on mobile */}
        <CategoryNavBar />

        {/* NIVEAU 4: Promo Banner (44px) - Orange gradient, collapsible - Hidden on mobile */}
        <PromotionalBanner />
      </header>

      {/* Dynamic spacer to prevent content from being hidden under fixed header */}
      {/* Mobile spacer */}
      <div 
        className="md:hidden transition-all duration-300"
        style={{ height: `${getMobileVisibleHeight()}px` }} 
        aria-hidden="true" 
      />
      {/* Desktop/Tablet spacer */}
      <div 
        className="hidden md:block transition-all duration-300"
        style={{ height: `${getVisibleHeight()}px` }} 
        aria-hidden="true" 
      />

      {/* Mobile Search Overlay */}
      <MobileSearchOverlay />

      {/* Mobile Menu Drawer */}
      <MobileMenuDrawer />
    </>
  )
}

export default function Header() {
  return (
    <HeaderProvider>
      <HeaderContent />
    </HeaderProvider>
  )
}
