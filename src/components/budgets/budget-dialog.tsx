"use client"

import { useState, useTransition } from "react"
import { Loader2Icon, PencilIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { deleteBudget, saveBudget } from "@/app/(app)/actions"
import { CategoryIcon } from "@/components/category-badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Category } from "@/lib/supabase/database.types"

export function BudgetDialog({
  category,
  amount,
}: {
  category: Category
  amount?: number
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    setError(undefined)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success(success)
      setOpen(false)
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    run(() => saveBudget(formData), "Budget enregistré")
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        setError(undefined)
      }}
    >
      <DialogTrigger asChild>
        {amount ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Modifier le budget ${category.name}`}>
            <PencilIcon />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <PlusIcon />
            Définir
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <CategoryIcon category={category} />
            <div className="text-left">
              <DialogTitle>Budget « {category.name} »</DialogTitle>
              <DialogDescription>Plafond mensuel de dépenses.</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <input type="hidden" name="category_id" value={category.id} />
          <div className="grid gap-2">
            <Label htmlFor={`budget-${category.id}`}>Montant mensuel (€)</Label>
            <Input
              id={`budget-${category.id}`}
              name="amount"
              inputMode="decimal"
              placeholder="0,00"
              autoComplete="off"
              defaultValue={amount ? String(amount).replace(".", ",") : ""}
              autoFocus
              required
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter className="gap-2">
            {amount ? (
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={() => run(() => deleteBudget(category.id), "Budget supprimé")}
              >
                Supprimer
              </Button>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
