const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
})

const compactCurrencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

export function formatCompactCurrency(value: number) {
  return compactCurrencyFormatter.format(value)
}

/** "2026-10-07" -> "7 oct." */
export function formatShortDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
}

/** "2026-10-07" -> "mercredi 7 octobre" */
export function formatLongDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  })
}
