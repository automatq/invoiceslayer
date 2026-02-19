"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { createNotification } from "./notifications";
import { logDealActivity } from "./deals";

async function getRequiredSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return { userId: session.user.id, userName: session.user.name || "Unknown" };
}

// Feature 1: Create Invoice from Deal
export async function createInvoiceFromDeal(dealId: string, data: {
    description?: string;
    dueDate?: Date;
    items?: { description: string; quantity: number; unitPrice: number; taxRate?: number }[];
}) {
    const { userId, userName } = await getRequiredSession();

    try {
        const deal = await prisma.deal.findFirst({
            where: { id: dealId, userId },
            include: { client: true, invoices: true },
        });

        if (!deal) return { success: false, message: "Deal not found" };

        // Generate Invoice Number
        const lastInvoice = await prisma.invoice.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        let nextNumber = "INV-001";
        if (lastInvoice?.number?.startsWith("INV-")) {
            const lastNum = parseInt(lastInvoice.number.split("-")[1], 10);
            if (!isNaN(lastNum)) {
                nextNumber = `INV-${String(lastNum + 1).padStart(3, "0")}`;
            }
        }

        // Use provided items or create default item from deal value
        const invoiceItems = data.items?.length ? data.items : [{
            description: data.description || deal.title,
            quantity: 1,
            unitPrice: deal.value,
            taxRate: 0,
        }];

        const subtotal = invoiceItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
        const taxTotal = invoiceItems.reduce((acc, item) => {
            const amount = item.quantity * item.unitPrice;
            return acc + (amount * ((item.taxRate || 0) / 100));
        }, 0);
        const total = subtotal + taxTotal;

        const invoice = await prisma.invoice.create({
            data: {
                number: nextNumber,
                clientId: deal.clientId,
                userId,
                dealId: deal.id,
                date: new Date(),
                dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: "DRAFT",
                subtotal,
                taxTotal,
                total,
                items: {
                    create: invoiceItems.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        amount: item.quantity * item.unitPrice,
                        taxRate: item.taxRate || 0,
                        taxAmount: item.quantity * item.unitPrice * ((item.taxRate || 0) / 100),
                    })),
                },
            },
            include: { client: true },
        });

        // Log activity
        await logDealActivity(dealId, "INVOICE_CREATED", `Invoice ${invoice.number} created from deal`, { invoiceId: invoice.id });

        // Create notification
        await createNotification({
            type: "SUCCESS",
            title: "Invoice Created from Deal",
            message: `Invoice ${invoice.number} created for ${deal.client.name}`,
            link: `/invoices/${invoice.id}`,
            userId,
        });

        await logAuditEvent({
            action: "CREATE",
            resource: "Invoice",
            resourceId: invoice.id,
            userId,
            metadata: { fromDeal: dealId },
        });

        revalidatePath("/pipeline");
        revalidatePath("/invoices");

        return { success: true, invoice };
    } catch (error: any) {
        console.error("Failed to create invoice from deal:", error);
        return { success: false, message: error.message };
    }
}

// Feature 2: Create Quote from Deal
export async function createQuoteFromDeal(dealId: string, data: {
    description?: string;
    validUntil?: Date;
    items?: { description: string; quantity: number; unitPrice: number; taxRate?: number }[];
}) {
    const { userId, userName } = await getRequiredSession();

    try {
        const deal = await prisma.deal.findFirst({
            where: { id: dealId, userId },
            include: { client: true },
        });

        if (!deal) return { success: false, message: "Deal not found" };

        // Generate Quote Number
        const lastQuote = await prisma.quote.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        let nextNumber = "Q-001";
        if (lastQuote?.number?.startsWith("Q-")) {
            const lastNum = parseInt(lastQuote.number.split("-")[1], 10);
            if (!isNaN(lastNum)) {
                nextNumber = `Q-${String(lastNum + 1).padStart(3, "0")}`;
            }
        }

        // Use provided items or create default item from deal value
        const quoteItems = data.items?.length ? data.items : [{
            description: data.description || deal.title,
            quantity: 1,
            unitPrice: deal.value,
            taxRate: 0,
        }];

        const subtotal = quoteItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
        const taxTotal = quoteItems.reduce((acc, item) => {
            const amount = item.quantity * item.unitPrice;
            return acc + (amount * ((item.taxRate || 0) / 100));
        }, 0);
        const total = subtotal + taxTotal;

        const quote = await prisma.quote.create({
            data: {
                number: nextNumber,
                clientId: deal.clientId,
                userId,
                dealId: deal.id,
                date: new Date(),
                expiryDate: data.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: "DRAFT",
                subtotal,
                taxTotal,
                total,
                items: {
                    create: quoteItems.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        amount: item.quantity * item.unitPrice,
                        taxRate: item.taxRate || 0,
                        taxAmount: item.quantity * item.unitPrice * ((item.taxRate || 0) / 100),
                    })),
                },
            },
            include: { client: true },
        });

        // Log activity
        await logDealActivity(dealId, "QUOTE_CREATED", `Quote ${quote.number} created from deal`, { quoteId: quote.id });

        // Create notification
        await createNotification({
            type: "SUCCESS",
            title: "Quote Created from Deal",
            message: `Quote ${quote.number} created for ${deal.client.name}`,
            link: `/quotes/${quote.id}`,
            userId,
        });

        await logAuditEvent({
            action: "CREATE",
            resource: "Quote",
            resourceId: quote.id,
            userId,
            metadata: { fromDeal: dealId },
        });

        revalidatePath("/pipeline");
        revalidatePath("/quotes");

        return { success: true, quote };
    } catch (error: any) {
        console.error("Failed to create quote from deal:", error);
        return { success: false, message: error.message };
    }
}

