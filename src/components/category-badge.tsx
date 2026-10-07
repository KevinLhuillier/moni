import { createElement } from "react"

import { getCategoryIcon } from "@/lib/category-icons"
import type { Category } from "@/lib/supabase/database.types"
import { cn } from "@/lib/utils"

type CategoryLike = Pick<Category, "color" | "icon"> | null | undefined

export function CategoryIcon({
  category,
  className,
}: {
  category: CategoryLike
  className?: string
}) {
  const color = category?.color ?? "#64748b"
  return (
    <span
      className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", className)}
      style={{ backgroundColor: `${color}1f`, color }}
    >
      {createElement(getCategoryIcon(category?.icon), { className: "size-4" })}
    </span>
  )
}

export function CategoryDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: color }}
    />
  )
}
