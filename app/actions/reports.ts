"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { calculateProjectedAmount } from "@/lib/invoice-utils";

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
    const projectedRevenue = calculateProjectedAmount(recurringTemplates, startDate, endDate);

    // Distribute projected revenue into monthlyData (simpler for monthlyData distribution)
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
                // DO NOT add to revenue here, keep it separate for the chart to stack
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

    const recurringTemplates = await prisma.recurringInvoice.findMany({
        where: { userId, isActive: true }
    });
    const projectedRevenue = calculateProjectedAmount(recurringTemplates, startDate, endDate);

    return {
        totalRevenue,
        projectedRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        pendingInvoices,
        overdueInvoices,
    };
}

// Pipeline CRM Reports
export async function getPipelineMetrics() {
    const { userId } = await getRequiredSession();

    const pipelines = await prisma.pipeline.findMany({
        where: { userId },
        include: {
            stages: {
                include: {
                    deals: true,
                },
            },
        },
    });

    let totalPipelineValue = 0;
    let weightedForecast = 0;
    let totalDeals = 0;
    let openDeals = 0;
    let wonDeals = 0;
    let lostDeals = 0;

    pipelines.forEach((pipeline: any) => {
        pipeline.stages.forEach((stage: any) => {
            stage.deals.forEach((deal: any) => {
                totalPipelineValue += deal.value;
                weightedForecast += deal.value * (stage.probability / 100);
                totalDeals++;
                if (deal.status === "OPEN") openDeals++;
                if (deal.status === "WON") wonDeals++;
                if (deal.status === "LOST") lostDeals++;
            });
        });
    });

    const winRate = totalDeals > 0 ? (wonDeals / (wonDeals + lostDeals)) * 100 : 0;

    return {
        totalPipelineValue,
        weightedForecast,
        totalDeals,
        openDeals,
        wonDeals,
        lostDeals,
        winRate: parseFloat(winRate.toFixed(1)),
        pipelineCount: pipelines.length,
    };
}

export async function getDealsByStage() {
    const { userId } = await getRequiredSession();

    const stages = await prisma.pipelineStage.findMany({
        where: { pipeline: { userId } },
        include: {
            deals: true,
            pipeline: true,
        },
        orderBy: { order: "asc" },
    });

    return stages.map((stage: any) => ({
        stageId: stage.id,
        stageName: stage.name,
        color: stage.color,
        probability: stage.probability,
        dealCount: stage.deals.length,
        totalValue: stage.deals.reduce((sum: number, d: any) => sum + d.value, 0),
        weightedValue: stage.deals.reduce((sum: number, d: any) => sum + d.value, 0) * (stage.probability / 100),
    }));
}

export async function getPipelineForecastByMonth(year: number = new Date().getFullYear()) {
    const { userId } = await getRequiredSession();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        name: new Date(year, i).toLocaleString('default', { month: 'short' }),
        pipelineValue: 0,
        weightedForecast: 0,
        expectedClose: 0,
    }));

    const deals = await prisma.deal.findMany({
        where: {
            userId,
            status: { in: ["OPEN", "WON"] },
            // If we want a strict forecast, we keep the date filter. 
            // But for the user to see "their deals" we might want to show them somewhere.
            // Let's keep the year filter if date exists, otherwise fallback to current month if it's open?
            // Actually, let's just use expectedClose if it's in the year, otherwise ignore for the time chart.
            expectedClose: { gte: startDate, lt: endDate },
        },
        include: {
            stage: true,
        },
    });

    deals.forEach((deal: any) => {
        if (deal.expectedClose && deal.stage) {
            const month = deal.expectedClose.getMonth();
            monthlyData[month].pipelineValue += deal.value;
            monthlyData[month].weightedForecast += deal.value * ((deal.stage.probability || 0) / 100);
            monthlyData[month].expectedClose += 1;
        }
    });

    return monthlyData;
}

export async function getConversionRates() {
    const { userId } = await getRequiredSession();

    const stages = await prisma.pipelineStage.findMany({
        where: { pipeline: { userId } },
        include: {
            deals: {
                select: { id: true, status: true },
            },
        },
        orderBy: { order: "asc" },
    });

    const conversionData = [];
    for (let i = 0; i < stages.length - 1; i++) {
        const currentStage = stages[i];
        const nextStage = stages[i + 1];

        const dealsInCurrent = currentStage.deals.length;
        const dealsInNext = nextStage.deals.length;

        const conversionRate = dealsInCurrent > 0
            ? (dealsInNext / dealsInCurrent) * 100
            : 0;

        conversionData.push({
            fromStage: currentStage.name,
            toStage: nextStage.name,
            fromCount: dealsInCurrent,
            toCount: dealsInNext,
            conversionRate: parseFloat(conversionRate.toFixed(1)),
        });
    }

    return conversionData;
}

export async function getWinLossAnalysis(year: number = new Date().getFullYear()) {
    const { userId } = await getRequiredSession();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const wonDeals = await prisma.deal.findMany({
        where: {
            userId,
            status: "WON",
            updatedAt: { gte: startDate, lt: endDate },
        },
        include: { stage: true },
    });

    const lostDeals = await prisma.deal.findMany({
        where: {
            userId,
            status: "LOST",
            updatedAt: { gte: startDate, lt: endDate },
        },
        include: { stage: true },
    });

    const wonValue = wonDeals.reduce((sum: number, d: any) => sum + d.value, 0);
    const lostValue = lostDeals.reduce((sum: number, d: any) => sum + d.value, 0);
    const totalClosed = wonDeals.length + lostDeals.length;

    return {
        won: {
            count: wonDeals.length,
            value: wonValue,
            avgValue: wonDeals.length > 0 ? wonValue / wonDeals.length : 0,
        },
        lost: {
            count: lostDeals.length,
            value: lostValue,
            avgValue: lostDeals.length > 0 ? lostValue / lostDeals.length : 0,
        },
        winRate: totalClosed > 0 ? parseFloat(((wonDeals.length / totalClosed) * 100).toFixed(1)) : 0,
        totalClosedValue: wonValue + lostValue,
    };
}

// Get combined revenue data: actual invoices + pipeline forecast
export async function getCombinedRevenueData(year: number = new Date().getFullYear()) {
    const { userId } = await getRequiredSession();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(year, i).toLocaleString('default', { month: 'short' }),
        actualRevenue: 0,
        forecastRevenue: 0,
        pipelineValue: 0,
    }));

    // Get actual invoice revenue (paid amounts)
    const payments = await prisma.payment.findMany({
        where: {
            invoice: { userId },
            date: { gte: startDate, lt: endDate }
        },
        select: { date: true, amount: true }
    });

    payments.forEach((payment: any) => {
        const month = payment.date.getMonth();
        monthlyData[month].actualRevenue += payment.amount;
    });

    // Get pipeline data - deals expected to close by month
    const deals = await prisma.deal.findMany({
        where: {
            userId,
            status: { in: ["OPEN", "WON"] },
            expectedClose: { gte: startDate, lt: endDate },
        },
        include: { stage: true },
    });

    deals.forEach((deal: any) => {
        if (deal.expectedClose) {
            const month = deal.expectedClose.getMonth();
            const weightedValue = deal.value * (deal.stage.probability / 100);
            monthlyData[month].forecastRevenue += weightedValue;
            monthlyData[month].pipelineValue += deal.value;
        }
    });

    return monthlyData;
}
