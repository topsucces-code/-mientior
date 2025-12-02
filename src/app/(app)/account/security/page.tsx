/**
 * Account Security Settings Page
 * Manage active sessions and security settings
 * 
 * Requirements: 9.1, 9.2, 9.3
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import { SecurityPageClient } from './security-client'

export const metadata: Metadata = {
  title: 'Security Settings | Mientior',
  description: 'Manage your account security and active sessions',
}

export default async function SecurityPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login?redirect=/account/security')
  }

  return (
    <div className="min-h-screen bg-platinum-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar would go here - imported from parent layout */}
          <div className="lg:col-span-2">
            <SecurityPageClient />
          </div>
        </div>
      </div>
    </div>
  )
}
