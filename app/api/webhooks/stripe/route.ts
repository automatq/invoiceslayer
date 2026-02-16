import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
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
            // If no secret, we can't verify. Logic regarding development without secret could go here, 
            // but for security we fail.
            return new NextResponse("Webhook secret or signature missing", { status: 400 });
        }

        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    try {
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;

            // Retrieve metadata to find invoice ID
            const invoiceId = session.metadata?.invoiceId;

            if (invoiceId) {
                console.log(`Payment succeeded for invoice: ${invoiceId}`);

                // Update Invoice Status
                await prisma.invoice.update({
                    where: { id: invoiceId },
                    data: {
                        status: "PAID",
                        amountPaid: {
                            increment: session.amount_total ? session.amount_total / 100 : 0
                        }
                    }
                });

                // Create Payment Record
                await prisma.payment.create({
                    data: {
                        invoiceId: invoiceId,
                        amount: session.amount_total ? session.amount_total / 100 : 0,
                        date: new Date(),
                        method: "CREDIT_CARD",
                        notes: `Stripe Session: ${session.id}`
                    }
                });
            }
        }

        return new NextResponse(null, { status: 200 });

    } catch (error) {
        console.error("Error processing webhook:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
