import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign,
  Users,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { requireVendor } from '@/lib/auth-roles'

export const metadata: Metadata = {
  title: 'Dashboard Vendeur | Mientior',
  description: 'Gérez votre boutique et suivez vos ventes',
}

// Mock data - in production, fetch from database
const stats = [
  {
    title: 'Ventes du mois',
    value: '2,450,000 F',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
  },
  {
    title: 'Commandes',
    value: '156',
    change: '+8.2%',
    trend: 'up',
    icon: ShoppingCart,
  },
  {
    title: 'Produits actifs',
    value: '48',
    change: '+3',
    trend: 'up',
    icon: Package,
  },
  {
    title: 'Note moyenne',
    value: '4.8',
    change: '+0.2',
    trend: 'up',
    icon: Star,
  },
]

const recentOrders = [
  { id: 'ORD-001', customer: 'Amadou D.', amount: '45,000 F', status: 'En cours', date: '2024-01-15' },
  { id: 'ORD-002', customer: 'Fatou S.', amount: '28,500 F', status: 'Livré', date: '2024-01-14' },
  { id: 'ORD-003', customer: 'Moussa K.', amount: '67,200 F', status: 'En préparation', date: '2024-01-14' },
  { id: 'ORD-004', customer: 'Aïcha B.', amount: '15,800 F', status: 'Livré', date: '2024-01-13' },
]

export default async function VendorDashboardPage() {
  // Check vendor role - will throw if not authorized
  let vendor
  try {
    vendor = await requireVendor()
  } catch {
    redirect('/unauthorized?reason=vendor_required')
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bonjour, {vendor.firstName || 'Vendeur'} 👋
          </h1>
          <p className="text-gray-600">
            Voici un aperçu de votre activité
          </p>
        </div>
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link href="/vendor/products/new">
            <Package className="mr-2 h-4 w-4" />
            Ajouter un produit
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className={`flex items-center text-xs ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3" />
                )}
                {stat.change} vs mois dernier
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Commandes récentes</CardTitle>
                <CardDescription>Vos dernières commandes</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/vendor/orders">Voir tout</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-gray-500">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{order.amount}</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      order.status === 'Livré' 
                        ? 'bg-green-100 text-green-700'
                        : order.status === 'En cours'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Gérez votre boutique</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/vendor/products">
                  <Package className="mr-2 h-4 w-4" />
                  Gérer mes produits
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/vendor/orders">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Voir les commandes
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/vendor/analytics">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Statistiques détaillées
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/vendor/customers">
                  <Users className="mr-2 h-4 w-4" />
                  Mes clients
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
