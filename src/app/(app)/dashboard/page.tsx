import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon, PiggyBankIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { BudgetBar } from "@/components/budgets/budget-bar"
import { CategoryIcon } from "@/components/category-badge"
import { SpendingChart, type SpendingPoint } from "@/components/dashboard/spending-chart"
import { MonthNav } from "@/components/month-nav"
import { PageHeader } from "@/components/page-header"
import { TransactionList } from "@/components/transactions/transaction-list"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getBudgets,
  getCategories,
  getMonthTransactions,
  sumByCategory,
  sumByType,
} from "@/lib/data"
import { formatCurrency } from "@/lib/format"
import {
  currentMonth,
  daysInMonth,
  isSameMonth,
  monthKey,
  parseMonth,
  shiftMonth,
  today,
} from "@/lib/month"
import { getMonth } from "@/lib/month-param"
import type { TransactionWithCategory } from "@/lib/supabase/database.types"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Tableau de bord" }

type SearchParams = PageProps<"/dashboard">["searchParams"]

// Le titre fait partie du shell statique ; ce qui dépend du mois est rendu à la
// requête derrière un <Suspense> (voir getMonth).
export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <>
      <PageHeader title="Tableau de bord" description="Vue d'ensemble de vos finances.">
        <Suspense fallback={<Skeleton className="h-8 w-56" />}>
          <DashboardMonthNav searchParams={searchParams} />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function DashboardMonthNav({ searchParams }: { searchParams: SearchParams }) {
  return <MonthNav month={await getMonth(searchParams)} basePath="/dashboard" />
}

