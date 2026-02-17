import { getClientByPortalToken } from "@/app/actions/portal";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { PortalPayButton } from "@/components/PortalPayButton";
import { PortalNotifications } from "@/components/PortalNotifications";

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const client = await getClientByPortalToken(token);

    if (!client) {
        notFound();
    }

    const totalOutstanding = client.invoices.reduce((acc, inv) => {
        if (inv.status !== "PAID" && inv.status !== "CANCELLED") {
            return acc + (inv.total - inv.amountPaid);
        }
        return acc;
    }, 0);

    const totalPaid = client.invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Welcome, {client.name}</h1>
                <p className="text-muted-foreground">Manage your invoices and payments secure history.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">${totalOutstanding.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Amount due now</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Lifetime payments</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                    <CardDescription>View and download your past invoices.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {client.invoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">{invoice.number}</TableCell>
                                    <TableCell>{format(invoice.date, "MMM d, yyyy")}</TableCell>
                                    <TableCell>
                                        <Badge variant={invoice.status === "PAID" ? "default" : invoice.status === "OVERDUE" ? "destructive" : "secondary"}>
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">${invoice.total.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">${(invoice.total - invoice.amountPaid).toFixed(2)}</TableCell>
                                    <TableCell className="text-right flex items-center justify-end gap-2">
                                        {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (invoice.total - invoice.amountPaid > 0) && (
                                            <PortalPayButton
                                                invoiceId={invoice.id}
                                                portalToken={token}
                                            />
                                        )}
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/api/invoices/${invoice.id}/pdf`} target="_blank">
                                                <Download className="mr-2 h-4 w-4" />
                                                PDF
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <PortalNotifications />
        </div>
    );
}
