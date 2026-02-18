"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendInvoiceEmail } from "@/app/actions/email";
import { z } from "zod";
import { addWeeks, addMonths, addYears } from "date-fns";
import { createNotification } from "@/app/actions/notifications";
import { auth } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

async function getRequiredSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return { userId: session.user.id, session };
}

const RecurringInvoiceSchema = z.object({
    clientId: z.string().min(1, "Client is required"),
    items: z.string().min(1, "Items are required"),
    frequency: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
    nextRunDate: z.date(),
    maxOccurrences: z.number().int().min(1).nullable().optional(),
    currentOccurrence: z.number().int().min(0).optional(),
    isActive: z.boolean().default(true),
    notes: z.string().optional(),
});

export async function getRecurringInvoices() {
    const { userId } = await getRequiredSession();
    return await prisma.recurringInvoice.findMany({
        where: { userId },
        include: {
            client: true,
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getRecurringInvoice(id: string) {
    const { userId } = await getRequiredSession();
    return await prisma.recurringInvoice.findUnique({
        where: { id, userId },
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
    maxOccurrences?: number | null;
    notes?: string;
}) {
    const { userId } = await getRequiredSession();
    try {
        const recurring = await prisma.recurringInvoice.create({
            data: {
                clientId: data.clientId,
                userId,
                items: JSON.stringify(data.items),
                frequency: data.frequency,
                nextRunDate: data.nextRunDate,
                maxOccurrences: data.maxOccurrences,
                notes: data.notes,
            },
        });

        await logAuditEvent({
            action: "CREATE",
            resource: "RecurringInvoice",
            resourceId: recurring.id,
            userId
        });

        revalidatePath("/recurring");
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
    maxOccurrences?: number | null;
    isActive: boolean;
    notes?: string;
}) {
    const { userId } = await getRequiredSession();
    try {
        await prisma.recurringInvoice.update({
            where: { id, userId },
            data: {
                clientId: data.clientId,
                items: JSON.stringify(data.items),
                frequency: data.frequency,
                nextRunDate: data.nextRunDate,
                maxOccurrences: data.maxOccurrences,
                isActive: data.isActive,
                notes: data.notes,
            },
        });

        await logAuditEvent({
            action: "UPDATE",
            resource: "RecurringInvoice",
            resourceId: id,
            userId
        });

        revalidatePath("/recurring");
        revalidatePath(`/recurring/${id}`);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to update recurring invoice" };
    }
}

export async function deleteRecurringInvoice(id: string) {
    const { userId } = await getRequiredSession();
    try {
        await prisma.recurringInvoice.delete({
            where: { id, userId },
        });

        await logAuditEvent({
            action: "DELETE",
            resource: "RecurringInvoice",
            resourceId: id,
            userId
        });

        revalidatePath("/recurring");
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
            const result = await prisma.$transaction(async (tx: any) => {
                const items = JSON.parse(recurring.items);
                const subtotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
                const taxTotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);
                const total = subtotal + taxTotal;

                // Per-user numbering
                const lastInvoice = await tx.invoice.findFirst({
                    where: { userId: recurring.userId },
                    orderBy: { createdAt: "desc" },
                });

                let nextNumber = "INV-001";
                if (lastInvoice && lastInvoice.number.startsWith("INV-")) {
                    const lastNumSplit = lastInvoice.number.split("-")[1];
                    if (lastNumSplit) {
                        const lastNumNum = parseInt(lastNumSplit, 10);
                        if (!isNaN(lastNumNum)) {
                            nextNumber = `INV-${String(lastNumNum + 1).padStart(3, "0")}`;
                        }
                    }
                }

                const newInvoice = await tx.invoice.create({
                    data: {
                        number: nextNumber,
                        clientId: recurring.clientId,
                        userId: recurring.userId,
                        date: new Date(),
                        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        status: "SENT",
                        subtotal,
                        taxTotal,
                        total,
                        notes: recurring.notes,
                        items: {
                            create: items.map((item: any) => {
                                let description = item.description;
                                if (recurring.maxOccurrences) {
                                    description += ` (Installment ${recurring.currentOccurrence + 1} of ${recurring.maxOccurrences})`;
                                }
                                return {
                                    description,
                                    quantity: item.quantity,
                                    unitPrice: item.unitPrice,
                                    amount: item.quantity * item.unitPrice,
                                    taxRate: item.taxRate,
                                    taxAmount: item.quantity * item.unitPrice * (item.taxRate / 100),
                                };
                            }),
                        },
                    },
                });

                let nextDate = new Date(recurring.nextRunDate);
                switch (recurring.frequency) {
                    case "WEEKLY": nextDate = addWeeks(nextDate, 1); break;
                    case "MONTHLY": nextDate = addMonths(nextDate, 1); break;
                    case "QUARTERLY": nextDate = addMonths(nextDate, 3); break;
                    case "YEARLY": nextDate = addYears(nextDate, 1); break;
                }

                const isFinished = recurring.maxOccurrences && (recurring.currentOccurrence + 1 >= recurring.maxOccurrences);

                await tx.recurringInvoice.update({
                    where: { id: recurring.id },
                    data: {
                        nextRunDate: nextDate,
                        currentOccurrence: { increment: 1 },
                        isActive: isFinished ? false : recurring.isActive
                    },
                });

                return { id: newInvoice.id, number: newInvoice.number };
            });

            if (result) {
                await sendInvoiceEmail(result.id);

                const client = await prisma.client.findUnique({
                    where: { id: recurring.clientId },
                    select: { name: true }
                });

                await createNotification({
                    type: "INFO",
                    title: "Recurring Invoice Generated",
                    message: `Invoice ${result.number} was automatically generated for ${client?.name || 'a client'}`,
                    link: `/invoices/${result.id}`,
                    userId: recurring.userId
                });

                await logAuditEvent({
                    action: "CREATE",
                    resource: "Invoice",
                    resourceId: result.id,
                    userId: recurring.userId,
                    metadata: { type: "RECURRING_GENERATED", recurringId: recurring.id }
                });
            }

            processedCount++;
        } catch (e) {
            console.error(`Failed to process recurring invoice ${recurring.id}:`, e);
        }
    }

    if (processedCount > 0) {
        revalidatePath("/invoices");
    }

    return { processed: processedCount };
}
