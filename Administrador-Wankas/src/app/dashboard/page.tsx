
"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader } from "@/components/ui/loader"
import type { Order, OrderStatus } from "@/types"
import { orderStatusToSpanish } from "@/types"
import { ShoppingCart, Package, MapPin, DollarSign } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = React.useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeProducts: 0,
    activeLocations: 0,
  })
  const [recentOrders, setRecentOrders] = React.useState<Order[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // No hacer nada hasta que el usuario esté autenticado
    if (!user) return

    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/admin/dashboard')
        const data = await res.json()
        setStats(data.stats)
        setRecentOrders(data.recentOrders)
      } catch (e) {
        console.error('Error fetching dashboard data:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()

    // Prefetch silencioso: alimentar Redis con todos los datos antes de que el
    // admin navegue a esas pestañas, para que carguen altoque.
    const prefetchAll = () => {
      fetch('/api/admin/catalogo').catch(() => {})
      fetch('/api/admin/usuarios').catch(() => {})
      fetch('/api/admin/ubicaciones').catch(() => {})
      const params = new URLSearchParams({ role: user.role })
      if (user.role === 'worker' && user.location_id) {
        params.set('location_id', user.location_id)
      }
      fetch(`/api/admin/pedidos?${params}`).catch(() => {})
    }

    // Ejecutar prefetch 1 segundo después de que el dashboard carga para
    // no competir con la propia petición del panel
    const timer = setTimeout(prefetchAll, 1000)
    return () => clearTimeout(timer)
  }, [user])

  const statCards = [
    {
      title: "Total Pedidos",
      value: stats.totalOrders,
      icon: ShoppingCart,
      description: "Todos los pedidos registrados",
    },
    {
      title: "Ingresos Totales",
      value: `S/ ${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "Suma de pedidos completados",
    },
    {
      title: "Productos Activos",
      value: stats.activeProducts,
      icon: Package,
      description: "Productos en el catálogo",
    },
    {
      title: "Ubicaciones Activas",
      value: stats.activeLocations,
      icon: MapPin,
      description: "Sucursales operativas",
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-15rem)]">
        <Loader text="Cargando panel..." size={48} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Resumen del Panel</h1>
        <p className="text-muted-foreground">
          Bienvenido de nuevo, {user?.name}. Aquí tienes un resumen de la actividad.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Pedidos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-md">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{order.profiles?.name || 'Cliente'}</p>
                    <p className="text-sm text-muted-foreground">{order.id} - {order.locations?.name_es}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">S/ {order.total_price.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{orderStatusToSpanish[order.status as OrderStatus] || order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

