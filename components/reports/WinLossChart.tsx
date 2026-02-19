"use client"

import { Trophy, XCircle, TrendingUp } from "lucide-react"
import { Pie, PieChart, Cell } from "recharts"

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
    won: {
        label: "Won",
        color: "oklch(0.7 0.2 150)",
    },
    lost: {
        label: "Lost",
        color: "oklch(0.6 0.2 30)",
    },
} satisfies ChartConfig

export function WinLossChart({ data }: { data: any }) {
    const chartData = [
        { name: "Won", value: data.won.count, fill: "var(--color-won)" },
        { name: "Lost", value: data.lost.count, fill: "var(--color-lost)" },
    ]

    const totalDeals = data.won.count + data.lost.count

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Win/Loss Analysis
                </CardTitle>
                <CardDescription>
                    Deal outcomes and success rate
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full">
                    <PieChart>
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    formatter={(value, name) => (
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{name}:</span>
                                            <span className="font-bold">{value} deals</span>
                                        </div>
                                    )}
                                />
                            }
                        />
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                            <Trophy className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Won</p>
                            <p className="text-lg font-bold text-green-600">{data.won.count}</p>
                            <p className="text-xs text-muted-foreground">${data.won.value.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                            <XCircle className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Lost</p>
                            <p className="text-lg font-bold text-red-600">{data.lost.count}</p>
                            <p className="text-xs text-muted-foreground">${data.lost.value.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Win Rate:</span>
                    <span className={`font-bold ${data.winRate >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
                        {data.winRate}%
                    </span>
                    <span className="text-muted-foreground">
                        ({totalDeals} total closed deals)
                    </span>
                </div>
            </CardFooter>
        </Card>
    )
}
