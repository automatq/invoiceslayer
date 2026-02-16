"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendInvoiceEmail } from "@/app/actions/email";
import { z } from "zod";
import { addWeeks, addMonths, addYears, parseISO } from "date-fns";
import { createNotification } from "@/app/actions/notifications";

const RecurringInvoiceSchema = z.object({
    clientId: z.string().min(1, "Client is required"),
    items: z.string().min(1, "Items are required"), // JSON string
    frequency: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
    nextRunDate: z.date(),
    isActive: z.boolean().default(true),
    notes: z.string().optional(),
});

export async function getRecurringInvoices() {
    return await prisma.recurringInvoice.findMany({
        include: {
            client: true,
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getRecurringInvoice(id: string) {
    return await prisma.recurringInvoice.findUnique({
        where: { id },
        include: {
            client: true,
        },
    });
}

export async function createRecurringInvoice(data: {
    clientId: string;
    items: { description: string; quantity: number; unitPrice: number; taxRate: number }[];
    frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
    nextRunDate: Date;
    notes?: string;
}) {
    try {
        const recurring = await prisma.recurringInvoice.create({
            data: {
                clientId: data.clientId,
                items: JSON.stringify(data.items),
                frequency: data.frequency,
                nextRunDate: data.nextRunDate,
                notes: data.notes,
            },
        });

        try {
            try {
                revalidatePath("/recurring");
            } catch (e) { }
        } catch (e) { }
        return { success: true, id: recurring.id };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to create recurring invoice" };
    }
}

export async function updateRecurringInvoice(id: string, data: {
    clientId: string;
    items: { description: string; quantity: number; unitPrice: number; taxRate: number }[];
    frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
    nextRunDate: Date;
    isActive: boolean;
    notes?: string;
}) {
    try {
        await prisma.recurringInvoice.update({
            where: { id },
            data: {
                clientId: data.clientId,
                items: JSON.stringify(data.items),
                frequency: data.frequency,
                nextRunDate: data.nextRunDate,
                isActive: data.isActive,
                notes: data.notes,
            },
        });

        try {
            try {
                revalidatePath("/recurring");
            } catch (e) { }
            revalidatePath(`/recurring/${id}`);
        } catch (e) { }
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to update recurring invoice" };
    }
}

export async function deleteRecurringInvoice(id: string) {
    try {
        await prisma.recurringInvoice.delete({
            where: { id },
        });
        try {
            revalidatePath("/recurring");
        } catch (e) { }
        return { success: true };
    } catch (e) {
        return { success: false, message: "Failed to delete recurring invoice" };
    }
}

export async function processRecurringInvoices() {
    const now = new Date();
    const dueRecurring = await prisma.recurringInvoice.findMany({
        where: {
            isActive: true,
            nextRunDate: { lte: now },
        },
    });

    let processedCount = 0;

    for (const recurring of dueRecurring) {
        try {
            const result = await prisma.$transaction(async (tx) => {
                // 1. Create Invoice
                const items = JSON.parse(recurring.items);
                const subtotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
                const taxTotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);
                const total = subtotal + taxTotal;

                // Generate Invoice Number
                const lastInvoice = await tx.invoice.findFirst({
                    orderBy: { createdAt: "desc" },
                });

                let nextNumber = "INV-001";
                if (lastInvoice && lastInvoice.number.startsWith("INV-")) {
                    const lastNum = parseInt(lastInvoice.number.split("-")[1], 10);
                    nextNumber = `INV-${String(lastNum + 1).padStart(3, "0")}`;
                }

                const newInvoice = await tx.invoice.create({
                    data: {
                        number: nextNumber,
                        clientId: recurring.clientId,
                        date: new Date(),
                        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
                        status: "SENT", // Set to SENT immediately as we will email it
                        subtotal,
                        taxTotal,
                        total,
                        notes: recurring.notes,
                        items: {
                            create: items.map((item: any) => ({
                                description: item.description,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                amount: item.quantity * item.unitPrice,
                                taxRate: item.taxRate,
                                taxAmount: item.quantity * item.unitPrice * (item.taxRate / 100),
                            })),
                        },
                    },
                });

                // 2. Calculate next run date
                let nextDate = new Date(recurring.nextRunDate);
                switch (recurring.frequency) {
                    case "WEEKLY":
                        nextDate = addWeeks(nextDate, 1);
                        break;
                    case "MONTHLY":
                        nextDate = addMonths(nextDate, 1);
                        break;
                    case "QUARTERLY":
                        nextDate = addMonths(nextDate, 3);
                        break;
                    case "YEARLY":
                        nextDate = addYears(nextDate, 1);
                        break;
                }

                // Update Recurring Record
                await tx.recurringInvoice.update({
                    where: { id: recurring.id },
                    data: { nextRunDate: nextDate },
                });

                return { id: newInvoice.id, number: newInvoice.number };
            });

            // Email the invoice
            if (result) {
                await sendInvoiceEmail(result.id);

                // Fetch client name for notification
                const client = await prisma.client.findUnique({
                    where: { id: recurring.clientId },
                    select: { name: true }
                });

                // Trigger Notification
                await createNotification({
                    type: "INFO",
                    title: "Recurring Invoice Generated",
                    message: `Invoice ${result.number} was automatically generated for ${client?.name || 'a client'}`,
                    link: `/invoices/${result.id}`,
                });
            }

            processedCount++;
        } catch (e) {
            console.error(`Failed to process recurring invoice ${recurring.id}:`, e);
        }
    }

    if (processedCount > 0) {
        try {
            revalidatePath("/invoices");
        } catch (e) {
            // Ignore revalidation error in script context
        }
    }

    return { processed: processedCount };
}
