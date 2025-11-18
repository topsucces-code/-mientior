'use client'

import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { BreadcrumbItem } from '@/types'

export interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbNavigation({ items }: BreadcrumbNavigationProps) {
  // For mobile: show home icon + last 2 levels
  const mobileItems = items.length > 2 ? [items[0], ...items.slice(-2)] : items

  // Generate JSON-LD structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href && { item: item.href })
    }))
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <nav aria-label="Breadcrumb" className="py-4 px-0">
        {/* Desktop breadcrumb */}
        <ol className="hidden md:flex items-center overflow-x-auto custom-scrollbar-horizontal">
          {items.map((item, index) => {
            const isLast = index === items.length - 1

            return (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="mx-2 h-4 w-4 text-platinum-400 flex-shrink-0" />
                )}
                {isLast ? (
                  <span
                    className="text-sm font-semibold text-anthracite-700"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href || '#'}
                    className="text-sm text-nuanced-600 hover:text-orange-500 hover:underline whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>

        {/* Mobile breadcrumb */}
        <ol className="flex md:hidden items-center overflow-x-auto custom-scrollbar-horizontal">
          {mobileItems.map((item, index) => {
            const isLast = index === mobileItems.length - 1
            const isFirst = index === 0

            return (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="mx-2 h-4 w-4 text-platinum-400 flex-shrink-0" />
                )}
                {isLast ? (
                  <span
                    className="text-sm font-semibold text-anthracite-700"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href || '#'}
                    className={cn(
                      "text-sm text-nuanced-600 hover:text-orange-500 hover:underline whitespace-nowrap",
                      "flex items-center gap-1"
                    )}
                  >
                    {isFirst && <Home className="h-3.5 w-3.5" />}
                    {!isFirst && item.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
