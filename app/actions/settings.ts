"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";
import { logAuditEvent } from "@/lib/audit";

export type SettingsFormValues = {
    companyName: string;
    companyEmail: string;
    companyAddress?: string;
    companyPhone?: string;
    companyLogo?: string;
    companyWebsite?: string;
    companyTaxId?: string;
    paymentInstructions?: string;
    currency: string;
    defaultTaxRate: number;
    invoiceTemplate: string;
    quoteTemplate: string;
    resendApiKey?: string;
    stripePublishableKey?: string;
    stripeSecretKey?: string;
    cryptoWalletAddress?: string;
    localAiUrl?: string;
    localAiModel?: string;
};

export async function createSettings(data: SettingsFormValues) {
    try {
        const existing = await prisma.setting.findFirst();
        if (existing) {
            await prisma.setting.update({ where: { id: existing.id }, data });
        } else {
            await prisma.setting.create({ data });
        }
        revalidatePath("/");
        await logAuditEvent({ action: "SETTINGS_CHANGE", resource: "Settings" });
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to save settings" };
    }
}

export async function getSettings() {
    noStore();
    try {
        const settings = await prisma.setting.findFirst();
        if (settings) {
            console.log(`[getSettings] Found settings. Logo length: ${settings.companyLogo?.length || 0}`);
        } else {
            console.log("[getSettings] No settings found in DB");
        }
        // Return the full settings object, including localAi configuration
        return settings;
    } catch (e) {
        console.error("Error getting settings:", e);
        return null;
    }
}

export async function getCompanyLogo() {
    noStore();
    try {
        const settings = await prisma.setting.findFirst({
            select: { companyLogo: true }
        });
        console.log(`[getCompanyLogo] Length: ${settings?.companyLogo?.length || 0}`);
        return settings?.companyLogo;
    } catch (e) {
        console.error("Error getting logo:", e);
        return null;
    }
}

export async function purgeAllData() {
    try {
        await prisma.$transaction([
            prisma.payment.deleteMany(),
            prisma.invoiceItem.deleteMany(),
            prisma.invoice.deleteMany(),
            prisma.quoteItem.deleteMany(),
            prisma.quote.deleteMany(),
            prisma.recurringInvoice.deleteMany(),
            prisma.client.deleteMany(),
            prisma.notification.deleteMany(),
            prisma.expense.deleteMany(),
        ]);

        revalidatePath("/");
        revalidatePath("/invoices");
        revalidatePath("/clients");
        revalidatePath("/quotes");
        revalidatePath("/expenses");
        revalidatePath("/recurring");

        await logAuditEvent({ action: "DATA_PURGE", resource: "System", metadata: { purgedAt: new Date().toISOString() } });
        return { success: true };
    } catch (e) {
        console.error("Purge failed:", e);
        return { success: false, message: "Failed to purge data" };
    }
}
