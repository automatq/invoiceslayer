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
        const existing = await prisma.setting.findUnique({
            where: { userId }
        });

        if (existing) {
            await prisma.setting.update({
                where: { userId },
                data
            });
        } else {
            await prisma.setting.create({
                data: {
                    ...data,
                    userId
                }
            });
        }
        revalidatePath("/");
        revalidatePath("/settings");
        await logAuditEvent({
            action: "SETTINGS_CHANGE",
            resource: "Settings",
            userId
        });
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to save settings" };
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

        const settings = await prisma.setting.findUnique({
            where: { userId: finalUserId }
        });

        return settings;
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
