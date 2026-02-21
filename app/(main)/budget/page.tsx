import {
    getProfitBuckets,
    getBudgetPerformance,
    getGoalsProgress
} from "@/app/actions/budget";
import { getDashboardMetrics } from "@/app/actions/reports";
import { getExpenseCategories } from "@/app/actions/expenses";
import { ProfitAllocationOverview } from "@/components/budget/ProfitAllocationOverview";
import { BucketList } from "@/components/budget/BucketList";
import { CategoryBudgetList } from "@/components/budget/CategoryBudgetList";
import { GoalTracker } from "@/components/budget/GoalTracker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Target, Coins, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BudgetPage({
    searchParams,
}: {
    searchParams: { tab?: string };
}) {
    const { tab } = searchParams;
    const activeTab = tab || "budget";
    const currentYear = new Date().getFullYear();

    const [buckets, budgetPerformance, goalsProgress, dashboardMetrics, categories] = await Promise.all([
        getProfitBuckets(),
        getBudgetPerformance(),
        getGoalsProgress(),
        getDashboardMetrics(currentYear),
        getExpenseCategories(),
    ]);

    const totalAllocated = buckets.reduce((sum, b) => sum + b.percentage, 0);
    const netProfit = dashboardMetrics?.netProfit || 0;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Financial Planning</h2>
            </div>

            <Tabs defaultValue={activeTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="budget" className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Budget
                    </TabsTrigger>
                    <TabsTrigger value="goals" className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Goals
                    </TabsTrigger>
                    <TabsTrigger value="allocation" className="flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        Allocation
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="budget" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <div className="col-span-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Budget vs Actual</CardTitle>
                                    <CardDescription>
                                        Track your monthly spending against your budgets.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <CategoryBudgetList performance={budgetPerformance} categories={categories} />
                                </CardContent>
                            </Card>
                        </div>
                        <div className="col-span-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profit Allocation</CardTitle>
                                    <CardDescription>
                                        How your profits are distributed.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-8">
                                    <ProfitAllocationOverview buckets={buckets} netProfit={netProfit} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="goals" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Financial Goals</CardTitle>
                            <CardDescription>
                                Track your progress towards revenue and profit milestones.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <GoalTracker goals={goalsProgress} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="allocation" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profit Buckets</CardTitle>
                            <CardDescription>
                                Manage your automatic profit distribution percentages.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BucketList buckets={buckets} totalAllocated={totalAllocated} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
