"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCompactCurrency, formatCurrency } from "@/lib/format"

export type SpendingPoint = { day: number; current: number | null; previous: number | null }

// Paire validée (CVD, contraste) sur les surfaces claire et sombre.
const chartConfig = {
  current: { label: "Ce mois", theme: { light: "#059669", dark: "#059669" } },
  previous: { label: "Mois précédent", theme: { light: "#3b82f6", dark: "#3b82f6" } },
} satisfies ChartConfig

export function SpendingChart({ data }: { data: SpendingPoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v: number) => formatCompactCurrency(v)}
        />
        <ChartTooltip
          cursor
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => `Jour ${payload?.[0]?.payload.day}`}
              formatter={(value, name, item) => (
                <div className="flex w-full items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">
                    {chartConfig[name as keyof typeof chartConfig]?.label}
                  </span>
                  <span className="ml-auto font-medium text-foreground tabular-nums">
                    {formatCurrency(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="previous"
          type="monotone"
          stroke="var(--color-previous)"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          dataKey="current"
          type="monotone"
          stroke="var(--color-current)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  )
}
