"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { getNextSequenceNumber, calculateInvoiceTotals } from "@/lib/invoice-utils";

async function getRequiredSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return { userId: session.user.id, session };
}

const QuoteItemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Price must be positive"),
    taxRate: z.number().min(0).max(100).default(0),
});

const QuoteSchema = z.object({
    clientId: z.string().min(1, "Client is required"),
    projectId: z.string().optional(),
    date: z.date(),
    expiryDate: z.date(),
    items: z.array(QuoteItemSchema).min(1, "At least one item is required"),
});

export async function getQuotes() {
    const { userId } = await getRequiredSession();
    return await prisma.quote.findMany({
        where: { userId },
        include: {
            client: true,
            items: true,
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function createQuote(data: {
    clientId: string;
    projectId?: string;
    date: Date;
    expiryDate: Date;
    items: { description: string; quantity: number; unitPrice: number; taxRate?: number }[];
}) {
    const { userId } = await getRequiredSession();
    const validatedData = QuoteSchema.safeParse(data);

    if (!validatedData.success) {
        return {
            message: "Validation Error",
            errors: validatedData.error.flatten().fieldErrors,
        };
    }

    const { items: processedItems, subtotal, taxTotal, total } = calculateInvoiceTotals(validatedData.data.items);

    // Generate Quote Number
    const nextNumber = await getNextSequenceNumber(userId, "Q");

    try {
        const quote = await prisma.quote.create({
            data: {
                number: nextNumber,
                clientId: validatedData.data.clientId,
                userId,
                projectId: validatedData.data.projectId,
                date: validatedData.data.date,
                expiryDate: validatedData.data.expiryDate,
                subtotal: subtotal,
                taxTotal: taxTotal,
                total: total,
                items: {
                    create: processedItems.map((item) => ({
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

        await logAuditEvent({
            action: "CREATE",
            resource: "Quote",
            resourceId: quote.id,
            userId,
            metadata: { number: quote.number }
        });

        revalidatePath("/quotes");
        revalidatePath("/reports");
        revalidatePath("/");
        return { success: true, quoteId: quote.id };
    } catch (e) {
        console.error(e);
        return { message: "Database Error: Failed to create quote" };
    }
}

export async function getQuote(id: string) {
    const { userId } = await getRequiredSession();
    return await prisma.quote.findUnique({
        where: {
            id,
            userId,
        },
        include: {
            client: true,
            items: true,
        },
    });
}

export async function updateQuote(id: string, data: {
    clientId: string;
    projectId?: string;
    date: Date;
    expiryDate: Date;
    items: { description: string; quantity: number; unitPrice: number; taxRate?: number }[];
}) {
    const { userId } = await getRequiredSession();
    const validatedData = QuoteSchema.safeParse(data);

    if (!validatedData.success) {
        return {
            message: "Validation Error",
            errors: validatedData.error.flatten().fieldErrors,
        };
    }

    const { items: processedItems, subtotal, taxTotal, total } = calculateInvoiceTotals(validatedData.data.items);

    try {
        await prisma.$transaction(async (tx: any) => {
            const existing = await tx.quote.findUnique({
                where: { id, userId }
            });
            if (!existing) throw new Error("Quote not found or unauthorized");

            await tx.quote.update({
                where: { id, userId },
                data: {
                    clientId: validatedData.data.clientId,
                    projectId: validatedData.data.projectId,
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
                data: processedItems.map((item) => ({
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

        await logAuditEvent({
            action: "UPDATE",
            resource: "Quote",
            resourceId: id,
            userId
        });

        revalidatePath("/quotes");
        revalidatePath(`/quotes/${id}`);
        revalidatePath("/reports");
        revalidatePath("/");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { message: "Database Error: Failed to update quote" };
    }
}

export async function deleteQuote(id: string) {
    const { userId } = await getRequiredSession();
    try {
        await prisma.quote.delete({
            where: {
                id,
                userId,
            },
        });

        await logAuditEvent({
            action: "DELETE",
            resource: "Quote",
            resourceId: id,
            userId
        });

        revalidatePath("/quotes");
        return { success: true };
    } catch (e) {
        return { message: "Database Error: Failed to delete quote" };
    }
}
