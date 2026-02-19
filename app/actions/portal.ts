"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { createNotification } from "@/app/actions/notifications";
import { logAuditEvent } from "@/lib/audit";

async function getRequiredSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return { userId: session.user.id, session };
}

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
    const { userId } = await getRequiredSession();
    try {
        const token = uuidv4();
        await prisma.client.update({
            where: {
                id: clientId,
                userId,
            },
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
    const { userId } = await getRequiredSession();
    const client = await prisma.client.findUnique({
        where: {
            id: clientId,
            userId,
        },
        select: { portalToken: true }
    });

    if (client && !client.portalToken) {
        return await regeneratePortalToken(clientId);
    }

    return { success: true, token: client?.portalToken };
}

export async function getClientDeals(token: string) {
    if (!token) return [];

    const deals = await prisma.deal.findMany({
        where: {
            client: { portalToken: token }
        },
        orderBy: { updatedAt: "desc" },
        include: {
            stage: true,
            pipeline: true,
            quotes: {
                select: {
                    id: true,
                    number: true,
                    total: true,
                    status: true,
                }
            },
            invoices: {
                select: {
                    id: true,
                    number: true,
                    total: true,
                    status: true,
                }
            }
        }
    });

    return deals;
}

export async function acceptQuoteViaPortal(quoteId: string, token: string) {
    if (!token) return { success: false, message: "Invalid token" };

    const client = await prisma.client.findUnique({
        where: { portalToken: token },
        include: {
            quotes: {
                where: { id: quoteId }
            }
        }
    });

    if (!client) {
        return { success: false, message: "Client not found" };
    }

    const quote = client.quotes[0];
    if (!quote) {
        return { success: false, message: "Quote not found" };
    }

    if (quote.status !== "SENT") {
        return { success: false, message: "Quote cannot be accepted" };
    }

    const quoteWithItems = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { items: true, client: true, user: true }
    });

    if (!quoteWithItems) {
        return { success: false, message: "Quote not found" };
    }

    const lastInvoice = await prisma.invoice.findFirst({
        where: { userId: quoteWithItems.userId },
        orderBy: { createdAt: "desc" },
    });

    let nextNumber = "INV-001";
    if (lastInvoice && lastInvoice.number.startsWith("INV-")) {
        const lastNumNum = parseInt(lastInvoice.number.split("-")[1], 10);
        if (!isNaN(lastNumNum)) {
            nextNumber = `INV-${String(lastNumNum + 1).padStart(3, "0")}`;
        }
    }

    try {
        const result = await prisma.$transaction(async (tx: any) => {
            const invoice = await tx.invoice.create({
                data: {
                    number: nextNumber,
                    clientId: quoteWithItems.clientId,
                    userId: quoteWithItems.userId,
                    date: new Date(),
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    status: "SENT",
                    total: quoteWithItems.total,
                    subtotal: quoteWithItems.subtotal,
                    taxTotal: quoteWithItems.taxTotal,
                    items: {
                        create: quoteWithItems.items.map((item: any) => ({
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            amount: item.amount,
                            taxRate: item.taxRate,
                            taxAmount: item.taxAmount,
                        })),
                    },
                },
            });

            await tx.quote.update({
                where: { id: quoteId },
                data: { status: "ACCEPTED" },
            });

            return { id: invoice.id, number: invoice.number };
        });

        await logAuditEvent({
            action: "UPDATE",
            resource: "Quote",
            resourceId: quoteId,
            userId: quoteWithItems.userId,
            metadata: { 
                action: "ACCEPTED_VIA_PORTAL",
                convertedToInvoice: result.id,
                clientId: client.id
            }
        });

        await createNotification({
            type: "SUCCESS",
            title: "Quote Accepted via Portal",
            message: `Quote ${quoteWithItems.number} was accepted by ${client.name} and converted to Invoice ${result.number}`,
            link: `/invoices/${result.id}`,
            userId: quoteWithItems.userId
        });

        revalidatePath(`/portal/${token}`);
        return { success: true, invoiceId: result.id, invoiceNumber: result.number };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to accept quote" };
    }
}

export async function rejectQuoteViaPortal(quoteId: string, token: string, reason?: string) {
    if (!token) return { success: false, message: "Invalid token" };

    const client = await prisma.client.findUnique({
        where: { portalToken: token },
        include: {
            quotes: {
                where: { id: quoteId }
            }
        }
    });

    if (!client) {
        return { success: false, message: "Client not found" };
    }

    const quote = client.quotes[0];
    if (!quote) {
        return { success: false, message: "Quote not found" };
    }

    if (quote.status !== "SENT") {
        return { success: false, message: "Quote cannot be rejected" };
    }

    try {
        await prisma.quote.update({
            where: { id: quoteId },
            data: { status: "REJECTED" },
        });

        await logAuditEvent({
            action: "UPDATE",
            resource: "Quote",
            resourceId: quoteId,
            userId: client.userId,
            metadata: { 
                action: "REJECTED_VIA_PORTAL",
                reason: reason || "No reason provided",
                clientId: client.id
            }
        });

        await createNotification({
            type: "WARNING",
            title: "Quote Rejected via Portal",
            message: `Quote ${quote.number} was rejected by ${client.name}${reason ? `: ${reason}` : ""}`,
            link: `/quotes/${quoteId}`,
            userId: client.userId
        });

        revalidatePath(`/portal/${token}`);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to reject quote" };
    }
}
