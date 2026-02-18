"use server";

import { prisma } from "@/lib/prisma";
import { sendInvoiceEmail } from "@/app/actions/email";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/app/actions/notifications";
import { logAuditEvent } from "@/lib/audit";

export async function checkAndSendReminders() {
    try {
        const now = new Date();

        // Find overdue invoices (not yet marked as OVERDUE)
        const overdueInvoices = await prisma.invoice.findMany({
            where: {
                dueDate: { lt: now },
                status: {
                    in: ["SENT", "PARTIAL", "DRAFT"],
                },
            },
            include: {
                client: true,
            },
        });

        let updatedCount = 0;
        let emailedCount = 0;

        for (const invoice of overdueInvoices) {
            const userId = invoice.userId;

            // Update status to OVERDUE
            await prisma.invoice.update({
                where: { id: invoice.id, userId },
                data: { status: "OVERDUE" },
            });
            updatedCount++;

            // Send reminder email if not draft
            if (invoice.client.email && invoice.status !== "DRAFT") {
                await sendInvoiceEmail(invoice.id, `Reminder: Invoice ${invoice.number} is Overdue`);
                emailedCount++;
            }

            // Trigger Notification
            await createNotification({
                type: "WARNING",
                title: "Invoice Overdue",
                message: `Invoice ${invoice.number} for ${invoice.client.name} is now overdue.`,
                link: `/invoices/${invoice.id}`,
                userId,
            });

            await logAuditEvent({
                action: "UPDATE",
                resource: "Invoice",
                resourceId: invoice.id,
                userId,
                actor: "system-reminders",
                metadata: { status: "OVERDUE" }
            });
        }

        if (updatedCount > 0) {
            revalidatePath("/invoices");
        }

        return { success: true, updated: updatedCount, emailed: emailedCount };
    } catch (error) {
        console.error("Failed to check reminders:", error);
        return { success: false, error: "Internal Server Error" };
    }
}
