import { prisma } from "@/lib/prisma";

export interface InvoiceItemInput {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
}

/**
 * Generates the next invoice or quote number for a user.
 * @param userId The user's ID
 * @param prefix The prefix to use (e.g., "INV", "Q")
 * @returns A promise that resolves to the next number string
 */
export async function getNextSequenceNumber(userId: string, prefix: "INV" | "Q"): Promise<string> {
    const model = prefix === "INV" ? prisma.invoice : prisma.quote;

    const lastRecord = await (model as any).findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { number: true }
    });

    const prefixString = `${prefix}-`;
    let nextNumber = `${prefixString}001`;

    if (lastRecord?.number?.startsWith(prefixString)) {
        const lastNum = parseInt(lastRecord.number.split("-")[1], 10);
        if (!isNaN(lastNum)) {
            nextNumber = `${prefixString}${String(lastNum + 1).padStart(3, "0")}`;
        }
    }

    return nextNumber;
}

/**
 * Calculates subtotals, tax totals, and grand totals for a set of items.
 */
export function calculateInvoiceTotals(items: InvoiceItemInput[]) {
    const calculatedItems = items.map(item => {
        const amount = item.quantity * item.unitPrice;
        const taxRate = item.taxRate || 0;
        const taxAmount = amount * (taxRate / 100);
        return {
            ...item,
            amount,
            taxAmount,
            taxRate
        };
    });

    const subtotal = calculatedItems.reduce((acc, item) => acc + item.amount, 0);
    const taxTotal = calculatedItems.reduce((acc, item) => acc + item.taxAmount, 0);
    const total = subtotal + taxTotal;

    return {
        items: calculatedItems,
        subtotal,
        taxTotal,
        total
    };
}

/**
 * Common revenue projection logic.
 */
export function calculateProjectedAmount(templates: any[], startDate: Date, endDate: Date) {
    const now = new Date();
    let projectedRevenue = 0;

    templates.forEach((template: any) => {
        const items = typeof template.items === 'string' ? JSON.parse(template.items) : template.items;
        const { total } = calculateInvoiceTotals(items);

        let checkDate = new Date(template.nextRunDate);
        let projectedRuns = template.currentOccurrence;

        while (checkDate < endDate) {
            if (template.maxOccurrences && projectedRuns >= template.maxOccurrences) break;
            if (checkDate >= now && checkDate >= startDate) {
                projectedRevenue += total;
            }
            projectedRuns++;

            if (template.frequency === "WEEKLY") checkDate.setDate(checkDate.getDate() + 7);
            else if (template.frequency === "MONTHLY") checkDate.setMonth(checkDate.getMonth() + 1);
            else if (template.frequency === "QUARTERLY") checkDate.setMonth(checkDate.getMonth() + 3);
            else if (template.frequency === "YEARLY") checkDate.setFullYear(checkDate.getFullYear() + 1);
            else break;
        }
    });

    return projectedRevenue;
}
