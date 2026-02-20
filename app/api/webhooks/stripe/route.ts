import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { createNotification } from "@/app/actions/notifications";
import { logAuditEvent } from "@/lib/audit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
    apiVersion: "2026-01-28.clover" as any,
    typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("stripe-signature") as string;

    let event: Stripe.Event;

    try {
        if (!signature || !webhookSecret) {
            return new NextResponse("Webhook secret or signature missing", { status: 400 });
        }
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return new NextResponse("Bad Request", { status: 400 });
    }

    try {
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const invoiceId = session.metadata?.invoiceId;

            if (invoiceId) {
                // Fetch invoice with userId and current payment state
                const invoice = await prisma.invoice.findUnique({
                    where: { id: invoiceId },
                    select: { number: true, userId: true, total: true, amountPaid: true }
                });

                if (!invoice) return new NextResponse("Invoice not found", { status: 404 });

                const userId = invoice.userId;
                const paymentAmount = session.amount_total ? session.amount_total / 100 : 0;
                const newAmountPaid = invoice.amountPaid + paymentAmount;
                const newStatus = newAmountPaid >= invoice.total ? "PAID" : "PARTIAL";

                // Update Invoice Status
                await prisma.invoice.update({
                    where: { id: invoiceId },
                    data: {
                        status: newStatus,
                        amountPaid: newAmountPaid,
                    }
                });

                // Create Payment Record
                const payment = await prisma.payment.create({
                    data: {
                        invoiceId: invoiceId,
                        amount: session.amount_total ? session.amount_total / 100 : 0,
                        date: new Date(),
                        method: "CREDIT_CARD",
                        notes: `Stripe Session: ${session.id}`
                    }
                });

                await logAuditEvent({
                    action: "UPDATE",
                    resource: "Invoice",
                    resourceId: invoiceId,
                    actor: "stripe-webhook",
                    userId,
                    metadata: { event: event.type, status: "PAID" }
                });

                await logAuditEvent({
                    action: "CREATE",
                    resource: "Payment",
                    resourceId: payment.id,
                    actor: "stripe-webhook",
                    userId,
                    metadata: { amount: payment.amount }
                });

                await createNotification({
                    type: "SUCCESS",
                    title: "Stripe Payment Success",
                    message: `Payment of $${session.amount_total ? (session.amount_total / 100).toFixed(2) : 0} received for invoice ${invoice.number}`,
                    link: `/invoices/${invoiceId}`,
                    userId,
                });
            }
        }

        return new NextResponse(null, { status: 200 });
    } catch (error) {
        console.error("Error processing webhook:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
