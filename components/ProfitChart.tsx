"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
    profit: {
        label: "Net Profit",
        color: "oklch(0.65 0.18 150)", // Greenish
    },
    loss: {
        label: "Loss",
        color: "oklch(0.65 0.18 20)", // Reddish
    },
} satisfies ChartConfig

export function ProfitChart({ data }: { data: { name: string; profit: number }[] }) {
    return (
        <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[300px] w-full"
        >
            <BarChart data={data}>
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
                    cursor={{ fill: "var(--color-muted)", opacity: 0.2 }}
                    content={
                        <ChartTooltipContent
                            indicator="dot"
                            formatter={(value, name) => (
                                <span className={Number(value) >= 0 ? "text-green-600" : "text-red-600"}>
                                    ${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </span>
                            )}
                        />
                    }
                />
                <Bar
                    dataKey="profit"
                    radius={[4, 4, 0, 0]}
                // Use Cell to conditionally color bars
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={entry.profit >= 0 ? "var(--color-profit)" : "var(--color-loss)"}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ChartContainer>
    )
}
