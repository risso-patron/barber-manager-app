"use client"

import { Badge } from "@/components/ui/badge"
import { Mail, Phone, Calendar, Gift, XCircle } from "lucide-react"

interface ClientAvatarProps {
  name: string
  size?: "sm" | "lg"
  className?: string
}

const AVATAR_DIMENSIONS: Record<NonNullable<ClientAvatarProps["size"]>, string> = {
  sm: "size-12 text-lg",
  lg: "size-20 text-3xl",
}

export function ClientAvatar({ name, size = "sm", className }: ClientAvatarProps) {
  return (
    <div
      className={`${AVATAR_DIMENSIONS[size]} shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold ${className ?? ""}`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

interface ClientIdentityProps {
  name: string
  email?: string | null
  phone?: string | null
  createdAt?: string | null
  isActive?: boolean
  loyaltyPoints?: number | null
  noShowCount?: number | null
  size?: "sm" | "lg"
  className?: string
}

export function ClientIdentity({
  name,
  email,
  phone,
  createdAt,
  isActive,
  loyaltyPoints,
  noShowCount,
  size = "sm",
  className,
}: ClientIdentityProps) {
  return (
    <div className={`flex items-center gap-4 ${className ?? ""}`}>
      <ClientAvatar name={name} size={size} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={size === "lg" ? "text-3xl font-bold text-foreground" : "font-semibold text-foreground"}>
            {name}
          </h3>
          {isActive !== undefined && (
            isActive ? (
              <Badge variant="success">Activo</Badge>
            ) : (
              <Badge variant="neutral">Inactivo</Badge>
            )
          )}
          {loyaltyPoints !== null && loyaltyPoints !== undefined && (
            <Badge variant="warning" className="gap-1">
              <Gift />
              {loyaltyPoints} pts
            </Badge>
          )}
          {!!noShowCount && noShowCount > 0 && (
            <Badge variant="danger" className="gap-1">
              <XCircle />
              {noShowCount} no-show{noShowCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-ink-600">
          {email && (
            <span className="flex items-center gap-1">
              <Mail className="size-3.5" />
              {email}
            </span>
          )}
          {phone && (
            <span className="flex items-center gap-1">
              <Phone className="size-3.5" />
              {phone}
            </span>
          )}
          {createdAt && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              Cliente desde{" "}
              {new Date(createdAt).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
