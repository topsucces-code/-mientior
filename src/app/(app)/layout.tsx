import React from 'react'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { MobileNav } from '@/components/layout/mobile-nav'
import { QuickViewProvider } from '@/contexts/quick-view-context'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QuickViewProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main id="main-content" className="flex-1 pb-20 md:pb-0">{children}</main>
        <Footer />
        <MobileNav />
      </div>
    </QuickViewProvider>
  )
}
