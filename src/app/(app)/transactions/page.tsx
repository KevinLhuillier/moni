import type { Metadata } from "next"
import { io } from "next/cache"
import Link from "next/link"
import { ArrowLeftRightIcon } from "lucide-react"

import { MonthNav } from "@/components/month-nav"
import { PageHeader } from "@/components/page-header"
import { TransactionList } from "@/components/transactions/transaction-list"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCategories, getMonthTransactions, sumByType } from "@/lib/data"
import { formatCurrency } from "@/lib/format"
import { monthKey, parseMonth } from "@/lib/month"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Transactions" }

const FILTERS = [
  { value: "all", label: "Tout" },
  { value: "expense", label: "Dépenses" },
  { value: "income", label: "Revenus" },
] as const

export default async function TransactionsPage({ searchParams }: PageProps<"/transactions">) {
  const params = await searchParams
  await io() // parseMonth lit la date du jour
  const month = parseMonth(params.month)
  const filter = FILTERS.find((f) => f.value === params.type)?.value ?? "all"

  const [transactions, categories] = await Promise.all([
    getMonthTransactions(month),
    getCategories(),
  ])
  const totals = sumByType(transactions)
  const visible =
    filter === "all" ? transactions : transactions.filter((t) => t.type === filter)

  const filterHref = (value: string) => {
    const search = new URLSearchParams()
    if (params.month) search.set("month", monthKey(month))
    if (value !== "all") search.set("type", value)
    const qs = search.toString()
    return qs ? `/transactions?${qs}` : "/transactions"
  }

  return (
    <>
      <PageHeader title="Transactions" description="Toutes vos opérations du mois.">
        <MonthNav
          month={month}
          basePath="/transactions"
          params={{ type: filter === "all" ? undefined : filter }}
        />
      </PageHeader>

      <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-4">
        <Stat label="Revenus" value={totals.income} className="text-income" />
        <Stat label="Dépenses" value={totals.expense} />
        <Stat
          label="Solde"
          value={totals.balance}
          className={totals.balance < 0 ? "text-expense" : undefined}
        />
      </div>

      <Card className="gap-0 py-0">
        <div className="border-b p-3">
          <Tabs value={filter}>
            <TabsList>
              {FILTERS.map((f) => (
                <TabsTrigger key={f.value} value={f.value} asChild>
                  <Link href={filterHref(f.value)} scroll={false}>
                    {f.label}
                  </Link>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <CardContent className="px-0">
          {visible.length > 0 ? (
            <TransactionList transactions={visible} categories={categories} groupByDate />
          ) : (
            <Empty className="py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ArrowLeftRightIcon />
                </EmptyMedia>
                <EmptyTitle>Aucune transaction</EmptyTitle>
                <EmptyDescription>
                  Ajoutez votre première opération avec le bouton « Nouvelle transaction ».
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function Stat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <Card className="gap-1 px-3 py-3 sm:px-4 sm:py-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("truncate text-sm font-semibold tabular-nums sm:text-lg", className)}>
        {formatCurrency(value)}
      </p>
    </Card>
  )
}