// Feature 3: Auto-create invoice when deal is won
export async function convertWonDealToInvoice(dealId: string) {
    const { userId } = await getRequiredSession();

    try {
        const deal = await prisma.deal.findFirst({
            where: { id: dealId, userId, status: "WON" },
            include: { client: true, invoices: true },
        });

        if (!deal) return { success: false, message: "Deal not found or not won" };

        // Check if invoice already exists
        if (deal.invoices.length > 0) {
            return { success: false, message: "Invoice already exists for this deal", invoices: deal.invoices };
        }

        const result = await createInvoiceFromDeal(dealId, {
            description: `${deal.title} - Project Completion`,
        });

        if (result.success) {
            await createNotification({
                type: "SUCCESS",
                title: "Deal Converted to Invoice",
                message: `Deal "${deal.title}" has been converted to invoice ${result.invoice?.number}`,
                link: `/invoices/${result.invoice?.id}`,
                userId,
            });
        }

        return result;
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// Feature 4: Sync invoice payment to deal
export async function syncInvoicePaymentToDeal(invoiceId: string) {
    const { userId } = await getRequiredSession();

    try {
        const invoice = await prisma.invoice.findFirst({
            where: { id: invoiceId, userId },
            include: { 
                deal: true, 
                payments: true 
            },
        });

        if (!invoice || !invoice.dealId) return { success: false, message: "Invoice or deal not found" };

        const totalPaid = invoice.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
        const isFullyPaid = totalPaid >= invoice.total;
        const isPartiallyPaid = totalPaid > 0 && totalPaid < invoice.total;

        // Get the pipeline stages to find appropriate stage
        const deal = await prisma.deal.findUnique({
            where: { id: invoice.dealId! },
            include: { pipeline: { include: { stages: true } } },
        });

        if (!deal) return { success: false, message: "Deal not found" };

        let newStageId = deal.stageId;
        let activityType = "NOTE";
        let activityDescription = "";

        if (isFullyPaid) {
            // Find "Paid" or "Completed" stage, or stay in Closed Won
            const paidStage = deal.pipeline.stages.find(s => 
                s.name.toLowerCase().includes("paid") || 
                s.name.toLowerCase().includes("completed")
            );
            if (paidStage) newStageId = paidStage.id;
            activityType = "PAYMENT_RECEIVED";
            activityDescription = `Full payment received! Invoice ${invoice.number} is now PAID`;
        } else if (isPartiallyPaid) {
            activityType = "PARTIAL_PAYMENT";
            activityDescription = `Partial payment received: $${totalPaid.toFixed(2)} of $${invoice.total.toFixed(2)}`;
        }

        // Update deal stage if changed
        if (newStageId !== deal.stageId) {
            await prisma.deal.update({
                where: { id: deal.id },
                data: { stageId: newStageId },
            });
        }

        // Log activity
        await logDealActivity(deal.id, activityType, activityDescription, { 
            invoiceId, 
            amountPaid: totalPaid,
            total: invoice.total 
        });

        revalidatePath("/pipeline");
        return { success: true, isFullyPaid, isPartiallyPaid };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// Feature 5: Get deal with invoice status
export async function getDealWithInvoiceStatus(dealId: string) {
    const { userId } = await getRequiredSession();

    return await prisma.deal.findFirst({
        where: { id: dealId, userId },
        include: {
            client: true,
            stage: true,
            invoices: {
                include: { payments: true },
                orderBy: { createdAt: "desc" },
            },
            quotes: {
                orderBy: { createdAt: "desc" },
            },
            activities: {
                orderBy: { createdAt: "desc" },
                take: 10,
            },
        },
    });
}

// Get all deals with their invoice status for reporting
export async function getDealsWithRevenue() {
    const { userId } = await getRequiredSession();

    const deals = await prisma.deal.findMany({
        where: { userId },
        include: {
            client: true,
            stage: true,
            invoices: {
                include: { payments: true },
            },
            quotes: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return deals.map(deal => {
        const totalInvoiced = deal.invoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalPaid = deal.invoices.reduce((sum, inv) => 
            sum + inv.payments.reduce((pSum, p) => pSum + p.amount, 0), 0
        );
        const invoiceCount = deal.invoices.length;
        const hasUnpaidInvoices = deal.invoices.some(inv => {
            const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
            return paid < inv.total;
        });

        return {
            ...deal,
            totalInvoiced,
            totalPaid,
            invoiceCount,
            hasUnpaidInvoices,
            paymentStatus: totalPaid >= deal.value ? "PAID" : 
                          totalPaid > 0 ? "PARTIAL" : 
                          invoiceCount > 0 ? "INVOICED" : "PENDING",
        };
    });
}
