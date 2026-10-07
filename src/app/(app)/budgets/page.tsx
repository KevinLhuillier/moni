import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { TagsIcon } from "lucide-react"

import { BudgetBar } from "@/components/budgets/budget-bar"
import { BudgetDialog } from "@/components/budgets/budget-dialog"
import { CategoryIcon } from "@/components/category-badge"
import { MonthNav } from "@/components/month-nav"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { getBudgets, getCategories, getMonthTransactions, sumByCategory } from "@/lib/data"
import { formatCurrency } from "@/lib/format"
import { getMonth } from "@/lib/month-param"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Budgets" }

type SearchParams = PageProps<"/budgets">["searchParams"]

// Le titre fait partie du shell statique ; ce qui dépend du mois (searchParams et
// date du jour) est rendu à la requête derrière un <Suspense>, pour que la
// navigation, y compris d'un mois à l'autre, reste instantanée.
export default function BudgetsPage({ searchParams }: PageProps<"/budgets">) {
  return (
    <>
      <PageHeader title="Budgets" description="Vos plafonds de dépenses mensuels par catégorie.">
        <Suspense fallback={<Skeleton className="h-8 w-56" />}>
          <BudgetsMonthNav searchParams={searchParams} />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<BudgetsSkeleton />}>
        <BudgetsContent searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function BudgetsMonthNav({ searchParams }: { searchParams: SearchParams }) {
  return <MonthNav month={await getMonth(searchParams)} basePath="/budgets" />
}

async function BudgetsContent({ searchParams }: { searchParams: SearchParams }) {
  const month = await getMonth(searchParams)
  const [categories, budgets, transactions] = await Promise.all([
    getCategories(),
    getBudgets(),
    getMonthTransactions(month),
  ])

  const spentByCategory = sumByCategory(transactions)
  const budgetByCategory = new Map(budgets.map((b) => [b.category_id, Number(b.amount)]))
  const expenseCategories = categories.filter((c) => c.type === "expense")

  const rows = expenseCategories.map((category) => ({
    category,
    budget: budgetByCategory.get(category.id),
    spent: spentByCategory.get(category.id) ?? 0,
  }))
  const withBudget = rows
    .filter((r) => r.budget !== undefined)
    .sort((a, b) => b.spent / b.budget! - a.spent / a.budget!)
  const withoutBudget = rows.filter((r) => r.budget === undefined)

  const totalBudget = withBudget.reduce((sum, r) => sum + r.budget!, 0)
  const totalSpent = withBudget.reduce((sum, r) => sum + r.spent, 0)
  const remaining = totalBudget - totalSpent

  return (
    <>
      {expenseCategories.length === 0 ? (
        <Card>
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TagsIcon />
              </EmptyMedia>
              <EmptyTitle>Aucune catégorie de dépense</EmptyTitle>
              <EmptyDescription>
                Créez d&apos;abord des catégories pour leur associer un budget.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/categories">Gérer les catégories</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </Card>
      ) : (
        <div className="grid gap-6">
          {withBudget.length > 0 && (
            <Card>
              <CardHeader>
                <CardDescription>Total budgété ce mois</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {formatCurrency(totalSpent)}{" "}
                  <span className="text-base font-normal text-muted-foreground">
                    / {formatCurrency(totalBudget)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <BudgetBar spent={totalSpent} budget={totalBudget} className="h-3" />
                <p
                  className={cn(
                    "text-sm",
                    remaining < 0 ? "text-expense" : "text-muted-foreground"
                  )}
                >
                  {remaining >= 0
                    ? `${formatCurrency(remaining)} restants`
                    : `Dépassement de ${formatCurrency(-remaining)}`}
                </p>
              </CardContent>
            </Card>
          )}

          {withBudget.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {withBudget.map(({ category, budget, spent }) => {
                const left = budget! - spent
                return (
                  <Card key={category.id} size="sm">
                    <CardContent className="grid gap-3">
                      <div className="flex items-center gap-3">
                        <CategoryIcon category={category} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{category.name}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {formatCurrency(spent)} / {formatCurrency(budget!)}
                          </p>
                        </div>
                        <BudgetDialog category={category} amount={budget} />
                      </div>
                      <BudgetBar spent={spent} budget={budget!} />
                      <p
                        className={cn(
                          "text-xs tabular-nums",
                          left < 0 ? "text-expense" : "text-muted-foreground"
                        )}
                      >
                        {left >= 0
                          ? `Reste ${formatCurrency(left)}`
                          : `Dépassé de ${formatCurrency(-left)}`}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {withoutBudget.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sans budget</CardTitle>
                <CardDescription>
                  Définissez un plafond pour suivre ces catégories.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <ul className="divide-y">
                  {withoutBudget.map(({ category, spent }) => (
                    <li key={category.id} className="flex items-center gap-3 px-4 py-3">
                      <CategoryIcon category={category} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{category.name}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {formatCurrency(spent)} dépensés
                        </p>
                      </div>
                      <BudgetDialog category={category} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  )
}

function BudgetsSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Chargement">
      <Skeleton className="h-32 rounded-xl" />
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    </div>
  )
}
