"use client"

import { TrendingUp } from "lucide-react"
import { Pie, PieChart } from "recharts"

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
    count: {
        label: "Count",
        color: "var(--chart-1)",
    },
    draft: {
        label: "Draft",
        color: "var(--chart-1)",
    },
    sent: {
        label: "Sent",
        color: "var(--chart-2)",
    },
    paid: {
        label: "Paid",
        color: "var(--chart-3)",
    },
    partial: {
        label: "Partial",
        color: "var(--chart-4)",
    },
    overdue: {
        label: "Overdue",
        color: "var(--chart-5)",
    },
    cancelled: {
        label: "Cancelled",
        color: "var(--chart-6)",
    },
} satisfies ChartConfig

export function StatusDistributionChart({ data, trend }: { data: any[], trend?: number }) {
    // Map data to include the fill from chartConfig
    const chartData = data.map(item => {
        const key = item.status.toLowerCase() as keyof typeof chartConfig
        return {
            ...item,
            statusKey: key,
            fill: (chartConfig[key] as any)?.color || item.fill
        }
    })

    const isUp = (trend || 0) >= 0

    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle>Invoice Status Distribution</CardTitle>
                <CardDescription>All-time status breakdown</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px] pb-0"
                >
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie
                            data={chartData}
                            dataKey="count"
                            label
                            nameKey="status"
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm pt-4">
                <div className="flex items-center gap-2 leading-none font-medium">
                    {isUp ? "Trending up" : "Trending down"} by {Math.abs(trend || 0).toFixed(1)}% this month{" "}
                    <TrendingUp className={`h-4 w-4 ${!isUp && "rotate-180"}`} />
                </div>
                <div className="text-muted-foreground leading-none">
                    Showing real-time distribution of invoice statuses
                </div>
            </CardFooter>
        </Card>
    )
}
