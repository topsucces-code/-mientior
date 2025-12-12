'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Package, ChevronRight, Search, Calendar, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { OrdersQuery } from '@/lib/validations/orders'

interface OrderItem {
  id: string
  productId: string
  productName: string
  productSlug?: string
  productImage: string
  quantity: number
  price: number
}

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  total: number
  subtotal: number
  shippingCost: number
  tax: number
  discount: number
  createdAt: string
  updatedAt: string
  estimatedDeliveryMin?: string
  estimatedDeliveryMax?: string
  items: OrderItem[]
  itemCount: number
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

interface OrderHistoryClientProps {
  orders: Order[]
  pagination: PaginationInfo
  filters: OrdersQuery
}

export function OrderHistoryClient({ orders, pagination, filters }: OrderHistoryClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('account.orders')
  const locale = useLocale()
  const [searchQuery, setSearchQuery] = React.useState(filters.search || '')
  const [statusFilter, setStatusFilter] = React.useState<string>(filters.status || 'all')
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Status and payment status configs using translations
  const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    PENDING: { label: t('statuses.PENDING'), color: 'text-amber-700', bgColor: 'bg-amber-100' },
    PROCESSING: { label: t('statuses.PROCESSING'), color: 'text-blue-700', bgColor: 'bg-blue-100' },
    SHIPPED: { label: t('statuses.SHIPPED'), color: 'text-purple-700', bgColor: 'bg-purple-100' },
    DELIVERED: { label: t('statuses.DELIVERED'), color: 'text-green-700', bgColor: 'bg-green-100' },
    CANCELLED: { label: t('statuses.CANCELLED'), color: 'text-red-700', bgColor: 'bg-red-100' },
  }

  const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PENDING: { label: t('paymentStatuses.PENDING'), color: 'text-amber-600' },
    PAID: { label: t('paymentStatuses.PAID'), color: 'text-green-600' },
    FAILED: { label: t('paymentStatuses.FAILED'), color: 'text-red-600' },
    REFUNDED: { label: t('paymentStatuses.REFUNDED'), color: 'text-purple-600' },
  }

  const updateFilters = React.useCallback((updates: Partial<OrdersQuery>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    // Reset to page 1 when filters change
    if (!('page' in updates)) {
      params.delete('page')
    }

    router.push(`/account/orders?${params.toString()}`)
  }, [router, searchParams])

  const handleSearch = React.useCallback((query: string) => {
    setSearchQuery(query)

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      updateFilters({ search: query })
      searchTimeoutRef.current = null
    }, 500) // Debounce 500ms
  }, [updateFilters])

  const handleStatusFilter = React.useCallback((status: string) => {
    setStatusFilter(status)
    updateFilters({ status: status === 'all' ? undefined : status as "PENDING" | "CANCELLED" | "DELIVERED" | "PROCESSING" | "SHIPPED" })
  }, [updateFilters])

  const handlePageChange = React.useCallback((page: number) => {
    updateFilters({ page })
  }, [updateFilters])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR', // TODO: Get from user preferences
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-anthracite-900 mb-2">{t('title')}</h1>
        <p className="text-nuanced-600">
          {t('subtitle')}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-platinum-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nuanced-400" />
            <Input
              type="text"
              placeholder={t('filters.placeholder')}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="px-4 py-2 border border-platinum-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">{t('filters.allStatuses')}</option>
              {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-platinum-200 p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-platinum-300 mb-4" />
          <h3 className="text-lg font-semibold text-anthracite-900 mb-2">
            {t('empty.title')}
          </h3>
          <p className="text-nuanced-600 mb-6">
            {pagination.total === 0
              ? t('empty.subtitle')
              : t('empty.noResults')}
          </p>
          {pagination.total === 0 && (
            <Link href="/products">
              <Button>{t('empty.discover')}</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status] || { label: 'En attente', color: 'text-amber-700', bgColor: 'bg-amber-100' }
            const paymentConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus] || { label: 'En attente', color: 'text-amber-600' }

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-platinum-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Order Header */}
                <div className="p-4 border-b border-platinum-100 bg-platinum-50">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-nuanced-600">{t('orderCard.order')}</p>
                        <p className="font-semibold text-anthracite-900">
                          {order.orderNumber}
                        </p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-sm text-nuanced-600">{t('orderCard.date')}</p>
                        <p className="font-medium text-anthracite-700">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={cn(
                          'px-3 py-1',
                          statusConfig.bgColor,
                          statusConfig.color
                        )}
                      >
                        {statusConfig.label}
                      </Badge>
                      <span className={cn('text-sm font-medium', paymentConfig.color)}>
                        {paymentConfig.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Product Images */}
                    <div className="flex -space-x-3">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div
                          key={item.id}
                          className="relative w-14 h-14 rounded-lg border-2 border-white overflow-hidden bg-platinum-100"
                          style={{ zIndex: 3 - index }}
                        >
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="relative w-14 h-14 rounded-lg border-2 border-white bg-platinum-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-nuanced-600">
                            +{order.items.length - 3}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Order Summary */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-nuanced-600 truncate">
                        {order.items
                          .slice(0, 2)
                          .map((item) => item.productName)
                          .join(', ')}
                        {order.items.length > 2 && ` et ${order.items.length - 2} autre(s)`}
                      </p>
                      <p className="text-sm text-nuanced-500">
                        {order.itemCount} {order.itemCount > 1 ? t('orderCard.items_plural') : t('orderCard.items')}
                      </p>
                    </div>

                    {/* Total & Action */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-anthracite-900">
                        {formatPrice(order.total)}
                      </p>
                      <Link href={`/account/orders/${order.id}`}>
                        <Button variant="ghost" size="sm" className="mt-1">
                          {t('orderCard.details')}
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Estimated Delivery */}
                  {order.status === 'SHIPPED' && order.estimatedDeliveryMin && (
                    <div className="mt-4 pt-4 border-t border-platinum-100 flex items-center gap-2 text-sm text-nuanced-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {t('orderCard.estimatedDelivery')} : {formatDate(order.estimatedDeliveryMin)}
                        {order.estimatedDeliveryMax &&
                          ` - ${formatDate(order.estimatedDeliveryMax)}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-nuanced-600">
            {t('pagination.showing', {
              from: (pagination.page - 1) * pagination.limit + 1,
              to: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total
            })} {pagination.total > 1 ? t('pagination.orders') : t('pagination.orders')}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t('pagination.previous')}
            </Button>
            <div className="flex gap-1">
              {Array.from(
                { length: Math.ceil(pagination.total / pagination.limit) },
                (_, i) => i + 1
              )
                .filter((page) => {
                  const totalPages = Math.ceil(pagination.total / pagination.limit)
                  if (totalPages <= 5) return true
                  if (page === 1 || page === totalPages) return true
                  if (
                    page >= pagination.page - 1 &&
                    page <= pagination.page + 1
                  )
                    return true
                  return false
                })
                .map((page, index, arr) => {
                  if (index > 0 && arr[index - 1] !== page - 1) {
                    return (
                      <React.Fragment key={`ellipsis-${page}`}>
                        <span className="px-2 py-1">...</span>
                        <Button
                          key={page}
                          variant={page === pagination.page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    )
                  }
                  return (
                    <Button
                      key={page}
                      variant={page === pagination.page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  )
                })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasMore}
            >
              {t('pagination.next')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
