/**
 * Addresses Management Page
 * Manage shipping and billing addresses
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { AddressesPageClient } from './addresses-client'

export const metadata: Metadata = {
  title: 'My Addresses | Mientior',
  description: 'Manage your shipping and billing addresses',
}

export const dynamic = 'force-dynamic'

async function getAddresses(userId: string) {
  try {
    const addresses = await prisma.savedAddress.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    })
    return addresses
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return []
  }
}

export default async function AddressesPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login?redirect=/account/addresses')
  }

  const addresses = await getAddresses(session.user.id)

  return (
    <div className="min-h-screen bg-platinum-50">
      <div className="container mx-auto px-4 py-8">
        <AddressesPageClient 
          initialAddresses={addresses.map(addr => ({
            id: addr.id,
            firstName: addr.firstName,
            lastName: addr.lastName,
            line1: addr.line1,
            line2: addr.line2,
            city: addr.city,
            postalCode: addr.postalCode,
            country: addr.country,
            phone: addr.phone,
            isDefault: addr.isDefault,
          }))}
        />
      </div>
    </div>
  )
}
