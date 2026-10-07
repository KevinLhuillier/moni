import { formatCurrency } from "@/lib/format"
import type { TransactionType } from "@/lib/supabase/database.types"
import { cn } from "@/lib/utils"

export function Amount({
  value,
  type,
  className,
}: {
  value: number
  type: TransactionType
  className?: string
}) {
  return (
    <span
      className={cn(
        "font-medium whitespace-nowrap tabular-nums",
        type === "income" ? "text-income" : "text-foreground",
        className
      )}
    >
      {type === "income" ? "+" : "−"}
      {formatCurrency(Number(value))}
    </span>
  )
}
