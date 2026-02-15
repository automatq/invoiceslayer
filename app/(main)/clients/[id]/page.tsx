import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, FileText, FileSpreadsheet } from "lucide-react";
import { getClient } from "@/app/actions/clients";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const client = await getClient(id);

    if (!client) {
        notFound();
    }

    const { invoices = [], quotes = [] } = client as any;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/clients">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
                    <div className="text-muted-foreground">{client.email}</div>
                </div>
                <Button asChild>
                    <Link href={`/clients/${client.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Client
                    </Link>
                </Button>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="invoices">
                        Invoices ({invoices.length})
                    </TabsTrigger>
                    <TabsTrigger value="quotes">
                        Quotes ({quotes.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Client Details</CardTitle>
                            <CardDescription>Personal and contact information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarFallback className="text-2xl">
                                        {client.name
                                            .split(" ")
                                            .map((n: string) => n[0])
                                            .join("")
                                            .toUpperCase()
                                            .slice(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <div className="font-semibold text-xl">{client.name}</div>
                                    <div className="text-muted-foreground">{client.id}</div>
                                </div>
                            </div>
                            <Separator />
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">Email</span>
                                    <div className="font-medium">{client.email}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">Phone</span>
                                    <div className="font-medium">{client.phone || "N/A"}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">Address</span>
                                    <div className="font-medium md:col-span-2">{client.address || "N/A"}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">GST/HST Number</span>
                                    <div className="font-medium">{client.vatNumber || "N/A"}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="invoices">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoices</CardTitle>
                            <CardDescription>History of invoices for this client.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Number</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                No invoices found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        invoices.map((inv: any) => (
                                            <TableRow key={inv.id}>
                                                <TableCell className="font-medium">{inv.number}</TableCell>
                                                <TableCell>{new Date(inv.date).toLocaleDateString()}</TableCell>
                                                <TableCell>${inv.total.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <StatusBadge status={inv.status} />
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/invoices/${inv.id}`}>
                                                            <FileSpreadsheet className="h-4 w-4" />
                                                            <span className="sr-only">View</span>
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="quotes">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quotes</CardTitle>
                            <CardDescription>History of quotes for this client.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Number</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Expiry</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quotes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                No quotes found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        quotes.map((quote: any) => (
                                            <TableRow key={quote.id}>
                                                <TableCell className="font-medium">{quote.number}</TableCell>
                                                <TableCell>{new Date(quote.date).toLocaleDateString()}</TableCell>
                                                <TableCell>{new Date(quote.expiryDate).toLocaleDateString()}</TableCell>
                                                <TableCell>${quote.total.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <StatusBadge status={quote.status} />
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/quotes/${quote.id}`}>
                                                            <FileText className="h-4 w-4" />
                                                            <span className="sr-only">View</span>
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
