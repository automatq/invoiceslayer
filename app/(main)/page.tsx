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
import { getRevenueByMonth } from "@/app/actions/reports";
import { DollarSign, Clock, Users, FileText, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { redirect } from "next/navigation";
import { getSettings } from "@/app/actions/settings";
import { AccountingBasisToggle } from "@/components/reports/AccountingBasisToggle";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: { basis?: string } }) {
  const settings = await getSettings();
  if (!settings) {
    redirect("/onboarding");
  }

  const basis = (searchParams?.basis === "cash") ? "cash" : "accrual";
  const currentYear = new Date().getFullYear();

  const invoices = await getInvoices();
  const clients = await getClients();
  const quotes = await getQuotes();
  const revenueData = await getRevenueByMonth(currentYear, basis as "accrual" | "cash");

  // Metrics
  const totalRevenue = invoices.reduce((acc: number, inv: any) => {
    if (basis === "cash") {
      return acc + (inv.amountPaid || 0);
    } else {
      // Accrual: Sum of all finalized invoices
      if (["PAID", "PARTIAL", "SENT", "OVERDUE"].includes(inv.status)) {
        return acc + inv.total;
      }
      return acc;
    }
  }, 0);
  const pendingInvoices = invoices.filter((inv: any) => inv.status === "PENDING" || inv.status === "SENT").length;
  const overdueInvoices = invoices.filter((inv: any) => inv.status === "OVERDUE").length;
  const activeClients = clients.length; // Simplified for now
  const activeQuotes = quotes.filter((q: any) => q.status === "SENT" || q.status === "DRAFT").length;

  // Recent Sales Data (Paid Invoices)
  const recentSales = invoices
    .filter((inv: any) => inv.status === "PAID" || inv.status === "SENT" || inv.status === "PENDING") // Show all for demo if no paid
    .slice(0, 25)
    .map((inv: any) => ({
      id: inv.id,
      name: inv.client.name,
      email: inv.client.email,
      amount: inv.total,
      fallback: inv.client.name.substring(0, 2).toUpperCase(),
    }));

  // Merge Revenue Data with Quotes Data
  const overviewData = revenueData.map((monthData, index) => {
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
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {basis === "cash" ? "Cash collected" : "Total invoiced value"}
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/invoices" className="gradient-border silver transition-transform hover:scale-[1.02]">
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
        <Link href="/clients" className="gradient-border green transition-transform hover:scale-[1.02]">
          <Card className="border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeClients}</div>
              <p className="text-xs text-muted-foreground">
                Total clients
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/quotes" className="gradient-border blue transition-transform hover:scale-[1.02]">
          <Card className="border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Quotes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeQuotes}</div>
              <p className="text-xs text-muted-foreground">
                Currently open
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Monthly revenue breakdown for {currentYear}.
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
