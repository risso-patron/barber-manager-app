"use client"

import { useState, useEffect, useMemo } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { type InventoryItem, DEMO_INVENTORY } from "@/lib/demo-appointments"
import { createBrowserClient } from "@supabase/ssr"
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

interface InventoryRow {
  id: string
  product_name: string
  category?: string
  quantity: number
  min_stock: number
  cost_per_unit?: number
  sale_price?: number | null
  sku?: string | null
  supplier?: string
  updated_at?: string
}

function mapDbToItem(row: InventoryRow): InventoryItem {
  const qty = row.quantity
  const min = row.min_stock
  return {
    id: row.id,
    name: row.product_name,
    category: (row.category || 'suministro') as "suministro" | "producto" | "herramienta",
    quantity: qty,
    minStock: min,
    price: row.cost_per_unit || 0,
    salePrice: row.sale_price ?? null,
    sku: row.sku ?? null,
    supplier: row.supplier,
    lastRestocked: row.updated_at?.split('T')[0],
    status: qty === 0 ? 'agotado' : qty < min ? 'bajo' : 'disponible',
  }
}

export default function InventoryPage() {
  useRequireAuth(["admin", "manager"])
  
  const [items, setItems] = useState<InventoryItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)

  useEffect(() => {
    if (!supabase) {
      setItems(DEMO_INVENTORY)
      return
    }
    supabase.from("inventory").select("*").order("product_name").then(({ data }) => {
      if (data) setItems(data.map(mapDbToItem))
    })
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

  const handleCreateItem = async (itemData: Partial<InventoryItem>) => {
    setError(null)
    const qty = itemData.quantity ?? 0
    const min = itemData.minStock ?? 0
    if (!supabase) {
      const newItem: InventoryItem = {
        id: `demo-${Date.now()}`,
        name: itemData.name ?? "",
        category: itemData.category ?? "suministro",
        quantity: qty,
        minStock: min,
        price: itemData.price ?? 0,
        supplier: itemData.supplier,
        lastRestocked: new Date().toISOString().split("T")[0],
        status: qty === 0 ? "agotado" : qty < min ? "bajo" : "disponible",
      }
      setItems(prev => [...prev, newItem])
      setIsModalOpen(false)
      return
    }
    const { data, error } = await supabase.from("inventory").insert({
      product_name: itemData.name!,
      category: itemData.category,
      quantity: qty,
      min_stock: min,
      cost_per_unit: itemData.price,
      supplier: itemData.supplier,
      sale_price: itemData.salePrice ?? null,
      sku: itemData.sku || null,
    }).select().single()
    if (error) {
      setError(`Error al crear producto: ${error.message}`)
      return
    }
    if (data) setItems([...items, mapDbToItem(data)])
    setIsModalOpen(false)
  }

  const handleUpdateItem = async (itemData: Partial<InventoryItem>) => {
    if (!selectedItem) return
    setError(null)
    const qty = itemData.quantity ?? selectedItem.quantity
    const min = itemData.minStock ?? selectedItem.minStock
    if (!supabase) {
      const updated: InventoryItem = {
        ...selectedItem,
        ...itemData,
        quantity: qty,
        minStock: min,
        status: qty === 0 ? "agotado" : qty < min ? "bajo" : "disponible",
      }
      setItems(items.map(i => i.id === selectedItem.id ? updated : i))
      setIsModalOpen(false)
      setSelectedItem(null)
      return
    }
    const { data, error } = await supabase.from("inventory").update({
      product_name: itemData.name ?? selectedItem.name,
      category: itemData.category ?? selectedItem.category,
      quantity: qty,
      min_stock: min,
      cost_per_unit: itemData.price ?? selectedItem.price,
      supplier: itemData.supplier ?? selectedItem.supplier,
      sale_price: itemData.salePrice ?? null,
      sku: itemData.sku || null,
    }).eq("id", selectedItem.id).select().single()
    if (error) {
      setError(`Error al actualizar producto: ${error.message}`)
      return
    }
    if (data) setItems(items.map(i => i.id === selectedItem.id ? mapDbToItem(data) : i))
    setIsModalOpen(false)
    setSelectedItem(null)
  }

    const handleDeleteItem = async () => {
    if (!itemToDelete) return
    const res = await fetch(`/api/inventory?id=${itemToDelete.id}`, { method: "DELETE" })
    if (res.ok) setItems(items.filter(item => item.id !== itemToDelete.id))
    setIsDeleteModalOpen(false)
    setItemToDelete(null)
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
      case "producto":    return "orno-cat-producto"
      case "herramienta": return "orno-cat-herramienta"
      case "suministro":  return "orno-cat-suministro"
      default:            return "orno-cat-default"
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "disponible": return "orno-stock-ok"
      case "bajo":       return "orno-stock-low"
      case "agotado":    return "orno-stock-out"
      default:           return "orno-cat-default"
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
    <div style={{ padding: 32 }}>
      {error && (
        <div style={{ marginBottom: 16, padding: "12px 16px", background: "#1F1212", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#EF4444", fontSize: 13, display: "flex", justifyContent: "space-between" }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ fontWeight: 700, marginLeft: 16, background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}>✕</button>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 22, fontWeight: 600, color: "#F0F0F0", margin: 0 }}>Inventario</h1>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, color: "#8A8A8A", marginTop: 4 }}>Gestiona productos, herramientas y suministros</p>
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
            <AlertTriangle className="h-4 w-4" style={{ color: "#F59E0B" }} />
          </CardHeader>
          <CardContent>
            <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 28, fontWeight: 700, color: "#F59E0B" }}>{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agotados</CardTitle>
            <TrendingDown className="h-4 w-4" style={{ color: "#EF4444" }} />
          </CardHeader>
          <CardContent>
            <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 28, fontWeight: 700, color: "#EF4444" }}>{stats.outOfStock}</div>
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
              aria-label="Filtrar por categoría"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm" style={{ background: "hsl(var(--input))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            >
              <option value="all">Todas las categorías</option>
              <option value="producto">Productos</option>
              <option value="herramienta">Herramientas</option>
              <option value="suministro">Suministros</option>
            </select>
            <select
              aria-label="Filtrar por estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm" style={{ background: "hsl(var(--input))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
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
                  <th className="text-left py-3 px-4 font-medium">Costo</th>
                  <th className="text-left py-3 px-4 font-medium">Venta</th>
                  <th className="text-left py-3 px-4 font-medium">Margen</th>                  <th className="text-left py-3 px-4 font-medium">Proveedor</th>
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                  <th className="text-left py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b" style={{ borderColor: "#252525" }} onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#222222" }} onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent" }}>
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
                    <td className="py-3 px-4">
                      {item.salePrice ? (
                        <span style={{ color: "#22C55E", fontWeight: 500 }}>${item.salePrice.toFixed(2)}</span>
                      ) : (
                        <span style={{ color: "#555" }}>—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {item.salePrice && item.salePrice > item.price ? (
                        <span style={{ color: "#00C896", fontSize: 12, fontWeight: 600 }}>
                          {(((item.salePrice - item.price) / item.salePrice) * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span style={{ color: "#555" }}>—</span>
                      )}
                    </td>                    <td className="py-3 px-4 text-sm text-muted-foreground">{item.supplier || "N/A"}</td>
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
