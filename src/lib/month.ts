const TIME_ZONE = "Europe/Paris"

export type Month = { year: number; month: number } // month : 1-12

/** Date du jour au format YYYY-MM-DD, dans le fuseau de l'utilisateur. */
export function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date())
}

export function currentMonth(): Month {
  const [year, month] = today().split("-").map(Number)
  return { year, month }
}

/** Lit un paramètre "YYYY-MM" ; retombe sur le mois courant s'il est invalide. */
export function parseMonth(value: string | string[] | undefined): Month {
  if (typeof value === "string") {
    const match = /^(\d{4})-(\d{2})$/.exec(value)
    if (match) {
      const year = Number(match[1])
      const month = Number(match[2])
      if (month >= 1 && month <= 12) return { year, month }
    }
  }
  return currentMonth()
}

export function monthKey({ year, month }: Month) {
  return `${year}-${String(month).padStart(2, "0")}`
}

export function shiftMonth({ year, month }: Month, delta: number): Month {
  const index = year * 12 + (month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

/** Bornes [start, end[ au format YYYY-MM-DD. */
export function monthRange(m: Month) {
  return { start: `${monthKey(m)}-01`, end: `${monthKey(shiftMonth(m, 1))}-01` }
}

export function daysInMonth({ year, month }: Month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function formatMonth(m: Month) {
  const label = new Date(Date.UTC(m.year, m.month - 1, 1)).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function isSameMonth(a: Month, b: Month) {
  return a.year === b.year && a.month === b.month
}
