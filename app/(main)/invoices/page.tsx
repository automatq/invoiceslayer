import Link from "next/link";
import { Plus } from "lucide-react";
import { getInvoices } from "@/app/actions/invoices";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { InteractiveLink } from "@/components/ui/interactive-link";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceRowActions } from "@/components/InvoiceRowActions";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
    const invoices = await getInvoices();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
                <InteractiveLink href="/invoices/new">
                    <Plus className="mr-2 h-4 w-4" />
                    New Invoice
                </InteractiveLink>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Invoices</CardTitle>
                    <CardDescription>Track and manage your invoices.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Number</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="h-24 text-center"
                                    >
                                        No invoices found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invoices.map((invoice: any) => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                                                {invoice.number}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{invoice.client.name}</TableCell>
                                        <TableCell>
                                            {new Date(invoice.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(invoice.dueDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            ${invoice.total.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={invoice.status} />
                                        </TableCell>
                                        <TableCell>
                                            <InvoiceRowActions invoice={invoice} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
