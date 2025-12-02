'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package, ChevronRight, Search, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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

interface OrderHistoryClientProps {
  orders: Order[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'En attente', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  PROCESSING: { label: 'En cours', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  SHIPPED: { label: 'Expédiée', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  DELIVERED: { label: 'Livrée', color: 'text-green-700', bgColor: 'bg-green-100' },
  CANCELLED: { label: 'Annulée', color: 'text-red-700', bgColor: 'bg-red-100' },
}

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'text-amber-600' },
  PAID: { label: 'Payé', color: 'text-green-600' },
  FAILED: { label: 'Échoué', color: 'text-red-600' },
  REFUNDED: { label: 'Remboursé', color: 'text-purple-600' },
}

export function OrderHistoryClient({ orders }: OrderHistoryClientProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')

  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some((item) =>
          item.productName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, searchQuery, statusFilter])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-anthracite-900 mb-2">Mes Commandes</h1>
        <p className="text-nuanced-600">
          Consultez et suivez l'état de vos commandes
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-platinum-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nuanced-400" />
            <Input
              type="text"
              placeholder="Rechercher par n° de commande ou produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-platinum-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Tous les statuts</option>
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
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-platinum-200 p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-platinum-300 mb-4" />
          <h3 className="text-lg font-semibold text-anthracite-900 mb-2">
            {orders.length === 0 ? 'Aucune commande' : 'Aucun résultat'}
          </h3>
          <p className="text-nuanced-600 mb-6">
            {orders.length === 0
              ? "Vous n'avez pas encore passé de commande."
              : 'Aucune commande ne correspond à votre recherche.'}
          </p>
          {orders.length === 0 && (
            <Link href="/products">
              <Button>Découvrir nos produits</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
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
                        <p className="text-sm text-nuanced-600">Commande</p>
                        <p className="font-semibold text-anthracite-900">
                          {order.orderNumber}
                        </p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-sm text-nuanced-600">Date</p>
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
                        {order.itemCount} article{order.itemCount > 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Total & Action */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-anthracite-900">
                        {formatPrice(order.total)}
                      </p>
                      <Link href={`/account/orders/${order.id}`}>
                        <Button variant="ghost" size="sm" className="mt-1">
                          Détails
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
                        Livraison estimée : {formatDate(order.estimatedDeliveryMin)}
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

      {/* Summary */}
      {orders.length > 0 && (
        <div className="mt-6 text-center text-sm text-nuanced-500">
          {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''} sur{' '}
          {orders.length}
        </div>
      )}
    </div>
  )
}
