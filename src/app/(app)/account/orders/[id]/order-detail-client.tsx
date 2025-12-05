'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  CreditCard,
  FileText,
  Copy,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import OrderTracking from '@/components/orders/order-tracking'

interface OrderItem {
  id: string
  productId: string
  productName: string
  productSlug?: string
  productImage: string
  quantity: number
  price: number
  subtotal: number
}

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  paymentGateway?: string | null
  total: number
  subtotal: number
  shippingCost: number
  tax: number
  discount: number
  createdAt: string
  updatedAt: string
  estimatedDeliveryMin?: string
  estimatedDeliveryMax?: string
  shippingAddress: Record<string, string>
  billingAddress: Record<string, string> | null
  notes?: string | null
  items: OrderItem[]
}

interface OrderDetailClientProps {
  order: Order
}

const STATUS_STEPS = [
  { key: 'PENDING', label: 'En attente', icon: Clock },
  { key: 'PROCESSING', label: 'En préparation', icon: Package },
  { key: 'SHIPPED', label: 'Expédiée', icon: Truck },
  { key: 'DELIVERED', label: 'Livrée', icon: CheckCircle },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'En attente', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  PROCESSING: { label: 'En préparation', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  SHIPPED: { label: 'Expédiée', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  DELIVERED: { label: 'Livrée', color: 'text-green-700', bgColor: 'bg-green-100' },
  CANCELLED: { label: 'Annulée', color: 'text-red-700', bgColor: 'bg-red-100' },
}

export function OrderDetailClient({ order }: OrderDetailClientProps) {
  const [copied, setCopied] = React.useState(false)

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
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentStatusIndex = STATUS_STEPS.findIndex((step) => step.key === order.status)
  const statusConfig = STATUS_CONFIG[order.status] || { label: 'Inconnu', color: 'text-gray-700', bgColor: 'bg-gray-100' }

  const formatAddress = (address: Record<string, string>) => {
    const parts = [
      `${address.firstName || ''} ${address.lastName || ''}`.trim(),
      address.line1,
      address.line2,
      `${address.postalCode || ''} ${address.city || ''}`.trim(),
      address.country,
    ].filter(Boolean)
    return parts
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/account/orders"
          className="inline-flex items-center text-sm text-nuanced-600 hover:text-anthracite-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux commandes
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-anthracite-900">
                Commande {order.orderNumber}
              </h1>
              <button
                onClick={copyOrderNumber}
                className="p-1.5 rounded-md hover:bg-platinum-100 transition-colors"
                title="Copier le numéro"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-nuanced-400" />
                )}
              </button>
            </div>
            <p className="text-nuanced-600">
              Passée le {formatDate(order.createdAt)}
            </p>
          </div>
          <Badge className={cn('px-4 py-2 text-sm', statusConfig.bgColor, statusConfig.color)}>
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Status Timeline (only for non-cancelled orders) */}
      {order.status !== 'CANCELLED' && (
        <div className="bg-white rounded-xl border border-platinum-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-anthracite-900 mb-6">Suivi de commande</h2>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-platinum-200">
              <div
                className="h-full bg-orange-500 transition-all duration-500"
                style={{
                  width: `${Math.max(0, (currentStatusIndex / (STATUS_STEPS.length - 1)) * 100)}%`,
                }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index <= currentStatusIndex
                const isCurrent = index === currentStatusIndex
                const Icon = step.icon

                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                        isCompleted
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'bg-white border-platinum-300 text-nuanced-400'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={cn(
                        'mt-2 text-xs font-medium text-center',
                        isCurrent ? 'text-orange-600' : isCompleted ? 'text-anthracite-700' : 'text-nuanced-400'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Estimated Delivery */}
          {order.status === 'SHIPPED' && order.estimatedDeliveryMin && (
            <div className="mt-6 pt-6 border-t border-platinum-100">
              <p className="text-sm text-nuanced-600">
                <Truck className="w-4 h-4 inline mr-2" />
                Livraison estimée :{' '}
                <span className="font-medium text-anthracite-900">
                  {new Date(order.estimatedDeliveryMin).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                  })}
                  {order.estimatedDeliveryMax && (
                    <>
                      {' - '}
                      {new Date(order.estimatedDeliveryMax).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                      })}
                    </>
                  )}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Detailed Order Tracking */}
      {order.status !== 'CANCELLED' && (
        <div className="mb-6">
          <OrderTracking orderId={order.id} orderNumber={order.orderNumber} />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-platinum-200 overflow-hidden">
            <div className="p-4 border-b border-platinum-100">
              <h2 className="font-semibold text-anthracite-900">
                Articles ({order.items.length})
              </h2>
            </div>
            <div className="divide-y divide-platinum-100">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex gap-4">
                  <Link
                    href={item.productSlug ? `/products/${item.productSlug}` : '#'}
                    className="relative w-20 h-20 rounded-lg overflow-hidden bg-platinum-100 flex-shrink-0"
                  >
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={item.productSlug ? `/products/${item.productSlug}` : '#'}
                      className="font-medium text-anthracite-900 hover:text-orange-600 transition-colors"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-sm text-nuanced-600 mt-1">
                      Quantité : {item.quantity}
                    </p>
                    <p className="text-sm text-nuanced-600">
                      Prix unitaire : {formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-anthracite-900">
                      {formatPrice(item.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary & Info */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-xl border border-platinum-200 p-4">
            <h2 className="font-semibold text-anthracite-900 mb-4">Récapitulatif</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-nuanced-600">Sous-total</span>
                <span className="text-anthracite-700">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-nuanced-600">Livraison</span>
                <span className="text-anthracite-700">
                  {order.shippingCost === 0 ? 'Gratuite' : formatPrice(order.shippingCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-nuanced-600">TVA</span>
                <span className="text-anthracite-700">{formatPrice(order.tax)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Réduction</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-platinum-200 flex justify-between">
                <span className="font-semibold text-anthracite-900">Total</span>
                <span className="font-bold text-lg text-anthracite-900">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-platinum-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-nuanced-500" />
              <h2 className="font-semibold text-anthracite-900">Adresse de livraison</h2>
            </div>
            <div className="text-sm text-nuanced-600 space-y-1">
              {formatAddress(order.shippingAddress).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl border border-platinum-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-nuanced-500" />
              <h2 className="font-semibold text-anthracite-900">Paiement</h2>
            </div>
            <div className="text-sm">
              <p className="text-nuanced-600">
                Statut :{' '}
                <span
                  className={cn(
                    'font-medium',
                    order.paymentStatus === 'PAID'
                      ? 'text-green-600'
                      : order.paymentStatus === 'FAILED'
                      ? 'text-red-600'
                      : 'text-amber-600'
                  )}
                >
                  {order.paymentStatus === 'PAID'
                    ? 'Payé'
                    : order.paymentStatus === 'FAILED'
                    ? 'Échoué'
                    : order.paymentStatus === 'REFUNDED'
                    ? 'Remboursé'
                    : 'En attente'}
                </span>
              </p>
              {order.paymentGateway && (
                <p className="text-nuanced-600 mt-1">
                  Via : {order.paymentGateway}
                </p>
              )}
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-white rounded-xl border border-platinum-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-nuanced-500" />
                <h2 className="font-semibold text-anthracite-900">Notes</h2>
              </div>
              <p className="text-sm text-nuanced-600">{order.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/contact" className="block">
              <Button variant="outline" className="w-full">
                Besoin d'aide ?
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
