"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createBrowserClient } from "@supabase/ssr"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { LogOut, Save, User } from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createBrowserClient(supabaseUrl, supabaseAnonKey) : null

export default function ClientProfilePage() {
  const router = useRouter()
  const user = useRequireAuth(["client"])

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [saved, setSaved] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Inicializar valores desde user cuando esté disponible
  if (user && !initialized) {
    setName(user.profile?.name || "")
    setPhone(user.profile?.phone || "")
    setInitialized(true)
  }

  if (!user) return null

  const email = user.email || ""
  const displayName = name || email.split("@")[0] || "Cliente"
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (supabase) {
      await supabase
        .from("users")
        .update({ name, phone })
        .eq("id", user.id)
    } else {
      // Demo mode: persistir en localStorage
      const stored = localStorage.getItem("currentUser")
      if (stored) {
        const parsed = JSON.parse(stored)
        parsed.profile = { ...parsed.profile, name, phone }
        localStorage.setItem("currentUser", JSON.stringify(parsed))
      }
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleLogout = async () => {
    localStorage.removeItem("currentUser")
    if (supabase) await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div style={{ padding: "24px 32px 100px", maxWidth: "560px" }}>
      <style>{`
        @keyframes ornoFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .orno-profile-fade { animation: ornoFadeUp 0.35s ease both; }
      `}</style>

      {/* Header */}
      <div className="orno-profile-fade pt-8 pb-6">
        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(28px,4vw,40px)", fontWeight: 300, color: "#F0F0F0", letterSpacing: "-0.02em" }}>
          Mi perfil
        </p>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A", marginTop: "4px" }}>
          Datos de tu cuenta
        </p>
      </div>

      {/* Avatar */}
      <div className="orno-profile-fade" style={{ borderTop: "1px solid #252525", paddingTop: "28px", paddingBottom: "28px", display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "#E53935", color: "#FFF",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-cormorant)", fontSize: 24, fontWeight: 400, letterSpacing: "-0.01em",
          flexShrink: 0,
        }}>
          {initials || <User size={24} />}
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0F0F0" }}>
            {displayName}
          </p>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#555555", marginTop: 2 }}>
            {email}
          </p>
        </div>
      </div>

      {/* Demo notice */}
      {!supabase && (
        <div className="orno-profile-fade" style={{ background: "#1A1A1A", border: "1px solid #2E2E2E", borderRadius: 6, padding: "12px 16px", marginBottom: 24 }}>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#8A8A8A" }}>
            Modo demo — los cambios se guardan localmente en este dispositivo.
          </p>
        </div>
      )}

      {/* Success message */}
      {saved && (
        <div className="orno-profile-fade" style={{ background: "#0F2A1A", border: "1px solid #1A4A2A", borderRadius: 6, padding: "12px 16px", marginBottom: 24 }}>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#22C55E" }}>
            {supabase ? "Cambios guardados correctamente." : "Cambios guardados en modo demo."}
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="orno-profile-fade" style={{ borderTop: "1px solid #252525", paddingTop: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <Label htmlFor="profile-name" style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A" }}>
              Nombre
            </Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre completo"
              style={{ marginTop: 8, background: "#111", border: "1px solid #2E2E2E", color: "#F0F0F0" }}
            />
          </div>

          <div>
            <Label htmlFor="profile-email" style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A" }}>
              Email
            </Label>
            <Input
              id="profile-email"
              value={email}
              disabled
              style={{ marginTop: 8, background: "#0A0A0A", border: "1px solid #1A1A1A", color: "#555555", cursor: "not-allowed" }}
            />
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 10, color: "#3A3A3A", marginTop: 4 }}>
              El email no se puede cambiar desde aquí.
            </p>
          </div>

          <div>
            <Label htmlFor="profile-phone" style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A" }}>
              Teléfono
            </Label>
            <Input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234 567 890"
              style={{ marginTop: 8, background: "#111", border: "1px solid #2E2E2E", color: "#F0F0F0" }}
            />
          </div>
        </div>

        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
          <Button
            type="submit"
            style={{
              minHeight: 44,
              background: "#E53935", border: "none", color: "#FFF",
              fontFamily: "var(--font-dm-sans)", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <Save size={15} />
            Guardar cambios
          </Button>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            style={{
              minHeight: 44,
              background: "none", border: "1px solid #303030", color: "#8A8A8A",
              fontFamily: "var(--font-dm-sans)", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              borderRadius: 6, cursor: "pointer", width: "100%", transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#E53935"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(229,57,53,0.4)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#8A8A8A"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#303030" }}
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </form>
    </div>
  )
}
