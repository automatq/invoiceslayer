import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { rateLimit, getIdentifier } from "@/lib/rate-limit";

// Helper for authorized checks
async function authenticate(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    const token = authHeader.split(" ")[1];

    const setting = await db.setting.findUnique({
        where: { agentApiKey: token },
        select: { userId: true }
    });

    return setting?.userId || null;
}

export async function GET(req: NextRequest) {
    const rl = rateLimit(`agent:${getIdentifier(req)}`, { limit: 60, windowSec: 60 });
    if (!rl.success) {
        return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }

    const userId = await authenticate(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const resource = searchParams.get("resource");

    try {
        if (resource === "user") {
            const setting = await db.setting.findUnique({ where: { userId } });
            return NextResponse.json({
                companyName: setting?.companyName,
                email: setting?.companyEmail,
                currency: setting?.currency
            });
        }

        if (resource === "clients") {
            const clients = await db.client.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                select: { id: true, name: true, email: true, phone: true }
            });
            return NextResponse.json(clients);
        }

        if (resource === "invoices") {
            const invoices = await db.invoice.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: 50,
                include: { client: { select: { name: true } } }
            });
            return NextResponse.json(invoices);
        }

        if (resource === "projects") {
            const projects = await db.project.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                include: { client: { select: { name: true } } }
            });
            return NextResponse.json(projects);
        }

        return NextResponse.json({
            message: "Welcome to InvoiceMaster Agent API",
            available_resources: ["user", "clients", "invoices", "projects"],
            documentation: "/api/docs/openapi.json"
        });

    } catch (error: any) {
        console.error("[Agent GET] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const rl = rateLimit(`agent:${getIdentifier(req)}`, { limit: 60, windowSec: 60 });
    if (!rl.success) {
        return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }

    const userId = await authenticate(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const resource = searchParams.get("resource");

    try {
        const body = await req.json();

        if (resource === "clients") {
            const client = await db.client.create({
                data: {
                    name: body.name,
                    email: body.email,
                    address: body.address,
                    phone: body.phone,
                    userId,
                }
            });
            await logAuditEvent({ action: "CREATE", resource: "Client", resourceId: client.id, actor: "api-key", userId });
            return NextResponse.json(client);
        }

        if (resource === "invoices") {
            // Generate a number (per user)
            let number = body.number;
            if (!number) {
                const count = await db.invoice.count({ where: { userId } });
                number = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, "0")}`;
            }

            const invoice = await db.invoice.create({
                data: {
                    number,
                    userId,
                    date: new Date(body.date || Date.now()),
                    dueDate: new Date(body.dueDate || Date.now() + 7 * 24 * 60 * 60 * 1000),
                    clientId: body.clientId,
                    status: body.status || "DRAFT",
                    total: body.total || 0,
                    items: {
                        create: body.items?.map((item: any) => ({
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            amount: item.quantity * item.unitPrice
                        }))
                    }
                }
            });
            await logAuditEvent({ action: "CREATE", resource: "Invoice", resourceId: invoice.id, actor: "api-key", userId });
            return NextResponse.json(invoice);
        }

        return NextResponse.json({ error: "Resource not supported for POST or missing resource param" }, { status: 400 });

    } catch (error: any) {
        console.error("[Agent POST] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const userId = await authenticate(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const resource = searchParams.get("resource");

    try {
        const body = await req.json();

        if (resource === "invoices") {
            const { id, status } = body;

            if (!id || !status) {
                return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
            }

            const updatedInvoice = await db.invoice.update({
                where: { id, userId },
                data: { status }
            });

            await logAuditEvent({ action: "UPDATE", resource: "Invoice", resourceId: id, actor: "api-key", userId, metadata: { status } });
            return NextResponse.json(updatedInvoice);
        }

        if (resource === "escrow") {
            const { invoiceId, status } = body;

            if (!invoiceId || !status) {
                return NextResponse.json({ error: "Missing invoiceId or status" }, { status: 400 });
            }

            // Check if user owns the invoice via a subquery or check beforehand
            const invoice = await db.invoice.findUnique({ where: { id: invoiceId, userId } });
            if (!invoice) return NextResponse.json({ error: "Invoice not found or unauthorized" }, { status: 404 });

            const updatedEscrow = await db.escrowContract.update({
                where: { invoiceId },
                data: { status }
            });

            await logAuditEvent({ action: "UPDATE", resource: "Invoice", resourceId: invoiceId, actor: "api-key", userId, metadata: { escrowStatus: status } });
            return NextResponse.json(updatedEscrow);
        }

        return NextResponse.json({ error: "Resource not supported for PATCH" }, { status: 400 });

    } catch (error: any) {
        console.error("[Agent PATCH] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
