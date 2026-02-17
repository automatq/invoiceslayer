"use server";

import { Resend } from "resend";
import Stripe from "stripe";

export async function verifyResendConnection(apiKey: string) {
    if (!apiKey || !apiKey.startsWith("re_")) {
        return { success: false, message: "Invalid API Key format" };
    }

    try {
        const resend = new Resend(apiKey);
        // Try to fetch domains as a lightweight verification
        const { error } = await resend.domains.list(); // or batch.list() which is empty by default usually

        if (error) {
            console.error("[Verify Resend] Error:", error);
            // Resend error objects usually have a message
            return { success: false, message: error.message || "Connection failed" };
        }

        return { success: true };
    } catch (e: any) {
        console.error("[Verify Resend] Exception:", e);
        return { success: false, message: e.message || "Connection failed" };
    }
}

export async function verifyStripeConnection(secretKey: string) {
    if (!secretKey || (!secretKey.startsWith("sk_") && !secretKey.startsWith("rk_"))) {
        return { success: false, message: "Invalid Secret Key format" };
    }

    try {
        const stripe = new Stripe(secretKey, {
            apiVersion: "2024-06-20", // Use a recent version or default
            typescript: true,
        });

        // Try to list 1 customer to verify auth
        await stripe.customers.list({ limit: 1 });

        return { success: true };
    } catch (e: any) {
        console.error("[Verify Stripe] Exception:", e);
        return { success: false, message: e.message || "Connection failed" };
    }
}
