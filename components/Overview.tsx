"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
    revenue: {
        label: "Revenue",
        color: "oklch(0.75 0.15 85)",
    },
    quotes: {
        label: "Quotes",
        color: "oklch(0.55 0.15 250)",
    },
} satisfies ChartConfig

export function Overview({ data }: { data: { name: string; revenue: number; quotes: number }[] }) {
    return (
        <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[300px] w-full"
        >
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="5%"
                            stopColor="var(--color-revenue)"
                            stopOpacity={0.8}
                        />
                        <stop
                            offset="95%"
                            stopColor="var(--color-revenue)"
                            stopOpacity={0.05}
                        />
                    </linearGradient>
                    <linearGradient id="fillQuotes" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="5%"
                            stopColor="var(--color-quotes)"
                            stopOpacity={0.8}
                        />
                        <stop
                            offset="95%"
                            stopColor="var(--color-quotes)"
                            stopOpacity={0.05}
                        />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-muted-foreground"
                    fontSize={12}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-muted-foreground"
                    fontSize={12}
                    tickFormatter={(value) => `$${value}`}
                />
                <ChartTooltip
                    cursor={false}
                    content={
                        <ChartTooltipContent
                            indicator="dot"
                            formatter={(value, name) => (
                                <span>
                                    ${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </span>
                            )}
                        />
                    }
                />
                <Area
                    dataKey="quotes"
                    type="natural"
                    fill="url(#fillQuotes)"
                    stroke="var(--color-quotes)"
                    strokeWidth={2}
                    stackId="a"
                />
                <Area
                    dataKey="revenue"
                    type="natural"
                    fill="url(#fillRevenue)"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                    stackId="a"
                />
            </AreaChart>
        </ChartContainer>
    )
}
