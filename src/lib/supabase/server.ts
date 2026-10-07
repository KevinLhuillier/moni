import { createServerClient } from "@supabase/ssr"
import { io } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"

import type { Database } from "./database.types"

export async function createClient() {
  const cookieStore = await cookies()
  // Supabase compare l'expiration du jeton à Date.now() : hors du shell prérendu.
  await io()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Appelé depuis un Server Component : le proxy rafraîchit déjà la session.
          }
        },
      },
    }
  )
}

/** Utilisateur authentifié (JWT vérifié) ou redirection vers /login. */
export const requireUser = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect("/login")
  return {
    supabase,
    user: { id: data.claims.sub, email: data.claims.email as string | undefined },
  }
})
