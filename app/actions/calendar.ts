"use server";

import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

export type CalendarEvent = {
    id: string;
    title: string;
    date: Date;
    type: "INVOICE" | "QUOTE" | "RECURRING" | "PAYMENT";
    amount?: number;
    status?: string;
};

export async function getCalendarEvents(date: Date): Promise<CalendarEvent[]> {
    // Current logic: Fetch everything. Optimizable later for month-range.
    // For a real app with tons of data, we should filter by date range.
    // However, given the schema and current scale, fetching all active/pending items is okay for now, 
    // but let's try to be slightly efficient and fetch relevant items.

    // Actually, to keep it simple and perfectly accurate for "all time" views (if user scrolls), 
    // let's fetch based on a window if possible, or just fetch all open items + recent history.

    // Let's just fetch all for now to ensure we don't miss anything, and filter locally or return all. 
    // Client-side filtering is fast for < 1000 items. 

    try {
        const [invoices, quotes, recurring, payments] = await Promise.all([
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

        return events;

    } catch (error) {
        console.error("Failed to fetch calendar events:", error);
        return [];
    }
}
