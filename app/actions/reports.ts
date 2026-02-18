"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function getRequiredSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return { userId: session.user.id, session };
}

export async function getRevenueByMonth(year: number = new Date().getFullYear(), basis: "accrual" | "cash" = "accrual") {
    const { userId } = await getRequiredSession();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        name: new Date(year, i).toLocaleString('default', { month: 'short' }),
        revenue: 0,
        projected: 0,
        paid: 0,
        outstanding: 0,
    }));

    if (basis === "cash") {
        const payments = await prisma.payment.findMany({
            where: {
                invoice: { userId },
                date: { gte: startDate, lt: endDate }
            },
            select: { date: true, amount: true }
        });

        payments.forEach((payment: any) => {
            const month = payment.date.getMonth();
            monthlyData[month].revenue += payment.amount;
            monthlyData[month].paid += payment.amount;
        });
    } else {
        const invoices = await prisma.invoice.findMany({
            where: {
                userId,
                date: { gte: startDate, lt: endDate },
                status: { in: ["PAID", "PARTIAL", "SENT", "OVERDUE"] }
            },
            select: { date: true, total: true, amountPaid: true }
        });

        invoices.forEach((inv: any) => {
            const month = inv.date.getMonth();
            monthlyData[month].revenue += inv.total;
            monthlyData[month].paid += inv.amountPaid;
            monthlyData[month].outstanding += (inv.total - inv.amountPaid);
        });
    }

    const recurringTemplates = await prisma.recurringInvoice.findMany({
        where: { userId, isActive: true }
    });

    const now = new Date();
    recurringTemplates.forEach((template: any) => {
        const items = JSON.parse(template.items);
        const subtotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
        const taxTotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);
        const totalPerRun = subtotal + taxTotal;

        let checkDate = new Date(template.nextRunDate);
        let projectedRuns = template.currentOccurrence;

        while (checkDate < endDate) {
            if (template.maxOccurrences && projectedRuns >= template.maxOccurrences) break;
            if (checkDate >= now && checkDate >= startDate) {
                const month = checkDate.getMonth();
                monthlyData[month].projected += totalPerRun;
                monthlyData[month].revenue += totalPerRun;
            }
            projectedRuns++;
            if (template.frequency === "WEEKLY") checkDate.setDate(checkDate.getDate() + 7);
            else if (template.frequency === "MONTHLY") checkDate.setMonth(checkDate.getMonth() + 1);
            else if (template.frequency === "QUARTERLY") checkDate.setMonth(checkDate.getMonth() + 3);
            else if (template.frequency === "YEARLY") checkDate.setFullYear(checkDate.getFullYear() + 1);
            else break;
        }
    });

    return monthlyData;
}

export async function getTopCustomers(limit: number = 5) {
    const { userId } = await getRequiredSession();
    const clients = await prisma.client.findMany({
        where: { userId },
        include: {
            invoices: { where: { status: "PAID" } }
        }
    });

    const clientRevenue = clients.map((client: any) => ({
        name: client.name,
        email: client.email,
        totalPaid: client.invoices.reduce((acc: number, inv: any) => acc + inv.total, 0),
        invoiceCount: client.invoices.length,
    }));

    return clientRevenue.sort((a: any, b: any) => b.totalPaid - a.totalPaid).slice(0, limit);
}

export async function getInvoiceStatusDistribution() {
    const { userId } = await getRequiredSession();
    const statusCounts = await prisma.invoice.groupBy({
        where: { userId },
        by: ['status'],
        _count: { status: true },
    });

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const currentMonthCount = await prisma.invoice.count({
        where: { userId, date: { gte: startOfCurrentMonth } }
    });

    const lastMonthCount = await prisma.invoice.count({
        where: { userId, date: { gte: startOfLastMonth, lt: startOfCurrentMonth } }
    });

    let trend = 0;
    if (lastMonthCount !== 0) trend = ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100;
    else if (currentMonthCount !== 0) trend = 100;

    const allStatuses = ["DRAFT", "SENT", "PAID", "PARTIAL", "OVERDUE", "CANCELLED"];
    const statusData = allStatuses.map(status => ({
        status,
        count: statusCounts.find((s: any) => s.status === status)?._count.status || 0,
        fill: `var(--color-${status.toLowerCase()})`,
    }));

    return {
        data: statusData,
        trend: parseFloat(trend.toFixed(1)),
    };
}

export async function getDashboardMetrics(year: number = new Date().getFullYear(), basis: "accrual" | "cash" = "accrual") {
    const { userId } = await getRequiredSession();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    let totalRevenue = 0;
    if (basis === "cash") {
        const payments = await prisma.payment.findMany({
            where: { invoice: { userId }, date: { gte: startDate, lt: endDate } },
            select: { amount: true }
        });
        totalRevenue = payments.reduce((acc: number, p: any) => acc + p.amount, 0);
    } else {
        const invoices = await prisma.invoice.findMany({
            where: {
                userId,
                date: { gte: startDate, lt: endDate },
                status: { in: ["PAID", "PARTIAL", "SENT", "OVERDUE"] }
            },
            select: { total: true }
        });
        totalRevenue = invoices.reduce((acc: number, inv: any) => acc + inv.total, 0);
    }

    const expenses = await prisma.expense.findMany({
        where: { userId, date: { gte: startDate, lt: endDate } },
        select: { amount: true }
    });
    const totalExpenses = expenses.reduce((acc: number, e: any) => acc + e.amount, 0);

    const pendingInvoices = await prisma.invoice.count({
        where: { userId, status: { in: ["SENT", "PARTIAL"] } }
    });

    const overdueInvoices = await prisma.invoice.count({
        where: { userId, status: "OVERDUE" }
    });

    let projectedRevenue = 0;
    const recurringTemplates = await prisma.recurringInvoice.findMany({
        where: { userId, isActive: true }
    });

    const now = new Date();
    recurringTemplates.forEach((template: any) => {
        const items = JSON.parse(template.items);
        const subtotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
        const taxTotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);
        const totalPerRun = subtotal + taxTotal;
        let checkDate = new Date(template.nextRunDate);
        let projectedRuns = template.currentOccurrence;

        while (checkDate < endDate) {
            if (template.maxOccurrences && projectedRuns >= template.maxOccurrences) break;
            if (checkDate >= now && checkDate >= startDate) projectedRevenue += totalPerRun;
            projectedRuns++;
            if (template.frequency === "WEEKLY") checkDate.setDate(checkDate.getDate() + 7);
            else if (template.frequency === "MONTHLY") checkDate.setMonth(checkDate.getMonth() + 1);
            else if (template.frequency === "QUARTERLY") checkDate.setMonth(checkDate.getMonth() + 3);
            else if (template.frequency === "YEARLY") checkDate.setFullYear(checkDate.getFullYear() + 1);
            else break;
        }
    });

    return {
        totalRevenue,
        projectedRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        pendingInvoices,
        overdueInvoices,
    };
}
