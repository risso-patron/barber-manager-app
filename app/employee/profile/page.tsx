"use client"

import { useEffect, useState } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Camera, Save, CheckCircle, AlertCircle } from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

type ProfileData = {
  name: string
  email: string
  phone: string
  role: string
  avatar_url: string
}

export default function EmployeeProfilePage() {
  const user = useRequireAuth(["employee", "admin"])
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
    role: "employee",
    avatar_url: "",
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return

    if (!supabase) {
      setProfile({
        name: user.profile?.name || "",
        email: user.email || "",
        phone: user.profile?.phone || "",
        role: user.role || "employee",
        avatar_url: user.profile?.avatar_url || "",
      })
      setLoading(false)
      return
    }
    const loadProfile = async () => {
      const { data } = await supabase
        .from("users")
        .select("name, email, phone, role, avatar_url")
        .eq("id", user.id)
        .single()

      if (data) {
        setProfile({
          name: data.name || "",
          email: data.email || user.email || "",
          phone: data.phone || "",
          role: data.role || "employee",
          avatar_url: data.avatar_url || "",
        })
      } else {
        setProfile((prev) => ({
          ...prev,
          email: user.email || "",
          role: (user as { role?: string }).role || "employee",
        }))
      }
      setLoading(false)
    }

    void loadProfile()
  }, [user])

  const handleSave = async () => {
    if (!user?.id || !supabase) return
    setSaving(true)

    const { error } = await supabase
      .from("users")
      .update({
        name: profile.name,
        phone: profile.phone || null,
        avatar_url: profile.avatar_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    setSaving(false)
    if (error) {
      setSaveError("No se pudo guardar el perfil. Intenta nuevamente.")
      return
    }
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  if (!user || loading) {
    return (
      <div style={{ padding: "32px" }}>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "12px", color: "#8A8A8A" }}>Cargando perfil...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: "24px 32px 80px" }}>
      <style>{`
        .orno-input { background: #111 !important; border: 1px solid #2E2E2E !important; color: #F0F0F0 !important; }
        .orno-input:disabled { opacity: 0.4; }
        .orno-input::placeholder { color: #555555 !important; }
        .orno-btn { transition: background 0.15s, color 0.15s; }
        .orno-btn:hover { background: rgba(240,240,240,0.06) !important; }
      `}</style>

      {/* ── Header ── */}
      <div className="pt-8 pb-3">
        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(28px,4vw,40px)", fontWeight: 300, color: "#F0F0F0", letterSpacing: "-0.02em" }}>Mi perfil</p>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A", marginTop: "4px" }}>Gestiona tus datos personales y de contacto</p>
      </div>
      <div style={{ height: "1px", background: "#252525", marginBottom: "32px" }} />

      {saveSuccess && (
        <div style={{ marginBottom: "16px", padding: "12px 16px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle style={{ width: 14, height: 14, color: "#22C55E", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "12px", color: "#22C55E" }}>Perfil actualizado correctamente</span>
        </div>
      )}
      {saveError && (
        <div style={{ marginBottom: "16px", padding: "12px 16px", background: "rgba(229,57,53,0.08)", border: "1px solid rgba(229,57,53,0.3)", borderRadius: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle style={{ width: 14, height: 14, color: "#E53935", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "12px", color: "#E53935" }}>{saveError}</span>
        </div>
      )}

      {!hasSupabaseConfig && (
        <div style={{ marginBottom: "16px", padding: "12px 16px", background: "rgba(240,240,240,0.04)", border: "1px solid #2E2E2E", borderRadius: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle style={{ width: 14, height: 14, color: "#8A8A8A", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "12px", color: "#8A8A8A" }}>Modo demo — vista de solo lectura. Los cambios no se guardan.</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Identity card */}
        <div style={{ background: "#1A1A1A", border: "1px solid #2E2E2E", borderRadius: "8px", padding: "28px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#E53935", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", overflow: "hidden", flexShrink: 0 }}>
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.name} style={{ width: 80, height: 80, objectFit: "cover" }} />
            ) : (
              <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "32px", fontWeight: 300, color: "#F0F0F0" }}>
                {(profile.name || "?")[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "22px", fontWeight: 400, color: "#F0F0F0", marginBottom: "4px" }}>{profile.name || "Sin nombre"}</p>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#8A8A8A", marginBottom: "12px" }}>{profile.email}</p>
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A", border: "1px solid #2E2E2E", padding: "4px 10px", borderRadius: "2px" }}>{profile.role}</span>
        </div>

        {/* Edit form */}
        <div style={{ background: "#1A1A1A", border: "1px solid #2E2E2E", borderRadius: "8px", padding: "28px" }} className="lg:col-span-2">
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "20px", fontWeight: 300, color: "#F0F0F0", marginBottom: "4px" }}>Editar perfil</p>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#8A8A8A", marginBottom: "24px" }}>Los cambios se guardan en tu cuenta de empleado</p>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A" }}>Nombre</Label>
              <Input id="name" value={profile.name} onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))} placeholder="Tu nombre" className="orno-input" disabled={!hasSupabaseConfig} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A" }}>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4" style={{ color: "#555555" }} />
                <Input id="email" value={profile.email} className="pl-9 orno-input" disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A" }}>Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4" style={{ color: "#555555" }} />
                <Input id="phone" value={profile.phone} onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))} className="pl-9 orno-input" placeholder="+54..." disabled={!hasSupabaseConfig} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A" }}>URL de avatar</Label>
              <div className="relative">
                <Camera className="absolute left-3 top-3 h-4 w-4" style={{ color: "#555555" }} />
                <Input id="avatar" value={profile.avatar_url} onChange={(e) => setProfile((prev) => ({ ...prev, avatar_url: e.target.value }))} className="pl-9 orno-input" placeholder="https://..." disabled={!hasSupabaseConfig} />
              </div>
            </div>

            <button
              type="button"
              className="orno-btn"
              onClick={handleSave}
              disabled={saving || !hasSupabaseConfig}
              style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#F0F0F0", background: (saving || !hasSupabaseConfig) ? "#2E2E2E" : "#E53935", border: "none", padding: "12px 24px", cursor: (saving || !hasSupabaseConfig) ? "default" : "pointer", borderRadius: "4px" }}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
