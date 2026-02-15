import { getInvoice } from "@/app/actions/invoices";
import { InvoiceActions } from "@/components/InvoiceActions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const invoice = await getInvoice(id);

    if (!invoice) {
        notFound();
    }

    // Default values if not set (backward compatibility)
    const subtotal = invoice.subtotal || invoice.items.reduce((acc, item) => acc + item.amount, 0);
    const taxTotal = invoice.taxTotal || invoice.items.reduce((acc, item) => acc + (item.amount * ((item.taxRate || 0) / 100)), 0);
    const total = invoice.total;
    const amountPaid = invoice.amountPaid || 0;
    const balanceDue = total - amountPaid;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Invoice {invoice.number}</h1>
                    <p className="text-muted-foreground">
                        Issued on {new Date(invoice.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge status={invoice.status} />
                    <InvoiceActions invoice={invoice} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Bill To</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="font-semibold text-lg">{invoice.client.name}</div>
                        <div className="text-sm text-muted-foreground">{invoice.client.email}</div>
                        <div className="text-sm text-muted-foreground">{invoice.client.phone}</div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.client.address}</div>
                        {invoice.client.vatNumber && (
                            <div className="text-sm text-muted-foreground">GST/HST: {invoice.client.vatNumber}</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Invoice Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Invoice Number</span>
                            <span className="font-medium">{invoice.number}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Issue Date</span>
                            <span className="font-medium">{new Date(invoice.date).toLocaleDateString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Due Date</span>
                            <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="text-right">Tax</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoice.items.map((item: any) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{item.taxRate || 0}%</TableCell>
                                    <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="mt-6 flex justify-end">
                        <div className="w-full max-w-xs space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tax</span>
                                <span>${taxTotal.toFixed(2)}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between">
                                <span className="font-bold">Total</span>
                                <span className="font-bold">${total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                                <span className="font-medium">Amount Paid</span>
                                <span className="font-medium">${amountPaid.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-red-600 border-t pt-2 mt-2">
                                <span className="font-bold text-lg">Balance Due</span>
                                <span className="font-bold text-lg">${balanceDue.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Payment History */}
            {invoice.payments && invoice.payments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Payment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoice.payments.map((payment: any) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                                        <TableCell>{payment.method}</TableCell>
                                        <TableCell>{payment.notes || "-"}</TableCell>
                                        <TableCell className="text-right font-medium">${payment.amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
