import type { Metadata } from "next"
import { Suspense } from "react"

import { AuthForm } from "../auth-form"

export const metadata: Metadata = { title: "Connexion" }

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="grid gap-4">
      <Suspense>
        <ConfirmationError searchParams={searchParams} />
      </Suspense>
      <AuthForm mode="login" />
    </div>
  )
}

async function ConfirmationError({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { error } = await searchParams
  if (error !== "confirmation") return null

  return (
    <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
      Le lien de confirmation est invalide ou a expiré.
    </p>
  )
}
