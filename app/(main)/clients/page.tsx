import Link from "next/link";
import { Plus } from "lucide-react";
import { getClients, getClientsByRevenue } from "@/app/actions/clients";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { InteractiveLink } from "@/components/ui/interactive-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClientActions } from "@/components/ClientActions";
import { ClientRevenueChart } from "@/components/ClientRevenueChart";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
    const clients = await getClients();
    const topClients = await getClientsByRevenue();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                <InteractiveLink href="/clients/new">
                    <Plus className="mr-2 h-4 w-4" />
                    New Client
                </InteractiveLink>
            </div>

            {topClients.length > 0 && (
                <ClientRevenueChart data={topClients} />
            )}

            <Card>
                <CardHeader>
                    <CardTitle>All Clients</CardTitle>
                    <CardDescription>Manage your client base and view their details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]"></TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-24 text-center"
                                    >
                                        No clients found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                clients.map((client: any) => (
                                    <TableRow key={client.id}>
                                        <TableCell>
                                            <Avatar>
                                                <AvatarFallback>
                                                    {client.name
                                                        .split(" ")
                                                        .map((n: string) => n[0])
                                                        .join("")
                                                        .toUpperCase()
                                                        .slice(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell className="font-medium">{client.name}</TableCell>
                                        <TableCell>{client.email}</TableCell>
                                        <TableCell>{client.phone || "-"}</TableCell>
                                        <TableCell>
                                            {new Date(client.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <ClientActions id={client.id} />
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


