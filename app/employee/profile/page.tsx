"use client"

import { useEffect, useState } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Camera, Save } from "lucide-react"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

  useEffect(() => {
    if (!user?.id) return

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
          role: (user as any).role || "employee",
        }))
      }
      setLoading(false)
    }

    void loadProfile()
  }, [user])

  const handleSave = async () => {
    if (!user?.id) return
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
      alert("No se pudo guardar el perfil. Intenta nuevamente.")
      return
    }

    alert("Perfil actualizado correctamente")
  }

  if (!user || loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Cargando perfil...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mi Perfil</h1>
        <p className="text-muted-foreground">Gestiona tus datos personales y de contacto</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Identidad
            </CardTitle>
            <CardDescription>Información principal de tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full bg-slate-100 border flex items-center justify-center mb-4">
                <User className="h-10 w-10 text-slate-500" />
              </div>
              <p className="font-semibold text-lg">{profile.name || "Sin nombre"}</p>
              <p className="text-sm text-muted-foreground mb-3">{profile.email}</p>
              <Badge>{profile.role}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Editar perfil</CardTitle>
            <CardDescription>Los cambios se guardan en tu cuenta de empleado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Tu nombre"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="email" value={profile.email} className="pl-9" disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                  className="pl-9"
                  placeholder="+54..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">URL de avatar</Label>
              <div className="relative">
                <Camera className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="avatar"
                  value={profile.avatar_url}
                  onChange={(e) => setProfile((prev) => ({ ...prev, avatar_url: e.target.value }))}
                  className="pl-9"
                  placeholder="https://..."
                />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
