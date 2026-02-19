"use client"

import { TrendingUp, DollarSign } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
    pipelineValue: {
        label: "Pipeline Value",
        color: "oklch(0.65 0.15 250)",
    },
    weightedForecast: {
        label: "Weighted Forecast",
        color: "oklch(0.75 0.15 150)",
    },
} satisfies ChartConfig

export function PipelineForecastChart({ data }: { data: any[] }) {
    const totalPipeline = data.reduce((sum, month) => sum + month.pipelineValue, 0)
    const totalForecast = data.reduce((sum, month) => sum + month.weightedForecast, 0)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Pipeline Forecast
                </CardTitle>
                <CardDescription>
                    Expected deal closures by month
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="fillPipeline" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-pipelineValue)" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="var(--color-pipelineValue)" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="fillForecast" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-weightedForecast)" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="var(--color-weightedForecast)" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            fontSize={12}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    formatter={(value, name) => (
                                        <div className="flex items-center gap-1">
                                            <span className="font-mono font-medium">
                                                ${Number(value).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                />
                            }
                        />
                        <Area
                            dataKey="pipelineValue"
                            type="monotone"
                            fill="url(#fillPipeline)"
                            stroke="var(--color-pipelineValue)"
                            strokeWidth={2}
                        />
                        <Area
                            dataKey="weightedForecast"
                            type="monotone"
                            fill="url(#fillForecast)"
                            stroke="var(--color-weightedForecast)"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Total Pipeline:</span>
                        <span className="font-bold">${totalPipeline.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Weighted:</span>
                        <span className="font-bold text-green-600">${totalForecast.toLocaleString()}</span>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}
