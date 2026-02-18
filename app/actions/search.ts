"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function getSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session;
}

export async function searchClients(query: string) {
    const session = await getSession();
    if (!query || query.length < 2) return [];

    const clients = await prisma.client.findMany({
        where: {
            userId: session.user.id,
            OR: [
                { name: { contains: query } },
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
    const session = await getSession();
    if (!query || query.length < 2) return [];

    const invoices = await prisma.invoice.findMany({
        where: {
            userId: session.user.id,
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
