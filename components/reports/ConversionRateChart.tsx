"use client"

import { ArrowRight, Percent } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"

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
    conversionRate: {
        label: "Conversion Rate",
        color: "oklch(0.65 0.15 280)",
    },
} satisfies ChartConfig

export function ConversionRateChart({ data }: { data: any[] }) {
    const avgConversion = data.length > 0
        ? data.reduce((sum, item) => sum + item.conversionRate, 0) / data.length
        : 0

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ArrowRight className="h-5 w-5" />
                    Stage Conversion Rates
                </CardTitle>
                <CardDescription>
                    Percentage of deals moving to next stage
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                    <BarChart data={data}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="fromStage"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            fontSize={11}
                            angle={-15}
                            textAnchor="end"
                            height={60}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            fontSize={12}
                            tickFormatter={(value) => `${value}%`}
                            domain={[0, 100]}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    formatter={(value, name, props) => (
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium">
                                                {props.payload.fromStage} → {props.payload.toStage}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {props.payload.fromCount} deals → {props.payload.toCount} deals
                                            </span>
                                            <span className="font-bold text-primary">
                                                {Number(value).toFixed(1)}% conversion
                                            </span>
                                        </div>
                                    )}
                                />
                            }
                        />
                        <Bar dataKey="conversionRate" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.conversionRate > 50 ? "var(--chart-1)" : "var(--chart-3)"}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Average Conversion:</span>
                    <span className="font-bold">{avgConversion.toFixed(1)}%</span>
                </div>
            </CardFooter>
        </Card>
    )
}
