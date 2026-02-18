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

    // In a real multi-tenant app, this would verify looking up by key
    // Here we check if it matches the stored single-tenant key
    const setting = await db.setting.findFirst();
    if (setting && setting.agentApiKey === token) {
        return true;
    }
    return null;
}

export async function GET(req: NextRequest) {
    const rl = rateLimit(`agent:${getIdentifier(req)}`, { limit: 60, windowSec: 60 });
    if (!rl.success) {
        return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }

    if (!await authenticate(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const resource = searchParams.get("resource"); // e.g., ?resource=clients

    try {
        if (resource === "user") {
            const setting = await db.setting.findFirst();
            return NextResponse.json({
                companyName: setting?.companyName,
                email: setting?.companyEmail,
                currency: setting?.currency
            });
        }

        if (resource === "clients") {
            const clients = await db.client.findMany({
                orderBy: { createdAt: "desc" },
                select: { id: true, name: true, email: true, phone: true }
            });
            return NextResponse.json(clients);
        }

        if (resource === "invoices") {
            const invoices = await db.invoice.findMany({
                orderBy: { createdAt: "desc" },
                take: 50,
                include: { client: { select: { name: true } } }
            });
            return NextResponse.json(invoices);
        }

        if (resource === "projects") {
            const projects = await db.project.findMany({
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

    if (!await authenticate(req)) {
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
                }
            });
            return NextResponse.json(client);
        }

        if (resource === "invoices") {
            // Basic invoices creation (simplified for agent)
            // Requires clientId, date, dueDate, items

            // Generate a number if not provided
            let number = body.number;
            if (!number) {
                const count = await db.invoice.count();
                number = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, "0")}`;
            }

            const invoice = await db.invoice.create({
                data: {
                    number,
                    date: new Date(body.date || Date.now()),
                    dueDate: new Date(body.dueDate || Date.now() + 7 * 24 * 60 * 60 * 1000),
                    clientId: body.clientId,
                    status: "DRAFT",
                    total: body.total || 0, // Should be calculated but trusting agent for now or 0
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
            await logAuditEvent({ action: "CREATE", resource: "Invoice", resourceId: invoice.id, actor: "api-key" });
            return NextResponse.json(invoice);
        }

        return NextResponse.json({ error: "Resource not supported for POST or missing resource param" }, { status: 400 });

    } catch (error: any) {
        console.error("[Agent POST] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    if (!await authenticate(req)) {
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
                where: { id },
                data: { status }
            });

            return NextResponse.json(updatedInvoice);
        }

        if (resource === "escrow") {
            const { invoiceId, status } = body;

            if (!invoiceId || !status) {
                return NextResponse.json({ error: "Missing invoiceId or status" }, { status: 400 });
            }

            const updatedEscrow = await db.escrowContract.update({
                where: { invoiceId },
                data: { status }
            });

            return NextResponse.json(updatedEscrow);
        }

        return NextResponse.json({ error: "Resource not supported for PATCH" }, { status: 400 });

    } catch (error: any) {
        console.error("[Agent PATCH] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
