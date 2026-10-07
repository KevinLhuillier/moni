"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login, signup, type AuthState } from "./actions"

const COPY = {
  login: {
    title: "Bon retour !",
    description: "Connectez-vous pour suivre vos dépenses.",
    submit: "Se connecter",
    switchText: "Pas encore de compte ?",
    switchLabel: "Créer un compte",
    switchHref: "/signup",
  },
  signup: {
    title: "Créer un compte",
    description: "Commencez à suivre vos dépenses et budgets.",
    submit: "Créer mon compte",
    switchText: "Déjà inscrit ?",
    switchLabel: "Se connecter",
    switchHref: "/login",
  },
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    mode === "login" ? login : signup,
    {}
  )
  const copy = COPY[mode]

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {state.message ? (
          <p className="rounded-lg bg-primary/10 p-4 text-center text-sm text-primary">
            {state.message}
          </p>
        ) : (
          <form action={formAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.fr"
                defaultValue={state.email}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={8}
                required
              />
            </div>
            {state.error && (
              <p role="alert" className="text-sm text-destructive">
                {state.error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending && <Loader2Icon className="animate-spin" />}
              {copy.submit}
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {copy.switchText}{" "}
          <Link href={copy.switchHref} className="font-medium text-foreground underline-offset-4 hover:underline">
            {copy.switchLabel}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
