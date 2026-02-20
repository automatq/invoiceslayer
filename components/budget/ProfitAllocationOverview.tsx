"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

interface Bucket {
    id: string;
    name: string;
    percentage: number;
}

interface ProfitAllocationOverviewProps {
    buckets: Bucket[];
    netProfit: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export function ProfitAllocationOverview({ buckets, netProfit }: ProfitAllocationOverviewProps) {
    const totalAllocated = buckets.reduce((sum, b) => sum + b.percentage, 0);
    const remaining = Math.max(0, 100 - totalAllocated);

    const data = [
        ...buckets.map((b) => ({
            name: b.name,
            value: b.percentage,
            amount: (netProfit * b.percentage) / 100,
        })),
        ...(remaining > 0
            ? [
                {
                    name: "Unallocated",
                    value: remaining,
                    amount: (netProfit * remaining) / 100,
                },
            ]
            : []),
    ];

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(value);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Profit Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number, name: string, props: any) => [
                                    `${value}% (${formatCurrency(props.payload.amount)})`,
                                    name,
                                ]}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
