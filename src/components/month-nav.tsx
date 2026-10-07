import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  currentMonth,
  formatMonth,
  isSameMonth,
  monthKey,
  shiftMonth,
  type Month,
} from "@/lib/month"

export function MonthNav({
  month,
  basePath,
  params,
}: {
  month: Month
  basePath: string
  params?: Record<string, string | undefined>
}) {
  const href = (m: Month) => {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value) search.set(key, value)
    }
    if (!isSameMonth(m, currentMonth())) search.set("month", monthKey(m))
    const qs = search.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }
  const isCurrent = isSameMonth(month, currentMonth())

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="icon" asChild>
        <Link href={href(shiftMonth(month, -1))} aria-label="Mois précédent" scroll={false}>
          <ChevronLeftIcon />
        </Link>
      </Button>
      <span className="min-w-36 text-center text-sm font-medium tabular-nums">
        {formatMonth(month)}
      </span>
      <Button variant="outline" size="icon" asChild>
        <Link href={href(shiftMonth(month, 1))} aria-label="Mois suivant" scroll={false}>
          <ChevronRightIcon />
        </Link>
      </Button>
      {!isCurrent && (
        <Button variant="ghost" size="sm" asChild>
          <Link href={href(currentMonth())} scroll={false}>
            Aujourd&apos;hui
          </Link>
        </Button>
      )}
    </div>
  )
}
