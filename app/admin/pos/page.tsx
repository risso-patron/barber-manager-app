"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  CheckCircle,
  ArrowLeft,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Gift,
  User,
} from "lucide-react"
import Link from "next/link"
import type { Service, InventoryItem } from "@/lib/demo-appointments"
import { DEMO_SERVICES, DEMO_INVENTORY } from "@/lib/demo-appointments"
import { ClientAvatar } from "@/components/admin/clients/client-identity"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createBrowserClient(supabaseUrl, supabaseAnonKey)
    : null

// ---------- Types -----------------------------------------------------------

interface CartItem {
  key: string
  item_type: "service" | "product"
  item_id?: string
  name: string
  price: number
  quantity: number
}

interface ClientOption {
  id: string
  name: string
  loyalty_points: number
}

type PaymentMethod = "cash" | "card" | "transfer"

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
}

const PAYMENT_ICONS: Record<PaymentMethod, React.ReactNode> = {
  cash: <Banknote className="h-4 w-4" />,
  card: <CreditCard className="h-4 w-4" />,
  transfer: <ArrowRightLeft className="h-4 w-4" />,
}

// ---------- Page ------------------------------------------------------------

export default function POSPage() {
  const user = useRequireAuth(["admin"])

  // Catalog
  const [services, setServices] = useState<Service[]>([])
  const [products, setProducts] = useState<InventoryItem[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [catalogSearch, setCatalogSearch] = useState("")
  const [catalogTab, setCatalogTab] = useState<"service" | "product">("service")

  // Cart & sale
  const [cart, setCart] = useState<CartItem[]>([])
  const [payment, setPayment] = useState<PaymentMethod>("cash")
  const [discount, setDiscount] = useState("")
  const [tip, setTip] = useState("")
  const [clientSearch, setClientSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null)
  const [notes, setNotes] = useState("")
  const [useRedeemPoints, setUseRedeemPoints] = useState(false)

  // Redemption constants
  const POINT_VALUE = 0.1 // $0.10 por punto

  // UX state
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ---------- Load catalog --------------------------------------------------
  useEffect(() => {
    if (!user) return
    if (!supabase) {
      setServices(DEMO_SERVICES)
      setProducts(DEMO_INVENTORY.filter((i) => i.category === "producto"))
      return
    }
    supabase.from("services").select("id, name, price, duration").order("name").then(({ data }) => {
      if (data) setServices(data as Service[])
    })
    supabase
      .from("inventory")
      .select("id, product_name, cost_per_unit, quantity, category")
      .eq("category", "producto")
      .gt("quantity", 0)
      .order("product_name")
      .then(({ data }) => {
        if (data)
          setProducts(
            data.map(
              (r: { id: string; product_name: string; cost_per_unit: number | null; quantity: number; category: string }) => ({
                id: r.id,
                name: r.product_name,
                category: "producto" as const,
                quantity: r.quantity,
                minStock: 0,
                price: r.cost_per_unit ?? 0,
                status: "disponible" as const,
              })
            )
          )
      })
    supabase
      .from("users")
      .select("id, name, loyalty_points")
      .eq("role", "client")
      .order("name")
      .then(({ data }) => {
        if (data) setClients(data as ClientOption[])
      })
  }, [user])

  // ---------- Preload from appointment (Item 9) -----------------------------
  const searchParams = useSearchParams()

  useEffect(() => {
    const appointmentId = searchParams.get("appointment_id")
    if (!appointmentId || !supabase || !user) return

    supabase
      .from("appointments")
      .select(`
        id,
        service:services(id, name, price),
        client:users!appointments_client_id_fkey(id, name, loyalty_points)
      `)
      .eq("id", appointmentId)
      .single()
      .then(({ data }) => {
        if (!data) return
        const svc = data.service as unknown as { id: string; name: string; price: number } | null
        const cli = data.client as unknown as { id: string; name: string; loyalty_points: number } | null
        if (svc) addItem("service", svc.id, svc.name, svc.price)
        if (cli) setSelectedClient({ id: cli.id, name: cli.name, loyalty_points: cli.loyalty_points ?? 0 })
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // ---------- Catalog filter ------------------------------------------------
  const filteredItems = useMemo(() => {
    const q = catalogSearch.toLowerCase()
    if (catalogTab === "service")
      return services.filter((s) => s.name.toLowerCase().includes(q))
    return products.filter((p) => p.name.toLowerCase().includes(q))
  }, [catalogTab, catalogSearch, services, products])

  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase()
    return clients.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8)
  }, [clientSearch, clients])

  // ---------- Cart helpers --------------------------------------------------
  function addItem(item_type: "service" | "product", id: string, name: string, price: number) {
    const key = `${item_type}:${id}`
    setCart((prev) => {
      const existing = prev.find((c) => c.key === key)
      if (existing) return prev.map((c) => c.key === key ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { key, item_type, item_id: id, name, price, quantity: 1 }]
    })
  }

  function updateQty(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => c.key === key ? { ...c, quantity: c.quantity + delta } : c)
        .filter((c) => c.quantity > 0)
    )
  }

  function removeItem(key: string) {
    setCart((prev) => prev.filter((c) => c.key !== key))
  }

  // ---------- Totals --------------------------------------------------------
  const subtotal = useMemo(() => cart.reduce((sum, c) => sum + c.price * c.quantity, 0), [cart])
  const discountAmt = parseFloat(discount) || 0
  const tipAmt = parseFloat(tip) || 0
  const totalBeforeRedemption = Math.max(0, subtotal - discountAmt)
  const availablePoints = selectedClient?.loyalty_points ?? 0
  const maxRedemptionAmt = parseFloat((availablePoints * POINT_VALUE).toFixed(2))
  const redemptionAmt = useRedeemPoints ? Math.min(maxRedemptionAmt, totalBeforeRedemption) : 0
  const redeemPointsCount = useRedeemPoints ? Math.ceil(redemptionAmt / POINT_VALUE) : 0
  const total = Math.max(0, totalBeforeRedemption - redemptionAmt)
  const loyaltyEarned = selectedClient && !useRedeemPoints ? Math.max(1, Math.floor(total)) : 0

  // ---------- Checkout ------------------------------------------------------
  async function handleCheckout() {
    if (cart.length === 0) return
    setLoading(true)
    setError(null)

    if (!supabase) {
      await new Promise(resolve => setTimeout(resolve, 600))
      setSuccess(true)
      setLoading(false)
      setTimeout(() => {
        setCart([])
        setDiscount("")
        setTip("")
        setSelectedClient(null)
        setClientSearch("")
        setNotes("")
        setPayment("cash")
        setUseRedeemPoints(false)
        setSuccess(false)
      }, 2200)
      return
    }

    try {
      const res = await fetch("/api/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: selectedClient?.id,
          payment_method: payment,
          discount: discountAmt,
          redeem_points: redeemPointsCount,
          tip: tipAmt,
          notes: notes || undefined,
          items: cart.map((c) => ({
            item_type: c.item_type,
            item_id: c.item_id,
            name: c.name,
            price: c.price,
            quantity: c.quantity,
          })),
        }),
      })

      const data = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok) { setError(data.error ?? "Error al procesar la venta"); return }

      setSuccess(true)
      setTimeout(() => {
        setCart([])
        setDiscount("")
        setTip("")
        setSelectedClient(null)
        setClientSearch("")
        setNotes("")
        setPayment("cash")
        setUseRedeemPoints(false)
        setSuccess(false)
      }, 2200)
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  // ---------- Render --------------------------------------------------------
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Punto de Venta</h1>
          <p className="text-sm text-gray-500">Registra ventas de servicios y productos</p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">

        {/* ─── LEFT: Catalog ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex rounded-lg border overflow-hidden bg-white">
            {(["service", "product"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setCatalogTab(tab)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  catalogTab === tab ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab === "service" ? "Servicios" : "Productos"}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={catalogTab === "service" ? "Buscar servicio…" : "Buscar producto…"}
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Items grid */}
          <div className="grid grid-cols-2 gap-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => addItem(catalogTab, item.id, item.name, item.price)}
                className="text-left p-4 bg-white border rounded-xl hover:border-gray-400 hover:shadow-sm transition-all group"
              >
                <p className="font-medium text-gray-900 text-sm leading-tight group-hover:text-gray-700">
                  {item.name}
                </p>
                <p className="text-lg font-bold text-gray-900 mt-1">${item.price.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{catalogTab === "service" ? "servicio" : "producto"}</p>
              </button>
            ))}
            {filteredItems.length === 0 && (
              <div className="col-span-2 py-10 text-center text-gray-400 text-sm">
                Sin resultados
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT: Cart + Checkout ────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Cart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-4 w-4" />
                Carrito
                {cart.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">{cart.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Agrega ítems desde el catálogo</p>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.key} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">${item.price.toFixed(2)} c/u</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => updateQty(item.key, -1)}
                          aria-label="Reducir cantidad"
                          className="w-6 h-6 rounded-full border flex items-center justify-center text-gray-600 hover:bg-gray-200"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.key, 1)}
                          aria-label="Aumentar cantidad"
                          className="w-6 h-6 rounded-full border flex items-center justify-center text-gray-600 hover:bg-gray-200"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <span className="w-14 text-right text-sm font-semibold text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button onClick={() => removeItem(item.key)} aria-label="Eliminar ítem" className="text-gray-300 hover:text-red-500 ml-1">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Cliente (opcional)
                {selectedClient && (
                  <button
                    onClick={() => { setSelectedClient(null); setClientSearch("") }}
                    className="ml-auto text-xs text-gray-400 hover:text-red-500"
                  >
                    ✕ Quitar
                  </button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedClient ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted border border-border rounded-lg">
                    <ClientAvatar name={selectedClient.name} size="sm" className="h-8 w-8 text-sm" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{selectedClient.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Gift className="h-3 w-3" />
                        {selectedClient.loyalty_points} pts actuales
                        {cart.length > 0 && !useRedeemPoints && ` → +${loyaltyEarned} pts`}
                        {cart.length > 0 && useRedeemPoints && ` → −${redeemPointsCount} pts (−$${redemptionAmt.toFixed(2)})`}
                      </p>
                    </div>
                  </div>

                  {/* Loyalty redemption toggle (Item 10) */}
                  {availablePoints > 0 && cart.length > 0 && (
                    <label className="flex items-center gap-2 cursor-pointer select-none p-2 rounded-lg border hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={useRedeemPoints}
                        onChange={(e) => setUseRedeemPoints(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">
                        Canjear{" "}
                        <span className="font-medium text-amber-700">{availablePoints} pts</span>
                        {" "}= descuento de{" "}
                        <span className="font-medium text-green-700">${Math.min(maxRedemptionAmt, totalBeforeRedemption).toFixed(2)}</span>
                      </span>
                    </label>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar cliente…"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {clientSearch && (
                    <div className="border rounded-lg overflow-hidden">
                      {filteredClients.length === 0 ? (
                        <p className="text-sm text-gray-400 p-3 text-center">Sin resultados</p>
                      ) : (
                        filteredClients.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => { setSelectedClient(c); setClientSearch("") }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between border-b last:border-0"
                          >
                            <span className="text-gray-900">{c.name}</span>
                            <span className="text-xs text-amber-600">{c.loyalty_points} pts</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment + totals */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment method */}
              <div className="flex gap-2">
                {(["cash", "card", "transfer"] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPayment(m)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      payment === m ? "bg-gray-900 text-white border-gray-900" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {PAYMENT_ICONS[m]}
                    {PAYMENT_LABELS[m]}
                  </button>
                ))}
              </div>

              {/* Discount */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-24 shrink-0">Descuento $</label>
                <Input
                  type="number"
                  min={0}
                  max={subtotal}
                  step={0.01}
                  placeholder="0.00"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="max-w-[120px]"
                />
              </div>

              {/* Notes */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-24 shrink-0">Propina $</label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  value={tip}
                  onChange={(e) => setTip(e.target.value)}
                  className="max-w-[120px]"
                />
              </div>

              {/* Notes */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-24 shrink-0">Notas</label>
                <Input
                  placeholder="Opcional…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                />
              </div>

              {/* Totals summary */}
              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discountAmt > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span>− ${discountAmt.toFixed(2)}</span>
                  </div>
                )}
                {redemptionAmt > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Puntos canjeados ({redeemPointsCount} pts)</span>
                    <span>− ${redemptionAmt.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg text-gray-900 pt-1">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                {tipAmt > 0 && (
                  <div className="flex justify-between text-indigo-600 pt-1 border-t">
                    <span>Propina</span>
                    <span>+ ${tipAmt.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && <p className="text-sm text-red-600">{error}</p>}

              {/* Submit */}
              {success ? (
                <div className="flex items-center justify-center gap-2 py-3 text-green-600 font-medium">
                  <CheckCircle className="h-5 w-5" />
                  Venta registrada correctamente
                </div>
              ) : (
                <Button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || loading}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 text-base font-semibold"
                >
                  {loading ? "Procesando…" : `Cobrar $${total.toFixed(2)}`}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
