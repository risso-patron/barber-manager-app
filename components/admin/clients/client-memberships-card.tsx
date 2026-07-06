"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Plus, Loader2 } from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

interface Membership {
  id: string
  plan_name: string
  status: "active" | "paused" | "cancelled"
  billing_cycle: "monthly" | "annual"
  price: number
  starts_at: string
  ends_at: string | null
}

const STATUS_LABEL: Record<Membership["status"], { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "Activa", variant: "default" },
  paused: { label: "Pausada", variant: "secondary" },
  cancelled: { label: "Cancelada", variant: "outline" },
}

interface Props {
  clientId: string
  adminUserId?: string
}

export function ClientMembershipsCard({ clientId, adminUserId }: Props) {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [planName, setPlanName] = useState("")
  const [price, setPrice] = useState("")
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }
    supabase
      .from("memberships")
      .select("id, plan_name, status, billing_cycle, price, starts_at, ends_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setMemberships(data as Membership[])
        setIsLoading(false)
      })
  }, [clientId])

  const handleAdd = async () => {
    if (!planName.trim() || !price) return
    setIsSaving(true)

    const newMembership = {
      plan_name: planName.trim(),
      status: "active" as const,
      billing_cycle: billingCycle,
      price: parseFloat(price),
      starts_at: new Date().toISOString().slice(0, 10),
      ends_at: null,
    }

    if (!supabase) {
      setMemberships((prev) => [{ id: `demo-${Date.now()}`, ...newMembership }, ...prev])
      setPlanName(""); setPrice(""); setShowForm(false); setIsSaving(false)
      return
    }

    const { data } = await supabase
      .from("memberships")
      .insert({ ...newMembership, client_id: clientId, created_by: adminUserId })
      .select("id, plan_name, status, billing_cycle, price, starts_at, ends_at")
      .single()

    if (data) setMemberships((prev) => [data as Membership, ...prev])
    setPlanName(""); setPrice(""); setShowForm(false); setIsSaving(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Membresías
          </CardTitle>
          <CardDescription className="text-xs">Planes recurrentes contratados por el cliente.</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-3.5 w-3.5" />
          Nueva
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="flex flex-col gap-2 p-3 border border-border rounded-lg bg-muted">
            <Input placeholder="Nombre del plan (ej: Ilimitado mensual)" value={planName} onChange={(e) => setPlanName(e.target.value)} />
            <div className="flex gap-2">
              <Input type="number" min="0" placeholder="Precio" value={price} onChange={(e) => setPrice(e.target.value)} />
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as "monthly" | "annual")}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="monthly">Mensual</option>
                <option value="annual">Anual</option>
              </select>
            </div>
            <Button size="sm" onClick={handleAdd} disabled={isSaving || !planName.trim() || !price} className="gap-2">
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Crear membresía
            </Button>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Cargando…</p>
        ) : memberships.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin membresías activas</p>
        ) : (
          memberships.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <p className="text-sm font-medium">{m.plan_name}</p>
                <p className="text-xs text-muted-foreground">
                  ${m.price} / {m.billing_cycle === "monthly" ? "mes" : "año"} · desde{" "}
                  {new Date(m.starts_at + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <Badge variant={STATUS_LABEL[m.status].variant}>{STATUS_LABEL[m.status].label}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
