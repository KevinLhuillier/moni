"use client"

import { TriangleAlertIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <Empty className="py-24">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TriangleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>Impossible de charger les données</EmptyTitle>
        <EmptyDescription>Vérifiez votre connexion puis réessayez.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={reset}>Réessayer</Button>
      </EmptyContent>
    </Empty>
  )
}
