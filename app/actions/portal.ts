"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

export async function getClientByPortalToken(token: string) {
    if (!token) return null;

    const client = await prisma.client.findUnique({
        where: { portalToken: token },
        include: {
            invoices: {
                orderBy: { date: "desc" },
                select: {
                    id: true,
                    number: true,
                    date: true,
                    dueDate: true,
                    total: true,
                    amountPaid: true,
                    status: true,
                }
            },
            quotes: {
                orderBy: { date: "desc" },
                select: {
                    id: true,
                    number: true,
                    date: true,
                    expiryDate: true,
                    total: true,
                    status: true,
                }
            }
        }
    });

    return client;
}

export async function regeneratePortalToken(clientId: string) {
    try {
        const token = uuidv4();
        await prisma.client.update({
            where: { id: clientId },
            data: { portalToken: token },
        });

        revalidatePath(`/clients/${clientId}`);
        return { success: true, token };
    } catch (error) {
        console.error("Failed to regenerate token:", error);
        return { success: false, message: "Failed to regenerate token" };
    }
}

export async function ensureClientHasToken(clientId: string) {
    const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { portalToken: true }
    });

    if (client && !client.portalToken) {
        return await regeneratePortalToken(clientId);
    }

    return { success: true, token: client?.portalToken };
}
