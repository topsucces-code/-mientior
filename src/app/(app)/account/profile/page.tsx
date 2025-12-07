/**
 * Profile Page
 * Allows users to view and edit their profile information
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { ProfilePageClient } from './profile-client'

export const metadata: Metadata = {
  title: 'Mon Profil | Mientior',
  description: 'Gérez vos informations personnelles',
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await getSession()

  if (!session) {
    redirect('/login?redirect=/account/profile')
  }

  // Fetch user profile directly from database (server-side)
  // No need for HTTP call - we're already on the server
  try {
    const profile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        locale: true,
        countryCode: true,
        currency: true,
        loyaltyLevel: true,
        loyaltyPoints: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!profile) {
      redirect('/account')
    }

    return (
      <div className="min-h-screen bg-platinum-50">
        <div className="container mx-auto px-4 py-8">
          <ProfilePageClient initialProfile={profile} />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error fetching profile:', error)
    redirect('/account')
  }
}
