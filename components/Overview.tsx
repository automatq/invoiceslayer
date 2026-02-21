"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts"

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
    revenue: {
        label: "Realized",
        color: "oklch(0.75 0.15 85)",
    },
    projected: {
        label: "Projected",
        color: "oklch(0.65 0.12 280)",
    },
    quotes: {
        label: "Quotes",
        color: "oklch(0.55 0.15 250)",
    },
    pipeline: {
        label: "Pipeline (Total)",
        color: "oklch(0.6 0.18 300)",
    },
    weighted: {
        label: "Weighted Forecast",
        color: "oklch(0.7 0.2 320)",
    },
} satisfies ChartConfig

interface OverviewData {
    name: string;
    revenue: number;
    projected?: number;
    quotes: number;
    pipeline?: number;
    weighted?: number;
}

export function Overview({ data }: { data: OverviewData[] }) {
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
                    <linearGradient id="fillProjected" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="5%"
                            stopColor="var(--color-projected)"
                            stopOpacity={0.6}
                        />
                        <stop
                            offset="95%"
                            stopColor="var(--color-projected)"
                            stopOpacity={0.02}
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
                    <linearGradient id="fillWeighted" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="5%"
                            stopColor="var(--color-weighted)"
                            stopOpacity={0.7}
                        />
                        <stop
                            offset="95%"
                            stopColor="var(--color-weighted)"
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
                                <div className="flex items-center gap-1">
                                    <span className="font-mono font-medium">
                                        ${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                        />
                    }
                />
                <Legend verticalAlign="top" height={36} />
                {data.some(d => d.pipeline && d.pipeline > 0) && (
                    <Area
                        dataKey="pipeline"
                        type="natural"
                        fill="transparent"
                        stroke="var(--color-pipeline)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                    />
                )}
                {data.some(d => d.weighted && d.weighted > 0) && (
                    <Area
                        dataKey="weighted"
                        type="natural"
                        fill="url(#fillWeighted)"
                        stroke="var(--color-weighted)"
                        strokeWidth={2}
                        stackId="a"
                    />
                )}
                <Area
                    dataKey="quotes"
                    type="natural"
                    fill="url(#fillQuotes)"
                    stroke="var(--color-quotes)"
                    strokeWidth={2}
                    stackId="a"
                />
                <Area
                    dataKey="projected"
                    type="natural"
                    fill="url(#fillProjected)"
                    stroke="var(--color-projected)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
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
