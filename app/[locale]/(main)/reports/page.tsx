import { 
    getRevenueByMonth, 
    getTopCustomers, 
    getInvoiceStatusDistribution,
    getPipelineForecastByMonth,
    getDealsByStage,
    getConversionRates,
    getWinLossAnalysis,
    getCombinedRevenueData,
} from "@/app/actions/reports";
import { RevenueChart } from "@/components/reports/RevenueChart";
import { StatusDistributionChart } from "@/components/reports/StatusDistributionChart";
import { TopCustomersList } from "@/components/reports/TopCustomersList";
import { DownloadReportButton } from "@/components/reports/DownloadReportButton";
import { PipelineForecastChart } from "@/components/reports/PipelineForecastChart";
import { DealsByStageChart } from "@/components/reports/DealsByStageChart";
import { ConversionRateChart } from "@/components/reports/ConversionRateChart";
import { WinLossChart } from "@/components/reports/WinLossChart";
import { CombinedRevenueChart } from "@/components/reports/CombinedRevenueChart";

export const dynamic = "force-dynamic";

import { AccountingBasisToggle } from "@/components/reports/AccountingBasisToggle";

export default async function ReportsPage({ searchParams }: { searchParams: { basis?: string } }) {
    const basis = (searchParams?.basis === "cash") ? "cash" : "accrual";
    const currentYear = new Date().getFullYear();
    
    const [
        revenueData, 
        topCustomers, 
        statusResult,
        pipelineForecast,
        dealsByStage,
        conversionRates,
        winLossAnalysis,
        combinedRevenue,
    ] = await Promise.all([
        getRevenueByMonth(currentYear, basis as "accrual" | "cash"),
        getTopCustomers(),
        getInvoiceStatusDistribution(),
        getPipelineForecastByMonth(currentYear),
        getDealsByStage(),
        getConversionRates(),
        getWinLossAnalysis(currentYear),
        getCombinedRevenueData(currentYear),
    ]);

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

            {/* Financial Reports */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Financial Reports</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    <div className="col-span-7">
                        <CombinedRevenueChart data={combinedRevenue} />
                    </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-6">
                    <div className="col-span-4">
                        <RevenueChart data={revenueData} />
                    </div>
                    <div className="col-span-3">
                        <StatusDistributionChart data={statusResult.data} trend={statusResult.trend} />
                    </div>
                </div>
            </div>

            {/* Pipeline CRM Reports */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Pipeline CRM Reports</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    <div className="col-span-4">
                        <PipelineForecastChart data={pipelineForecast} />
                    </div>
                    <div className="col-span-3">
                        <DealsByStageChart data={dealsByStage} />
                    </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-6">
                    <div className="col-span-3">
                        <WinLossChart data={winLossAnalysis} />
                    </div>
                    <div className="col-span-4">
                        <ConversionRateChart data={conversionRates} />
                    </div>
                </div>
            </div>

            {/* Customer Reports */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Customer Reports</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    <div className="col-span-3">
                        <TopCustomersList data={topCustomers} />
                    </div>
                </div>
            </div>
        </div>
    );
}
