"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotification } from "@/app/actions/notifications";
import { auth } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

async function getSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session;
}

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
    const session = await getSession();
    const validatedData = PaymentSchema.safeParse(data);

    if (!validatedData.success) {
        return {
            success: false,
            message: "Validation Error",
            errors: validatedData.error.flatten().fieldErrors,
        };
    }

    const { invoiceId, amount, date, method, notes } = validatedData.data;
    const userId = session.user.id;

    try {
        const result = await prisma.$transaction(async (tx: any) => {
            const invoice = await tx.invoice.findUnique({
                where: { id: invoiceId, userId },
            });

            if (!invoice) throw new Error("Invoice not found or unauthorized");

            const payment = await tx.payment.create({
                data: {
                    invoiceId,
                    amount,
                    date,
                    method,
                    notes,
                },
            });

            const newAmountPaid = invoice.amountPaid + amount;
            let newStatus = invoice.status;

            if (newAmountPaid >= invoice.total) newStatus = "PAID";
            else if (newAmountPaid > 0) newStatus = "PARTIAL";

            await tx.invoice.update({
                where: { id: invoiceId, userId },
                data: {
                    amountPaid: newAmountPaid,
                    status: newStatus,
                },
            });

            return { payment, invoiceNumber: invoice.number };
        });

        await logAuditEvent({
            action: "CREATE",
            resource: "Payment",
            resourceId: result.payment.id,
            userId,
            metadata: { amount, invoiceId }
        });

        await createNotification({
            type: "SUCCESS",
            title: "Payment Received",
            message: `Payment of $${amount.toFixed(2)} received for invoice ${result.invoiceNumber}`,
            link: `/invoices/${invoiceId}`,
            userId,
        });

        revalidatePath(`/invoices/${invoiceId}`);
        revalidatePath("/invoices");
        revalidatePath("/reports");
        revalidatePath("/");
        return { success: true, paymentId: result.payment.id };
    } catch (e: any) {
        console.error(e);
        return { success: false, message: e.message || "Failed to record payment" };
    }
}

export async function getPayments(invoiceId: string) {
    const session = await getSession();
    return await prisma.payment.findMany({
        where: { invoiceId, invoice: { userId: session.user.id } },
        orderBy: { date: "desc" },
    });
}

export async function deletePayment(paymentId: string, invoiceId: string) {
    const session = await getSession();
    const userId = session.user.id;
    try {
        await prisma.$transaction(async (tx: any) => {
            const payment = await tx.payment.findUnique({
                where: { id: paymentId, invoice: { userId } },
            });

            if (!payment) throw new Error("Payment not found or unauthorized");

            await tx.payment.delete({ where: { id: paymentId } });

            const invoice = await tx.invoice.findUnique({
                where: { id: invoiceId, userId },
            });

            if (!invoice) throw new Error("Invoice not found");

            const newAmountPaid = Math.max(0, invoice.amountPaid - payment.amount);
            let newStatus = invoice.status;

            if (newAmountPaid >= invoice.total) newStatus = "PAID";
            else if (newAmountPaid > 0) newStatus = "PARTIAL";
            else newStatus = "SENT";

            await tx.invoice.update({
                where: { id: invoiceId, userId },
                data: {
                    amountPaid: newAmountPaid,
                    status: newStatus,
                },
            });
        });

        await logAuditEvent({
            action: "DELETE",
            resource: "Payment",
            resourceId: paymentId,
            userId,
            metadata: { invoiceId }
        });

        revalidatePath(`/invoices/${invoiceId}`);
        revalidatePath("/invoices");
        revalidatePath("/reports");
        revalidatePath("/");
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message || "Failed to delete payment" };
    }
}
