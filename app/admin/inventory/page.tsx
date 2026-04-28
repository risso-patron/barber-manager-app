"use client"

import { useState, useEffect, useMemo } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { DEMO_INVENTORY, type InventoryItem } from "@/lib/demo-appointments"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Archive,
  Edit,
  Trash2,
  RefreshCw,
  ArrowLeft
} from "lucide-react"
import { InventoryModal } from "@/components/admin/inventory/inventory-modal"
import { DeleteConfirmModal } from "@/components/admin/inventory/delete-confirm-modal"

export default function InventoryPage() {
  useRequireAuth(["admin"])
  
  const [items, setItems] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)

  useEffect(() => {
    setItems(DEMO_INVENTORY)
  }, [])

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
      const matchesStatus = statusFilter === "all" || item.status === statusFilter
      
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [items, searchTerm, categoryFilter, statusFilter])

  const stats = useMemo(() => {
    const totalItems = items.length
    const lowStock = items.filter(i => i.status === "bajo").length
    const outOfStock = items.filter(i => i.status === "agotado").length
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    return { totalItems, lowStock, outOfStock, totalValue }
  }, [items])

  const handleCreateItem = (itemData: Partial<InventoryItem>) => {
    const newItem: InventoryItem = {
      id: `i${Date.now()}`,
      name: itemData.name!,
      category: itemData.category!,
      quantity: itemData.quantity!,
      minStock: itemData.minStock!,
      price: itemData.price!,
      supplier: itemData.supplier,
      lastRestocked: new Date().toISOString().split('T')[0],
      status: itemData.quantity! === 0 ? "agotado" : itemData.quantity! < itemData.minStock! ? "bajo" : "disponible"
    }
    setItems([...items, newItem])
    setIsModalOpen(false)
  }

  const handleUpdateItem = (itemData: Partial<InventoryItem>) => {
    setItems(items.map(item => {
      if (item.id === selectedItem?.id) {
        const updatedItem = { ...item, ...itemData }
        updatedItem.status = updatedItem.quantity === 0 ? "agotado" : updatedItem.quantity < updatedItem.minStock ? "bajo" : "disponible"
        return updatedItem
      }
      return item
    }))
    setIsModalOpen(false)
    setSelectedItem(null)
  }

  const handleDeleteItem = () => {
    if (itemToDelete) {
      setItems(items.filter(item => item.id !== itemToDelete.id))
      setIsDeleteModalOpen(false)
      setItemToDelete(null)
    }
  }

  const handleRestock = (item: InventoryItem) => {
    setItems(items.map(i => {
      if (i.id === item.id) {
        const newQuantity = i.quantity + i.minStock * 2
        return {
          ...i,
          quantity: newQuantity,
          lastRestocked: new Date().toISOString().split('T')[0],
          status: newQuantity === 0 ? "agotado" : newQuantity < i.minStock ? "bajo" : "disponible"
        }
      }
      return i
    }))
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "producto": return "bg-blue-100 text-blue-800"
      case "herramienta": return "bg-purple-100 text-purple-800"
      case "suministro": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "disponible": return "bg-green-100 text-green-800"
      case "bajo": return "bg-yellow-100 text-yellow-800"
      case "agotado": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "disponible": return <Package className="h-4 w-4" />
      case "bajo": return <AlertTriangle className="h-4 w-4" />
      case "agotado": return <Archive className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const router = useRouter()

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Inventario</h1>
            <p className="text-muted-foreground">Gestiona productos, herramientas y suministros</p>
          </div>
        </div>
        <Button onClick={() => { setSelectedItem(null); setIsModalOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Artículo
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Artículos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">En inventario</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agotados</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
            <p className="text-xs text-muted-foreground">Sin stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Valor en inventario</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Todas las categorías</option>
              <option value="producto">Productos</option>
              <option value="herramienta">Herramientas</option>
              <option value="suministro">Suministros</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="bajo">Stock Bajo</option>
              <option value="agotado">Agotado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Artículos ({filteredItems.length})</CardTitle>
          <CardDescription>
            Lista completa de artículos en inventario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Artículo</th>
                  <th className="text-left py-3 px-4 font-medium">Categoría</th>
                  <th className="text-left py-3 px-4 font-medium">Cantidad</th>
                  <th className="text-left py-3 px-4 font-medium">Stock Mín.</th>
                  <th className="text-left py-3 px-4 font-medium">Precio</th>
                  <th className="text-left py-3 px-4 font-medium">Proveedor</th>
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                  <th className="text-left py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.lastRestocked && (
                          <div className="text-xs text-muted-foreground">
                            Último reabastecimiento: {new Date(item.lastRestocked).toLocaleDateString('es-ES')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={getCategoryColor(item.category)}>
                        {item.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className={item.quantity < item.minStock ? "font-bold text-yellow-600" : ""}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4">{item.minStock}</td>
                    <td className="py-3 px-4">${item.price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{item.supplier || "N/A"}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={`flex items-center gap-1 w-fit ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {(item.status === "bajo" || item.status === "agotado") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestock(item)}
                            title="Reabastecer"
                          >
                            <RefreshCw className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedItem(item); setIsModalOpen(true) }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setItemToDelete(item); setIsDeleteModalOpen(true) }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron artículos
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <InventoryModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedItem(null) }}
        onSubmit={selectedItem ? handleUpdateItem : handleCreateItem}
        item={selectedItem}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setItemToDelete(null) }}
        onConfirm={handleDeleteItem}
        itemName={itemToDelete?.name || ""}
      />
    </div>
  )
}
