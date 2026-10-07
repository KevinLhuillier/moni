"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export type AuthState = { error?: string; message?: string; email?: string }

const credentialsSchema = z.object({
  email: z.email("Adresse email invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
})

function parseCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = parseCredentials(formData)
  const email = String(formData.get("email") ?? "")
  if (!parsed.success) return { error: parsed.error.issues[0].message, email }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    return {
      error:
        error.code === "email_not_confirmed"
          ? "Confirmez votre adresse email avant de vous connecter."
          : "Email ou mot de passe incorrect.",
      email,
    }
  }

  redirect("/dashboard")
}

export async function signup(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = parseCredentials(formData)
  const email = String(formData.get("email") ?? "")
  if (!parsed.success) return { error: parsed.error.issues[0].message, email }

  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  })
  if (error) {
    return {
      error:
        error.code === "user_already_exists"
          ? "Un compte existe déjà avec cet email."
          : "Inscription impossible pour le moment. Réessayez plus tard.",
      email,
    }
  }

  // Confirmation d'email désactivée : la session est déjà ouverte.
  if (data.session) redirect("/dashboard")

  return {
    message: "Compte créé ! Consultez votre boîte mail pour confirmer votre adresse.",
    email,
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
