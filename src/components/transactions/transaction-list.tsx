"use client"

import { useState, useTransition } from "react"
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { deleteTransaction } from "@/app/(app)/actions"
import { Amount } from "@/components/amount"
import { CategoryIcon } from "@/components/category-badge"
import { TransactionDialog } from "@/components/transactions/transaction-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatLongDate, formatShortDate } from "@/lib/format"
import type { Category, TransactionWithCategory } from "@/lib/supabase/database.types"

type Props = {
  transactions: TransactionWithCategory[]
  categories: Category[]
  /** Regroupe les lignes par jour avec un intitulé de date. */
  groupByDate?: boolean
}

export function TransactionList({ transactions, categories, groupByDate = false }: Props) {
  const [editing, setEditing] = useState<TransactionWithCategory>()
  const [deleting, setDeleting] = useState<TransactionWithCategory>()
  const [pending, startTransition] = useTransition()

  function confirmDelete() {
    if (!deleting) return
    startTransition(async () => {
      const result = await deleteTransaction(deleting.id)
      if (result.ok) toast.success("Transaction supprimée")
      else toast.error(result.error)
      setDeleting(undefined)
    })
  }

  const groups = groupByDate
    ? Object.entries(Object.groupBy(transactions, (t) => t.date))
    : [["", transactions] as const]

  return (
    <>
      <div className="divide-y">
        {groups.map(([date, items]) => (
          <section key={date}>
            {date && (
              <h3 className="bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground first-letter:uppercase">
                {formatLongDate(date)}
              </h3>
            )}
            <ul className="divide-y">
              {items?.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <CategoryIcon category={t.category} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {t.description || t.category?.name || "Sans catégorie"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.description ? (t.category?.name ?? "Sans catégorie") : null}
                      {!groupByDate && (
                        <>
                          {t.description ? " · " : null}
                          {formatShortDate(t.date)}
                        </>
                      )}
                    </p>
                  </div>
                  <Amount value={t.amount} type={t.type} className="text-sm" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="Actions">
                        <MoreHorizontalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditing(t)}>
                        <PencilIcon />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(t)}>
                        <Trash2Icon />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <TransactionDialog
        categories={categories}
        transaction={editing}
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(undefined)}
      />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette transaction ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
