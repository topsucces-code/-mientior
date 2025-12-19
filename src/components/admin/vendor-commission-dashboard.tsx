'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Smartphone
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface VendorCommissionDashboardProps {
  vendorId?: string // If provided, shows single vendor view
}

interface CommissionStats {
  totalCommission: number
  totalSales: number
  vendorPayouts: number
  pendingPayouts: number
  activeVendors: number
  averageCommissionRate: number
  topVendors: Array<{
    vendorId: string
    vendorName: string
    sales: number
    commission: number
    tier: string
    payoutMethod: string
  }>
}

interface PayoutRequest {
  id: string
  vendorName: string
  amount: number
  currency: string
  method: string
  mobileMoneyProvider?: string
  phoneNumber?: string
  status: string
  createdAt: string
  scheduledAt?: string
}

export function VendorCommissionDashboard({ vendorId }: VendorCommissionDashboardProps) {
  const [stats, setStats] = useState<CommissionStats | null>(null)
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30d')

  useEffect(() => {
    fetchCommissionData()
    fetchPayoutRequests()
  }, [vendorId, selectedPeriod])

  const fetchCommissionData = async () => {
    try {
      const endpoint = vendorId 
        ? `/api/admin/vendors/${vendorId}/commission-stats?period=${selectedPeriod}`
        : `/api/admin/commission/stats?period=${selectedPeriod}`
      
      const response = await fetch(endpoint)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch commission data:', error)
    }
  }

  const fetchPayoutRequests = async () => {
    try {
      const endpoint = vendorId 
        ? `/api/admin/vendors/${vendorId}/payouts`
        : '/api/admin/payouts?status=pending'
      
      const response = await fetch(endpoint)
      const data = await response.json()
      setPayoutRequests(data.requests || [])
    } catch (error) {
      console.error('Failed to fetch payout requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const processPayout = async (payoutId: string) => {
    try {
      const response = await fetch(`/api/admin/payouts/${payoutId}/process`, {
        method: 'POST'
      })
      
      if (response.ok) {
        fetchPayoutRequests() // Refresh the list
      }
    } catch (error) {
      console.error('Failed to process payout:', error)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return 'bg-purple-100 text-purple-800'
      case 'GOLD': return 'bg-yellow-100 text-yellow-800'
      case 'SILVER': return 'bg-gray-100 text-gray-800'
      default: return 'bg-orange-100 text-orange-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'PROCESSING': return 'bg-blue-100 text-blue-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />
      case 'PROCESSING': return <Clock className="h-4 w-4" />
      case 'FAILED': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {vendorId ? 'Commission Vendeur' : 'Tableau de Bord Commissions'}
        </h2>
        <div className="flex gap-2">
          {['7d', '30d', '90d', '1y'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period === '7d' && '7 jours'}
              {period === '30d' && '30 jours'}
              {period === '90d' && '3 mois'}
              {period === '1y' && '1 an'}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Commission Totale</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.totalCommission, 'XOF')}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ventes Totales</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.totalSales, 'XOF')}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paiements Vendeurs</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.vendorPayouts, 'XOF')}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vendeurs Actifs</p>
                  <p className="text-2xl font-bold">{stats.activeVendors}</p>
                  <p className="text-xs text-gray-500">
                    Taux moyen: {(stats.averageCommissionRate * 100).toFixed(1)}%
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="vendors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vendors">Top Vendeurs</TabsTrigger>
          <TabsTrigger value="payouts">Demandes de Paiement</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques</TabsTrigger>
        </TabsList>

        <TabsContent value="vendors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendeurs les Plus Performants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.topVendors.map((vendor, index) => (
                  <div key={vendor.vendorId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{vendor.vendorName}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getTierColor(vendor.tier)}>
                            {vendor.tier}
                          </Badge>
                          {vendor.payoutMethod === 'MOBILE_MONEY' && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Smartphone className="h-3 w-3" />
                              Mobile Money
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(vendor.sales, 'XOF')}
                      </p>
                      <p className="text-sm text-gray-500">
                        Commission: {formatCurrency(vendor.commission, 'XOF')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Demandes de Paiement en Attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payoutRequests.map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(payout.status)}
                        <Badge className={getStatusColor(payout.status)}>
                          {payout.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium">{payout.vendorName}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-500">
                            {payout.method === 'MOBILE_MONEY' && payout.mobileMoneyProvider && (
                              <>
                                {payout.mobileMoneyProvider} - {payout.phoneNumber}
                              </>
                            )}
                            {payout.method === 'BANK_TRANSFER' && 'Virement bancaire'}
                            {payout.method === 'CASH' && 'Espèces'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Demandé le {new Date(payout.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(payout.amount, payout.currency)}
                        </p>
                        {payout.scheduledAt && (
                          <p className="text-xs text-gray-500">
                            Programmé: {new Date(payout.scheduledAt).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                      {payout.status === 'PENDING' && (
                        <Button
                          size="sm"
                          onClick={() => processPayout(payout.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Traiter
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {payoutRequests.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucune demande de paiement en attente
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Niveau</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['PLATINUM', 'GOLD', 'SILVER', 'BRONZE'].map((tier) => {
                    const vendorCount = stats?.topVendors.filter(v => v.tier === tier).length || 0
                    const percentage = stats?.topVendors.length ? 
                      (vendorCount / stats.topVendors.length * 100).toFixed(1) : '0'
                    
                    return (
                      <div key={tier} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={getTierColor(tier)}>{tier}</Badge>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{vendorCount}</span>
                          <span className="text-sm text-gray-500 ml-2">({percentage}%)</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Méthodes de Paiement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4 text-orange-600" />
                      <span>Mobile Money</span>
                    </div>
                    <span className="font-medium">
                      {payoutRequests.filter(p => p.method === 'MOBILE_MONEY').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span>Virement Bancaire</span>
                    </div>
                    <span className="font-medium">
                      {payoutRequests.filter(p => p.method === 'BANK_TRANSFER').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span>Espèces</span>
                    </div>
                    <span className="font-medium">
                      {payoutRequests.filter(p => p.method === 'CASH').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}