
"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import type { Product, Category } from "@/types"
import { createClient } from "@/lib/supabase/client"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CatalogoPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [products, setProducts] = React.useState<Product[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

  const [productToEdit, setProductToEdit] = React.useState<Product | null>(null)
  const [productToDeleteId, setProductToDeleteId] = React.useState<string | null>(null)
  
  const [formData, setFormData] = React.useState({
    name_es: "",
    description_es: "",
    price: "",
    stock: "",
    category_id: ""
  })
  
  const supabase = createClient()

  const fetchProductsAndCategories = React.useCallback(async () => {
    setLoading(true)
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select(`*, categories (*)`)
      .order('name_es', { ascending: true })
    
    if (productsError) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los productos."})
      console.error(productsError)
    } else {
      setProducts(productsData as any)
    }

    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select('*')
    
    if (categoriesError) {
       toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las categorías."})
      console.error(categoriesError)
    } else {
      setCategories(categoriesData)
    }
    setLoading(false)
  }, [supabase, toast])

  React.useEffect(() => {
    fetchProductsAndCategories()
  }, [fetchProductsAndCategories])
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({...prev, category_id: value}));
  };

  const handleOpenAddDialog = () => {
    setFormData({ name_es: "", description_es: "", price: "", stock: "", category_id: "" })
    setIsAddDialogOpen(true)
  }

  const handleOpenEditDialog = (product: Product) => {
    setProductToEdit(product)
    setFormData({
      name_es: product.name_es,
      description_es: product.description_es || "",
      price: String(product.price),
      stock: String(product.stock),
      category_id: product.category_id,
    })
    setIsEditDialogOpen(true)
  }

  const handleOpenDeleteDialog = (productId: string) => {
    setProductToDeleteId(productId)
    setIsDeleteDialogOpen(true)
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    const { name_es, description_es, price, stock, category_id } = formData;
    
    if (!name_es || !price || !stock || !category_id) {
        toast({ variant: "destructive", title: "Error", description: "Por favor, rellena todos los campos obligatorios."})
        return
    }

    const { error } = await supabase.from('products').insert({
      name_es,
      description_es,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      category_id,
    })

    if (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el producto."})
      console.error(error)
    } else {
      toast({ title: "Éxito", description: "Producto añadido correctamente."})
      setIsAddDialogOpen(false)
      fetchProductsAndCategories()
    }
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productToEdit) return

    const { name_es, description_es, price, stock, category_id } = formData;
    const { error } = await supabase.from('products').update({
      name_es,
      description_es,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      category_id,
    }).eq('id', productToEdit.id)

    if (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el producto."})
      console.error(error)
    } else {
      toast({ title: "Éxito", description: "Producto actualizado correctamente."})
      setIsEditDialogOpen(false)
      setProductToEdit(null)
      fetchProductsAndCategories()
    }
  }

  const handleDeleteProduct = async () => {
    if (!productToDeleteId) return

    const { error } = await supabase.from('products').delete().eq('id', productToDeleteId)
    
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el producto."})
      console.error(error)
    } else {
      toast({ title: "Éxito", description: "Producto eliminado correctamente."})
      fetchProductsAndCategories()
    }
    setIsDeleteDialogOpen(false)
    setProductToDeleteId(null)
  }


  if (user?.role !== 'admin') {
    return <p>Acceso denegado.</p>
  }

  if (loading) {
    return <p>Cargando productos...</p>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Gestión de Catálogo</h1>
        <p className="text-muted-foreground">
          Añade, edita o elimina productos de la tienda.
        </p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
                <CardTitle>Productos</CardTitle>
                <CardDescription>
                    Gestiona los productos de tu tienda.
                </CardDescription>
            </div>
            <div className="ml-auto flex items-center gap-2">
                <Button size="sm" className="h-7 gap-1" onClick={handleOpenAddDialog}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Añadir Producto
                    </span>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(product => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name_es}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.categories?.name_es || 'N/A'}</Badge>
                  </TableCell>
                   <TableCell>{product.stock}</TableCell>
                  <TableCell className="text-right">S/ {product.price.toFixed(2)}</TableCell>
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
                        <DropdownMenuItem onSelect={() => handleOpenEditDialog(product)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onSelect={() => handleOpenDeleteDialog(product.id)}>Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSaveProduct}>
                <DialogHeader>
                    <DialogTitle className="font-headline">Añadir Nuevo Producto</DialogTitle>
                    <DialogDescription>
                        Rellena los detalles del nuevo producto.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name_es">Nombre</Label>
                        <Input id="name_es" value={formData.name_es} onChange={handleFormChange} placeholder="Lomo Saltado" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description_es">Descripción</Label>
                        <Textarea id="description_es" value={formData.description_es} onChange={handleFormChange} placeholder="Delicioso plato peruano." />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="price">Precio</Label>
                        <Input id="price" type="number" value={formData.price} onChange={handleFormChange} placeholder="45.00" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="stock">Stock</Label>
                        <Input id="stock" type="number" value={formData.stock} onChange={handleFormChange} placeholder="100" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category_id">Categoría</Label>
                        <Select value={formData.category_id} onValueChange={handleSelectChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name_es}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Guardar Producto</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleUpdateProduct}>
                <DialogHeader>
                    <DialogTitle className="font-headline">Editar Producto</DialogTitle>
                    <DialogDescription>
                        Actualiza los detalles del producto.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name_es">Nombre</Label>
                        <Input id="name_es" value={formData.name_es} onChange={handleFormChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description_es">Descripción</Label>
                        <Textarea id="description_es" value={formData.description_es} onChange={handleFormChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="price">Precio</Label>
                        <Input id="price" type="number" value={formData.price} onChange={handleFormChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="stock">Stock</Label>
                        <Input id="stock" type="number" value={formData.stock} onChange={handleFormChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category_id">Categoría</Label>
                        <Select value={formData.category_id} onValueChange={handleSelectChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name_es}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Actualizar Producto</Button>
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente el producto de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
