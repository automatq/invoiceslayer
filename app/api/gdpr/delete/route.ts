import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getIdentifier } from "@/lib/rate-limit";

/** Authenticate request using the user's unique agent API key */
async function authenticate(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];

    const setting = await prisma.setting.findUnique({
        where: { agentApiKey: token },
        select: { userId: true }
    });

    return setting?.userId || null;
}

/**
 * DELETE /api/gdpr/delete?clientId=xxx
 * Permanently deletes a client and all their associated data, scoped to the user.
 */
export async function DELETE(req: NextRequest) {
    const userId = await authenticate(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
        return NextResponse.json({ error: "Missing clientId query parameter" }, { status: 400 });
    }

    try {
        const client = await prisma.client.findUnique({
            where: { id: clientId, userId },
            select: { id: true, name: true, email: true },
        });

        if (!client) {
            return NextResponse.json({ error: "Client not found or unauthorized" }, { status: 404 });
        }

        await prisma.$transaction(async (tx) => {
            const invoices = await tx.invoice.findMany({
                where: { clientId, userId },
                select: { id: true },
            });
            const invoiceIds = invoices.map((i) => i.id);

            await tx.payment.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
            await tx.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
            await tx.escrowContract.deleteMany({ where: { invoiceId: { in: invoiceIds } } });

            const quotes = await tx.quote.findMany({
                where: { clientId, userId },
                select: { id: true },
            });
            const quoteIds = quotes.map((q) => q.id);
            await tx.quoteItem.deleteMany({ where: { quoteId: { in: quoteIds } } });

            await tx.invoice.deleteMany({ where: { clientId, userId } });
            await tx.quote.deleteMany({ where: { clientId, userId } });
            await tx.recurringInvoice.deleteMany({ where: { clientId, userId } });
            await tx.project.deleteMany({ where: { clientId, userId } });
            await tx.client.delete({ where: { id: clientId, userId } });
        });

        await logAuditEvent({
            action: "DELETE",
            resource: "Client",
            resourceId: clientId,
            actor: "gdpr-request",
            ipAddress: getIdentifier(req),
            metadata: { gdprErasure: true, clientEmail: client.email },
            userId,
        });

        return NextResponse.json({
            success: true,
            message: "Client and all associated data have been permanently deleted.",
            deletedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[GDPR Delete] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
