'use client'

import { User, LogOut, Package, Heart, Settings, CreditCard, MapPin } from 'lucide-react'
import { useHeader } from '@/contexts/header-context'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface Session {
    user?: {
        name?: string
        email?: string
        image?: string
    }
}

export function UserAccountDropdown() {
    const { activeDropdown, setActiveDropdown } = useHeader()
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const isOpen = activeDropdown === 'account'

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const response = await fetch('/api/auth/session')
                const data = await response.json()
                setSession(data.session)
            } catch (error) {
                console.error('Failed to fetch session:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchSession()
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, setActiveDropdown])

    const handleSignOut = async () => {
        try {
            // Redirect to sign out endpoint
            window.location.href = '/api/auth/sign-out'
        } catch (error) {
            console.error('Sign out failed:', error)
        }
    }

    if (loading) {
        return (
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Compte">
                <User className="w-6 h-6 animate-pulse" />
            </button>
        )
    }

    if (!session?.user) {
        return (
            <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium"
            >
                <User className="w-5 h-5" />
                <span className="hidden lg:inline">Connexion</span>
            </Link>
        )
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setActiveDropdown(isOpen ? null : 'account')}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Mon compte"
                aria-expanded={isOpen}
            >
                <User className="w-6 h-6" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-slide-down">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{session.user.name || 'Utilisateur'}</p>
                                <p className="text-sm text-gray-600 truncate">{session.user.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="py-2">
                        <Link
                            href="/account/orders"
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                            <Package className="w-5 h-5 text-gray-600" />
                            <span className="font-medium">Mes commandes</span>
                        </Link>

                        <Link
                            href="/wishlist"
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                            <Heart className="w-5 h-5 text-gray-600" />
                            <span className="font-medium">Ma liste de souhaits</span>
                        </Link>

                        <Link
                            href="/account/addresses"
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                            <MapPin className="w-5 h-5 text-gray-600" />
                            <span className="font-medium">Mes adresses</span>
                        </Link>

                        <Link
                            href="/account/payment-methods"
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                            <CreditCard className="w-5 h-5 text-gray-600" />
                            <span className="font-medium">Moyens de paiement</span>
                        </Link>

                        <Link
                            href="/account/settings"
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                            <Settings className="w-5 h-5 text-gray-600" />
                            <span className="font-medium">Paramètres</span>
                        </Link>
                    </div>

                    <div className="border-t border-gray-200 p-2">
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-50 text-red-600 rounded-md transition-colors font-medium"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Déconnexion</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
