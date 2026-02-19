"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Line,
    ComposedChart,
} from "recharts";

interface CombinedRevenueData {
    month: string;
    actualRevenue: number;
    forecastRevenue: number;
    pipelineValue: number;
}

interface CombinedRevenueChartProps {
    data: CombinedRevenueData[];
}

export function CombinedRevenueChart({ data }: CombinedRevenueChartProps) {
    const totalActual = data.reduce((sum, d) => sum + d.actualRevenue, 0);
    const totalForecast = data.reduce((sum, d) => sum + d.forecastRevenue, 0);
    const totalPipeline = data.reduce((sum, d) => sum + d.pipelineValue, 0);

    return (
        <Card className="col-span-7">
            <CardHeader>
                <CardTitle>Revenue Overview: Actual vs Forecast vs Pipeline</CardTitle>
                <div className="flex gap-6 mt-2 text-sm">
                    <div>
                        <span className="text-muted-foreground">Actual Revenue:</span>
                        <span className="ml-2 font-semibold text-green-600">
                            ${totalActual.toLocaleString()}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Weighted Forecast:</span>
                        <span className="ml-2 font-semibold text-blue-600">
                            ${totalForecast.toLocaleString()}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Total Pipeline:</span>
                        <span className="ml-2 font-semibold text-purple-600">
                            ${totalPipeline.toLocaleString()}
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                            formatter={(value: number) => `$${value.toLocaleString()}`}
                        />
                        <Legend />
                        <Bar
                            dataKey="actualRevenue"
                            name="Actual Revenue"
                            fill="#22c55e"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="forecastRevenue"
                            name="Weighted Forecast"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                        />
                        <Line
                            type="monotone"
                            dataKey="pipelineValue"
                            name="Total Pipeline"
                            stroke="#a855f7"
                            strokeWidth={2}
                            dot={{ fill: "#a855f7" }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
