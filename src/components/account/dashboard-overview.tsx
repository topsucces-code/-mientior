'use client'

import * as React from 'react'
import Link from 'next/link'
import { ShoppingBag, Package, Truck, CheckCircle, Heart, Trophy } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export interface Order {
  id: string
  orderNumber: string
  createdAt: string
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  total: number
  items: Array<{
    productId: string | { id: string; name: string; slug: string }
    quantity: number
    price: number
  }>
}

export interface DashboardStats {
  totalOrders: number
  pendingOrders: number
  wishlistItems: number
  loyaltyPoints?: number
}

export interface DashboardOverviewProps {
  user: {
    name: string
    email: string
  }
  stats: DashboardStats
  recentOrders: Order[]
  className?: string
}

const statusConfig = {
  PENDING: { label: 'Pending', variant: 'warning' as const, icon: ShoppingBag },
  PROCESSING: { label: 'Processing', variant: 'default' as const, icon: Package },
  SHIPPED: { label: 'Shipped', variant: 'default' as const, icon: Truck },
  DELIVERED: { label: 'Delivered', variant: 'success' as const, icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', variant: 'error' as const, icon: ShoppingBag },
}

export function DashboardOverview({
  user,
  stats,
  recentOrders,
  className,
}: DashboardOverviewProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {user.name}!</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wishlist</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.wishlistItems}</div>
            <p className="text-xs text-muted-foreground">Saved items</p>
          </CardContent>
        </Card>

        {stats.loyaltyPoints !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.loyaltyPoints}</div>
              <p className="text-xs text-muted-foreground">Available</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Your latest purchases</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/account/orders">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag className="mb-4 h-12 w-12 text-nuanced-400" />
              <p className="text-sm text-nuanced-600">No orders yet</p>
              <p className="mb-4 text-xs text-nuanced-500">Start shopping to see your orders here</p>
              <Button variant="gradient" asChild>
                <Link href="/products">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.slice(0, 3).map((order, index) => {
                const config = statusConfig[order.status]
                const Icon = config.icon

                return (
                  <div key={order.id}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/account/orders/${order.id}`}
                            className="font-medium text-anthracite-700 hover:text-orange-500 hover:underline"
                          >
                            Order #{order.orderNumber}
                          </Link>
                          <Badge variant={config.variant} className="flex items-center gap-1">
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-nuanced-600">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-nuanced-500">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-anthracite-700">
                          ${(order.total / 100).toFixed(2)}
                        </p>
                        <Button variant="outline" size="sm" className="mt-2" asChild>
                          <Link href={`/account/orders/${order.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/account/wishlist">
                <Heart className="mr-2 h-4 w-4" />
                View Wishlist
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/account/addresses">
                <Package className="mr-2 h-4 w-4" />
                Manage Addresses
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/account/loyalty">
                <Trophy className="mr-2 h-4 w-4" />
                Loyalty Program
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
