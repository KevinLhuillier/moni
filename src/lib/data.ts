import "server-only"

import { cache } from "react"

import type { TransactionWithCategory } from "@/lib/supabase/database.types"
import { requireUser } from "@/lib/supabase/server"
import { monthRange, type Month } from "@/lib/month"

const TRANSACTION_SELECT = "*, category:categories(id, name, color, icon)"

export const getCategories = cache(async () => {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("type")
    .order("name")
  if (error) throw error
  return data
})

export const getBudgets = cache(async () => {
  const { supabase } = await requireUser()
  const { data, error } = await supabase.from("budgets").select("*")
  if (error) throw error
  return data
})

export const getMonthTransactions = cache(async (month: Month) => {
  const { supabase } = await requireUser()
  const { start, end } = monthRange(month)
  const { data, error } = await supabase
    .from("transactions")
    .select(TRANSACTION_SELECT)
    .gte("date", start)
    .lt("date", end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as TransactionWithCategory[]
})

/** Totaux de dépenses par catégorie pour un mois donné. */
export function sumByCategory(transactions: TransactionWithCategory[]) {
  const totals = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== "expense") continue
    const key = t.category_id ?? "none"
    totals.set(key, (totals.get(key) ?? 0) + Number(t.amount))
  }
  return totals
}

/**
 * Totaux par type. L'épargne n'est pas une dépense mais réduit le reste
 * disponible ; le taux d'épargne est rapporté aux revenus (null sans revenus).
 */
export function sumByType(transactions: TransactionWithCategory[]) {
  const totals = { income: 0, expense: 0, saving: 0 }
  for (const t of transactions) totals[t.type] += Number(t.amount)
  return {
    ...totals,
    balance: totals.income - totals.expense - totals.saving,
    savingRate: totals.income > 0 ? totals.saving / totals.income : null,
  }
}
