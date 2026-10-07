import type { Metadata } from "next"

import { CategoryManager } from "@/components/categories/category-manager"
import { PageHeader } from "@/components/page-header"
import { getCategories } from "@/lib/data"

export const metadata: Metadata = { title: "Catégories" }

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <>
      <PageHeader
        title="Catégories"
        description="Organisez vos dépenses et revenus."
      />
      <CategoryManager categories={categories} />
    </>
  )
}
