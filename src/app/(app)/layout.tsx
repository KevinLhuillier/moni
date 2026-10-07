import { Suspense } from "react"
import { cookies } from "next/headers"

import { AppSidebar } from "@/components/app-sidebar"
import { TransactionDialog } from "@/components/transactions/transaction-dialog"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { getCategories } from "@/lib/data"
import { requireUser } from "@/lib/supabase/server"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // La session est lue à la requête : elle doit rester derrière un <Suspense>
  // (Cache Components), le squelette sert de shell statique.
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  )
}

async function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser()
  const [cookieStore, categories] = await Promise.all([cookies(), getCategories()])
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar email={user.email} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
          <div className="ml-auto">
            <TransactionDialog categories={categories} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 pb-24 sm:p-6 sm:pb-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function AppShellSkeleton() {
  return (
    <div className="flex min-h-svh" aria-busy="true" aria-label="Chargement">
      <div className="hidden w-64 shrink-0 flex-col gap-3 border-r bg-sidebar p-4 md:flex">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="mt-4 h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <Skeleton className="size-7" />
          <Skeleton className="ml-auto h-8 w-36" />
        </div>
      </div>
    </div>
  )
}
