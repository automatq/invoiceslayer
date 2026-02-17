"use server";

import { prisma as db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ExpenseFormValues = {
    description: string;
    amount: number;
    date: Date;
    category: string;
    receipt?: string;
    projectId?: string;
};

export async function createExpense(data: ExpenseFormValues) {
    try {
        const expense = await db.expense.create({
            data: {
                description: data.description,
                amount: data.amount,
                date: data.date,
                category: data.category,
                receipt: data.receipt,
                projectId: data.projectId,
            },
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
    try {
        const expenses = await db.expense.findMany({
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
    try {
        await db.expense.delete({
            where: { id },
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
