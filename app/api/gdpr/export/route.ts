import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { rateLimit, getIdentifier } from "@/lib/rate-limit";

/** Authenticate request using the stored agent API key */
async function authenticate(req: NextRequest): Promise<boolean> {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return false;
    const token = authHeader.split(" ")[1];
    const setting = await prisma.setting.findFirst({ select: { agentApiKey: true } });
    return !!(setting?.agentApiKey && setting.agentApiKey === token);
}

export async function GET(req: NextRequest) {
    // Rate limit: 30 requests per minute per IP
    const id = getIdentifier(req);
    const rl = rateLimit(`gdpr-export:${id}`, { limit: 5, windowSec: 60 });
    if (!rl.success) {
        return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }

    if (!await authenticate(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const [clients, invoices, payments, expenses] = await Promise.all([
            prisma.client.findMany({
                select: {
                    id: true, name: true, email: true, address: true,
                    phone: true, vatNumber: true, createdAt: true,
                },
            }),
            prisma.invoice.findMany({
                select: {
                    id: true, number: true, date: true, dueDate: true,
                    status: true, total: true, clientId: true, createdAt: true,
                },
            }),
            prisma.payment.findMany({
                select: {
                    id: true, invoiceId: true, amount: true, date: true, method: true,
                },
            }),
            prisma.expense.findMany({
                select: {
                    id: true, description: true, amount: true, date: true, category: true,
                },
            }),
        ]);

        const exportData = {
            exportedAt: new Date().toISOString(),
            gdprNote: "This export contains all personal data held in InvoiceSlayer per GDPR Art. 20 (Right to Data Portability).",
            clients,
            invoices,
            payments,
            expenses,
        };

        await logAuditEvent({
            action: "EXPORT",
            resource: "DataExport",
            actor: "api-key",
            ipAddress: getIdentifier(req),
            metadata: { recordCounts: { clients: clients.length, invoices: invoices.length } },
        });

        return NextResponse.json(exportData, {
            headers: {
                "Content-Disposition": `attachment; filename="invoiceslayer-gdpr-export-${Date.now()}.json"`,
            },
        });
    } catch (error) {
        console.error("[GDPR Export] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
