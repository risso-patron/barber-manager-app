"use client"

// ORNO UI Framework · M3 · Data
// AsyncPane — the ONE state machine every data surface uses.
// Composition over specialization: wrap any content, feed it a state,
// it renders loading/empty/error/permission-denied/success consistently.
// This is what guarantees "no duplicated feedback patterns".

import * as React from "react"

import { Delayed } from "@/components/ui/skeleton"
import { ErrorPane, PermissionDenied, type ErrorPaneProps } from "@/components/ui/error-pane"

export type PaneState = "loading" | "empty" | "error" | "denied" | "success"

export interface AsyncPaneProps {
  state: PaneState
  /** Shaped skeleton matching the content (SkeletonList/Table/Stat…). */
  skeleton: React.ReactNode
  /** EmptyState element with ORNO-voice copy + one action. */
  empty: React.ReactNode
  /** Error overrides (title/description/onRetry). */
  error?: Omit<ErrorPaneProps, "size" | "className">
  /** Subject for permission copy: "el inventario". */
  deniedSubject?: string
  size?: "compact" | "page"
  children: React.ReactNode
}

export function AsyncPane({ state, skeleton, empty, error, deniedSubject, size = "compact", children }: AsyncPaneProps) {
  switch (state) {
    case "loading":
      return <Delayed>{skeleton}</Delayed>
    case "empty":
      return <>{empty}</>
    case "error":
      return <ErrorPane size={size} {...error} />
    case "denied":
      return <PermissionDenied size={size} subject={deniedSubject} />
    default:
      return <>{children}</>
  }
}

/** Derive PaneState from common query flags. */
export function paneState(opts: {
  loading?: boolean
  error?: unknown
  denied?: boolean
  count?: number
}): PaneState {
  if (opts.denied) return "denied"
  if (opts.loading) return "loading"
  if (opts.error) return "error"
  if (opts.count === 0) return "empty"
  return "success"
}
