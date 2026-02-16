import { getRevenueByMonth, getTopCustomers, getInvoiceStatusDistribution } from "@/app/actions/reports";
import { RevenueChart } from "@/components/reports/RevenueChart";
import { StatusDistributionChart } from "@/components/reports/StatusDistributionChart";
import { TopCustomersList } from "@/components/reports/TopCustomersList";
import { DownloadReportButton } from "@/components/reports/DownloadReportButton";

export const dynamic = "force-dynamic";

import { AccountingBasisToggle } from "@/components/reports/AccountingBasisToggle";

export default async function ReportsPage({ searchParams }: { searchParams: { basis?: string } }) {
    const basis = (searchParams?.basis === "cash") ? "cash" : "accrual";
    const revenueData = await getRevenueByMonth(new Date().getFullYear(), basis as "accrual" | "cash");
    const topCustomers = await getTopCustomers();
    const statusResult = await getInvoiceStatusDistribution();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground">Analyze your business performance.</p>
                </div>
                <div className="flex items-center gap-4">
                    <AccountingBasisToggle />
                    <DownloadReportButton data={revenueData} filename="revenue_report.csv" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <RevenueChart data={revenueData} />
                </div>
                <div className="col-span-3">
                    <StatusDistributionChart data={statusResult.data} trend={statusResult.trend} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-3">
                    <TopCustomersList data={topCustomers} />
                </div>
                {/* Placeholder for future specific reports, e.g., Expense breakdown if we had expenses */}
            </div>
        </div>
    );
}
