"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotification } from "@/app/actions/notifications";

export async function getInvoices() {
    return await prisma.invoice.findMany({
        include: {
            client: true,
            items: true,
            payments: true,
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getInvoice(id: string) {
    return await prisma.invoice.findUnique({
        where: { id },
        include: {
            client: true,
            items: true,
            payments: { orderBy: { date: "desc" } },
        },
    });
}

export async function convertQuoteToInvoice(quoteId: string) {
    const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { items: true },
    });

    if (!quote) {
        return { success: false, message: "Quote not found" };
    }

    // Generate Invoice Number
    const lastInvoice = await prisma.invoice.findFirst({
        orderBy: { createdAt: "desc" },
    });

    let nextNumber = "INV-001";
    if (lastInvoice && lastInvoice.number.startsWith("INV-")) {
        const lastNum = parseInt(lastInvoice.number.split("-")[1], 10);
        nextNumber = `INV-${String(lastNum + 1).padStart(3, "0")}`;
    }

    try {
        const result = await prisma.$transaction(async (tx: any) => {
            // Create Invoice
            const invoice = await tx.invoice.create({
                data: {
                    number: nextNumber,
                    clientId: quote.clientId,
                    date: new Date(),
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
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
                where: { id: quoteId },
                data: { status: "ACCEPTED" },
            });

            return { id: invoice.id, number: invoice.number };
        });

        // Trigger Notification
        await createNotification({
            type: "SUCCESS",
            title: "Quote Accepted",
            message: `Quote ${quote.number} was accepted and converted to Invoice ${result.number}`,
            link: `/invoices/${result.id}`,
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
    if (!VALID_STATUSES.includes(status as any)) {
        return { success: false, message: "Invalid status" };
    }

    try {
        await prisma.$transaction(async (tx: any) => {
            const invoice = await tx.invoice.findUnique({
                where: { id },
                select: { total: true, amountPaid: true, number: true }
            });

            if (!invoice) throw new Error("Invoice not found");

            // If marking as PAID and not fully paid, create a payment for the balance
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

                // Update amountPaid to total
                await tx.invoice.update({
                    where: { id },
                    data: {
                        status,
                        amountPaid: invoice.total
                    },
                });
            } else {
                // Just update status
                await tx.invoice.update({
                    where: { id },
                    data: { status },
                });
            }
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
    date: z.string().transform((str) => new Date(str)),
    dueDate: z.string().transform((str) => new Date(str)),
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
    date: string;
    dueDate: string;
    items: { description: string; quantity: number; unitPrice: number; taxRate?: number }[];
}) {
    const validatedData = InvoiceSchema.safeParse(data);

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

    // Generate Invoice Number
    const lastInvoice = await prisma.invoice.findFirst({
        orderBy: { createdAt: "desc" },
    });

    let nextNumber = "INV-001";
    if (lastInvoice && lastInvoice.number.startsWith("INV-")) {
        const lastNum = parseInt(lastInvoice.number.split("-")[1], 10);
        nextNumber = `INV-${String(lastNum + 1).padStart(3, "0")}`;
    }

    try {
        const invoice = await prisma.invoice.create({
            data: {
                number: nextNumber,
                clientId: validatedData.data.clientId,
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
                        amount: total, // Escrow the full amount for now
                        status: "PENDING"
                    }
                } : undefined,
            },
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
    try {
        await prisma.invoice.delete({
            where: { id },
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
    date: string;
    dueDate: string;
    items: { description: string; quantity: number; unitPrice: number; taxRate?: number }[];
}) {
    const validatedData = InvoiceSchema.safeParse(data);

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
        await prisma.$transaction(async (tx: any) => {
            // 1. Update Invoice basic details
            await tx.invoice.update({
                where: { id },
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

            // 2. Delete existing items
            await tx.invoiceItem.deleteMany({
                where: { invoiceId: id },
            });

            // 3. Create new items
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
