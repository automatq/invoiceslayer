"use server";

import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

export type CalendarEvent = {
    id: string;
    title: string;
    date: Date;
    type: "INVOICE" | "QUOTE" | "RECURRING" | "PAYMENT" | "EXPENSE";
    amount?: number;
    status?: string;
};

export async function getCalendarEvents(date: Date): Promise<CalendarEvent[]> {
    try {
        const [invoices, quotes, recurring, payments, expenses] = await Promise.all([
            prisma.invoice.findMany({
                select: { id: true, number: true, dueDate: true, total: true, status: true, client: { select: { name: true } } },
            }),
            prisma.quote.findMany({
                select: { id: true, number: true, expiryDate: true, total: true, status: true, client: { select: { name: true } } },
            }),
            prisma.recurringInvoice.findMany({
                where: { isActive: true },
                select: { id: true, nextRunDate: true, frequency: true, client: { select: { name: true } } },
            }),
            prisma.payment.findMany({
                select: { id: true, amount: true, date: true, invoice: { select: { number: true, client: { select: { name: true } } } } },
            }),
            prisma.expense.findMany({
                select: { id: true, description: true, amount: true, date: true, category: true },
            }),
        ]);

        const events: CalendarEvent[] = [];

        // @ts-ignore
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

        // @ts-ignore
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

        // @ts-ignore
        recurring.forEach((rec: any) => {
            events.push({
                id: rec.id,
                title: `Run: ${rec.frequency} (${rec.client.name})`,
                date: rec.nextRunDate,
                type: "RECURRING",
            });
        });

        // @ts-ignore
        payments.forEach((pay: any) => {
            events.push({
                id: pay.id,
                title: `Pay: ${pay.invoice.number}`,
                date: pay.date,
                type: "PAYMENT",
                amount: pay.amount
            });
        });

        // @ts-ignore
        expenses.forEach((exp: any) => {
            events.push({
                id: exp.id,
                title: `${exp.description}`,
                date: exp.date,
                type: "EXPENSE",
                amount: exp.amount
            });
        });

        return events;

    } catch (error) {
        console.error("Failed to fetch calendar events:", error);
        return [];
    }
}
