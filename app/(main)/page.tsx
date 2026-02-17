import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Overview } from "@/components/Overview";
import { RecentSales } from "@/components/RecentSales";
import { getInvoices } from "@/app/actions/invoices";
import { getClients } from "@/app/actions/clients";
import { getQuotes } from "@/app/actions/quotes";
import { getExpenses } from "@/app/actions/expenses";
import { getRevenueByMonth, getDashboardMetrics } from "@/app/actions/reports";
import { DollarSign, Clock, TriangleAlert, Wallet, TrendingUp, Repeat } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { redirect } from "next/navigation";
import { getSettings } from "@/app/actions/settings";
import { AccountingBasisToggle } from "@/components/reports/AccountingBasisToggle";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ basis?: string }> }) {
  const { basis: rawBasis } = await searchParams;
  const settings = await getSettings();
  if (!settings) {
    redirect("/onboarding");
  }

  const basis = (rawBasis === "cash") ? "cash" : "accrual";
  const currentYear = new Date().getFullYear();

  const [invoices, clients, quotes, expenses, revenueData, metrics] = await Promise.all([
    getInvoices(),
    getClients(),
    getQuotes(),
    getExpenses(),
    getRevenueByMonth(currentYear, basis as "accrual" | "cash"),
    getDashboardMetrics(currentYear, basis as "accrual" | "cash")
  ]);

  const { totalRevenue, projectedRevenue, totalExpenses, netProfit, pendingInvoices, overdueInvoices } = metrics;

  // Recent Sales Data (Paid Invoices)
  const recentSales = invoices
    .filter((inv: any) => inv.status === "PAID" || inv.status === "SENT" || inv.status === "PENDING" || inv.status === "PARTIAL")
    .slice(0, 25)
    .map((inv: any) => ({
      id: inv.id,
      name: inv.client.name,
      email: inv.client.email,
      amount: inv.total,
      fallback: inv.client.name.substring(0, 2).toUpperCase(),
    }));

  // Merge Revenue Data with Quotes Data
  const overviewData = revenueData.map((monthData: any, index: number) => {
    const monthQuotes = quotes.reduce((acc: number, q: any) => {
      const qDate = new Date(q.date);
      if (qDate.getFullYear() === currentYear && qDate.getMonth() === index) {
        return acc + q.total;
      }
      return acc;
    }, 0);

    return {
      name: monthData.name,
      revenue: monthData.revenue,
      projected: monthData.projected,
      quotes: monthQuotes,
    };
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <AccountingBasisToggle />
        </div>
      </div>

      {overdueInvoices > 0 && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Attention Needed</AlertTitle>
          <AlertDescription>
            You have {overdueInvoices} overdue invoice{overdueInvoices === 1 ? "" : "s"}. Please review them immediately.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/invoices" className="gradient-border gold transition-transform hover:scale-[1.02]">
          <Card className="border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalRevenue - projectedRevenue).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Realized income
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/recurring" className="gradient-border silver transition-transform hover:scale-[1.02]">
          <Card className="border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projected Recurring</CardTitle>
              <Repeat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">${projectedRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Expected by year-end
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/reports" className="gradient-border green transition-transform hover:scale-[1.02]">
          <Card className="border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Net Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", netProfit >= 0 ? "text-green-600" : "text-red-600")}>
                ${netProfit.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Realized - Expenses
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/invoices" className="gradient-border blue transition-transform hover:scale-[1.02]">
          <Card className="border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInvoices}</div>
              <p className="text-xs text-muted-foreground">
                Action required
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              Monthly breakdown of realized and projected income for {currentYear}.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={overviewData} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>
              Latest invoices and payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentSales data={recentSales} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
