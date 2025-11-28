"use client"

import { useState } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  QrCode, 
  Copy, 
  CheckCircle, 
  Share2, 
  Download,
  ExternalLink,
  Smartphone
} from "lucide-react"

export default function ShareBookingPage() {
  useRequireAuth(["admin"])
  
  const [barbershopSlug, setBarbershopSlug] = useState("mi-barberia-premium")
  const [copied, setCopied] = useState(false)
  
  const bookingUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${barbershopSlug}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(bookingUrl)}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadQR = () => {
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `qr-${barbershopSlug}.png`
    link.click()
  }

  const handleShareWhatsApp = () => {
    const message = `¡Reserva tu cita en línea! 💈\n\n🔗 ${bookingUrl}\n\nRápido, fácil y sin llamadas. ¡Te esperamos!`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(bookingUrl)}`, '_blank')
  }

  const handleShareTwitter = () => {
    const text = "¡Reserva tu cita en línea! 💈"
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(bookingUrl)}`, '_blank')
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Comparte tu Enlace de Reservas</h1>
        <p className="text-muted-foreground">
          Genera y comparte tu enlace público para que los clientes reserven sin necesidad de crear cuenta
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-6xl">
        {/* Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Enlace</CardTitle>
              <CardDescription>Personaliza el nombre de tu enlace público</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="slug">Nombre del Enlace (Slug)</Label>
                <Input
                  id="slug"
                  value={barbershopSlug}
                  onChange={(e) => setBarbershopSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="mi-barberia"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Solo letras, números y guiones
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-muted-foreground mb-2">Tu enlace público:</p>
                <div className="flex gap-2">
                  <Input
                    value={bookingUrl}
                    readOnly
                    className="bg-white font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    className={copied ? "bg-green-50" : ""}
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(bookingUrl, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver Página de Reservas
              </Button>
            </CardContent>
          </Card>

          {/* Share Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Compartir Enlace
              </CardTitle>
              <CardDescription>Comparte tu enlace en redes sociales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                onClick={handleShareWhatsApp}
              >
                <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Compartir por WhatsApp
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                onClick={handleShareFacebook}
              >
                <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Compartir en Facebook
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200"
                onClick={handleShareTwitter}
              >
                <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Compartir en Twitter
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* QR Code */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Código QR
              </CardTitle>
              <CardDescription>
                Descarga e imprime tu código QR para colocar en tu local
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white border rounded-lg p-8 text-center">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="mx-auto mb-4"
                />
                <p className="text-sm text-muted-foreground mb-4">
                  Escanea para reservar
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDownloadQR}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar QR Code
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Smartphone className="h-5 w-5" />
                Consejos de Uso
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800 space-y-2">
              <p>✅ Imprime el QR y colócalo en tu recepción</p>
              <p>✅ Compártelo en tus redes sociales</p>
              <p>✅ Agrégalo a tus tarjetas de presentación</p>
              <p>✅ Envíalo por WhatsApp a tus clientes</p>
              <p>✅ Publícalo en tu biografía de Instagram</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-900">Ventajas del Enlace Público</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-green-800 space-y-2">
              <p>🚀 Clientes reservan sin crear cuenta</p>
              <p>⏰ Reservas 24/7 sin intervención</p>
              <p>📱 Notificaciones automáticas por WhatsApp/Email</p>
              <p>📊 Todas las reservas en tu panel admin</p>
              <p>💼 Imagen profesional y moderna</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
