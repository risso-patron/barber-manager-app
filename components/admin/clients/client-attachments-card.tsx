"use client"

import { useEffect, useRef, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Image as ImageIcon, FileText, Upload, Loader2 } from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

const BUCKET = "client-attachments"

interface Attachment {
  id: string
  kind: "photo" | "document"
  file_name: string
  storage_path: string
  created_at: string
  url?: string
}

interface Props {
  clientId: string
  uploadedBy?: string
}

export function ClientAttachmentsCard({ clientId, uploadedBy }: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }
    void loadAttachments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  const loadAttachments = async () => {
    if (!supabase) return
    const { data } = await supabase
      .from("client_attachments")
      .select("id, kind, file_name, storage_path, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })

    if (data) {
      const withUrls = await Promise.all(
        (data as Attachment[]).map(async (a) => {
          const { data: signed } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(a.storage_path, 60 * 60)
          return { ...a, url: signed?.signedUrl }
        })
      )
      setAttachments(withUrls)
    }
    setIsLoading(false)
  }

  const handleUpload = async (file: File) => {
    if (!supabase) return
    setError(null)
    setIsUploading(true)

    const kind: Attachment["kind"] = file.type.startsWith("image/") ? "photo" : "document"
    const path = `${clientId}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file)
    if (uploadError) {
      setError("No se pudo subir el archivo. Verificá que el bucket 'client-attachments' exista (script 34).")
      setIsUploading(false)
      return
    }

    const { data } = await supabase
      .from("client_attachments")
      .insert({
        client_id: clientId,
        uploaded_by: uploadedBy,
        kind,
        file_name: file.name,
        storage_path: path,
        mime_type: file.type,
        size_bytes: file.size,
      })
      .select("id, kind, file_name, storage_path, created_at")
      .single()

    if (data) {
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60)
      setAttachments((prev) => [{ ...(data as Attachment), url: signed?.signedUrl }, ...prev])
    }
    setIsUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4" />
            Fotos y documentos
          </CardTitle>
          <CardDescription className="text-xs">Privado — solo visible para admin/manager.</CardDescription>
        </div>
        {supabase && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleUpload(f) }}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Subir
            </Button>
          </>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {!supabase ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Requiere Supabase configurado (no disponible en modo demo).
          </p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Cargando…</p>
        ) : attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin archivos todavía</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {attachments.map((a) => (
              <a
                key={a.id}
                href={a.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 border border-border rounded-lg text-xs hover:bg-muted transition-colors"
              >
                {a.kind === "photo" ? (
                  <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{a.file_name}</span>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
