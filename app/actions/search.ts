"use server";

import { prisma } from "@/lib/prisma";

export async function searchClients(query: string) {
    if (!query || query.length < 2) return [];

    const clients = await prisma.client.findMany({
        where: {
            OR: [
                { name: { contains: query } }, // Case-insensitive by default in SQLite/Postgres usually or depends on collation
                { email: { contains: query } },
            ],
        },
        take: 5,
        select: {
            id: true,
            name: true,
            email: true,
        },
    });

    return clients;
}

export async function searchInvoices(query: string) {
    if (!query || query.length < 2) return [];

    const invoices = await prisma.invoice.findMany({
        where: {
            OR: [
                { number: { contains: query } },
                { client: { name: { contains: query } } },
            ],
        },
        take: 5,
        include: {
            client: {
                select: { name: true },
            },
        },
        orderBy: {
            createdAt: "desc",
        }
    });

    return invoices.map(inv => ({
        id: inv.id,
        number: inv.number,
        clientName: inv.client.name,
        total: inv.total,
        status: inv.status,
    }));
}
