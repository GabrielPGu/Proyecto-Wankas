
"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import type { Order, OrderStatus, Location } from "@/types"
import { orderStatusToSpanish, spanishToOrderStatus } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { format, parseISO } from "date-fns"
import { es } from 'date-fns/locale'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { MoreHorizontal, Filter, Calendar as CalendarIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function PedidosPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [orders, setOrders] = React.useState<Order[]>([])
  const [locations, setLocations] = React.useState<Location[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<string>("Todos")
  
  const [locationFilter, setLocationFilter] = React.useState<string>("all")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [dateFilter, setDateFilter] = React.useState<Date | undefined>()

  const supabase = createClient()

  const statuses: string[] = ["Todos", "Pendiente", "Completado", "Cancelado"]

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    let query = supabase.from('orders').select('*, profiles(name), locations(name_es), order_items(product_id, quantity)')

    if (user?.role === 'worker' && user.location_id) {
      query = query.eq('location_id', user.location_id)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los pedidos."})
      console.error("Error fetching orders:", error)
    } else {
      setOrders(data as any)
    }

    if (user?.role === 'admin') {
      const { data: locationsData, error: locationsError } = await supabase.from('locations').select('*').order('name_es', { ascending: true });
      if (locationsError) {
          toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las ubicaciones para el filtro."});
      } else {
          setLocations(locationsData || []);
      }
    }

    setLoading(false)
  }, [supabase, user?.role, user?.location_id, toast])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const clearFilters = () => {
    setLocationFilter("all");
    setSearchTerm("");
    setDateFilter(undefined);
  };

  const filteredOrders = React.useMemo(() => {
    let tempOrders = orders

    if (activeTab !== "Todos") {
      const statusInEnglish = spanishToOrderStatus(activeTab)
      tempOrders = tempOrders.filter(order => order.status === statusInEnglish)
    }

    if (user?.role === 'admin' && locationFilter !== 'all') {
      tempOrders = tempOrders.filter(order => order.location_id === locationFilter)
    }

    if (searchTerm) {
      tempOrders = tempOrders.filter(order => order.id.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    
    if (dateFilter) {
      tempOrders = tempOrders.filter(order => format(parseISO(order.created_at), 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd'))
    }

    return tempOrders
  }, [orders, activeTab, locationFilter, user?.role, searchTerm, dateFilter])

  const handleStatusChange = async (order: Order, newStatusSpanish: string) => {
    const newStatus = spanishToOrderStatus(newStatusSpanish);
    const oldStatus = order.status as OrderStatus;

    if (!newStatus || !order.order_items || newStatus === oldStatus) {
        return;
    }

    let stockChange = 0;
    if (newStatus === 'completed' && oldStatus !== 'completed') {
        stockChange = -1; 
    } else if (oldStatus === 'completed' && newStatus !== 'completed') {
        stockChange = 1; 
    }

    if (stockChange !== 0) {
        const productIds = order.order_items.map(item => item.product_id);
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, stock')
            .in('id', productIds);

        if (productsError) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo obtener el stock para la actualización." });
            return;
        }

        const productStockMap = new Map(products.map(p => [p.id, p.stock]));
        
        const stockUpdatePromises = order.order_items.map(item => {
            const currentStock = productStockMap.get(item.product_id) ?? 0;
            const newStock = currentStock + (item.quantity * stockChange);
            return supabase.from('products').update({ stock: newStock }).eq('id', item.product_id);
        });

        const results = await Promise.all(stockUpdatePromises);
        if (results.some(res => res.error)) {
            const action = stockChange === -1 ? "descontar" : "devolver";
            toast({ variant: "destructive", title: "Error", description: `Fallo al ${action} el stock para todos los productos.` });
            return; 
        }

        const { error: updateOrderStatusError } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', order.id);

        if (updateOrderStatusError) {
            toast({ variant: "destructive", title: "Error de Sincronización", description: "Se ajustó el stock, pero no se pudo actualizar el estado del pedido. Contacte a soporte." });
            console.error('Error updating order status:', updateOrderStatusError);
        } else {
            toast({ title: "Éxito", description: "Estado del pedido y stock actualizados correctamente." });
            fetchData();
        }
    } else {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', order.id)

        if (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estado del pedido."})
            console.error('Error updating order status:', error)
        } else {
            toast({ title: "Éxito", description: "Estado del pedido actualizado."})
            fetchData()
        }
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500'
      case 'completed': return 'bg-green-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return <p>Cargando pedidos...</p>
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Gestión de Pedidos</h1>
        <p className="text-muted-foreground">
          {user?.role === 'admin' ? 'Supervisa todos los pedidos.' : `Pedidos para ${user?.locationName || 'tu ubicación'}.`}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center">
            <TabsList>
                {statuses.map(status => (
                    <TabsTrigger key={status} value={status}>{status}</TabsTrigger>
                ))}
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1">
                    <Filter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filtro</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Filtros</h4>
                      <p className="text-sm text-muted-foreground">
                        Ajusta los filtros para encontrar pedidos.
                      </p>
                    </div>
                    <div className="grid gap-4">
                       <div className="grid gap-2">
                          <Label htmlFor="search">Buscar por Código</Label>
                          <Input id="search" placeholder="0000-0000..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                       </div>
                       <div className="grid gap-2">
                        <Label htmlFor="date">Fecha del Pedido</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="date"
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateFilter && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateFilter ? format(dateFilter, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              mode="single"
                              selected={dateFilter}
                              onSelect={setDateFilter}
                              initialFocus
                              locale={es}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      {user?.role === 'admin' && (
                        <div className="grid gap-2">
                          <Label htmlFor="location">Ubicación</Label>
                          <Select value={locationFilter} onValueChange={setLocationFilter}>
                            <SelectTrigger id="location" className="h-8">
                              <SelectValue placeholder="Seleccionar ubicación" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas las ubicaciones</SelectItem>
                              {locations.map((loc) => (
                                <SelectItem key={loc.id} value={loc.id}>{loc.name_es}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                     <Button variant="ghost" onClick={clearFilters} className="w-full mt-2">Limpiar Filtros</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
        </div>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>Pedidos</CardTitle>
              <CardDescription>
                Una lista de los pedidos recientes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    {user?.role === 'admin' && <TableHead>Ubicación</TableHead>}
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length > 0 ? filteredOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-medium">{order.profiles?.name || 'N/A'}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">{order.id}</div>
                      </TableCell>
                      {user?.role === 'admin' && <TableCell>{order.locations?.name_es || 'N/A'}</TableCell>}
                      <TableCell>
                        <Badge className={`${getStatusColor(order.status as OrderStatus)} text-white`}>{orderStatusToSpanish[order.status as OrderStatus] || order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">S/ {order.total_price.toFixed(2)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            {statuses.slice(1).map(status => (
                              <DropdownMenuItem key={status} onSelect={() => handleStatusChange(order, status)}>
                                Marcar como {status}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                     <TableRow>
                        <TableCell colSpan={user?.role === 'admin' ? 5 : 4} className="h-24 text-center">
                            No se encontraron pedidos.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
