"use client"

import { useState, useTransition } from "react"
import { MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { deleteCategory } from "@/app/(app)/actions"
import { CategoryIcon } from "@/components/category-badge"
import { CategoryDialog } from "@/components/categories/category-dialog"
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
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Category, TransactionType } from "@/lib/supabase/database.types"

const SECTIONS: { type: TransactionType; title: string }[] = [
  { type: "expense", title: "Dépenses" },
  { type: "income", title: "Revenus" },
]

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [dialog, setDialog] = useState<{ category?: Category; type: TransactionType }>()
  const [deleting, setDeleting] = useState<Category>()
  const [pending, startTransition] = useTransition()

  function confirmDelete() {
    if (!deleting) return
    startTransition(async () => {
      const result = await deleteCategory(deleting.id)
      if (result.ok) toast.success("Catégorie supprimée")
      else toast.error(result.error)
      setDeleting(undefined)
    })
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        {SECTIONS.map((section) => {
          const items = categories.filter((c) => c.type === section.type)
          return (
            <Card key={section.type} className="pb-0">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardAction>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialog({ type: section.type })}
                  >
                    <PlusIcon />
                    Ajouter
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="px-0">
                {items.length === 0 ? (
                  <p className="px-4 pb-6 text-sm text-muted-foreground">Aucune catégorie.</p>
                ) : (
                  <ul className="divide-y border-t">
                    {items.map((category) => (
                      <li key={category.id} className="flex items-center gap-3 px-4 py-3">
                        <CategoryIcon category={category} />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {category.name}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label="Actions">
                              <MoreHorizontalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => setDialog({ category, type: category.type })}
                            >
                              <PencilIcon />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => setDeleting(category)}
                            >
                              <Trash2Icon />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <CategoryDialog
        open={Boolean(dialog)}
        onOpenChange={(open) => !open && setDialog(undefined)}
        category={dialog?.category}
        defaultType={dialog?.type}
      />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deleting?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les transactions associées seront conservées sans catégorie, et le budget lié
              sera supprimé.
            </AlertDialogDescription>
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
