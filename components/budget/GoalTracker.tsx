"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Target, MoreVertical, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AddGoalDialog } from "./AddGoalDialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteFinancialGoal } from "@/app/actions/budget";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GoalProgress {
    id: string;
    name: string;
    type: string;
    targetAmount: number;
    startDate: Date;
    endDate: Date;
    actual: number;
    percentage: number;
    remaining: number;
}

interface GoalTrackerProps {
    goals: GoalProgress[];
}

export function GoalTracker({ goals }: GoalTrackerProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(amount);

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this goal?")) {
            const result = await deleteFinancialGoal(id);
            if (result.success) {
                toast.success("Goal deleted");
            } else {
                toast.error("Failed to delete goal");
            }
        }
    };

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Financial Goals
                </CardTitle>
                <Button size="sm" onClick={() => setIsDialogOpen(true)} variant="outline">
                    <Plus className="mr-2 h-4 w-4" /> Add Goal
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 sm:grid-cols-2">
                    {goals.length === 0 ? (
                        <div className="col-span-full py-8 text-center border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground text-sm">No active goals found. Start by adding one!</p>
                        </div>
                    ) : (
                        goals.map((goal) => (
                            <Card key={goal.id} className="relative overflow-hidden border-muted/50">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-semibold text-lg">{goal.name}</h3>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                                {goal.type} TARGET
                                            </p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => handleDelete(goal.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div className="text-2xl font-bold">{formatCurrency(goal.actual)}</div>
                                            <div className="text-sm text-muted-foreground">
                                                of {formatCurrency(goal.targetAmount)}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Progress
                                                value={Math.min(100, goal.percentage)}
                                                className="h-2"
                                            />
                                            <div className="flex justify-between text-xs">
                                                <span className="font-medium text-primary">
                                                    {goal.percentage.toFixed(1)}% complete
                                                </span>
                                                <span className="text-muted-foreground italic">
                                                    Ends {new Date(goal.endDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        {goal.remaining > 0 ? (
                                            <div className="bg-primary/5 p-3 rounded-md text-center">
                                                <p className="text-sm font-medium text-primary">
                                                    {formatCurrency(goal.remaining)} to go!
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="bg-green-500/10 p-3 rounded-md text-center">
                                                <p className="text-sm font-bold text-green-600">
                                                    Goal Reached! 🎉
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </CardContent>

            <AddGoalDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
        </Card>
    );
}
