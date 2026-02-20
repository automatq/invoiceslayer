"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

async function getRequiredSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return { userId: session.user.id, session };
}

export type ProfitBucketFormValues = {
    name: string;
    percentage: number;
    description?: string;
    teamId?: string;
};

export async function getProfitBuckets(teamId?: string) {
    const { userId } = await getRequiredSession();
    try {
        const buckets = await prisma.profitBucket.findMany({
            where: {
                userId,
                ...(teamId ? { teamId } : {}),
            },
            orderBy: {
                percentage: "desc",
            },
        });
        return buckets;
    } catch (error) {
        console.error("Failed to fetch profit buckets:", error);
        return [];
    }
}

export async function createProfitBucket(data: ProfitBucketFormValues) {
    const { userId } = await getRequiredSession();
    try {
        // Basic validation: ensure total percentage doesn't exceed 100%
        const existingBuckets = await getProfitBuckets(data.teamId);
        const totalPercentage = existingBuckets.reduce((sum: number, b: any) => sum + b.percentage, 0);

        if (totalPercentage + data.percentage > 100) {
            return {
                success: false,
                message: "Total allocation cannot exceed 100%"
            };
        }

        const bucket = await prisma.profitBucket.create({
            data: {
                ...data,
                userId,
            },
        });

        await logAuditEvent({
            action: "CREATE",
            resource: "ProfitBucket",
            resourceId: bucket.id,
            userId,
        });

        revalidatePath("/budget");
        return { success: true, data: bucket };
    } catch (error) {
        console.error("Failed to create profit bucket:", error);
        return { success: false, message: "Failed to create profit bucket" };
    }
}

export async function updateProfitBucket(id: string, data: Partial<ProfitBucketFormValues>) {
    const { userId } = await getRequiredSession();
    try {
        if (data.percentage !== undefined) {
            const existingBuckets = await getProfitBuckets(data.teamId);
            const otherBuckets = existingBuckets.filter((b: any) => b.id !== id);
            const totalOther = otherBuckets.reduce((sum: number, b: any) => sum + b.percentage, 0);

            if (totalOther + data.percentage > 100) {
                return {
                    success: false,
                    message: "Total allocation cannot exceed 100%"
                };
            }
        }

        const bucket = await prisma.profitBucket.update({
            where: { id, userId },
            data,
        });

        await logAuditEvent({
            action: "UPDATE",
            resource: "ProfitBucket",
            resourceId: id,
            userId,
        });

        revalidatePath("/budget");
        return { success: true, data: bucket };
    } catch (error) {
        console.error("Failed to update profit bucket:", error);
        return { success: false, message: "Failed to update profit bucket" };
    }
}

export async function deleteProfitBucket(id: string) {
    const { userId } = await getRequiredSession();
    try {
        await prisma.profitBucket.delete({
            where: { id, userId },
        });

        await logAuditEvent({
            action: "DELETE",
            resource: "ProfitBucket",
            resourceId: id,
            userId,
        });

        revalidatePath("/budget");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete profit bucket:", error);
        return { success: false, message: "Failed to delete profit bucket" };
    }
}

export type ExpenseBudgetFormValues = {
    category: string;
    amount: number;
    teamId?: string;
};

export async function getExpenseBudgets(teamId?: string) {
    const { userId } = await getRequiredSession();
    try {
        const budgets = await prisma.expenseBudget.findMany({
            where: {
                userId,
                ...(teamId ? { teamId } : {}),
            },
        });
        return budgets;
    } catch (error) {
        console.error("Failed to fetch expense budgets:", error);
        return [];
    }
}

export async function upsertExpenseBudget(data: ExpenseBudgetFormValues) {
    const { userId } = await getRequiredSession();
    try {
        const budget = await prisma.expenseBudget.upsert({
            where: {
                userId_category_period: {
                    userId: userId,
                    category: data.category,
                    period: "MONTHLY",
                },
            },
            update: {
                amount: data.amount,
                teamId: data.teamId,
            },
            create: {
                userId,
                category: data.category,
                amount: data.amount,
                teamId: data.teamId,
                period: "MONTHLY",
            },
        });

        await logAuditEvent({
            action: "UPDATE",
            resource: "ExpenseBudget",
            resourceId: budget.id,
            userId,
        });

        revalidatePath("/budget");
        return { success: true, data: budget };
    } catch (error) {
        console.error("Failed to upsert expense budget:", error);
        return { success: false, message: "Failed to set expense budget" };
    }
}

export async function deleteExpenseBudget(id: string) {
    const { userId } = await getRequiredSession();
    try {
        await prisma.expenseBudget.delete({
            where: { id, userId },
        });

        await logAuditEvent({
            action: "DELETE",
            resource: "ExpenseBudget",
            resourceId: id,
            userId,
        });

        revalidatePath("/budget");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete expense budget:", error);
        return { success: false, message: "Failed to delete expense budget" };
    }
}

export async function getBudgetPerformance(teamId?: string) {
    const { userId } = await getRequiredSession();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    try {
        const [budgets, expenses] = await Promise.all([
            getExpenseBudgets(teamId),
            prisma.expense.findMany({
                where: {
                    userId,
                    ...(teamId ? { teamId } : {}),
                    date: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
            }),
        ]);

        const performance = budgets.map((budget: any) => {
            const actual = expenses
                .filter((e: any) => e.category === budget.category)
                .reduce((sum: number, e: any) => sum + e.amount, 0);

            return {
                id: budget.id,
                category: budget.category,
                budget: budget.amount,
                actual,
                remaining: budget.amount - actual,
                percentage: budget.amount > 0 ? (actual / budget.amount) * 100 : 0,
            };
        });

        return performance;
    } catch (error) {
        console.error("Failed to fetch budget performance:", error);
        return [];
    }
}
