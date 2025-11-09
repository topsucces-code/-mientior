'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AccountSidebar } from '@/components/account/account-sidebar'
import { DashboardOverview, type DashboardStats, type Order } from '@/components/account/dashboard-overview'

interface AccountPageClientProps {
  user: {
    name: string
    email: string
  }
  stats: DashboardStats
  recentOrders: Order[]
}

export function AccountPageClient({ user, stats, recentOrders }: AccountPageClientProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      // Call the sign out API
      await fetch('/api/auth/sign-out', {
        method: 'POST',
      })

      // Redirect to home
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block">
        <AccountSidebar onSignOut={handleSignOut} />
      </aside>

      {/* Main Content */}
      <div>
        <DashboardOverview
          user={user}
          stats={stats}
          recentOrders={recentOrders}
        />
      </div>
    </div>
  )
}
