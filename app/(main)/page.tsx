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
import { DollarSign, Clock, Users, FileText, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { redirect } from "next/navigation";
import { getSettings } from "@/app/actions/settings";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const settings = await getSettings();
  if (!settings) {
    redirect("/onboarding");
  }

  const invoices = await getInvoices();
  const clients = await getClients();
  const quotes = await getQuotes();

  // Metrics
  const totalRevenue = invoices.reduce((acc: number, inv: any) => acc + (inv.status === "PAID" ? inv.total : 0), 0);
  const pendingInvoices = invoices.filter((inv: any) => inv.status === "PENDING" || inv.status === "SENT").length;
  const overdueInvoices = invoices.filter((inv: any) => inv.status === "OVERDUE").length;
  const activeClients = clients.length; // Simplified for now
  const activeQuotes = quotes.filter((q: any) => q.status === "SENT" || q.status === "DRAFT").length;

  // Recent Sales Data (Paid Invoices)
  const recentSales = invoices
    .filter((inv: any) => inv.status === "PAID" || inv.status === "SENT" || inv.status === "PENDING") // Show all for demo if no paid
    .slice(0, 5)
    .map((inv: any) => ({
      id: inv.id,
      name: inv.client.name,
      email: inv.client.email,
      amount: inv.total,
      fallback: inv.client.name.substring(0, 2).toUpperCase(),
    }));

  // Overview Data — track revenue (paid invoices) and quotes by month
  const overviewData = [
    { name: "Jan", revenue: 0, quotes: 0 },
    { name: "Feb", revenue: 0, quotes: 0 },
    { name: "Mar", revenue: 0, quotes: 0 },
    { name: "Apr", revenue: 0, quotes: 0 },
    { name: "May", revenue: 0, quotes: 0 },
    { name: "Jun", revenue: 0, quotes: 0 },
    { name: "Jul", revenue: 0, quotes: 0 },
    { name: "Aug", revenue: 0, quotes: 0 },
    { name: "Sep", revenue: 0, quotes: 0 },
    { name: "Oct", revenue: 0, quotes: 0 },
    { name: "Nov", revenue: 0, quotes: 0 },
    { name: "Dec", revenue: 0, quotes: 0 },
  ];

  // Aggregate actual revenue by month
  invoices.forEach((inv: any) => {
    if (inv.status === "PAID") {
      const month = new Date(inv.date).getMonth();
      overviewData[month].revenue += inv.total;
    }
  });

  // Aggregate quotes by month
  quotes.forEach((q: any) => {
    const month = new Date(q.date).getMonth();
    overviewData[month].quotes += q.total;
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
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
                From paid invoices
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
              Monthly revenue breakdown for the current year.
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
