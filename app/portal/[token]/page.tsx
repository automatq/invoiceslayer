import { getClientByPortalToken, getClientDeals, acceptQuoteViaPortal, rejectQuoteViaPortal } from "@/app/actions/portal";
import { signDocumentViaPortal } from "@/app/actions/signatures";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle, XCircle, FileText, TrendingUp, PenTool } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { PortalPayButton } from "@/components/PortalPayButton";
import { PortalNotifications } from "@/components/PortalNotifications";
import { PortalQuoteActions } from "@/components/PortalQuoteActions";
import { revalidatePath } from "next/cache";

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const client = await getClientByPortalToken(token);
    const deals = await getClientDeals(token);

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

    async function handleAcceptQuote(quoteId: string) {
        "use server";
        const result = await acceptQuoteViaPortal(quoteId, token);
        if (result.success) {
            revalidatePath(`/portal/${token}`);
        }
        return result;
    }

    async function handleRejectQuote(quoteId: string, reason?: string) {
        "use server";
        const result = await rejectQuoteViaPortal(quoteId, token, reason);
        if (result.success) {
            revalidatePath(`/portal/${token}`);
        }
        return result;
    }

    async function handleSignDocument(documentId: string, documentType: "QUOTE" | "INVOICE", signatureData: string, metadata?: { name?: string; title?: string; company?: string }) {
        "use server";
        const result = await signDocumentViaPortal(documentId, documentType, signatureData, token, metadata);
        if (result.success) {
            revalidatePath(`/portal/${token}`);
        }
        return result;
    }

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Welcome, {client.name}</h1>
                <p className="text-muted-foreground">Manage your invoices, quotes, and view your deals.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {deals.filter((d: any) => d.status === "OPEN").length}
                        </div>
                        <p className="text-xs text-muted-foreground">In progress</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">
                            {client.quotes.filter((q: any) => q.status === "SENT").length}
                        </div>
                        <p className="text-xs text-muted-foreground">Awaiting your decision</p>
                    </CardContent>
                </Card>
            </div>

            {/* Deals Section */}
            {deals.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Your Deals</CardTitle>
                        <CardDescription>Track the progress of your ongoing deals.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Deal</TableHead>
                                    <TableHead>Stage</TableHead>
                                    <TableHead>Value</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Expected Close</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deals.map((deal: any) => (
                                    <TableRow key={deal.id}>
                                        <TableCell className="font-medium">{deal.title}</TableCell>
                                        <TableCell>
                                            <Badge style={{ backgroundColor: deal.stage.color }}>
                                                {deal.stage.name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>${deal.value.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                deal.status === "WON" ? "default" :
                                                deal.status === "LOST" ? "destructive" :
                                                deal.status === "STALE" ? "secondary" : "outline"
                                            }>
                                                {deal.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {deal.expectedClose 
                                                ? format(new Date(deal.expectedClose), "MMM d, yyyy") 
                                                : "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Quotes Section */}
            {client.quotes.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Quotes</CardTitle>
                        <CardDescription>Review and accept or reject your quotes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Quote #</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Expiry</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {client.quotes.map((quote: any) => (
                                    <TableRow key={quote.id}>
                                        <TableCell className="font-medium">{quote.number}</TableCell>
                                        <TableCell>{format(quote.date, "MMM d, yyyy")}</TableCell>
                                        <TableCell>{format(quote.expiryDate, "MMM d, yyyy")}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                quote.status === "ACCEPTED" ? "default" :
                                                quote.status === "REJECTED" ? "destructive" :
                                                quote.status === "SENT" ? "secondary" : "outline"
                                            }>
                                                {quote.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">${quote.total.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            {quote.status === "SENT" && (
                                                <PortalQuoteActions
                                                    quoteId={quote.id}
                                                    onAccept={async () => {
                                                        "use server";
                                                        await handleAcceptQuote(quote.id);
                                                    }}
                                                    onReject={async () => {
                                                        "use server";
                                                        await handleRejectQuote(quote.id);
                                                    }}
                                                    onSign={async (signatureData, metadata) => {
                                                        "use server";
                                                        await handleSignDocument(quote.id, "QUOTE", signatureData, metadata);
                                                        await handleAcceptQuote(quote.id);
                                                    }}
                                                />
                                            )}
                                            {quote.status === "ACCEPTED" && (
                                                <span className="text-sm text-green-600 font-medium">Accepted ✓</span>
                                            )}
                                            {quote.status === "REJECTED" && (
                                                <span className="text-sm text-red-600 font-medium">Rejected ✗</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

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
