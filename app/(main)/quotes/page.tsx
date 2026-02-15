import Link from "next/link";
import { Plus } from "lucide-react";
import { getQuotes } from "@/app/actions/quotes";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
    const quotes = await getQuotes();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
                <Button asChild>
                    <Link href="/quotes/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Quote
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Quotes</CardTitle>
                    <CardDescription>View and manage your quotes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Number</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quotes.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center"
                                    >
                                        No quotes found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                quotes.map((quote: any) => (
                                    <TableRow key={quote.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/quotes/${quote.id}`} className="hover:underline">
                                                {quote.number}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{quote.client.name}</TableCell>
                                        <TableCell>
                                            {new Date(quote.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            ${quote.total.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {quote.status}
                                            </Badge>
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
