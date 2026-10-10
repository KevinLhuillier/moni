"use client"

import { useState, useTransition } from "react"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { saveTransaction } from "@/app/(app)/actions"
import { CategoryDot } from "@/components/category-badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { today } from "@/lib/month"
import type {
  Category,
  Transaction,
  TransactionType,
} from "@/lib/supabase/database.types"

type Props = {
  categories: Category[]
  transaction?: Transaction
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function TransactionDialog({ categories, transaction, open, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setOpen = isControlled ? onOpenChange! : setInternalOpen

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>
            <PlusIcon />
            <span className="sm:hidden">Ajouter</span>
            <span className="hidden sm:inline">Nouvelle transaction</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Modifier la transaction" : "Nouvelle transaction"}
          </DialogTitle>
          <DialogDescription>
            Enregistrez une dépense ou un revenu.
          </DialogDescription>
        </DialogHeader>
        {/* Remonté à chaque ouverture pour repartir de valeurs fraîches. */}
        {isOpen && (
          <TransactionForm
            categories={categories}
            transaction={transaction}
            onDone={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function TransactionForm({
  categories,
  transaction,
  onDone,
}: {
  categories: Category[]
  transaction?: Transaction
  onDone: () => void
}) {
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense")
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? "none")
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  const options = categories.filter((c) => c.type === type)

  function handleTypeChange(value: string) {
    setType(value as TransactionType)
    setCategoryId("none")
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await saveTransaction(formData)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success(transaction ? "Transaction modifiée" : "Transaction ajoutée")
      onDone()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {transaction && <input type="hidden" name="id" value={transaction.id} />}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="category_id" value={categoryId} />

      <Tabs value={type} onValueChange={handleTypeChange}>
        <TabsList className="w-full">
          <TabsTrigger value="expense">Dépense</TabsTrigger>
          <TabsTrigger value="income">Revenu</TabsTrigger>
          <TabsTrigger value="saving">Épargne</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="amount">Montant (€)</Label>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            placeholder="0,00"
            autoComplete="off"
            defaultValue={transaction ? String(transaction.amount).replace(".", ",") : ""}
            autoFocus
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={transaction?.date ?? today()}
            required
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="category">Catégorie</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger id="category" className="w-full">
            <SelectValue placeholder="Choisir une catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <CategoryDot color="#94a3b8" />
              Sans catégorie
            </SelectItem>
            {options.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <CategoryDot color={c.color} />
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Courses de la semaine…"
          maxLength={200}
          rows={2}
          defaultValue={transaction?.description ?? ""}
        />
      </div>

      {type === "expense" && (
        <div className="flex items-start gap-3">
          <Checkbox
            id="recurring"
            name="recurring"
            defaultChecked={transaction?.recurring ?? false}
            className="mt-0.5"
          />
          <div className="grid gap-1">
            <Label htmlFor="recurring">Dépense récurrente</Label>
            <p className="text-xs text-muted-foreground">
              Ajoutée automatiquement au mois suivant, le dernier jour du mois.
            </p>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending && <Loader2Icon className="animate-spin" />}
          {transaction ? "Enregistrer" : "Ajouter"}
        </Button>
      </DialogFooter>
    </form>
  )
}
