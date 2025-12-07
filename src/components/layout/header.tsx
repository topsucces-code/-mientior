'use client'

import { HeaderProvider, useHeader } from '@/contexts/header-context'
import { PromotionalBanner } from '@/components/header/promotional-banner'
import { TopBar } from '@/components/header/top-bar'
import { MainHeader } from '@/components/header/main-header'
import { CategoryNavBar } from '@/components/header/category-nav-bar'

function HeaderContent() {
  const { isHidden, getVisibleHeight } = useHeader()

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-[100] w-full transition-transform duration-300 ease-smooth ${isHidden ? '-translate-y-full' : 'translate-y-0'
          }`}
      >
        {/* Tier 1: Promotional Banner (40px) */}
        <PromotionalBanner />

        {/* Tier 2: Top Bar (36px) */}
        <TopBar />

        {/* Tier 3: Main Header (72px) */}
        <MainHeader />

        {/* Tier 4: Category Navigation Bar (48px) */}
        <CategoryNavBar />
      </header>

      {/* Dynamic spacer to prevent content from being hidden under fixed header */}
      <div style={{ height: `${getVisibleHeight()}px` }} aria-hidden="true" />
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
