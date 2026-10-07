"use client"

import { useState, useTransition } from "react"
import { CheckIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { saveCategory } from "@/app/(app)/actions"
import { CategoryIcon } from "@/components/category-badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/category-icons"
import type { Category, TransactionType } from "@/lib/supabase/database.types"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category
  defaultType?: TransactionType
}

export function CategoryDialog({ open, onOpenChange, category, defaultType = "expense" }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle>
          <DialogDescription>Nom, type, couleur et icône.</DialogDescription>
        </DialogHeader>
        {open && (
          <CategoryForm
            category={category}
            defaultType={defaultType}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CategoryForm({
  category,
  defaultType,
  onDone,
}: {
  category?: Category
  defaultType: TransactionType
  onDone: () => void
}) {
  const [type, setType] = useState<TransactionType>(category?.type ?? defaultType)
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0])
  const [icon, setIcon] = useState(category?.icon ?? "tag")
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await saveCategory(formData)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success(category ? "Catégorie modifiée" : "Catégorie créée")
      onDone()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {category && <input type="hidden" name="id" value={category.id} />}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="color" value={color} />
      <input type="hidden" name="icon" value={icon} />

      <Tabs value={type} onValueChange={(v) => setType(v as TransactionType)}>
        <TabsList className="w-full">
          <TabsTrigger value="expense">Dépense</TabsTrigger>
          <TabsTrigger value="income">Revenu</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-2">
        <Label htmlFor="category-name">Nom</Label>
        <div className="flex items-center gap-3">
          <CategoryIcon category={{ color, icon }} />
          <Input
            id="category-name"
            name="name"
            placeholder="Courses"
            maxLength={50}
            defaultValue={category?.name}
            autoFocus
            required
          />
        </div>
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Couleur</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              className="flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:ring-2 aria-pressed:ring-foreground"
              style={{ backgroundColor: c }}
            >
              {color === c && <CheckIcon className="size-4 text-white" />}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Icône</legend>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {Object.entries(CATEGORY_ICONS).map(([name, Icon]) => (
            <button
              key={name}
              type="button"
              aria-label={name}
              aria-pressed={icon === name}
              onClick={() => setIcon(name)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg border text-muted-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                icon === name && "border-transparent text-white"
              )}
              style={icon === name ? { backgroundColor: color } : undefined}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending && <Loader2Icon className="animate-spin" />}
          {category ? "Enregistrer" : "Créer"}
        </Button>
      </DialogFooter>
    </form>
  )
}
