import { getRecurringInvoices } from "@/app/actions/recurring";
import { InteractiveLink } from "@/components/ui/interactive-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar } from "lucide-react";
import { format } from "date-fns";
import { RecurringInvoiceActions } from "@/components/RecurringInvoiceActions";
import { ProcessRecurringAction } from "@/components/recurring/ProcessRecurringAction";

export const dynamic = "force-dynamic";

export default async function RecurringInvoicesPage() {
    const recurringInvoices = await getRecurringInvoices();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Recurring Invoices</h1>
                    <p className="text-muted-foreground">Manage automated invoice schedules.</p>
                </div>
                <div className="flex items-center gap-2">
                    <ProcessRecurringAction />
                    <InteractiveLink href="/recurring/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Recurring Invoice
                    </InteractiveLink>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Schedules</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead>Frequency</TableHead>
                                <TableHead>Next Run</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recurringInvoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No recurring invoices found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recurringInvoices.map((recurring: { id: string; client: { name: string }; frequency: string; nextRunDate: Date; isActive: boolean }) => (
                                    <TableRow key={recurring.id}>
                                        <TableCell className="font-medium">{recurring.client.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{recurring.frequency}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                                {format(new Date(recurring.nextRunDate), "PPP")}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={recurring.isActive ? "default" : "secondary"}>
                                                {recurring.isActive ? "Active" : "Paused"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <RecurringInvoiceActions id={recurring.id} />
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
