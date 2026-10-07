import { io } from "next/cache"

import { parseMonth } from "@/lib/month"

/**
 * Mois demandé via `?month=`, ou le mois courant. Dépend de la requête et de la
 * date du jour : à appeler sous un <Suspense> pour garder la navigation instantanée.
 */
export async function getMonth(searchParams: Promise<{ month?: string | string[] }>) {
  const { month } = await searchParams
  await io() // parseMonth lit la date du jour
  return parseMonth(month)
}
