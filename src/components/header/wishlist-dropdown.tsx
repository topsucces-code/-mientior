'use client'

import { Heart, X, ShoppingCart } from 'lucide-react'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useCartStore } from '@/stores/cart.store'
import { useHeader } from '@/contexts/header-context'
import { useToast } from '@/hooks/use-toast'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'

export function WishlistDropdown() {
    const { items, removeItem } = useWishlistStore()
    const { addItem: addToCart } = useCartStore()
    const { activeDropdown, setActiveDropdown } = useHeader()
    const { toast } = useToast()
    const t = useTranslations('header')
    const tCart = useTranslations('cart')
    const containerRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)

    const isOpen = activeDropdown === 'wishlist'

    // Handle hydration
    useEffect(() => {
        setMounted(true)
    }, [])

    // Close dropdown when clicking outside - but NOT when clicking inside the dropdown
    useEffect(() => {
        if (!isOpen) return

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            
            // If the target is no longer in the document (removed by React), don't close
            // This happens when clicking remove button which removes the item from DOM
            if (!document.body.contains(target)) {
                return
            }
            
            // If click is inside the container (which includes the panel), don't close
            if (containerRef.current?.contains(target)) {
                return
            }
            
            setActiveDropdown(null)
        }

        // Use click event instead of mousedown
        const timeoutId = setTimeout(() => {
            document.addEventListener('click', handleClickOutside)
        }, 50)

        return () => {
            clearTimeout(timeoutId)
            document.removeEventListener('click', handleClickOutside)
        }
    }, [isOpen, setActiveDropdown])

    const totalItems = mounted ? items.length : 0
    const recentItems = mounted ? items.slice(0, 5) : []

    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const cancelClose = useCallback(() => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current)
            closeTimeoutRef.current = null
        }
    }, [])

    const scheduleClose = useCallback(() => {
        cancelClose()
        closeTimeoutRef.current = setTimeout(() => {
            setActiveDropdown(null)
        }, 400)
    }, [setActiveDropdown, cancelClose])

    const handleButtonClick = () => {
        cancelClose()
        setActiveDropdown(isOpen ? null : 'wishlist')
    }

    const handleDropdownMouseEnter = () => {
        cancelClose()
    }

    const handleDropdownMouseLeave = () => {
        scheduleClose()
    }

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => cancelClose()
    }, [cancelClose])

    return (
        <div 
            className="relative" 
            ref={containerRef}
        >
            <button
                ref={buttonRef}
                onClick={handleButtonClick}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={t('wishlist')}
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
                    ref={panelRef}
                    onMouseEnter={handleDropdownMouseEnter}
                    onMouseLeave={handleDropdownMouseLeave}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-[calc(100%+8px)] w-96 bg-white rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-gray-100 z-[9999]"
                    style={{ animation: 'fadeIn 150ms ease-out' }}
                >
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-semibold">{t('myWishlist')}</h3>
                        <span className="text-sm text-gray-500">{totalItems} {tCart('items')}</span>
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
                                                <h4 className="font-medium hover:text-turquoise-600 truncate">
                                                    {item.name || 'Produit'}
                                                </h4>
                                            </Link>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {item.price ? `${item.price.toFixed(2)} €` : 'Prix non disponible'}
                                            </p>

                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
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
                                                    className="text-xs bg-turquoise-600 text-white px-3 py-1.5 rounded-md hover:bg-turquoise-700 transition-colors flex items-center gap-1"
                                                >
                                                    <ShoppingCart className="w-3.5 h-3.5" />
                                                    {tCart('addToCart')}
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeItem(item.productId)
                                            }}
                                            className="flex-shrink-0 p-1 hover:bg-gray-200 rounded-full transition-colors h-fit"
                                            aria-label={tCart('remove')}
                                        >
                                            <X className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <Heart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p className="font-medium">{tCart('emptyWishlist')}</p>
                                <p className="text-sm mt-1">{tCart('addFavorites')}</p>
                            </div>
                        )}
                    </div>

                    {items.length > 0 && (
                        <div className="p-3 border-t border-gray-200">
                            <Link
                                href="/wishlist"
                                className="block w-full text-center text-sm bg-rosegold-500 text-white py-2 rounded-lg hover:bg-rosegold-600 font-medium transition-colors"
                            >
                                {t('viewAll')} ({totalItems})
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
