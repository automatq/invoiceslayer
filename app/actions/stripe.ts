"use server";


import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { headers } from "next/headers";
import { getSettings } from "@/app/actions/settings";

const defaultStripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
    apiVersion: "2026-01-28.clover" as any,
    typescript: true,
});

async function getStripeClient(settings: any) {
    if (settings?.stripeSecretKey) {
        return new Stripe(settings.stripeSecretKey, {
            apiVersion: "2026-01-28.clover" as any,
            typescript: true,
        });
    }
    return defaultStripe;
}

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

        const settings = await getSettings();
        const stripe = await getStripeClient(settings);
        const currency = settings?.currency?.toLowerCase() || "usd";

        const host = (await headers()).get("host");
        const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
        const origin = `${protocol}://${host}`;

        // Create session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: currency,
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

export async function createPortalCheckoutSession(invoiceId: string, portalToken: string) {
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

        // Verify portal token matches client
        if (invoice.client.portalToken !== portalToken) {
            throw new Error("Unauthorized access");
        }

        // Calculate remaining balance
        const pendingAmount = invoice.total - (invoice.amountPaid || 0);

        if (pendingAmount <= 0) {
            throw new Error("Invoice is already paid");
        }

        const settings = await getSettings();
        const stripe = await getStripeClient(settings);
        const currency = settings?.currency?.toLowerCase() || "usd";

        const host = (await headers()).get("host");
        const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
        const origin = `${protocol}://${host}`;

        // Create session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: currency,
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
            success_url: `${origin}/portal/${portalToken}?success=true&invoiceId=${invoice.id}`,
            cancel_url: `${origin}/portal/${portalToken}?canceled=true`,
            metadata: {
                invoiceId: invoice.id,
                source: "portal",
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
