'use client'

import { ShoppingCart, X, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
import { useHeader } from '@/contexts/header-context'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export function EnhancedCartPreview() {
    const { items, removeItem, getTotalPrice, getTotalItems } = useCartStore()
    const { activeDropdown, setActiveDropdown } = useHeader()
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)

    const isOpen = activeDropdown === 'cart'

    // Handle hydration - only show cart data after mount
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

    const totalItems = mounted ? getTotalItems() : 0
    const totalPrice = mounted ? getTotalPrice() : 0
    const recentItems = mounted ? items.slice(0, 5) : []

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setActiveDropdown(isOpen ? null : 'cart')}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Panier"
                aria-expanded={isOpen}
            >
                <ShoppingCart className="w-6 h-6" />
                {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {totalItems > 9 ? '9+' : totalItems}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-[420px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-slide-down">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="font-semibold">Mon Panier</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {totalItems} article{totalItems > 1 ? 's' : ''}
                        </p>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {recentItems.length > 0 ? (
                            recentItems.map((item) => (
                                <div
                                    key={`${item.id}-${JSON.stringify(item.variant)}`}
                                    className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex gap-3">
                                        <Link href={`/products/${item.productSlug}`} className="flex-shrink-0">
                                            <Image
                                                src={item.productImage || '/placeholder.png'}
                                                alt={item.productName}
                                                width={80}
                                                height={80}
                                                className="rounded-lg object-cover"
                                            />
                                        </Link>

                                        <div className="flex-1 min-w-0">
                                            <Link href={`/products/${item.productSlug}`}>
                                                <h4 className="font-medium hover:text-blue-600 line-clamp-2">
                                                    {item.productName}
                                                </h4>
                                            </Link>

                            {item.variant && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {Object.entries(item.variant).map(([key, value]) => (
                                        <span key={key}>{key}: {String(value)} </span>
                                    ))}
                                </p>
                            )}                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-sm text-gray-600">
                                                    Qté: {item.quantity}
                                                </span>
                                                <span className="font-semibold text-blue-600">
                                                    {((item.price / 100) * item.quantity).toFixed(2)} €
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => removeItem(item.id)}
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
                                <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p className="font-medium">Votre panier est vide</p>
                                <p className="text-sm mt-1">Ajoutez des produits pour commencer</p>
                            </div>
                        )}
                    </div>

                    {mounted && items.length > 0 && (
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-medium">Total</span>
                                <span className="text-xl font-bold text-blue-600">
                                    {(totalPrice / 100).toFixed(2)} €
                                </span>
                            </div>

                            <Link
                                href="/checkout"
                                className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Passer la commande
                                <ArrowRight className="w-4 h-4 inline ml-2" />
                            </Link>

                            <Link
                                href="/cart"
                                className="block w-full text-center mt-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                            >
                                Voir le panier complet
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