async function DashboardContent({ searchParams }: { searchParams: SearchParams }) {
  const month = await getMonth(searchParams)
  const previousMonth = shiftMonth(month, -1)
  const [transactions, previousTransactions, categories, budgets] = await Promise.all([
    getMonthTransactions(month),
    getMonthTransactions(previousMonth),
    getCategories(),
    getBudgets(),
  ])

  const totals = sumByType(transactions)
  const previousTotals = sumByType(previousTransactions)
  const expenseDelta =
    previousTotals.expense > 0
      ? (totals.expense - previousTotals.expense) / previousTotals.expense
      : null

  const spentByCategory = sumByCategory(transactions)
  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const breakdown = [...spentByCategory.entries()]
    .map(([id, amount]) => ({ category: categoryById.get(id), amount }))
    .sort((a, b) => b.amount - a.amount)

  const budgetRows = budgets
    .map((b) => ({
      category: categoryById.get(b.category_id)!,
      budget: Number(b.amount),
      spent: spentByCategory.get(b.category_id) ?? 0,
    }))
    .filter((r) => r.category)
    .sort((a, b) => b.spent / b.budget - a.spent / a.budget)
    .slice(0, 5)

  const monthParam = isSameMonth(month, currentMonth()) ? "" : `?month=${monthKey(month)}`

  return (
    <>
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Revenus" value={totals.income} valueClassName="text-income" />
          <StatCard label="Dépenses" value={totals.expense}>
            {expenseDelta !== null && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                {expenseDelta > 0 ? (
                  <TrendingUpIcon className="size-3.5 text-expense" />
                ) : (
                  <TrendingDownIcon className="size-3.5 text-income" />
                )}
                {expenseDelta > 0 ? "+" : ""}
                {Math.round(expenseDelta * 100)} % vs mois précédent
              </p>
            )}
          </StatCard>
          <StatCard label="Épargne" value={totals.saving} valueClassName="text-saving">
            {totals.savingRate !== null && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <PiggyBankIcon className="size-3.5 text-saving" />
                {Math.round(totals.savingRate * 100)} % des revenus
              </p>
            )}
          </StatCard>
          <StatCard
            label="Reste disponible"
            value={totals.balance}
            valueClassName={totals.balance < 0 ? "text-expense" : undefined}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Dépenses cumulées</CardTitle>
              <CardDescription>Comparaison jour par jour avec le mois précédent.</CardDescription>
            </CardHeader>
            <CardContent>
              <SpendingChart data={buildSpendingSeries(transactions, previousTransactions, month)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Par catégorie</CardTitle>
              <CardDescription>Répartition des dépenses du mois.</CardDescription>
            </CardHeader>
            <CardContent>
              {breakdown.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aucune dépense ce mois-ci.
                </p>
              ) : (
                <ul className="grid gap-3">
                  {breakdown.map(({ category, amount }) => (
                    <li key={category?.id ?? "none"} className="grid gap-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <CategoryIcon category={category} className="size-6 rounded-md [&_svg]:size-3.5" />
                        <span className="min-w-0 flex-1 truncate">
                          {category?.name ?? "Sans catégorie"}
                        </span>
                        <span className="font-medium tabular-nums">{formatCurrency(amount)}</span>
                        <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                          {Math.round((amount / totals.expense) * 100)} %
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(amount / breakdown[0].amount) * 100}%`,
                            backgroundColor: category?.color ?? "#94a3b8",
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Budgets</CardTitle>
              <CardDescription>Les plus sollicités ce mois-ci.</CardDescription>
              <CardAction>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/budgets${monthParam}`}>
                    Tout voir <ArrowRightIcon />
                  </Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {budgetRows.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <p>Aucun budget défini.</p>
                  <Button variant="link" asChild>
                    <Link href="/budgets">Définir un budget</Link>
                  </Button>
                </div>
              ) : (
                <ul className="grid gap-4">
                  {budgetRows.map(({ category, budget, spent }) => (
                    <li key={category.id} className="grid gap-1.5">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium">{category.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatCurrency(spent)} / {formatCurrency(budget)}
                        </span>
                      </div>
                      <BudgetBar spent={spent} budget={budget} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="pb-0">
            <CardHeader>
              <CardTitle>Dernières transactions</CardTitle>
              <CardDescription>{transactions.length} opération(s) ce mois-ci.</CardDescription>
              <CardAction>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/transactions${monthParam}`}>
                    Tout voir <ArrowRightIcon />
                  </Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="px-0">
              {transactions.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aucune transaction ce mois-ci.
                </p>
              ) : (
                <div className="border-t">
                  <TransactionList
                    transactions={transactions.slice(0, 5)}
                    categories={categories}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Chargement">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  )
}

function StatCard({
  label,
  value,
  valueClassName,
  children,
}: {
  label: string
  value: number
  valueClassName?: string
  children?: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className={cn("text-2xl font-semibold tabular-nums", valueClassName)}>
          {formatCurrency(value)}
        </CardTitle>
        {children}
      </CardHeader>
    </Card>
  )
}

/** Dépenses cumulées par jour pour le mois affiché et le précédent. */
function buildSpendingSeries(
  current: TransactionWithCategory[],
  previous: TransactionWithCategory[],
  month: ReturnType<typeof parseMonth>
): SpendingPoint[] {
  const dailyTotals = (list: TransactionWithCategory[]) => {
    const totals = new Map<number, number>()
    for (const t of list) {
      if (t.type !== "expense") continue
      const day = Number(t.date.slice(8, 10))
      totals.set(day, (totals.get(day) ?? 0) + Number(t.amount))
    }
    return totals
  }

  const currentDaily = dailyTotals(current)
  const previousDaily = dailyTotals(previous)
  const previousDays = daysInMonth(shiftMonth(month, -1))
  const now = currentMonth()
  const lastDay = isSameMonth(month, now)
    ? Number(today().slice(8, 10))
    : monthKey(month) > monthKey(now)
      ? 0
      : daysInMonth(month)

  const points: SpendingPoint[] = []
  let currentSum = 0
  let previousSum = 0
  for (let day = 1; day <= daysInMonth(month); day++) {
    currentSum += currentDaily.get(day) ?? 0
    previousSum += previousDaily.get(day) ?? 0
    points.push({
      day,
      current: day <= lastDay ? Math.round(currentSum * 100) / 100 : null,
      previous: day <= previousDays ? Math.round(previousSum * 100) / 100 : null,
    })
  }
  return points
}
