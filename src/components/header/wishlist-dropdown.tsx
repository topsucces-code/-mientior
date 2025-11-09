'use client'

import { Heart, X, ShoppingCart } from 'lucide-react'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useHeader } from '@/contexts/header-context'
import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export function WishlistDropdown() {
    const { items, removeItem } = useWishlistStore()
    const { activeDropdown, setActiveDropdown } = useHeader()
    const dropdownRef = useRef<HTMLDivElement>(null)

    const isOpen = activeDropdown === 'wishlist'

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

    const totalItems = items.length
    const recentItems = items.slice(0, 5)

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setActiveDropdown(isOpen ? null : 'wishlist')}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Liste de souhaits"
                aria-expanded={isOpen}
            >
                <Heart className="w-6 h-6" />
                {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {totalItems > 9 ? '9+' : totalItems}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-slide-down">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-semibold">Ma Liste de Souhaits</h3>
                        <span className="text-sm text-gray-500">{totalItems} article{totalItems > 1 ? 's' : ''}</span>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {recentItems.length > 0 ? (
                            recentItems.map((item) => (
                                <div
                                    key={item.productId}
                                    className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex gap-3">
                                        <Link href={`/products/${item.productId}`} className="flex-shrink-0">
                                            <Image
                                                src={item.image || '/placeholder.png'}
                                                alt={item.name || 'Product'}
                                                width={64}
                                                height={64}
                                                className="rounded-lg object-cover"
                                            />
                                        </Link>

                                        <div className="flex-1 min-w-0">
                                            <Link href={`/products/${item.productId}`}>
                                                <h4 className="font-medium hover:text-blue-600 truncate">
                                                    {item.name || 'Produit'}
                                                </h4>
                                            </Link>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {item.price ? `${item.price.toFixed(2)} €` : 'Prix non disponible'}
                                            </p>

                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                                                >
                                                    <ShoppingCart className="w-3.5 h-3.5" />
                                                    Ajouter au panier
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => removeItem(item.productId)}
                                            className="flex-shrink-0 p-1 hover:bg-gray-200 rounded-full transition-colors h-fit"
                                            aria-label="Retirer"
                                        >
                                            <X className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <Heart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p className="font-medium">Votre liste de souhaits est vide</p>
                                <p className="text-sm mt-1">Ajoutez vos produits préférés</p>
                            </div>
                        )}
                    </div>

                    {items.length > 5 && (
                        <div className="p-3 border-t border-gray-200">
                            <Link
                                href="/wishlist"
                                className="block text-center text-sm text-blue-600 hover:underline font-medium"
                            >
                                Voir tous les articles ({totalItems})
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
