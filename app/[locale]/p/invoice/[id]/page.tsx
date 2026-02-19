import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma"; // Fixed import
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { CheckoutButton } from "@/components/CheckoutButton"; // We'll create this next

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function PublicInvoicePage({ params }: PageProps) {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
            client: true,
            items: true,
            payments: true,
        },
    });

    if (!invoice) {
        return notFound();
    }

    // Calculate balance due
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = invoice.total - totalPaid;
    const isPaid = invoice.status === "PAID" || balanceDue <= 0;

    // Fetch company settings (assuming single user/settings for now)
    const settings = await prisma.setting.findFirst();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-10 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                        Invoice #{invoice.number} for {invoice.client.name}
                    </div>
                    {/* Download PDF button could go here */}
                </div>

                <Card className="shadow-lg border-t-4 border-t-primary">
                    <CardHeader className="flex flex-row justify-between items-start">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-bold">INVOICE</CardTitle>
                            <p className="text-muted-foreground font-medium">{invoice.number}</p>
                        </div>
                        <div className="text-right">
                            {settings?.companyLogo && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={settings.companyLogo} alt="Logo" className="h-12 object-contain mb-2 ml-auto" />
                            )}
                            <h3 className="font-semibold">{settings?.companyName || "Company Name"}</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">{settings?.companyAddress}</p>
                            <p className="text-sm text-muted-foreground">{settings?.companyEmail}</p>
                        </div>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6 space-y-6">
                        {/* Dates & Client Info */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bill To</h4>
                                <div className="text-sm font-medium">{invoice.client.name}</div>
                                <div className="text-sm text-muted-foreground whitespace-pre-line">{invoice.client.address}</div>
                                <div className="text-sm text-muted-foreground">{invoice.client.email}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-right sm:text-left">
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Issue Date</h4>
                                    <p className="text-sm font-medium">{format(new Date(invoice.date), "MMM d, yyyy")}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Due Date</h4>
                                    <p className="text-sm font-medium">{format(new Date(invoice.dueDate), "MMM d, yyyy")}</p>
                                </div>
                                <div className="col-span-2 mt-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status</h4>
                                    <Badge
                                        variant={isPaid ? "default" : "destructive"}
                                        className={isPaid ? "bg-green-600 hover:bg-green-700" : ""}
                                    >
                                        {isPaid ? "PAID" : invoice.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoice.items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Totals */}
                        <div className="flex justify-end">
                            <div className="w-1/2 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>${invoice.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span>${invoice.taxTotal.toFixed(2)}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>${invoice.total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-green-600 font-medium">
                                    <span>Amount Paid</span>
                                    <span>- ${totalPaid.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg text-red-600 border-t pt-2 mt-2">
                                    <span>Balance Due</span>
                                    <span>${balanceDue.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-end gap-4 bg-muted/20 p-6">
                        {!isPaid && (
                            <CheckoutButton invoiceId={invoice.id} amount={balanceDue} />
                        )}
                        {isPaid && (
                            <Button disabled variant="outline" className="w-full sm:w-auto text-green-600 border-green-200 bg-green-50">
                                Paid in Full
                            </Button>
                        )}
                    </CardFooter>
                </Card>

                <div className="text-center text-xs text-muted-foreground mt-8">
                    Powered by InvoiceSlayer
                </div>
            </div>
        </div>
    );
}
