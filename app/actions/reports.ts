"use server";

import { prisma } from "@/lib/prisma";

export async function getRevenueByMonth(year: number = new Date().getFullYear()) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const invoices = await prisma.invoice.findMany({
        where: {
            date: {
                gte: startDate,
                lt: endDate,
            },
            status: { in: ["PAID", "PARTIAL", "SENT"] } // Include SENT for projected revenue? Maybe just PAID.
        },
        select: {
            date: true,
            total: true,
            amountPaid: true,
            status: true,
        }
    });

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        name: new Date(year, i).toLocaleString('default', { month: 'short' }),
        revenue: 0,
        paid: 0,
        outstanding: 0,
    }));

    invoices.forEach(inv => {
        const month = inv.date.getMonth();
        if (inv.status === "PAID") {
            monthlyData[month].revenue += inv.total;
            monthlyData[month].paid += inv.total;
        } else if (inv.status === "PARTIAL") {
            monthlyData[month].revenue += inv.total; // Total value of invoice
            monthlyData[month].paid += inv.amountPaid;
            monthlyData[month].outstanding += (inv.total - inv.amountPaid);
        } else if (inv.status === "SENT") {
            monthlyData[month].revenue += inv.total;
            monthlyData[month].outstanding += inv.total;
        }
    });

    return monthlyData;
}

export async function getTopCustomers(limit: number = 5) {
    const clients = await prisma.client.findMany({
        include: {
            invoices: {
                where: { status: "PAID" }
            }
        }
    });

    const clientRevenue = clients.map(client => ({
        name: client.name,
        email: client.email,
        totalPaid: client.invoices.reduce((acc, inv) => acc + inv.total, 0),
        invoiceCount: client.invoices.length,
    }));

    return clientRevenue
        .sort((a, b) => b.totalPaid - a.totalPaid)
        .slice(0, limit);
}

export async function getInvoiceStatusDistribution() {
    const statusCounts = await prisma.invoice.groupBy({
        by: ['status'],
        _count: {
            status: true,
        },
    });

    // Calculate Trend: Total invoices this month vs last month
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const currentMonthCount = await prisma.invoice.count({
        where: {
            date: {
                gte: startOfCurrentMonth,
            }
        }
    });

    const lastMonthCount = await prisma.invoice.count({
        where: {
            date: {
                gte: startOfLastMonth,
                lt: startOfCurrentMonth,
            }
        }
    });

    let trend = 0;
    if (lastMonthCount !== 0) {
        trend = ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100;
    } else if (currentMonthCount !== 0) {
        trend = 100;
    }

    // Ensure all statuses are represented
    const allStatuses = ["DRAFT", "SENT", "PAID", "PARTIAL", "OVERDUE", "CANCELLED"];

    const statusData = allStatuses.map(status => ({
        status,
        count: statusCounts.find(s => s.status === status)?._count.status || 0,
        fill: `var(--color-${status.toLowerCase()})`,
    }));

    return {
        data: statusData,
        trend: parseFloat(trend.toFixed(1)),
    };
}
