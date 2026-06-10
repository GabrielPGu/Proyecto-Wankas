
"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import type { Location } from "@/types"
import { createClient } from "@/lib/supabase/client"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function UbicacionesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [locations, setLocations] = React.useState<Location[]>([])
  const [loading, setLoading] = React.useState(true)
  const supabase = createClient()

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

  const [locationToEdit, setLocationToEdit] = React.useState<Location | null>(null)
  const [locationToDeleteId, setLocationToDeleteId] = React.useState<string | null>(null)

  const [formData, setFormData] = React.useState({
    name_es: "",
    address: ""
  })

  const fetchLocations = React.useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('locations').select('*').order('name_es', { ascending: true })
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las ubicaciones."})
      console.error(error)
    } else {
      setLocations(data)
    }
    setLoading(false)
  }, [supabase, toast])

  React.useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleOpenAddDialog = () => {
    setFormData({ name_es: "", address: "" })
    setIsAddDialogOpen(true)
  }

  const handleOpenEditDialog = (location: Location) => {
    setLocationToEdit(location)
    setFormData({
      name_es: location.name_es,
      address: location.address,
    })
    setIsEditDialogOpen(true)
  }

  const handleOpenDeleteDialog = (locationId: string) => {
    setLocationToDeleteId(locationId)
    setIsDeleteDialogOpen(true)
  }
  
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    const { name_es, address } = formData;
    
    if (!name_es || !address) {
        toast({ variant: "destructive", title: "Error", description: "Por favor, rellena todos los campos."})
        return
    }

    const { error } = await supabase.from('locations').insert({
      name_es,
      address,
    })

    if (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la ubicación."})
      console.error(error)
    } else {
      toast({ title: "Éxito", description: "Ubicación añadida correctamente."})
      setIsAddDialogOpen(false)
      fetchLocations()
    }
  }

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!locationToEdit) return

    const { name_es, address } = formData;
    const { error } = await supabase.from('locations').update({
      name_es,
      address,
    }).eq('id', locationToEdit.id)

    if (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar la ubicación."})
      console.error(error)
    } else {
      toast({ title: "Éxito", description: "Ubicación actualizada correctamente."})
      setIsEditDialogOpen(false)
      setLocationToEdit(null)
      fetchLocations()
    }
  }

  const handleDeleteLocation = async () => {
    if (!locationToDeleteId) return

    const { error } = await supabase.from('locations').delete().eq('id', locationToDeleteId)
    
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la ubicación."})
      console.error(error)
    } else {
      toast({ title: "Éxito", description: "Ubicación eliminada correctamente."})
      fetchLocations()
    }
    setIsDeleteDialogOpen(false)
    setLocationToDeleteId(null)
  }

  if (user?.role !== 'admin') {
    return <p>Acceso denegado.</p>
  }
  
  if (loading) {
    return <p>Cargando ubicaciones...</p>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Gestión de Ubicaciones</h1>
        <p className="text-muted-foreground">
          Crea y administra las sucursales de tu tienda.
        </p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
                <CardTitle>Ubicaciones</CardTitle>
                <CardDescription>
                    Gestiona las sucursales de tu tienda.
                </CardDescription>
            </div>
            <div className="ml-auto flex items-center gap-2">
                <Button size="sm" className="h-7 gap-1" onClick={handleOpenAddDialog}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Añadir Ubicación
                    </span>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map(location => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name_es}</TableCell>
                  <TableCell>{location.address}</TableCell>
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
                        <DropdownMenuItem onSelect={() => handleOpenEditDialog(location)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onSelect={() => handleOpenDeleteDialog(location.id)}>Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Add Location Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSaveLocation}>
                <DialogHeader>
                    <DialogTitle className="font-headline">Añadir Nueva Ubicación</DialogTitle>
                    <DialogDescription>
                        Rellena los detalles de la nueva sucursal.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name_es">Nombre</Label>
                        <Input id="name_es" value={formData.name_es} onChange={handleFormChange} placeholder="Wanka - Lince" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input id="address" value={formData.address} onChange={handleFormChange} placeholder="Av. Arequipa 2345, Lince" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Guardar Ubicación</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Location Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleUpdateLocation}>
                <DialogHeader>
                    <DialogTitle className="font-headline">Editar Ubicación</DialogTitle>
                    <DialogDescription>
                        Actualiza los detalles de la sucursal.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name_es">Nombre</Label>
                        <Input id="name_es" value={formData.name_es} onChange={handleFormChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input id="address" value={formData.address} onChange={handleFormChange} />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Actualizar Ubicación</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la ubicación de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLocation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
