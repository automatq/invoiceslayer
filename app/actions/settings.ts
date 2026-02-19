"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";
import { logAuditEvent } from "@/lib/audit";
import { auth } from "@/lib/auth";

async function getRequiredSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return { userId: session.user.id, session };
}

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
    const { userId } = await getRequiredSession();
    try {
        console.log("Creating settings for user:", userId, "data:", data);
        
        // Ensure required fields are present
        if (!data.companyName || !data.companyEmail) {
            return { success: false, message: "Company name and email are required" };
        }
        
        // Convert empty strings to null for optional fields
        const createData = {
            companyName: data.companyName,
            companyEmail: data.companyEmail,
            companyAddress: data.companyAddress || null,
            companyPhone: data.companyPhone || null,
            companyLogo: data.companyLogo || null,
            companyWebsite: data.companyWebsite || null,
            companyTaxId: data.companyTaxId || null,
            paymentInstructions: data.paymentInstructions || null,
            currency: data.currency || "USD",
            defaultTaxRate: data.defaultTaxRate ?? 13,
            invoiceTemplate: data.invoiceTemplate || "modern",
            quoteTemplate: data.quoteTemplate || "modern",
            resendApiKey: data.resendApiKey || null,
            stripePublishableKey: data.stripePublishableKey || null,
            stripeSecretKey: data.stripeSecretKey || null,
            cryptoWalletAddress: data.cryptoWalletAddress || null,
            localAiUrl: data.localAiUrl || "http://localhost:11434/v1",
            localAiModel: data.localAiModel || "llama3",
        };
        
        // Try to find existing settings
        const existing = await prisma.setting.findFirst({
            where: { userId }
        });
        
        if (existing) {
            // Update existing
            await prisma.setting.update({
                where: { id: existing.id },
                data: createData
            });
        } else {
            // Create new - try with userId first
            try {
                await prisma.setting.create({
                    data: {
                        ...createData,
                        userId
                    }
                });
            } catch (err: any) {
                // If userId column doesn't exist, create without it
                if (err.message?.includes("userId")) {
                    await prisma.setting.create({
                        data: createData as any
                    });
                } else {
                    throw err;
                }
            }
        }
        
        revalidatePath("/settings");
        await logAuditEvent({
            action: "SETTINGS_CHANGE",
            resource: "Settings",
            userId
        });
        return { success: true };
    } catch (e: any) {
        console.error("Settings save error:", e);
        return { success: false, message: e.message || "Failed to save settings" };
    }
}

export async function getSettings(userId?: string) {
    noStore();
    try {
        let finalUserId = userId;

        if (!finalUserId) {
            const session = await auth();
            if (!session?.user?.id) return null;
            finalUserId = session.user.id;
        }

        // Try with userId first, fallback to first record if column doesn't exist
        try {
            const settings = await prisma.setting.findFirst({
                where: { userId: finalUserId }
            });
            if (settings) return settings;
        } catch (err: any) {
            if (!err.message?.includes("userId")) throw err;
        }
        
        // Fallback: return first setting (for databases without userId column)
        const fallback = await prisma.setting.findFirst();
        return fallback;
    } catch (e) {
        console.error("Error getting settings:", e);
        return null;
    }
}

export async function getCompanyLogo(userId?: string) {
    noStore();
    try {
        let finalUserId = userId;

        if (!finalUserId) {
            const session = await auth();
            if (!session?.user?.id) return null;
            finalUserId = session.user.id;
        }

        const settings = await prisma.setting.findUnique({
            where: { userId: finalUserId },
            select: { companyLogo: true }
        });
        return settings?.companyLogo;
    } catch (e) {
        console.error("Error getting logo:", e);
        return null;
    }
}

export async function purgeAllData() {
    const { userId } = await getRequiredSession();
    try {
        await prisma.$transaction([
            prisma.payment.deleteMany({ where: { invoice: { userId } } }),
            prisma.invoiceItem.deleteMany({ where: { invoice: { userId } } }),
            prisma.invoice.deleteMany({ where: { userId } }),
            prisma.quoteItem.deleteMany({ where: { quote: { userId } } }),
            prisma.quote.deleteMany({ where: { userId } }),
            prisma.recurringInvoice.deleteMany({ where: { userId } }),
            prisma.client.deleteMany({ where: { userId } }),
            prisma.notification.deleteMany({ where: { userId } }),
            prisma.expense.deleteMany({ where: { userId } }),
            prisma.project.deleteMany({ where: { userId } }),
        ]);

        revalidatePath("/");
        revalidatePath("/invoices");
        revalidatePath("/clients");
        revalidatePath("/quotes");
        revalidatePath("/expenses");
        revalidatePath("/recurring");

        await logAuditEvent({
            action: "DATA_PURGE",
            resource: "System",
            userId,
            metadata: { purgedAt: new Date().toISOString() }
        });
        return { success: true };
    } catch (e) {
        console.error("Purge failed:", e);
        return { success: false, message: "Failed to purge data" };
    }
}
