"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Heart } from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

interface EmployeeOption {
  id: string
  name: string
}

interface ClientPreferences {
  birthday: string | null
  allergies: string | null
  marketingConsent: boolean
  preferredEmployeeId: string | null
}

interface Props {
  clientId: string
  initial: ClientPreferences
}

export function ClientPreferencesCard({ clientId, initial }: Props) {
  const [birthday, setBirthday] = useState(initial.birthday ?? "")
  const [allergies, setAllergies] = useState(initial.allergies ?? "")
  const [marketingConsent, setMarketingConsent] = useState(initial.marketingConsent)
  const [preferredEmployeeId, setPreferredEmployeeId] = useState(initial.preferredEmployeeId ?? "")
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase
      .from("users")
      .select("id, name")
      .eq("role", "employee")
      .order("name")
      .then(({ data }) => {
        if (data) setEmployees(data as EmployeeOption[])
      })
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    if (supabase) {
      await supabase
        .from("users")
        .update({
          birthday: birthday || null,
          allergies: allergies.trim() || null,
          marketing_consent: marketingConsent,
          preferred_employee_id: preferredEmployeeId || null,
        })
        .eq("id", clientId)
    }
    setIsSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2500)
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="h-4 w-4" />
          Preferencias del cliente
        </CardTitle>
        <CardDescription className="text-xs">
          Cumpleaños, alergias, barbero preferido y permiso de marketing.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="space-y-1">
          <Label htmlFor="pref-birthday">Cumpleaños</Label>
          <Input
            id="pref-birthday"
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="pref-employee">Barbero preferido</Label>
          <select
            id="pref-employee"
            value={preferredEmployeeId}
            onChange={(e) => setPreferredEmployeeId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Sin preferencia</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="pref-allergies">Alergias</Label>
          <textarea
            id="pref-allergies"
            className="w-full border rounded-md p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            rows={3}
            placeholder="Ej: alérgico a productos con amoníaco"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(e) => setMarketingConsent(e.target.checked)}
            className="h-4 w-4"
          />
          Acepta recibir promociones y novedades
        </label>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full gap-2"
          variant={saveSuccess ? "outline" : "default"}
        >
          {isSaving ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Guardando…</>
          ) : saveSuccess ? (
            <><Save className="h-4 w-4 text-green-600" /><span className="text-green-600">Guardado</span></>
          ) : (
            <><Save className="h-4 w-4" />Guardar preferencias</>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
