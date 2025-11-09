'use client'

import { GitCompare, X, Eye } from 'lucide-react'
import { useComparatorStore } from '@/stores/comparator.store'
import { useHeader } from '@/contexts/header-context'
import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { COMPARATOR_CONFIG } from '@/lib/constants'

export function ComparatorDropdown() {
    const { items, removeItem, clearAll } = useComparatorStore()
    const { activeDropdown, setActiveDropdown } = useHeader()
    const dropdownRef = useRef<HTMLDivElement>(null)

    const isOpen = activeDropdown === 'comparator'

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

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setActiveDropdown(isOpen ? null : 'comparator')}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Comparateur"
                aria-expanded={isOpen}
            >
                <GitCompare className="w-6 h-6" />
                {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {totalItems}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-slide-down">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Comparateur</h3>
                            <span className="text-sm text-gray-500">
                                {totalItems}/{COMPARATOR_CONFIG.maxItems}
                            </span>
                        </div>
                        {totalItems >= 2 && (
                            <Link
                                href="/compare"
                                className="mt-2 block text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                <Eye className="w-4 h-4 inline mr-2" />
                                Comparer les produits
                            </Link>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {items.length > 0 ? (
                            <>
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex gap-3">
                                            <Link href={`/products/${item.id}`} className="flex-shrink-0">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    width={64}
                                                    height={64}
                                                    className="rounded-lg object-cover"
                                                />
                                            </Link>

                                            <div className="flex-1 min-w-0">
                                                <Link href={`/products/${item.id}`}>
                                                    <h4 className="font-medium hover:text-blue-600 truncate">
                                                        {item.name}
                                                    </h4>
                                                </Link>
                                                <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                                                <p className="text-sm text-gray-600 mt-1 font-semibold">
                                                    {item.price.toFixed(2)} €
                                                </p>
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
                                ))}

                                {items.length > 0 && (
                                    <div className="p-3 border-t border-gray-200">
                                        <button
                                            onClick={clearAll}
                                            className="w-full text-center text-sm text-red-600 hover:underline font-medium"
                                        >
                                            Vider le comparateur
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <GitCompare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p className="font-medium">Votre comparateur est vide</p>
                                <p className="text-sm mt-1">
                                    Ajoutez jusqu'à {COMPARATOR_CONFIG.maxItems} produits à comparer
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
