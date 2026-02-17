import { getExpenses } from "@/app/actions/expenses";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ExpenseActions } from "@/components/expenses/ExpenseActions";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { Expense } from "@prisma/client";
import { ImportExpensesDialog } from "@/components/expenses/ImportExpensesDialog";

import { InteractiveButton } from "@/components/ui/interactive-button";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
    const expenses = await getExpenses();

    const totalExpenses = expenses.reduce((acc: number, curr: Expense) => acc + curr.amount, 0);

    // Group expenses by category for a quick summary
    const categorySummary = expenses.reduce((acc: Record<string, number>, curr: Expense) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {});

    const topCategory = Object.entries(categorySummary).sort((a, b) => b[1] - a[1])[0];

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
                    <p className="text-muted-foreground">
                        Track and manage your business expenses.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <ImportExpensesDialog />
                    <Dialog>
                        <DialogTrigger asChild>
                            <InteractiveButton>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Expense
                            </InteractiveButton>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add New Expense</DialogTitle>
                                <DialogDescription>
                                    Enter the details of your expense. Attach a receipt if available.
                                </DialogDescription>
                            </DialogHeader>
                            <ExpenseForm />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <Download className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            Lifetime expenses
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Category</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">
                            {topCategory ? topCategory[0] : "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {topCategory ? `$${topCategory[1].toFixed(2)}` : "No data"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Expense History</CardTitle>
                    <CardDescription>
                        A list of all your recorded expenses.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Receipt</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No expenses recorded yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                expenses.map((expense) => (
                                    <TableRow key={expense.id}>
                                        <TableCell className="font-medium">
                                            {format(new Date(expense.date), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>{expense.description}</TableCell>
                                        <TableCell className="capitalize">{expense.category}</TableCell>
                                        <TableCell>
                                            {expense.receipt ? (
                                                <a
                                                    href={expense.receipt}
                                                    download={`receipt-${expense.id}.png`}
                                                    className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                                                >
                                                    <FileText className="h-3 w-3" /> View
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-red-600">
                                            -${expense.amount.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <ExpenseActions expense={expense} />
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
