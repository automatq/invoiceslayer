import { Suspense } from "react";
import { getProfitBuckets } from "@/app/actions/budget";
import { getDashboardMetrics } from "@/app/actions/reports";
import { ProfitAllocationOverview } from "@/components/budget/ProfitAllocationOverview";
import { BucketList } from "@/components/budget/BucketList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Percent, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BudgetPage({
    searchParams,
}: {
    searchParams: { basis?: string };
}) {
    const basis = searchParams?.basis === "cash" ? "cash" : "accrual";
    const currentYear = new Date().getFullYear();

    const [buckets, metrics] = await Promise.all([
        getProfitBuckets(),
        getDashboardMetrics(currentYear, basis as "accrual" | "cash"),
    ]);

    const totalAllocated = buckets.reduce((sum: number, b: any) => sum + b.percentage, 0);
    const remainingPercentage = 100 - totalAllocated;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Budget</h1>
                    <p className="text-muted-foreground">
                        Manage your profit allocations and budgets.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${metrics.netProfit.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total realized profit ({basis === "cash" ? "Cash" : "Accrual"})
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAllocated}%</div>
                        <p className="text-xs text-muted-foreground">
                            Across {buckets.length} buckets
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unallocated</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{remainingPercentage}%</div>
                        <p className="text-xs text-muted-foreground">
                            Remaining profit cushion
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <ProfitAllocationOverview buckets={buckets} netProfit={metrics.netProfit} />
                </div>
                <div className="col-span-3">
                    <BucketList buckets={buckets} totalAllocated={totalAllocated} />
                </div>
            </div>
        </div>
    );
}
