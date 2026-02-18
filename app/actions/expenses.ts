"use server";

import { prisma as db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

async function getSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session;
}

export type ExpenseFormValues = {
    description: string;
    amount: number;
    date: Date;
    category: string;
    receipt?: string;
    projectId?: string;
};

export async function createExpense(data: ExpenseFormValues) {
    const session = await getSession();
    try {
        const expense = await db.expense.create({
            data: {
                description: data.description,
                amount: data.amount,
                date: data.date,
                category: data.category,
                receipt: data.receipt,
                projectId: data.projectId,
                userId: session.user.id,
            },
        });

        await logAuditEvent({
            action: "CREATE",
            resource: "Expense",
            resourceId: expense.id,
            userId: session.user.id
        });

        revalidatePath("/expenses");
        revalidatePath("/reports");
        revalidatePath("/");
        return { success: true, data: expense };
    } catch (error) {
        console.error("Failed to create expense:", error);
        return { success: false, message: "Failed to create expense" };
    }
}

export async function getExpenses() {
    const session = await getSession();
    try {
        const expenses = await db.expense.findMany({
            where: { userId: session.user.id },
            orderBy: {
                date: "desc",
            },
            include: {
                project: true,
            }
        });
        return expenses;
    } catch (error) {
        console.error("Failed to fetch expenses:", error);
        return [];
    }
}

export async function deleteExpense(id: string) {
    const session = await getSession();
    try {
        await db.expense.delete({
            where: {
                id,
                userId: session.user.id,
            },
        });

        await logAuditEvent({
            action: "DELETE",
            resource: "Expense",
            resourceId: id,
            userId: session.user.id
        });

        revalidatePath("/expenses");
        revalidatePath("/reports");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete expense:", error);
        return { success: false, message: "Failed to delete expense" };
    }
}
