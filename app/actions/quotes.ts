"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

async function getSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session;
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
    const session = await getSession();
    return await prisma.quote.findMany({
        where: { userId: session.user.id },
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
    const session = await getSession();
    const validatedData = QuoteSchema.safeParse(data);

    if (!validatedData.success) {
        return {
            message: "Validation Error",
            errors: validatedData.error.flatten().fieldErrors,
        };
    }

    const items = validatedData.data.items.map(item => {
        const amount = item.quantity * item.unitPrice;
        const taxAmount = amount * (item.taxRate / 100);
        return { ...item, amount, taxAmount };
    });

    const subtotal = items.reduce((acc, item) => acc + item.amount, 0);
    const taxTotal = items.reduce((acc, item) => acc + item.taxAmount, 0);
    const total = subtotal + taxTotal;

    const lastQuote = await prisma.quote.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });

    let nextNumber = "QUO-001";
    if (lastQuote && lastQuote.number.startsWith("QUO-")) {
        const lastNumSplit = lastQuote.number.split("-")[1];
        if (lastNumSplit) {
            const lastNumNum = parseInt(lastNumSplit, 10);
            if (!isNaN(lastNumNum)) {
                nextNumber = `QUO-${String(lastNumNum + 1).padStart(3, "0")}`;
            }
        }
    }

    try {
        const quote = await prisma.quote.create({
            data: {
                number: nextNumber,
                clientId: validatedData.data.clientId,
                userId: session.user.id,
                projectId: validatedData.data.projectId,
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

        await logAuditEvent({
            action: "CREATE",
            resource: "Quote",
            resourceId: quote.id,
            userId: session.user.id,
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
    const session = await getSession();
    return await prisma.quote.findUnique({
        where: {
            id,
            userId: session.user.id,
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
    const session = await getSession();
    const validatedData = QuoteSchema.safeParse(data);

    if (!validatedData.success) {
        return {
            message: "Validation Error",
            errors: validatedData.error.flatten().fieldErrors,
        };
    }

    const items = validatedData.data.items.map(item => {
        const amount = item.quantity * item.unitPrice;
        const taxAmount = amount * (item.taxRate / 100);
        return { ...item, amount, taxAmount };
    });

    const subtotal = items.reduce((acc, item) => acc + item.amount, 0);
    const taxTotal = items.reduce((acc, item) => acc + item.taxAmount, 0);
    const total = subtotal + taxTotal;

    try {
        await prisma.$transaction(async (tx: any) => {
            const existing = await tx.quote.findUnique({
                where: { id, userId: session.user.id }
            });
            if (!existing) throw new Error("Quote not found or unauthorized");

            await tx.quote.update({
                where: { id, userId: session.user.id },
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

        await logAuditEvent({
            action: "UPDATE",
            resource: "Quote",
            resourceId: id,
            userId: session.user.id
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
    const session = await getSession();
    try {
        await prisma.quote.delete({
            where: {
                id,
                userId: session.user.id,
            },
        });

        await logAuditEvent({
            action: "DELETE",
            resource: "Quote",
            resourceId: id,
            userId: session.user.id
        });

        revalidatePath("/quotes");
        return { success: true };
    } catch (e) {
        return { message: "Database Error: Failed to delete quote" };
    }
}
