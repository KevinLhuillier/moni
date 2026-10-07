"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { CATEGORY_ICONS } from "@/lib/category-icons"
import { requireUser } from "@/lib/supabase/server"

export type ActionResult = { ok: true } | { ok: false; error: string }

const amountSchema = z.coerce
  .string()
  .transform((v) => Number(v.replace(",", ".").replace(/\s/g, "")))
  .pipe(
    z
      .number({ error: "Montant invalide." })
      .positive("Le montant doit être positif.")
      .max(9_999_999_999, "Montant trop élevé.")
  )
  .transform((v) => Math.round(v * 100) / 100)

const typeSchema = z.enum(["expense", "income"])
const idSchema = z.uuid()

function fail(error: unknown): ActionResult {
  if (error instanceof z.ZodError) return { ok: false, error: error.issues[0].message }
  console.error(error)
  return { ok: false, error: "Une erreur est survenue. Réessayez." }
}

function done(): ActionResult {
  revalidatePath("/", "layout")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

const transactionSchema = z.object({
  id: idSchema.optional(),
  type: typeSchema,
  amount: amountSchema,
  date: z.iso.date("Date invalide."),
  category_id: z
    .string()
    .optional()
    .transform((v) => (v && v !== "none" ? v : null))
    .pipe(idSchema.nullable()),
  description: z
    .string()
    .trim()
    .max(200, "Description trop longue (200 caractères max).")
    .optional()
    .transform((v) => v || null),
})

export async function saveTransaction(formData: FormData): Promise<ActionResult> {
  try {
    const { id, ...values } = transactionSchema.parse({
      id: formData.get("id") || undefined,
      type: formData.get("type"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      category_id: formData.get("category_id") ?? undefined,
      description: formData.get("description") ?? undefined,
    })
    const { supabase } = await requireUser()
    const { error } = id
      ? await supabase.from("transactions").update(values).eq("id", id)
      : await supabase.from("transactions").insert(values)
    if (error) throw error
    return done()
  } catch (error) {
    return fail(error)
  }
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser()
    const { error } = await supabase.from("transactions").delete().eq("id", idSchema.parse(id))
    if (error) throw error
    return done()
  } catch (error) {
    return fail(error)
  }
}

// ---------------------------------------------------------------------------
// Catégories
// ---------------------------------------------------------------------------

const categorySchema = z.object({
  id: idSchema.optional(),
  name: z.string().trim().min(1, "Le nom est requis.").max(50, "Nom trop long."),
  type: typeSchema,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide."),
  icon: z.string().refine((v) => v in CATEGORY_ICONS, "Icône invalide."),
})

export async function saveCategory(formData: FormData): Promise<ActionResult> {
  try {
    const { id, ...values } = categorySchema.parse({
      id: formData.get("id") || undefined,
      name: formData.get("name"),
      type: formData.get("type"),
      color: formData.get("color"),
      icon: formData.get("icon"),
    })
    const { supabase } = await requireUser()
    const { error } = id
      ? await supabase.from("categories").update(values).eq("id", id)
      : await supabase.from("categories").insert(values)
    if (error?.code === "23505") {
      return { ok: false, error: "Une catégorie porte déjà ce nom." }
    }
    if (error) throw error
    return done()
  } catch (error) {
    return fail(error)
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser()
    const { error } = await supabase.from("categories").delete().eq("id", idSchema.parse(id))
    if (error) throw error
    return done()
  } catch (error) {
    return fail(error)
  }
}

// ---------------------------------------------------------------------------
// Budgets
// ---------------------------------------------------------------------------

const budgetSchema = z.object({
  category_id: idSchema,
  amount: amountSchema,
})

export async function saveBudget(formData: FormData): Promise<ActionResult> {
  try {
    const values = budgetSchema.parse({
      category_id: formData.get("category_id"),
      amount: formData.get("amount"),
    })
    const { supabase, user } = await requireUser()
    const { error } = await supabase
      .from("budgets")
      .upsert({ ...values, user_id: user.id }, { onConflict: "user_id,category_id" })
    if (error) throw error
    return done()
  } catch (error) {
    return fail(error)
  }
}

export async function deleteBudget(categoryId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser()
    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("category_id", idSchema.parse(categoryId))
    if (error) throw error
    return done()
  } catch (error) {
    return fail(error)
  }
}
