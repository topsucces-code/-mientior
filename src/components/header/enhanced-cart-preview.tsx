'use client'

import { ShoppingCart, X, ArrowRight, Minus, Plus, Truck, Shield, RotateCcw } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
import { useHeader } from '@/contexts/header-context'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useCurrency } from '@/hooks/use-currency'

const FREE_SHIPPING_THRESHOLD = 15000 // 15,000 FCFA

export function EnhancedCartPreview() {
    const { items, removeItem, getTotalPrice, getTotalItems, updateQuantity } = useCartStore()
    const { activeDropdown, setActiveDropdown } = useHeader()
    const containerRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)
    const { formatPrice } = useCurrency()
    const t = useTranslations('cart')

    const isOpen = activeDropdown === 'cart'

    // Handle hydration - only show cart data after mount
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

    const totalItems = mounted ? getTotalItems() : 0
    const totalPrice = mounted ? getTotalPrice() : 0
    const recentItems = mounted ? items.slice(0, 5) : []
    
    // Free shipping progress
    const shippingProgress = Math.min((totalPrice / FREE_SHIPPING_THRESHOLD) * 100, 100)
    const remainingForFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - totalPrice, 0)

    // Use a timeout to allow mouse to move to dropdown
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
        setActiveDropdown(isOpen ? null : 'cart')
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
            {/* Cart Icon Button */}
            <button
                ref={buttonRef}
                onClick={handleButtonClick}
                className="
                    relative flex flex-col items-center justify-center
                    w-12 h-12 rounded-full cursor-pointer
                    transition-all duration-250 ease-smooth
                    hover:bg-turquoise-600/[0.08] hover:-translate-y-0.5 hover:scale-[1.08]
                    text-gray-800 hover:text-turquoise-600
                "
                aria-label={t('title')}
                aria-expanded={isOpen}
            >
                <ShoppingCart className="w-6 h-6" />
                
                {/* Badge */}
                {totalItems > 0 && (
                    <span className="
                        absolute -top-1 -right-1
                        min-w-[24px] h-6 px-1.5
                        bg-error text-white
                        text-xs font-bold rounded-full
                        border-2 border-white
                        flex items-center justify-center
                        shadow-[0_2px_8px_rgba(239,68,68,0.3)]
                        animate-[badgePulse_2s_infinite]
                    ">
                        {totalItems > 9 ? '9+' : totalItems}
                    </span>
                )}
                
                {/* Total amount indicator */}
                {totalPrice > 0 && (
                    <span className="
                        absolute -bottom-1.5 left-1/2 -translate-x-1/2
                        whitespace-nowrap text-[10px] font-bold
                        text-orange-500 bg-white px-2 py-0.5
                        rounded-full shadow-sm
                    ">
                        {formatPrice(totalPrice)}
                    </span>
                )}
            </button>

            {isOpen && (
                <div 
                    ref={panelRef}
                    onMouseEnter={handleDropdownMouseEnter}
                    onMouseLeave={handleDropdownMouseLeave}
                    onClick={(e) => e.stopPropagation()}
                    className="
                    absolute right-0 top-[calc(100%+12px)] 
                    w-[420px] max-h-[500px] overflow-y-auto
                    bg-white rounded-2xl 
                    shadow-[0_16px_64px_rgba(0,0,0,0.15)] 
                    z-[9999]
                "
                    style={{ animation: 'fadeIn 150ms ease-out' }}>
                    {/* Arrow indicator */}
                    <div className="
                        absolute -top-2 right-6 w-4 h-4 
                        bg-white rotate-45 
                        shadow-[-2px_-2px_4px_rgba(0,0,0,0.03)]
                    " />
                    
                    {/* Header */}
                    <div className="flex justify-between items-center p-5 border-b border-gray-200">
                        <div>
                            <h3 className="text-base font-bold text-gray-800">{t('title')}</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {totalItems} {t('items')}
                            </p>
                        </div>
                        <Link 
                            href="/cart" 
                            className="text-[13px] text-turquoise-600 hover:text-turquoise-500 hover:underline transition-colors"
                        >
                            {t('remove')}
                        </Link>
                    </div>
                    
                    {/* Free Shipping Progress */}
                    {totalPrice > 0 && (
                        <div className="px-5 py-4 bg-gradient-to-r from-turquoise-50 to-[#F0FDFF] border-b border-turquoise-100/50">
                            <div className="relative h-2 bg-turquoise-200/50 rounded-full overflow-hidden mb-2">
                                <div 
                                    className="h-full bg-gradient-to-r from-turquoise-600 to-success rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                    style={{ width: `${shippingProgress}%` }}
                                />
                            </div>
                            <p className="text-[13px] text-center text-turquoise-600 font-semibold">
                                {remainingForFreeShipping > 0 
                                    ? `${t('freeShippingProgress', { amount: formatPrice(remainingForFreeShipping) })}`
                                    : `🎉 ${t('freeShippingLabel')}!`
                                }
                            </p>
                        </div>
                    )}

                    {/* Cart Items */}
                    <div className="max-h-72 overflow-y-auto custom-scrollbar p-4">
                        {recentItems.length > 0 ? (
                            recentItems.map((item) => (
                                <div
                                    key={`${item.id}-${JSON.stringify(item.variant)}`}
                                    className="grid grid-cols-[80px_1fr_auto] gap-4 py-4 border-b border-gray-100 last:border-0"
                                >
                                    {/* Product Image */}
                                    <Link href={`/products/${item.productSlug || ''}`} className="flex-shrink-0">
                                        <Image
                                            src={item.productImage || '/placeholder.png'}
                                            alt={item.productName || 'Product'}
                                            width={80}
                                            height={80}
                                            className="rounded-lg object-cover shadow-sm"
                                        />
                                    </Link>

                                    {/* Product Info */}
                                    <div className="flex flex-col gap-1.5">
                                        <Link href={`/products/${item.productSlug || ''}`}>
                                            <h4 className="text-sm font-medium text-gray-800 hover:text-turquoise-600 line-clamp-2 transition-colors">
                                                {item.productName}
                                            </h4>
                                        </Link>

                                        {item.variant && (
                                            <p className="text-xs text-gray-500">
                                                {Object.entries(item.variant).map(([key, value]) => (
                                                    <span key={key}>{key}: {String(value)} </span>
                                                ))}
                                            </p>
                                        )}
                                        
                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-3 mt-2">
                                            <button 
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    updateQuantity(item.id, Math.max(1, item.quantity - 1))
                                                }}
                                                className="w-6 h-6 border border-gray-200 rounded flex items-center justify-center hover:border-turquoise-600 hover:text-turquoise-600 transition-colors"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-sm font-semibold text-gray-800 min-w-[24px] text-center">
                                                {item.quantity}
                                            </span>
                                            <button 
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    updateQuantity(item.id, item.quantity + 1)
                                                }}
                                                className="w-6 h-6 border border-gray-200 rounded flex items-center justify-center hover:border-turquoise-600 hover:text-turquoise-600 transition-colors"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Price & Remove */}
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-base font-bold text-orange-500">
                                            {formatPrice(item.price * item.quantity)}
                                        </span>
                                        <button
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeItem(item.id)
                                            }}
                                            className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-error-light hover:border-error hover:text-error transition-all"
                                            aria-label={t('remove')}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                                <p className="font-semibold text-gray-800">{t('emptyMessage')}</p>
                                <p className="text-sm text-gray-500 mt-1">{t('emptyText')}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer with Summary & Actions */}
                    {mounted && items.length > 0 && (
                        <div className="p-5 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            {/* Summary */}
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">{t('subtotal')}</span>
                                    <span className="text-gray-800">{formatPrice(totalPrice)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">{t('shipping')}</span>
                                    <span className="text-success font-medium">
                                        {remainingForFreeShipping > 0 ? t('shippingCalculated') : t('freeShippingLabel')}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-3 border-t border-gray-200">
                                    <span className="text-lg font-bold text-gray-800">{t('total')}</span>
                                    <span className="text-lg font-bold text-orange-500">
                                        {formatPrice(totalPrice)}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <Link
                                    href="/cart"
                                    className="py-3 px-5 border-2 border-turquoise-600 text-turquoise-600 text-center rounded-lg font-semibold hover:bg-turquoise-50 transition-colors"
                                >
                                    {t('viewCart')}
                                </Link>
                                <Link
                                    href="/checkout"
                                    className="py-3 px-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-center rounded-lg font-semibold shadow-[0_4px_12px_rgba(249,115,22,0.3)] hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                >
                                    {t('checkout')}
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                            
                            {/* Trust Badges */}
                            <div className="flex justify-around mt-4 pt-4 border-t border-gray-200">
                                <div className="flex flex-col items-center gap-1 text-[11px] text-gray-500">
                                    <Truck className="w-5 h-5 text-success" />
                                    <span>{t('fastDelivery')}</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 text-[11px] text-gray-500">
                                    <Shield className="w-5 h-5 text-success" />
                                    <span>{t('securePayment')}</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 text-[11px] text-gray-500">
                                    <RotateCcw className="w-5 h-5 text-success" />
                                    <span>{t('freeReturns')}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
