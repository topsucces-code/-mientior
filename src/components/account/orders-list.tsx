'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Package, Truck, CheckCircle, ChevronRight, Search } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export interface Order {
  id: string
  orderNumber: string
  createdAt: string
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  total: number
  items: Array<{
    productId: string | { id: string; name: string; slug: string; image?: string }
    quantity: number
    price: number
  }>
}

export interface OrdersListProps {
  orders: Order[]
  totalOrders?: number
  currentPage?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  className?: string
}

const statusConfig = {
  PENDING: { label: 'Pending', variant: 'warning' as const, icon: ShoppingBag },
  PROCESSING: { label: 'Processing', variant: 'default' as const, icon: Package },
  SHIPPED: { label: 'Shipped', variant: 'default' as const, icon: Truck },
  DELIVERED: { label: 'Delivered', variant: 'success' as const, icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', variant: 'error' as const, icon: ShoppingBag },
}

export function OrdersList({
  orders,
  totalOrders,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  className,
}: OrdersListProps) {
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredOrders = React.useMemo(() => {
    if (!searchQuery) return orders
    const query = searchQuery.toLowerCase()
    return orders.filter((order) =>
      order.orderNumber.toLowerCase().includes(query)
    )
  }, [orders, searchQuery])

  const totalPages = totalOrders ? Math.ceil(totalOrders / pageSize) : 1
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-anthracite-700">My Orders</h1>
          <p className="text-sm text-nuanced-600">
            {totalOrders ? `${totalOrders} orders total` : `${orders.length} orders`}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nuanced-500" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingBag className="mb-4 h-12 w-12 text-nuanced-400" />
            <h3 className="mb-2 text-lg font-semibold text-anthracite-700">
              {searchQuery ? 'No orders found' : 'No orders yet'}
            </h3>
            <p className="mb-4 text-sm text-nuanced-600">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Start shopping to see your orders here'}
            </p>
            {!searchQuery && (
              <Button variant="gradient" asChild>
                <Link href="/products">Browse Products</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const config = statusConfig[order.status]
            const Icon = config.icon

            return (
              <Card key={order.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <CardHeader className="bg-platinum-50 pb-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">Order #{order.orderNumber}</CardTitle>
                        <Badge variant={config.variant} className="flex items-center gap-1">
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>
                      <CardDescription>
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </CardDescription>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-anthracite-700">
                        ${(order.total / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-nuanced-600">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  {/* Order Items Preview */}
                  <div className="space-y-3">
                    {order.items.slice(0, 3).map((item, index) => {
                      const product = typeof item.productId === 'object' ? item.productId : null

                      return (
                        <div key={index} className="flex items-center gap-3">
                          {product?.image ? (
                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-platinum-300">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            </div>
                          ) : (
                            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md border border-platinum-300 bg-platinum-100">
                              <Package className="h-6 w-6 text-nuanced-400" />
                            </div>
                          )}
                          <div className="flex-1 space-y-0.5">
                            <p className="text-sm font-medium text-anthracite-700">
                              {product?.name || 'Product'}
                            </p>
                            <p className="text-xs text-nuanced-600">Quantity: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-semibold text-anthracite-700">
                            ${(item.price / 100).toFixed(2)}
                          </p>
                        </div>
                      )
                    })}

                    {order.items.length > 3 && (
                      <p className="text-xs text-nuanced-600">
                        + {order.items.length - 3} more {order.items.length - 3 === 1 ? 'item' : 'items'}
                      </p>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/account/orders/${order.id}`}>
                        View Details
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                    {order.status === 'DELIVERED' && (
                      <Button variant="outline" size="sm">
                        Leave Review
                      </Button>
                    )}
                    {order.status === 'SHIPPED' && (
                      <Button variant="outline" size="sm">
                        Track Package
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-platinum-300 pt-4">
          <p className="text-sm text-nuanced-600">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrevPage}
              onClick={() => onPageChange?.(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNextPage}
              onClick={() => onPageChange?.(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
