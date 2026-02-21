"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { createNotification } from "./notifications";

async function getRequiredSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return { userId: session.user.id, userName: session.user.name || "Unknown" };
}

// Pipeline Management
export async function getPipelines() {
    const { userId } = await getRequiredSession();
    return await prisma.pipeline.findMany({
        where: { userId },
        include: {
            stages: {
                orderBy: { order: "asc" },
                include: {
                    deals: {
                        include: {
                            client: true,
                            activities: {
                                orderBy: { createdAt: "desc" },
                                take: 1,
                            },
                        },
                        orderBy: { updatedAt: "desc" },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getPipeline(pipelineId: string) {
    const { userId } = await getRequiredSession();
    return await prisma.pipeline.findFirst({
        where: { id: pipelineId, userId },
        include: {
            stages: {
                orderBy: { order: "asc" },
                include: {
                    deals: {
                        include: {
                            client: true,
                            activities: {
                                orderBy: { createdAt: "desc" },
                                take: 1,
                            },
                        },
                        orderBy: { updatedAt: "desc" },
                    },
                },
            },
        },
    });
}

const CreatePipelineSchema = z.object({
    name: z.string().min(1, "Pipeline name is required"),
    stages: z.array(z.object({
        name: z.string().min(1),
        color: z.string().default("#3b82f6"),
        probability: z.number().default(0),
    })).min(1),
});

export async function createPipeline(data: z.infer<typeof CreatePipelineSchema>) {
    const { userId } = await getRequiredSession();
    const validated = CreatePipelineSchema.parse(data);

    try {
        const pipeline = await prisma.pipeline.create({
            data: {
                name: validated.name,
                userId,
                stages: {
                    create: validated.stages.map((stage, index) => ({
                        name: stage.name,
                        color: stage.color,
                        order: index,
                        probability: stage.probability,
                    })),
                },
            },
            include: { stages: true },
        });

        revalidatePath("/pipeline");
        await logAuditEvent({
            action: "CREATE",
            resource: "Pipeline",
            resourceId: pipeline.id,
            userId,
        });

        return { success: true, pipeline };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// Default pipeline for new users
export async function createDefaultPipeline() {
    const { userId } = await getRequiredSession();

    const existing = await prisma.pipeline.findFirst({
        where: { userId, isDefault: true },
    });

    if (existing) return { success: true, pipeline: existing };

    try {
        console.log(`[Pipeline] Creating default pipeline for user ${userId}`);
        const pipeline = await prisma.pipeline.create({
            data: {
                name: "Sales Pipeline",
                userId,
                isDefault: true,
                stages: {
                    create: [
                        { name: "Lead", color: "#94a3b8", order: 0, probability: 10 },
                        { name: "Qualified", color: "#3b82f6", order: 1, probability: 25 },
                        { name: "Proposal", color: "#8b5cf6", order: 2, probability: 50 },
                        { name: "Negotiation", color: "#f59e0b", order: 3, probability: 75 },
                        { name: "Closed Won", color: "#10b981", order: 4, probability: 100 },
                        { name: "Closed Lost", color: "#ef4444", order: 5, probability: 0 },
                    ],
                },
            },
            include: { stages: true },
        });

        console.log(`[Pipeline] Successfully created pipeline ${pipeline.id}`);
        return { success: true, pipeline };
    } catch (error: any) {
        console.error(`[Pipeline] Failed to create default pipeline:`, error);
        return { success: false, message: error.message };
    }
}

// Deal Management
const CreateDealSchema = z.object({
    title: z.string().min(1, "Deal title is required"),
    description: z.string().optional(),
    value: z.number().min(0),
    currency: z.string().default("USD"),
    clientId: z.string(),
    pipelineId: z.string(),
    stageId: z.string(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
    source: z.string().optional(),
    expectedClose: z.string().optional(), // ISO date string
});

export async function createDeal(data: z.infer<typeof CreateDealSchema>) {
    const { userId, userName } = await getRequiredSession();
    const validated = CreateDealSchema.parse(data);

    try {
        const deal = await prisma.deal.create({
            data: {
                title: validated.title,
                description: validated.description,
                value: validated.value,
                currency: validated.currency,
                clientId: validated.clientId,
                pipelineId: validated.pipelineId,
                stageId: validated.stageId,
                userId,
                priority: validated.priority,
                source: validated.source,
                expectedClose: validated.expectedClose ? new Date(validated.expectedClose) : null,
                activities: {
                    create: {
                        type: "NOTE",
                        description: `Deal created by ${userName}`,
                        createdBy: userId,
                    },
                },
            },
            include: {
                client: true,
                stage: true,
                activities: true,
            },
        });

        // Update client metrics
        await prisma.client.update({
            where: { id: validated.clientId },
            data: { lastContact: new Date() },
        });

        revalidatePath("/pipeline");
        await logAuditEvent({
            action: "CREATE",
            resource: "Deal",
            resourceId: deal.id,
            userId,
        });

        // Create notification
        await createNotification({
            type: "SUCCESS",
            title: "New Deal Created",
            message: `${deal.title} for $${deal.value.toLocaleString()} with ${deal.client.name}`,
            link: `/pipeline`,
            userId,
        });

        return { success: true, deal };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function getDeals() {
    const { userId } = await getRequiredSession();
    return await prisma.deal.findMany({
        where: { userId },
        include: {
            client: true,
            stage: true,
            pipeline: true,
            activities: {
                orderBy: { createdAt: "desc" },
                take: 3,
            },
        },
        orderBy: { updatedAt: "desc" },
    });
}

export async function getDeal(id: string) {
    const { userId } = await getRequiredSession();
    return await prisma.deal.findFirst({
        where: { id, userId },
        include: {
            client: true,
            stage: true,
            pipeline: { include: { stages: true } },
            activities: {
                orderBy: { createdAt: "desc" },
            },
            notes: {
                orderBy: { createdAt: "desc" },
            },
            quotes: true,
            invoices: true,
        },
    });
}

export async function moveDeal(dealId: string, stageId: string) {
    const { userId, userName } = await getRequiredSession();

    try {
        const deal = await prisma.deal.findFirst({
            where: { id: dealId, userId },
            include: { stage: true },
        });

        if (!deal) return { success: false, message: "Deal not found" };

        const newStage = await prisma.pipelineStage.findFirst({
            where: { id: stageId },
        });

        if (!newStage) return { success: false, message: "Stage not found" };

        const updatedDeal = await prisma.deal.update({
            where: { id: dealId },
            data: {
                stageId,
                status: newStage.probability === 100 ? "WON" : newStage.probability === 0 ? "LOST" : "OPEN",
                activities: {
                    create: {
                        type: "STAGE_CHANGE",
                        description: `Moved from "${deal.stage.name}" to "${newStage.name}" by ${userName}`,
                        metadata: JSON.stringify({ from: deal.stage.name, to: newStage.name }),
                        createdBy: userId,
                    },
                },
            },
            include: {
                client: true,
                stage: true,
            },
        });

        // Update client metrics if deal status changes
        if (newStage.probability === 100 && deal.status !== "WON") {
            await prisma.client.update({
                where: { id: deal.clientId },
                data: {
                    totalDealValue: { increment: deal.value },
                },
            });

            // Create notification for won deal
            await createNotification({
                type: "SUCCESS",
                title: "Deal Won!",
                message: `${deal.title} for $${deal.value.toLocaleString()} - Congratulations!`,
                link: `/pipeline`,
                userId,
            });
        } else if (deal.status === "WON" && newStage.probability !== 100) {
            // Moved away from WON
            await prisma.client.update({
                where: { id: deal.clientId },
                data: {
                    totalDealValue: { decrement: deal.value },
                },
            });
        } else if (newStage.probability === 0 && deal.status !== "LOST") {
            // Create notification for lost deal
            await createNotification({
                type: "WARNING",
                title: "Deal Lost",
                message: `${deal.title} was lost. Better luck next time!`,
                link: `/pipeline`,
                userId,
            });
        }

        revalidatePath("/pipeline");
        return { success: true, deal: updatedDeal };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function updateDeal(dealId: string, data: Partial<z.infer<typeof CreateDealSchema>>) {
    const { userId } = await getRequiredSession();

    try {
        const deal = await prisma.deal.update({
            where: { id: dealId },
            data: {
                ...data,
                expectedClose: data.expectedClose ? new Date(data.expectedClose) : undefined,
            },
            include: {
                client: true,
                stage: true,
            },
        });

        revalidatePath("/pipeline");
        return { success: true, deal };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteDeal(dealId: string) {
    const { userId } = await getRequiredSession();

    try {
        await prisma.deal.delete({
            where: { id: dealId, userId },
        });

        revalidatePath("/pipeline");
        await logAuditEvent({
            action: "DELETE",
            resource: "Deal",
            resourceId: dealId,
            userId,
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// Activity & Notes
export async function logDealActivity(dealId: string, type: string, description: string, metadata?: any) {
    const { userId } = await getRequiredSession();

    try {
        const activity = await prisma.dealActivity.create({
            data: {
                dealId,
                type,
                description,
                metadata: metadata ? JSON.stringify(metadata) : null,
                createdBy: userId,
            },
        });

        // Update deal's updatedAt and client's lastContact
        const deal = await prisma.deal.findUnique({
            where: { id: dealId },
            select: { clientId: true },
        });

        if (deal) {
            await prisma.client.update({
                where: { id: deal.clientId },
                data: { lastContact: new Date() },
            });
        }

        revalidatePath("/pipeline");
        return { success: true, activity };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function addDealNote(dealId: string, content: string, isPinned = false) {
    const { userId } = await getRequiredSession();

    try {
        const note = await prisma.dealNote.create({
            data: {
                dealId,
                content,
                isPinned,
                createdBy: userId,
            },
        });

        revalidatePath("/pipeline");
        return { success: true, note };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// Forecasting
export async function getPipelineForecast(pipelineId: string) {
    const { userId } = await getRequiredSession();

    const stages = await prisma.pipelineStage.findMany({
        where: { pipelineId },
        include: {
            deals: {
                where: {
                    status: "OPEN",
                },
            },
        },
    });

    const forecast = stages.map(stage => ({
        stageName: stage.name,
        probability: stage.probability,
        dealCount: stage.deals.length,
        totalValue: stage.deals.reduce((sum, d) => sum + d.value, 0),
        weightedValue: stage.deals.reduce((sum, d) => sum + (d.value * stage.probability / 100), 0),
    }));

    const totalWeighted = forecast.reduce((sum, f) => sum + f.weightedValue, 0);
    const totalDeals = forecast.reduce((sum, f) => sum + f.dealCount, 0);

    return {
        forecast,
        totalWeighted,
        totalDeals,
    };
}

// Link quotes and invoices to deals
export async function linkQuoteToDeal(quoteId: string, dealId: string) {
    const { userId } = await getRequiredSession();

    try {
        await prisma.quote.update({
            where: { id: quoteId },
            data: { dealId },
        });

        await logDealActivity(dealId, "QUOTE_SENT", `Quote linked to deal`, { quoteId });

        revalidatePath("/pipeline");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function linkInvoiceToDeal(invoiceId: string, dealId: string) {
    const { userId } = await getRequiredSession();

    try {
        await prisma.invoice.update({
            where: { id: invoiceId },
            data: { dealId },
        });

        await logDealActivity(dealId, "INVOICE_SENT", `Invoice linked to deal`, { invoiceId });

        revalidatePath("/pipeline");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
