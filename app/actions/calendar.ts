"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export type CalendarEvent = {
    id: string;
    title: string;
    date: Date;
    type: "INVOICE" | "QUOTE" | "RECURRING" | "PAYMENT" | "EXPENSE" | "DEAL";
    amount?: number;
    status?: string;
};

export async function getCalendarEvents(date: Date): Promise<CalendarEvent[]> {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];
        const userId = session.user.id;

        const [invoices, quotes, recurring, payments, expenses, deals] = await Promise.all([
            prisma.invoice.findMany({
                where: { userId },
                select: { id: true, number: true, dueDate: true, total: true, status: true, client: { select: { name: true } } },
            }),
            prisma.quote.findMany({
                where: { userId },
                select: { id: true, number: true, expiryDate: true, total: true, status: true, client: { select: { name: true } } },
            }),
            prisma.recurringInvoice.findMany({
                where: { userId, isActive: true },
                select: { id: true, nextRunDate: true, frequency: true, client: { select: { name: true } } },
            }),
            prisma.payment.findMany({
                where: { invoice: { userId } },
                select: { id: true, amount: true, date: true, invoice: { select: { number: true, client: { select: { name: true } } } } },
            }),
            prisma.expense.findMany({
                where: { userId },
                select: { id: true, description: true, amount: true, date: true, category: true },
            }),
            prisma.deal.findMany({
                where: { userId, expectedClose: { not: null } },
                select: { id: true, title: true, expectedClose: true, value: true, status: true },
            }),
        ]);

        const events: CalendarEvent[] = [];

        invoices.forEach((inv: any) => {
            if (inv.status !== "PAID" && inv.status !== "CANCELLED") {
                events.push({
                    id: inv.id,
                    title: `Due: ${inv.number} (${inv.client.name})`,
                    date: inv.dueDate,
                    type: "INVOICE",
                    amount: inv.total,
                    status: inv.status
                });
            }
        });

        quotes.forEach((quote: any) => {
            if (quote.status === "DRAFT" || quote.status === "SENT") {
                events.push({
                    id: quote.id,
                    title: `Exp: ${quote.number} (${quote.client.name})`,
                    date: quote.expiryDate,
                    type: "QUOTE",
                    amount: quote.total,
                    status: quote.status
                });
            }
        });

        recurring.forEach((rec: any) => {
            events.push({
                id: rec.id,
                title: `Run: ${rec.frequency} (${rec.client.name})`,
                date: rec.nextRunDate,
                type: "RECURRING",
            });
        });

        payments.forEach((pay: any) => {
            events.push({
                id: pay.id,
                title: `Pay: ${pay.invoice.number}`,
                date: pay.date,
                type: "PAYMENT",
                amount: pay.amount
            });
        });

        expenses.forEach((exp: any) => {
            events.push({
                id: exp.id,
                title: `${exp.description}`,
                date: exp.date,
                type: "EXPENSE",
                amount: exp.amount
            });
        });

        deals.forEach((deal: any) => {
            events.push({
                id: deal.id,
                title: `Deal: ${deal.title}`,
                date: deal.expectedClose,
                type: "DEAL",
                amount: deal.value,
                status: deal.status
            });
        });

        return events;

    } catch (error) {
        console.error("Failed to fetch calendar events:", error);
        return [];
    }
}
