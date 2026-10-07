import { cn } from "@/lib/utils"

/** Barre de progression : vert sous 80 %, orange jusqu'à 100 %, rouge au-delà. */
export function BudgetBar({
  spent,
  budget,
  className,
}: {
  spent: number
  budget: number
  className?: string
}) {
  const ratio = budget > 0 ? spent / budget : 0
  const tone = ratio > 1 ? "bg-expense" : ratio >= 0.8 ? "bg-amber-500" : "bg-primary"

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(Math.min(ratio, 1) * 100)}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full rounded-full transition-all", tone)}
        style={{ width: `${Math.min(ratio, 1) * 100}%` }}
      />
    </div>
  )
}
