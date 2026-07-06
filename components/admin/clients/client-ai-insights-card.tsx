"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

/**
 * Deliberate placeholder — AI Architecture is "Planned (Future)" with no
 * scope defined (project-brain/02_TARGET_ARCHITECTURE.md §14). This card
 * must never fabricate insights; it exists only to reserve the CRM layout
 * slot until that architecture is actually scoped and built.
 */
export function ClientAIInsightsCard() {
  return (
    <Card className="opacity-70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4" />
          AI Insights
        </CardTitle>
        <CardDescription className="text-xs">
          Próximamente. La arquitectura de IA todavía no está definida — ver
          project-brain/02_TARGET_ARCHITECTURE.md §14.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center py-6">
          Esta función no está implementada todavía.
        </p>
      </CardContent>
    </Card>
  )
}
