"use server";

import { prisma } from "@/lib/prisma"; // Fixed import
import Stripe from "stripe";
import { headers } from "next/headers";

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("STRIPE_SECRET_KEY is missing in .env");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2026-01-28.clover" as any, // Cast to any to avoid strict typing issues with specific version strings if types are slightly off
    typescript: true,
});

export async function createCheckoutSession(invoiceId: string) {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                client: true,
                items: true,
            },
        });

        if (!invoice) {
            throw new Error("Invoice not found");
        }

        // Calculate remaining balance to ensure we don't overcharge if partially paid
        // (For this MVP we assume full payment or remaining balance payment)
        const pendingAmount = invoice.total - (invoice.amountPaid || 0);

        if (pendingAmount <= 0) {
            throw new Error("Invoice is already paid");
        }

        const host = (await headers()).get("host");
        const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
        const origin = `${protocol}://${host}`;

        // Create session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd", // Should come from Settings
                        product_data: {
                            name: `Invoice #${invoice.number}`,
                            description: `Payment for invoice #${invoice.number}`,
                        },
                        unit_amount: Math.round(pendingAmount * 100), // Stripe expects cents
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${origin}/p/invoice/${invoice.id}?success=true`,
            cancel_url: `${origin}/p/invoice/${invoice.id}?canceled=true`,
            metadata: {
                invoiceId: invoice.id,
            },
        });

        if (!session.url) {
            throw new Error("Failed to create session URL");
        }

        return { url: session.url };

    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        throw new Error("Failed to create checkout session");
    }
}
