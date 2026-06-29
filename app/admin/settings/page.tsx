"use client"

import { useState, useEffect } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Settings, 
  Store, 
  Clock, 
  Bell, 
  Users, 
  DollarSign,
  Mail,
  Phone,
  MapPin,
  Save,
  CheckCircle,
  Globe,
  Calendar,
  Shield,
  Palette,
} from "lucide-react"

interface BusinessSettings {
  name: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  website: string
  description: string
}

interface ScheduleSettings {
  monday: { open: string; close: string; isOpen: boolean }
  tuesday: { open: string; close: string; isOpen: boolean }
  wednesday: { open: string; close: string; isOpen: boolean }
  thursday: { open: string; close: string; isOpen: boolean }
  friday: { open: string; close: string; isOpen: boolean }
  saturday: { open: string; close: string; isOpen: boolean }
  sunday: { open: string; close: string; isOpen: boolean }
}

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  appointmentReminders: boolean
  cancelationAlerts: boolean
  dailySummary: boolean
  weeklyReport: boolean
}

interface PaymentSettings {
  acceptCash: boolean
  acceptCard: boolean
  acceptTransfer: boolean
  currency: string
  taxRate: number
  cancellationFee: number
}

export default function SettingsPage() {
  useRequireAuth(["admin"])

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = supabaseUrl && supabaseAnonKey
    ? createBrowserClient(supabaseUrl, supabaseAnonKey)
    : null

  const [activeTab, setActiveTab] = useState<"business" | "schedule" | "notifications" | "payments">("business")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    name: "Mi Barbería Premium",
    email: "info@mibarberia.com",
    phone: "+1 (555) 123-4567",
    address: "Av. Principal 123",
    city: "Ciudad de México",
    country: "México",
    website: "www.mibarberia.com",
    description: "La mejor barbería de la ciudad con más de 10 años de experiencia"
  })

  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
    monday: { open: "09:00", close: "18:00", isOpen: true },
    tuesday: { open: "09:00", close: "18:00", isOpen: true },
    wednesday: { open: "09:00", close: "18:00", isOpen: true },
    thursday: { open: "09:00", close: "18:00", isOpen: true },
    friday: { open: "09:00", close: "18:00", isOpen: true },
    saturday: { open: "10:00", close: "16:00", isOpen: true },
    sunday: { open: "10:00", close: "14:00", isOpen: false }
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    appointmentReminders: true,
    cancelationAlerts: true,
    dailySummary: true,
    weeklyReport: false
  })

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    acceptCash: true,
    acceptCard: true,
    acceptTransfer: true,
    currency: "USD",
    taxRate: 16,
    cancellationFee: 0
  })

  // Cargar settings desde Supabase
  useEffect(() => {
    if (!supabase) return
    supabase
      .from("business_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["business", "schedule", "notifications", "payments"])
      .then(({ data }) => {
        if (!data) return
        data.forEach((row) => {
          try {
            const parsed = JSON.parse(row.setting_value)
            if (row.setting_key === "business")       setBusinessSettings(prev => ({ ...prev, ...parsed }))
            if (row.setting_key === "schedule")       setScheduleSettings(prev => ({ ...prev, ...parsed }))
            if (row.setting_key === "notifications")  setNotificationSettings(prev => ({ ...prev, ...parsed }))
            if (row.setting_key === "payments")       setPaymentSettings(prev => ({ ...prev, ...parsed }))
          } catch {
            // valor no es JSON válido — ignorar
          }
        })
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async () => {
    setSaveError(null)
    setIsSaving(true)

    if (!supabase) {
      // Sin conexión — sólo feedback visual (modo demo)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      setIsSaving(false)
      return
    }

    const rows = [
      { setting_key: "business",       setting_value: JSON.stringify(businessSettings),      description: "Datos generales del negocio" },
      { setting_key: "schedule",       setting_value: JSON.stringify(scheduleSettings),      description: "Horarios de atención por día" },
      { setting_key: "notifications",  setting_value: JSON.stringify(notificationSettings),  description: "Preferencias de notificaciones" },
      { setting_key: "payments",       setting_value: JSON.stringify(paymentSettings),       description: "Métodos y configuración de pagos" },
    ]

    const { error } = await supabase
      .from("business_settings")
      .upsert(rows, { onConflict: "setting_key" })

    setIsSaving(false)

    if (error) {
      setSaveError("No se pudieron guardar los cambios. Intenta de nuevo.")
      return
    }

    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const tabs = [
    { id: "business" as const, label: "Negocio", icon: Store },
    { id: "schedule" as const, label: "Horarios", icon: Clock },
    { id: "notifications" as const, label: "Notificaciones", icon: Bell },
    { id: "payments" as const, label: "Pagos", icon: DollarSign },
  ]

  const daysOfWeek = [
    { key: "monday" as const, label: "Lunes" },
    { key: "tuesday" as const, label: "Martes" },
    { key: "wednesday" as const, label: "Miércoles" },
    { key: "thursday" as const, label: "Jueves" },
    { key: "friday" as const, label: "Viernes" },
    { key: "saturday" as const, label: "Sábado" },
    { key: "sunday" as const, label: "Domingo" },
  ]

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">Administra los ajustes de tu barbería</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Configuración guardada exitosamente</span>
        </div>
      )}

      {saveError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
          <span className="font-medium">{saveError}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div
          role="tablist"
          aria-label="Secciones de configuración"
          className="flex gap-2 border-b"
          style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
        >
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                type="button"
                key={tab.id}
                role="tab"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? "border-blue-600 text-blue-600 font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Business Settings */}
      {activeTab === "business" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Información del Negocio
              </CardTitle>
              <CardDescription>
                Información general de tu barbería
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="businessName">Nombre del Negocio</Label>
                  <Input
                    id="businessName"
                    value={businessSettings.name}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="businessEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="businessEmail"
                      type="email"
                      className="pl-9"
                      value={businessSettings.email}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="businessPhone">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="businessPhone"
                      type="tel"
                      className="pl-9"
                      value={businessSettings.phone}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="businessWebsite">Sitio Web</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="businessWebsite"
                      type="url"
                      className="pl-9"
                      value={businessSettings.website}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, website: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="businessAddress">Dirección</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="businessAddress"
                    className="pl-9"
                    value={businessSettings.address}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="businessCity">Ciudad</Label>
                  <Input
                    id="businessCity"
                    value={businessSettings.city}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="businessCountry">País</Label>
                  <Input
                    id="businessCountry"
                    value={businessSettings.country}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, country: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="businessDescription">Descripción</Label>
                <textarea
                  id="businessDescription"
                  className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                  placeholder="Describe tu barbería..."
                  value={businessSettings.description}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, description: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schedule Settings */}
      {activeTab === "schedule" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horario de Atención
              </CardTitle>
              <CardDescription>
                Configura los horarios de apertura y cierre
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {daysOfWeek.map(day => (
                  <div key={day.key} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-32">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={scheduleSettings[day.key].isOpen}
                          onChange={(e) => setScheduleSettings({
                            ...scheduleSettings,
                            [day.key]: { ...scheduleSettings[day.key], isOpen: e.target.checked }
                          })}
                          className="rounded"
                        />
                        <span className="font-medium">{day.label}</span>
                      </label>
                    </div>
                    
                    {scheduleSettings[day.key].isOpen ? (
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-muted-foreground">Apertura:</Label>
                          <Input
                            type="time"
                            value={scheduleSettings[day.key].open}
                            onChange={(e) => setScheduleSettings({
                              ...scheduleSettings,
                              [day.key]: { ...scheduleSettings[day.key], open: e.target.value }
                            })}
                            className="w-32"
                          />
                        </div>
                        <span className="text-muted-foreground">-</span>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-muted-foreground">Cierre:</Label>
                          <Input
                            type="time"
                            value={scheduleSettings[day.key].close}
                            onChange={(e) => setScheduleSettings({
                              ...scheduleSettings,
                              [day.key]: { ...scheduleSettings[day.key], close: e.target.value }
                            })}
                            className="w-32"
                          />
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100">Cerrado</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notification Settings */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Preferencias de Notificaciones
              </CardTitle>
              <CardDescription>
                Configura cómo y cuándo recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Canales de Comunicación</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Notificaciones por Email</p>
                        <p className="text-sm text-muted-foreground">Recibir actualizaciones por correo</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        emailNotifications: e.target.checked
                      })}
                      className="h-5 w-5 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Notificaciones por SMS</p>
                        <p className="text-sm text-muted-foreground">Recibir mensajes de texto</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.smsNotifications}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        smsNotifications: e.target.checked
                      })}
                      className="h-5 w-5 rounded"
                    />
                  </label>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Tipos de Notificaciones</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">Recordatorios de Citas</p>
                        <p className="text-sm text-muted-foreground">24 horas antes de la cita</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.appointmentReminders}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        appointmentReminders: e.target.checked
                      })}
                      className="h-5 w-5 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium">Alertas de Cancelación</p>
                        <p className="text-sm text-muted-foreground">Cuando una cita es cancelada</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.cancelationAlerts}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        cancelationAlerts: e.target.checked
                      })}
                      className="h-5 w-5 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Resumen Diario</p>
                        <p className="text-sm text-muted-foreground">Reporte al final del día</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.dailySummary}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        dailySummary: e.target.checked
                      })}
                      className="h-5 w-5 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium">Reporte Semanal</p>
                        <p className="text-sm text-muted-foreground">Estadísticas cada lunes</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.weeklyReport}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        weeklyReport: e.target.checked
                      })}
                      className="h-5 w-5 rounded"
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Settings */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Configuración de Pagos
              </CardTitle>
              <CardDescription>
                Métodos de pago e información fiscal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Métodos de Pago Aceptados</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Efectivo</p>
                        <p className="text-sm text-muted-foreground">Pago en efectivo</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={paymentSettings.acceptCash}
                      onChange={(e) => setPaymentSettings({
                        ...paymentSettings,
                        acceptCash: e.target.checked
                      })}
                      className="h-5 w-5 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Tarjeta de Crédito/Débito</p>
                        <p className="text-sm text-muted-foreground">Pagos con tarjeta</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={paymentSettings.acceptCard}
                      onChange={(e) => setPaymentSettings({
                        ...paymentSettings,
                        acceptCard: e.target.checked
                      })}
                      className="h-5 w-5 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">Transferencia Bancaria</p>
                        <p className="text-sm text-muted-foreground">Transferencias electrónicas</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={paymentSettings.acceptTransfer}
                      onChange={(e) => setPaymentSettings({
                        ...paymentSettings,
                        acceptTransfer: e.target.checked
                      })}
                      className="h-5 w-5 rounded"
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="currency">Moneda</Label>
                  <select
                    id="currency"
                    aria-label="Moneda"
                    value={paymentSettings.currency}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, currency: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="USD">USD - Dólar Americano</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="MXN">MXN - Peso Mexicano</option>
                    <option value="COP">COP - Peso Colombiano</option>
                    <option value="ARS">ARS - Peso Argentino</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="taxRate">Tasa de Impuesto (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={paymentSettings.taxRate}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      taxRate: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cancellationFee">Cargo por Cancelación ($)</Label>
                <Input
                  id="cancellationFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentSettings.cancellationFee}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    cancellationFee: parseFloat(e.target.value) || 0
                  })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Cargo aplicado por cancelaciones tardías (0 para sin cargo)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
