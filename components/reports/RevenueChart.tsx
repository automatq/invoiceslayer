"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, LabelList } from "recharts"

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
    revenue: {
        label: "Revenue",
    },
} satisfies ChartConfig

export function RevenueChart({ data }: { data: any[] }) {
    const currentMonthIndex = new Date().getMonth()
    const currentMonthData = data[currentMonthIndex]?.revenue || 0
    const lastMonthData = data[currentMonthIndex - 1]?.revenue || 0

    let trend = 0
    if (lastMonthData !== 0) {
        trend = ((currentMonthData - lastMonthData) / Math.abs(lastMonthData)) * 100
    } else if (currentMonthData !== 0) {
        trend = 100
    }

    const isUp = trend >= 0

    return (
        <Card>
            <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue trends</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <BarChart accessibilityLayer data={data}>
                        <CartesianGrid vertical={false} />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel hideIndicator />}
                        />
                        <Bar dataKey="revenue">
                            <LabelList position="top" dataKey="name" fillOpacity={1} className="fill-foreground" />
                            {data.map((item, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={item.revenue > 0 ? "var(--chart-1)" : "var(--chart-2)"}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    {isUp ? "Trending up" : "Trending down"} by {Math.abs(trend).toFixed(1)}% this month{" "}
                    <TrendingUp className={`h-4 w-4 ${!isUp && "rotate-180"}`} />
                </div>
                <div className="text-muted-foreground leading-none">
                    Comparing {data[currentMonthIndex]?.name} to {data[max(0, currentMonthIndex - 1)]?.name}
                </div>
            </CardFooter>
        </Card>
    )
}

function max(a: number, b: number) {
    return a > b ? a : b
}
