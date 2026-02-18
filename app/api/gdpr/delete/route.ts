import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getIdentifier } from "@/lib/rate-limit";

/** Authenticate request using the stored agent API key */
async function authenticate(req: NextRequest): Promise<boolean> {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return false;
    const token = authHeader.split(" ")[1];
    const setting = await prisma.setting.findFirst({ select: { agentApiKey: true } });
    return !!(setting?.agentApiKey && setting.agentApiKey === token);
}

/**
 * DELETE /api/gdpr/delete?clientId=xxx
 * Permanently deletes a client and all their associated data.
 * GDPR Art. 17 — Right to Erasure ("Right to be Forgotten")
 */
export async function DELETE(req: NextRequest) {
    if (!await authenticate(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
        return NextResponse.json({ error: "Missing clientId query parameter" }, { status: 400 });
    }

    try {
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            select: { id: true, name: true, email: true },
        });

        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        // Delete in dependency order
        await prisma.$transaction(async (tx) => {
            // Get invoice IDs for this client
            const invoices = await tx.invoice.findMany({
                where: { clientId },
                select: { id: true },
            });
            const invoiceIds = invoices.map((i) => i.id);

            // Delete payments and items tied to those invoices
            await tx.payment.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
            await tx.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
            await tx.escrowContract.deleteMany({ where: { invoiceId: { in: invoiceIds } } });

            // Get quote IDs
            const quotes = await tx.quote.findMany({
                where: { clientId },
                select: { id: true },
            });
            const quoteIds = quotes.map((q) => q.id);
            await tx.quoteItem.deleteMany({ where: { quoteId: { in: quoteIds } } });

            // Delete top-level records
            await tx.invoice.deleteMany({ where: { clientId } });
            await tx.quote.deleteMany({ where: { clientId } });
            await tx.recurringInvoice.deleteMany({ where: { clientId } });
            await tx.project.deleteMany({ where: { clientId } });
            await tx.client.delete({ where: { id: clientId } });
        });

        await logAuditEvent({
            action: "DELETE",
            resource: "Client",
            resourceId: clientId,
            actor: "gdpr-request",
            ipAddress: getIdentifier(req),
            metadata: { gdprErasure: true, clientEmail: client.email },
        });

        return NextResponse.json({
            success: true,
            message: "Client and all associated data have been permanently deleted.",
            deletedClientId: clientId,
            deletedAt: new Date().toISOString(),
            gdprNote: "This deletion fulfills a GDPR Art. 17 Right to Erasure request.",
        });
    } catch (error) {
        console.error("[GDPR Delete] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
