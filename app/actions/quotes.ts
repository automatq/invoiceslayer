"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const QuoteItemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Price must be positive"),
    taxRate: z.number().min(0).max(100).default(0),
});

const QuoteSchema = z.object({
    clientId: z.string().min(1, "Client is required"),
    date: z.string().transform((str) => new Date(str)),
    expiryDate: z.string().transform((str) => new Date(str)),
    items: z.array(QuoteItemSchema),
});

export async function getQuotes() {
    return await prisma.quote.findMany({
        include: {
            client: true,
            items: true,
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function createQuote(data: {
    clientId: string;
    date: string;
    expiryDate: string;
    items: { description: string; quantity: number; unitPrice: number; taxRate?: number }[];
}) {
    const validatedData = QuoteSchema.safeParse(data);

    if (!validatedData.success) {
        return {
            message: "Validation Error",
            errors: validatedData.error.flatten().fieldErrors,
        };
    }

    // Calculate totals
    const items = validatedData.data.items.map(item => {
        const amount = item.quantity * item.unitPrice;
        const taxAmount = amount * (item.taxRate / 100);
        return { ...item, amount, taxAmount };
    });

    const subtotal = items.reduce((acc, item) => acc + item.amount, 0);
    const taxTotal = items.reduce((acc, item) => acc + item.taxAmount, 0);
    const total = subtotal + taxTotal;

    // Generate Quote Number
    const lastQuote = await prisma.quote.findFirst({
        orderBy: { createdAt: "desc" },
    });

    let nextNumber = "QUO-001";
    if (lastQuote && lastQuote.number.startsWith("QUO-")) {
        const lastNum = parseInt(lastQuote.number.split("-")[1], 10);
        nextNumber = `QUO-${String(lastNum + 1).padStart(3, "0")}`;
    }

    try {
        const quote = await prisma.quote.create({
            data: {
                number: nextNumber,
                clientId: validatedData.data.clientId,
                date: validatedData.data.date,
                expiryDate: validatedData.data.expiryDate,
                subtotal: subtotal,
                taxTotal: taxTotal,
                total: total,
                items: {
                    create: items.map((item) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        amount: item.amount,
                        taxRate: item.taxRate,
                        taxAmount: item.taxAmount,
                    })),
                },
            },
        });

        revalidatePath("/quotes");
        return { success: true, quoteId: quote.id };
    } catch (e) {
        console.error(e);
        return { message: "Database Error: Failed to create quote" };
    }
}

export async function getQuote(id: string) {
    return await prisma.quote.findUnique({
        where: { id },
        include: {
            client: true,
            items: true,
        },
    });
}

export async function updateQuote(id: string, data: {
    clientId: string;
    date: string;
    expiryDate: string;
    items: { description: string; quantity: number; unitPrice: number; taxRate?: number }[];
}) {
    const validatedData = QuoteSchema.safeParse(data);

    if (!validatedData.success) {
        return {
            message: "Validation Error",
            errors: validatedData.error.flatten().fieldErrors,
        };
    }

    // Calculate totals
    const items = validatedData.data.items.map(item => {
        const amount = item.quantity * item.unitPrice;
        const taxAmount = amount * (item.taxRate / 100);
        return { ...item, amount, taxAmount };
    });

    const subtotal = items.reduce((acc, item) => acc + item.amount, 0);
    const taxTotal = items.reduce((acc, item) => acc + item.taxAmount, 0);
    const total = subtotal + taxTotal;

    try {
        await prisma.$transaction(async (tx) => {
            await tx.quote.update({
                where: { id },
                data: {
                    clientId: validatedData.data.clientId,
                    date: validatedData.data.date,
                    expiryDate: validatedData.data.expiryDate,
                    subtotal: subtotal,
                    taxTotal: taxTotal,
                    total: total,
                },
            });

            await tx.quoteItem.deleteMany({
                where: { quoteId: id },
            });

            await tx.quoteItem.createMany({
                data: items.map((item) => ({
                    quoteId: id,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    amount: item.amount,
                    taxRate: item.taxRate,
                    taxAmount: item.taxAmount,
                })),
            });
        });

        revalidatePath("/quotes");
        revalidatePath(`/quotes/${id}`);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { message: "Database Error: Failed to update quote" };
    }
}

export async function deleteQuote(id: string) {
    try {
        await prisma.quote.delete({
            where: { id },
        });
        revalidatePath("/quotes");
        return { success: true };
    } catch (e) {
        return { message: "Database Error: Failed to delete quote" };
    }
}
