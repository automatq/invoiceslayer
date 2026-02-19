"use client"

import { Layers } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

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
    dealCount: {
        label: "Deals",
    },
    totalValue: {
        label: "Value",
    },
} satisfies ChartConfig

export function DealsByStageChart({ data }: { data: any[] }) {
    const totalDeals = data.reduce((sum, stage) => sum + stage.dealCount, 0)
    const totalValue = data.reduce((sum, stage) => sum + stage.totalValue, 0)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Deals by Stage
                </CardTitle>
                <CardDescription>
                    Deal distribution across pipeline stages
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                    <BarChart data={data} layout="vertical">
                        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="stageName"
                            type="category"
                            tickLine={false}
                            axisLine={false}
                            width={100}
                            fontSize={12}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    formatter={(value, name, props) => {
                                        if (name === "dealCount") {
                                            return <span>{value} deals</span>
                                        }
                                        return <span>${Number(value).toLocaleString()}</span>
                                    }}
                                />
                            }
                        />
                        <Bar dataKey="dealCount" radius={[0, 4, 4, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex items-center gap-4">
                    <div>
                        <span className="font-medium">Total Deals: </span>
                        <span className="font-bold">{totalDeals}</span>
                    </div>
                    <div>
                        <span className="font-medium">Total Value: </span>
                        <span className="font-bold">${totalValue.toLocaleString()}</span>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}
