
"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import type { UserProfile } from "@/types"
import { createUserAction, updateUserAction, deleteUserAction } from "@/actions/usuarios"
import { createClient } from "@/lib/supabase/client"
import { adminCache } from "@/lib/adminCache"
import { Loader } from "@/components/ui/loader"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function UsuariosPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [profiles, setProfiles] = React.useState<UserProfile[]>([])
  const [loading, setLoading] = React.useState(true)
  const supabase = createClient()

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

  const [userToEdit, setUserToEdit] = React.useState<UserProfile | null>(null)
  const [userToDeleteId, setUserToDeleteId] = React.useState<string | null>(null)

  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    password: "",
    role: "worker"
  })

  const fetchUsers = React.useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = adminCache.get<UserProfile[]>('usuarios')
      if (cached) {
        setProfiles(cached)
        setLoading(false)
        return
      }
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/usuarios')
      const data = await res.json()
      adminCache.set('usuarios', data)
      setProfiles(data)
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los usuarios."})
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
  }

  const handleOpenAddDialog = () => {
    setFormData({ name: "", email: "", password: "", role: "worker" })
    setIsAddDialogOpen(true)
  }

  const handleOpenEditDialog = (profile: UserProfile) => {
    setUserToEdit(profile)
    setFormData({
      name: profile.name || "",
      email: profile.email || "",
      password: "", 
      role: profile.role || "worker",
    })
    setIsEditDialogOpen(true)
  }

  const handleOpenDeleteDialog = (userId: string) => {
    setUserToDeleteId(userId)
    setIsDeleteDialogOpen(true)
  }
  
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const { name, email, password, role } = formData;
    
    if (!name || !email || !password || !role) {
        toast({ variant: "destructive", title: "Error", description: "Por favor, rellena todos los campos."})
        return
    }

    const response = await createUserAction({
      name,
      email,
      role,
      password,
    });

    if (!response.success) {
      toast({ variant: "destructive", title: "Error", description: response.error || "No se pudo crear el usuario."})
    } else {
      toast({ title: "Éxito", description: "Usuario creado correctamente."})
      setIsAddDialogOpen(false)
      fetchUsers()
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userToEdit) return

    const { name, email, role } = formData;
    const response = await updateUserAction(userToEdit.id, {
      name,
      email,
      role,
    });

    if (!response.success) {
      toast({ variant: "destructive", title: "Error", description: response.error || "No se pudo actualizar el usuario."})
    } else {
      toast({ title: "Éxito", description: "Usuario actualizado correctamente."})
      setIsEditDialogOpen(false)
      setUserToEdit(null)
      fetchUsers()
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDeleteId) return

    const response = await deleteUserAction(userToDeleteId);
    
    if (!response.success) {
      toast({ variant: "destructive", title: "Error", description: response.error || "No se pudo eliminar el usuario."})
    } else {
      toast({ title: "Éxito", description: "Usuario eliminado correctamente."})
      fetchUsers()
    }
    setIsDeleteDialogOpen(false)
    setUserToDeleteId(null)
  }

  if (user?.role !== 'admin') {
    return <p>Acceso denegado.</p>
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-15rem)]">
        <Loader text="Cargando usuarios..." size={48} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Crea y administra los perfiles de los trabajadores y administradores.
        </p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
                <CardTitle>Usuarios</CardTitle>
                <CardDescription>
                    Gestiona los usuarios del sistema.
                </CardDescription>
            </div>
            <div className="ml-auto flex items-center gap-2">
                <Button size="sm" className="h-7 gap-1" onClick={handleOpenAddDialog}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Añadir Usuario
                    </span>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map(profile => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.name}</TableCell>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell className="capitalize">{profile.role}</TableCell>
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
                        <DropdownMenuItem onSelect={() => handleOpenEditDialog(profile)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onSelect={() => handleOpenDeleteDialog(profile.id)}>Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSaveUser}>
                <DialogHeader>
                    <DialogTitle className="font-headline">Añadir Nuevo Usuario</DialogTitle>
                    <DialogDescription>
                        Rellena los detalles del nuevo usuario.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" value={formData.name} onChange={handleFormChange} placeholder="John Doe" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleFormChange} placeholder="worker@wanka.com" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input id="password" type="password" value={formData.password} onChange={handleFormChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="role">Rol</Label>
                        <Select value={formData.role} onValueChange={handleRoleChange}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Seleccionar rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="worker">Trabajador</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Guardar Usuario</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <form onSubmit={handleUpdateUser}>
                <DialogHeader>
                    <DialogTitle className="font-headline">Editar Usuario</DialogTitle>
                    <DialogDescription>
                        Actualiza los detalles del usuario. La contraseña no se puede editar aquí.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid gap-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" value={formData.name} onChange={handleFormChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleFormChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="role">Rol</Label>
                        <Select value={formData.role} onValueChange={handleRoleChange}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Seleccionar rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="worker">Trabajador</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Actualizar Usuario</Button>
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente el perfil del usuario de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
