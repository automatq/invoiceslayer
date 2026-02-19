import { getQuote } from "@/app/actions/quotes";
import { getDocumentSignature } from "@/app/actions/signatures";
import { QuoteActions } from "@/components/QuoteActions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PenTool } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function QuoteDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const [quote, signature] = await Promise.all([
        getQuote(id),
        getDocumentSignature(id, "QUOTE")
    ]);

    if (!quote) {
        notFound();
    }

    // Default values if not set
    const subtotal = quote.subtotal || quote.items.reduce((acc: number, item: any) => acc + item.amount, 0);
    const taxTotal = quote.taxTotal || quote.items.reduce((acc: number, item: any) => acc + (item.amount * ((item.taxRate || 0) / 100)), 0);
    const total = quote.total;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quote {quote.number}</h1>
                    <p className="text-muted-foreground">
                        Created on {new Date(quote.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {signature && (
                        <Badge className="bg-green-600">
                            <PenTool className="w-3 h-3 mr-1" />
                            Signed
                        </Badge>
                    )}
                    <Badge variant="outline" className="text-base px-3 py-1">
                        {quote.status}
                    </Badge>
                    <QuoteActions quote={quote} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Client Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="font-semibold text-lg">{quote.client.name}</div>
                        <div className="text-sm text-muted-foreground">{quote.client.email}</div>
                        <div className="text-sm text-muted-foreground">{quote.client.phone}</div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.client.address}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quote Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Quote Number</span>
                            <span className="font-medium">{quote.number}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Date Issued</span>
                            <span className="font-medium">{new Date(quote.date).toLocaleDateString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Valid Until</span>
                            <span className="font-medium">{new Date(quote.expiryDate).toLocaleDateString()}</span>
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
                            {quote.items.map((item: any) => (
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
                                <span className="font-bold text-lg">Total</span>
                                <span className="font-bold text-lg">${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
