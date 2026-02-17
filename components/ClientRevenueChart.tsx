"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"

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

export const description = "A horizontal bar chart"

const chartConfig = {
    revenue: {
        label: "Revenue",
        color: "oklch(0.70 0.10 50)", // Gold/Yellowish
    },
} satisfies ChartConfig

export function ClientRevenueChart({ data }: { data: { name: string; revenue: number }[] }) {
    // If no data, return nothing or a placeholder? 
    // For now let's render empty state handled by parent or empty chart.
    if (!data || data.length === 0) return null;

    const topClient = data[0];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Clients by Revenue</CardTitle>
                <CardDescription>Lifetime Revenue</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                    <BarChart
                        accessibilityLayer
                        data={data}
                        layout="vertical"
                        margin={{
                            left: -20,
                        }}
                    >
                        <XAxis type="number" dataKey="revenue" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 10) + (value.length > 10 ? "..." : "")}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel formatter={(value) => `$${Number(value).toLocaleString()}`} />}
                        />
                        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={5} maxBarSize={50} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    Top Client: {topClient.name} (${topClient.revenue.toLocaleString()}) <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                    Showing top {data.length} clients by total revenue
                </div>
            </CardFooter>
        </Card>
    )
}
