'use client'

import { Heart, X, ShoppingCart } from 'lucide-react'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useCartStore } from '@/stores/cart.store'
import { useHeader } from '@/contexts/header-context'
import { useToast } from '@/hooks/use-toast'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export function WishlistDropdown() {
    const { items, removeItem } = useWishlistStore()
    const { addItem: addToCart } = useCartStore()
    const { activeDropdown, setActiveDropdown } = useHeader()
    const { toast } = useToast()
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)

    const isOpen = activeDropdown === 'wishlist'

    // Handle hydration - only show wishlist data after mount
    useEffect(() => {
        setMounted(true)
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

    const totalItems = mounted ? items.length : 0
    const recentItems = mounted ? items.slice(0, 5) : []

    // Use a timeout to allow mouse to move to dropdown
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleMouseEnter = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current)
            closeTimeoutRef.current = null
        }
        setActiveDropdown('wishlist')
    }

    const handleMouseLeave = () => {
        closeTimeoutRef.current = setTimeout(() => {
            setActiveDropdown(null)
        }, 150)
    }

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current)
            }
        }
    }, [])

    return (
        <div 
            className="relative" 
            ref={dropdownRef}
        >
            <button
                onClick={() => setActiveDropdown(isOpen ? null : 'wishlist')}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Liste de souhaits"
                aria-expanded={isOpen}
            >
                <Heart className={`w-6 h-6 transition-colors ${totalItems > 0 ? 'text-orange-500' : ''}`} />
                {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-sm">
                        {totalItems > 99 ? '99+' : totalItems}
                    </span>
                )}
            </button>

            {isOpen && (
                <div 
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={() => setActiveDropdown(null)}
                    className="absolute right-0 top-[calc(100%+8px)] w-96 bg-white rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-gray-100 z-[9999]"
                    style={{ animation: 'fadeIn 150ms ease-out' }}
                >
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
                                        <Link href={`/products/${item.slug || item.productId}`} className="flex-shrink-0">
                                            <Image
                                                src={item.image || '/placeholder.png'}
                                                alt={item.name || 'Product'}
                                                width={64}
                                                height={64}
                                                className="rounded-lg object-cover"
                                            />
                                        </Link>

                                        <div className="flex-1 min-w-0">
                                            <Link href={`/products/${item.slug || item.productId}`}>
                                                <h4 className="font-medium hover:text-emerald-600 truncate">
                                                    {item.name || 'Produit'}
                                                </h4>
                                            </Link>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {item.price ? `${item.price.toFixed(2)} €` : 'Prix non disponible'}
                                            </p>

                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    onClick={() => {
                                                        addToCart({
                                                            id: item.productId,
                                                            productId: item.productId,
                                                            productName: item.name || 'Produit',
                                                            productSlug: item.slug || item.productId,
                                                            productImage: item.image || '/images/placeholder.svg',
                                                            price: item.price || 0,
                                                            quantity: 1,
                                                            stock: 99,
                                                        })
                                                        toast({
                                                            title: 'Ajouté au panier',
                                                            description: `${item.name} a été ajouté à votre panier.`,
                                                        })
                                                    }}
                                                    className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-1"
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

                    {items.length > 0 && (
                        <div className="p-3 border-t border-gray-200">
                            <Link
                                href="/wishlist"
                                className="block w-full text-center text-sm bg-rosegold-500 text-white py-2 rounded-lg hover:bg-rosegold-600 font-medium transition-colors"
                            >
                                Voir ma liste ({totalItems})
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
