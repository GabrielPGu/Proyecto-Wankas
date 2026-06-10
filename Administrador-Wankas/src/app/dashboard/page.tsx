
"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import type { Order, OrderStatus } from "@/types"
import { orderStatusToSpanish } from "@/types"
import { ShoppingCart, Package, MapPin, DollarSign } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [stats, setStats] = React.useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeProducts: 0,
    activeLocations: 0,
  })
  const [recentOrders, setRecentOrders] = React.useState<Order[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)

      const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true })
      const { data: revenueData } = await supabase.from('orders').select('total_price').eq('status', 'completed')
      const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_price, 0) || 0
      const { count: activeProducts } = await supabase.from('products').select('*', { count: 'exact', head: true })
      const { count: activeLocations } = await supabase.from('locations').select('*', { count: 'exact', head: true })
      
      setStats({
        totalOrders: totalOrders ?? 0,
        totalRevenue,
        activeProducts: activeProducts ?? 0,
        activeLocations: activeLocations ?? 0,
      })

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, profiles(name), locations(name_es)')
        .order('created_at', { ascending: false })
        .limit(5)

      if (ordersData) {
        setRecentOrders(ordersData as any)
      }

      setLoading(false)
    }

    fetchDashboardData()
  }, [supabase])

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
    return <p>Cargando panel...</p>
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
