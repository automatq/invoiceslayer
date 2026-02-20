"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { SetBudgetDialog } from "./SetBudgetDialog";
import { cn } from "@/lib/utils";

interface BudgetPerformance {
    id: string;
    category: string;
    budget: number;
    actual: number;
    remaining: number;
    percentage: number;
}

interface CategoryBudgetListProps {
    performance: BudgetPerformance[];
    categories: string[];
}

export function CategoryBudgetList({ performance, categories }: CategoryBudgetListProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<{ category: string; amount: number } | null>(null);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Expense Budgets</CardTitle>
                <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Set Budget
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {performance.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No category budgets set for this month.
                        </p>
                    ) : (
                        performance.map((item) => (
                            <div key={item.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{item.category}</span>
                                        {item.percentage > 90 && (
                                            <AlertCircle className={cn(
                                                "h-4 w-4",
                                                item.percentage > 100 ? "text-destructive" : "text-amber-500"
                                            )} />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-bold">{formatCurrency(item.actual)}</span>
                                        <span className="text-muted-foreground">of {formatCurrency(item.budget)}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => {
                                                setEditingBudget({ category: item.category, amount: item.budget });
                                                setIsDialogOpen(true);
                                            }}
                                        >
                                            <Edit2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                                <Progress
                                    value={Math.min(100, item.percentage)}
                                    className={cn(
                                        "h-2",
                                        item.percentage > 100 ? "bg-destructive/20" : ""
                                    )}
                                    style={{
                                        backgroundColor: item.percentage > 100 ? undefined : undefined
                                    }}
                                // Adding dynamic class for progress bar foreground
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{item.percentage.toFixed(1)}% used</span>
                                    <span className={cn(item.remaining < 0 && "text-destructive font-medium")}>
                                        {item.remaining >= 0
                                            ? `${formatCurrency(item.remaining)} remaining`
                                            : `${formatCurrency(Math.abs(item.remaining))} over budget`}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>

            <SetBudgetDialog
                open={isDialogOpen}
                onOpenChange={(open: boolean) => {
                    setIsDialogOpen(open);
                    if (!open) setEditingBudget(null);
                }}
                categories={categories}
                editingBudget={editingBudget}
            />
        </Card>
    );
}
