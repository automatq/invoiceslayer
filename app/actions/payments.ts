"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const PaymentSchema = z.object({
    invoiceId: z.string().min(1, "Invoice ID is required"),
    amount: z.number().min(0.01, "Amount must be positive"),
    date: z.date(),
    method: z.string().min(1, "Payment method is required"),
    notes: z.string().optional(),
});

export async function recordPayment(data: {
    invoiceId: string;
    amount: number;
    date: Date;
    method: string;
    notes?: string;
}) {
    const validatedData = PaymentSchema.safeParse(data);

    if (!validatedData.success) {
        return {
            success: false,
            message: "Validation Error",
            errors: validatedData.error.flatten().fieldErrors,
        };
    }

    const { invoiceId, amount, date, method, notes } = validatedData.data;

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Payment record
            const payment = await tx.payment.create({
                data: {
                    invoiceId,
                    amount,
                    date,
                    method,
                    notes,
                },
            });

            // 2. Update Invoice amountPaid and Status
            const invoice = await tx.invoice.findUnique({
                where: { id: invoiceId },
            });

            if (!invoice) {
                throw new Error("Invoice not found");
            }

            const newAmountPaid = invoice.amountPaid + amount;
            let newStatus = invoice.status;

            if (newAmountPaid >= invoice.total) {
                newStatus = "PAID";
            } else if (newAmountPaid > 0) {
                newStatus = "PARTIAL"; // We need to make sure this is a valid status in our system
            }

            await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    amountPaid: newAmountPaid,
                    status: newStatus,
                },
            });

            return payment;
        });

        revalidatePath(`/invoices/${invoiceId}`);
        revalidatePath("/invoices");
        return { success: true, paymentId: result.id };
    } catch (e: any) {
        console.error(e);
        return { success: false, message: e.message || "Failed to record payment" };
    }
}

export async function getPayments(invoiceId: string) {
    return await prisma.payment.findMany({
        where: { invoiceId },
        orderBy: { date: "desc" },
    });
}

export async function deletePayment(paymentId: string, invoiceId: string) {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Get payment to know amount
            const payment = await tx.payment.findUnique({
                where: { id: paymentId },
            });

            if (!payment) {
                throw new Error("Payment not found");
            }

            // 2. Delete payment
            await tx.payment.delete({
                where: { id: paymentId },
            });

            // 3. Update Invoice amountPaid
            const invoice = await tx.invoice.findUnique({
                where: { id: invoiceId },
            });

            if (!invoice) {
                throw new Error("Invoice not found");
            }

            const newAmountPaid = Math.max(0, invoice.amountPaid - payment.amount);
            let newStatus = invoice.status;

            if (newAmountPaid >= invoice.total) {
                newStatus = "PAID";
            } else if (newAmountPaid > 0) {
                newStatus = "PARTIAL";
            } else {
                newStatus = "SENT"; // Revert to SENT if no payments left (or DRAFT if it was never sent? assume SENT for simplicity)
                // Ideally check if createdAt == updatedAt or something but SENT is safer than DRAFT for an active invoice
            }

            await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    amountPaid: newAmountPaid,
                    status: newStatus,
                },
            });
        });

        revalidatePath(`/invoices/${invoiceId}`);
        revalidatePath("/invoices");
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message || "Failed to delete payment" };
    }
}
