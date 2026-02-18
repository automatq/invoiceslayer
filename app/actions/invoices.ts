"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotification } from "@/app/actions/notifications";
import { logAuditEvent } from "@/lib/audit";
import { auth } from "@/lib/auth";

async function getRequiredSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return { userId: session.user.id, session };
}

export async function getInvoices() {
    const { userId } = await getRequiredSession();
    return await prisma.invoice.findMany({
        where: { userId },
        include: {
            client: true,
            items: true,
            payments: true,
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getInvoice(id: string) {
    const { userId } = await getRequiredSession();
    return await prisma.invoice.findUnique({
        where: {
            id,
            userId,
        },
        include: {
            client: true,
            items: true,
            payments: { orderBy: { date: "desc" } },
        },
    });
}

export async function convertQuoteToInvoice(quoteId: string) {
    const { userId } = await getRequiredSession();
    const quote = await prisma.quote.findUnique({
        where: {
            id: quoteId,
            userId,
        },
        include: { items: true },
    });

    if (!quote) {
        return { success: false, message: "Quote not found" };
    }

    // Generate Invoice Number (per user)
    const lastInvoice = await prisma.invoice.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });

    let nextNumber = "INV-001";
    if (lastInvoice && lastInvoice.number.startsWith("INV-")) {
        const lastNumNum = parseInt(lastInvoice.number.split("-")[1], 10);
        if (!isNaN(lastNumNum)) {
            nextNumber = `INV-${String(lastNumNum + 1).padStart(3, "0")}`;
        }
    }

    try {
        const result = await prisma.$transaction(async (tx: any) => {
            // Create Invoice
            const invoice = await tx.invoice.create({
                data: {
                    number: nextNumber,
                    clientId: quote.clientId,
                    userId,
                    date: new Date(),
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    status: "DRAFT",
                    total: quote.total,
                    subtotal: quote.subtotal,
                    taxTotal: quote.taxTotal,
                    items: {
                        create: quote.items.map((item: any) => ({
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

            // Update Quote status
            await tx.quote.update({
                where: { id: quoteId, userId },
                data: { status: "ACCEPTED" },
            });

            return { id: invoice.id, number: invoice.number };
        });

        await logAuditEvent({
            action: "CREATE",
            resource: "Invoice",
            resourceId: result.id,
            userId,
            metadata: { convertedFrom: quoteId }
        });

        await createNotification({
            type: "SUCCESS",
            title: "Quote Accepted",
            message: `Quote ${quote.number} was accepted and converted to Invoice ${result.number}`,
            link: `/invoices/${result.id}`,
            userId
        });

        revalidatePath("/invoices");
        revalidatePath("/quotes");
        return { success: true, invoiceId: result.id };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to convert quote" };
    }
}

const VALID_STATUSES = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED", "PARTIAL"] as const;

export async function updateInvoiceStatus(id: string, status: string) {
    const { userId } = await getRequiredSession();
    if (!VALID_STATUSES.includes(status as any)) {
        return { success: false, message: "Invalid status" };
    }

    try {
        await prisma.$transaction(async (tx: any) => {
            const invoice = await tx.invoice.findUnique({
                where: { id, userId },
                select: { total: true, amountPaid: true, number: true }
            });

            if (!invoice) throw new Error("Invoice not found");

            if (status === "PAID" && invoice.amountPaid < invoice.total) {
                const balance = invoice.total - invoice.amountPaid;
                await tx.payment.create({
                    data: {
                        invoiceId: id,
                        amount: balance,
                        date: new Date(),
                        method: "MANUAL",
                        notes: "Auto-generated via 'Mark as Paid'",
                    }
                });

                await tx.invoice.update({
                    where: { id, userId },
                    data: {
                        status,
                        amountPaid: invoice.total
                    },
                });
            } else {
                await tx.invoice.update({
                    where: { id, userId },
                    data: { status },
                });
            }
        });

        await logAuditEvent({
            action: "UPDATE",
            resource: "Invoice",
            resourceId: id,
            userId,
            metadata: { status }
        });

        revalidatePath(`/invoices/${id}`);
        revalidatePath("/invoices");
        revalidatePath("/");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to update status" };
    }
}

const InvoiceItemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Price must be positive"),
    taxRate: z.number().min(0).max(100).default(0),
});

const InvoiceSchema = z.object({
    clientId: z.string().min(1, "Client is required"),
    projectId: z.string().optional(),
    date: z.date(),
    dueDate: z.date(),
    items: z.array(InvoiceItemSchema),
    escrow: z.object({
        platform: z.string(),
        resourceId: z.string(),
        condition: z.string(),
    }).optional(),
});

export async function createInvoice(data: {
    clientId: string;
    projectId?: string;
    date: Date;
    dueDate: Date;
    items: { description: string; quantity: number; unitPrice: number; taxRate?: number }[];
}) {
    const { userId } = await getRequiredSession();
    const validatedData = InvoiceSchema.safeParse(data);

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

    const lastInvoice = await prisma.invoice.findFirst({
        where: { userId },
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

    try {
        const invoice = await prisma.invoice.create({
            data: {
                number: nextNumber,
                clientId: validatedData.data.clientId,
                userId,
                projectId: validatedData.data.projectId,
                date: validatedData.data.date,
                dueDate: validatedData.data.dueDate,
                status: "DRAFT",
                total: total,
                subtotal: subtotal,
                taxTotal: taxTotal,
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
                escrowContract: validatedData.data.escrow ? {
                    create: {
                        platform: validatedData.data.escrow.platform,
                        resourceId: validatedData.data.escrow.resourceId,
                        condition: validatedData.data.escrow.condition,
                        amount: total,
                        status: "PENDING"
                    }
                } : undefined,
            },
        });

        await logAuditEvent({
            action: "CREATE",
            resource: "Invoice",
            resourceId: invoice.id,
            userId,
            metadata: { number: invoice.number }
        });

        revalidatePath("/invoices");
        revalidatePath("/reports");
        revalidatePath("/");
        return { success: true, invoiceId: invoice.id };
    } catch (e) {
        console.error(e);
        return { message: "Database Error: Failed to create invoice" };
    }
}

export async function deleteInvoice(id: string) {
    const { userId } = await getRequiredSession();
    try {
        await prisma.invoice.delete({
            where: {
                id,
                userId,
            },
        });

        await logAuditEvent({
            action: "DELETE",
            resource: "Invoice",
            resourceId: id,
            userId
        });

        revalidatePath("/invoices");
        return { success: true };
    } catch (e) {
        return { message: "Database Error: Failed to delete invoice" };
    }
}

export async function updateInvoice(id: string, data: {
    clientId: string;
    projectId?: string;
    date: Date;
    dueDate: Date;
    items: { description: string; quantity: number; unitPrice: number; taxRate?: number }[];
}) {
    const { userId } = await getRequiredSession();
    const validatedData = InvoiceSchema.safeParse(data);

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
            const existing = await tx.invoice.findUnique({
                where: { id, userId }
            });
            if (!existing) throw new Error("Invoice not found or unauthorized");

            await tx.invoice.update({
                where: { id, userId },
                data: {
                    clientId: validatedData.data.clientId,
                    projectId: validatedData.data.projectId,
                    date: validatedData.data.date,
                    dueDate: validatedData.data.dueDate,
                    total: total,
                    subtotal: subtotal,
                    taxTotal: taxTotal,
                },
            });

            await tx.invoiceItem.deleteMany({
                where: { invoiceId: id },
            });

            await tx.invoiceItem.createMany({
                data: items.map((item) => ({
                    invoiceId: id,
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
            resource: "Invoice",
            resourceId: id,
            userId
        });

        revalidatePath("/invoices");
        revalidatePath(`/invoices/${id}`);
        revalidatePath("/reports");
        revalidatePath("/");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { message: "Database Error: Failed to update invoice" };
    }
}
