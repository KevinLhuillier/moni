import { Suspense } from "react"
import type { Metadata } from "next"

import { CategoryManager } from "@/components/categories/category-manager"
import { PageHeader } from "@/components/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { getCategories } from "@/lib/data"

export const metadata: Metadata = { title: "Catégories" }

// Le titre fait partie du shell statique ; les catégories dépendent de la session
// et sont rendues à la requête derrière un <Suspense>.
export default function CategoriesPage() {
  return (
    <>
      <PageHeader
        title="Catégories"
        description="Organisez vos dépenses et revenus."
      />
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesContent />
      </Suspense>
    </>
  )
}

async function CategoriesContent() {
  const categories = await getCategories()
  return <CategoryManager categories={categories} />
}

function CategoriesSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2" aria-busy="true" aria-label="Chargement">
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  )
}
