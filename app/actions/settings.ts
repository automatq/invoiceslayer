"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";
import { logAuditEvent } from "@/lib/audit";
import { auth } from "@/lib/auth";


async function getRequiredSession() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
        throw new Error("Unauthorized");
    }
    return { userId, session };
}

async function getOptionalSession(userId?: string) {
    if (userId) return userId;
    const session = await auth();
    return session?.user?.id || null;
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

        // Ensure user exists in the local database (Requirement for foreign key in Setting model)
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
            console.log("Creating shadow user for:", userId);
            const email = data.companyEmail || `${userId}@placeholder.com`;
            const name = data.companyName || "Local User";

            await prisma.user.create({
                data: {
                    id: userId,
                    clerkId: userId,
                    email,
                    name,
                }
            });
        }

        if (!data.companyName || !data.companyEmail) {
            return { success: false, message: "Company name and email are required" };
        }

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

        await prisma.setting.upsert({
            where: { userId },
            update: createData,
            create: { ...createData, userId }
        });

        // Initialize default Team and Pipeline for fresh users
        const existingTeam = await prisma.teamMember.findFirst({
            where: { userId }
        });

        if (!existingTeam) {
            console.log(`[createSettings] Initializing fresh account for user: ${userId}`);

            // Generate a slug from company name
            let slug = data.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            if (!slug) slug = `team-${userId.slice(-5)}`;

            // Ensure unique slug
            const slugExists = await prisma.team.findUnique({ where: { slug } });
            if (slugExists) slug = `${slug}-${Math.random().toString(36).substring(2, 5)}`;

            const team = await prisma.team.create({
                data: {
                    name: data.companyName,
                    slug,
                    members: {
                        create: {
                            userId,
                            role: "OWNER"
                        }
                    }
                }
            });

            // Create default "Main Pipeline" with stages
            await prisma.pipeline.create({
                data: {
                    name: "Main Pipeline",
                    userId,
                    teamId: team.id,
                    isDefault: true,
                    stages: {
                        create: [
                            { name: "Lead", order: 1, color: "#3b82f6", probability: 10 },
                            { name: "Contacted", order: 2, color: "#f59e0b", probability: 30 },
                            { name: "Proposal", order: 3, color: "#8b5cf6", probability: 60 },
                            { name: "Negotiation", order: 4, color: "#ec4899", probability: 80 },
                            { name: "Won", order: 5, color: "#10b981", probability: 100 },
                            { name: "Lost", order: 6, color: "#ef4444", probability: 0 },
                        ]
                    }
                }
            });

            // Link team to settings
            await prisma.setting.update({
                where: { userId },
                data: { teamId: team.id }
            });
        }

        revalidatePath("/settings");
        await logAuditEvent({ action: "SETTINGS_CHANGE", resource: "Settings", userId });
        return { success: true };
    } catch (e: any) {
        console.error("Settings save error:", e);
        return { success: false, message: e.message || "Failed to save settings" };
    }
}

export async function getSettings(userId?: string) {
    noStore();
    try {
        const finalUserId = await getOptionalSession(userId);
        if (!finalUserId) return null;
        return await prisma.setting.findUnique({ where: { userId: finalUserId } });
    } catch (e) {
        console.error("Error getting settings:", e);
        return null;
    }
}

export async function getCompanyLogo(userId?: string) {
    noStore();
    try {
        const finalUserId = await getOptionalSession(userId);
        if (!finalUserId) return null;
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
        console.log(`[Purge] Starting comprehensive data purge for user: ${userId}`);

        // 1. Fetch parent IDs first (SQLite does not support nested filters in deleteMany)
        const [invoices, quotes, deals, pipelines] = await Promise.all([
            prisma.invoice.findMany({ where: { userId }, select: { id: true } }),
            prisma.quote.findMany({ where: { userId }, select: { id: true } }),
            prisma.deal.findMany({ where: { userId }, select: { id: true } }),
            prisma.pipeline.findMany({ where: { userId }, select: { id: true } }),
        ]);

        const invoiceIds = invoices.map(i => i.id);
        const quoteIds = quotes.map(q => q.id);
        const dealIds = deals.map(d => d.id);
        const pipelineIds = pipelines.map(p => p.id);

        console.log(`[Purge] Collected IDs: ${invoiceIds.length} invoices, ${quoteIds.length} quotes, ${dealIds.length} deals, ${pipelineIds.length} pipelines`);

        await prisma.$transaction([
            // Delete Children using collected IDs
            prisma.payment.deleteMany({ where: { invoiceId: { in: invoiceIds } } }),
            prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } }),
            prisma.quoteItem.deleteMany({ where: { quoteId: { in: quoteIds } } }),
            prisma.dealActivity.deleteMany({ where: { dealId: { in: dealIds } } }),
            prisma.dealNote.deleteMany({ where: { dealId: { in: dealIds } } }),
            prisma.pipelineStage.deleteMany({ where: { pipelineId: { in: pipelineIds } } }),

            // Delete Parents and Single Models
            prisma.invoice.deleteMany({ where: { userId } }),
            prisma.quote.deleteMany({ where: { userId } }),
            prisma.recurringInvoice.deleteMany({ where: { userId } }),
            prisma.deal.deleteMany({ where: { userId } }),
            prisma.pipeline.deleteMany({ where: { userId } }),
            prisma.client.deleteMany({ where: { userId } }),
            prisma.notification.deleteMany({ where: { userId } }),
            prisma.expense.deleteMany({ where: { userId } }),
            prisma.project.deleteMany({ where: { userId } }),
            prisma.profitBucket.deleteMany({ where: { userId } }),
            prisma.expenseBudget.deleteMany({ where: { userId } }),
            prisma.financialGoal.deleteMany({ where: { userId } }),
            prisma.auditLog.deleteMany({ where: { userId } }),
            prisma.invoiceTemplate.deleteMany({ where: { userId } }),
        ]);

        console.log(`[Purge] Transaction completed successfully for user: ${userId}`);

        revalidatePath("/");
        revalidatePath("/invoices");
        revalidatePath("/clients");
        revalidatePath("/quotes");
        revalidatePath("/expenses");
        revalidatePath("/recurring");
        revalidatePath("/pipeline");

        await logAuditEvent({
            action: "DATA_PURGE",
            resource: "System",
            userId,
            metadata: { purgedAt: new Date().toISOString() }
        });

        return { success: true };
    } catch (e: any) {
        console.error("[Purge] Critical failure:", e);
        return { success: false, message: `Purge failed: ${e.message || "Unknown error"}` };
    }
}
