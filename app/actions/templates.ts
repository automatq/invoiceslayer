"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

async function getSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session;
}

export type InvoiceTemplateInput = {
    name: string;
    color: string;
    font: string; // "inter", "montserrat", "roboto", "mono"
    layout: string; // "modern", "classic", "minimal"
    logoUrl?: string;
};

export async function saveTemplateSettings(data: InvoiceTemplateInput) {
    const session = await getSession();
    const userId = session.user.id;
    try {
        const existing = await prisma.invoiceTemplate.findUnique({
            where: { userId }
        });

        if (existing) {
            await prisma.invoiceTemplate.update({
                where: { userId },
                data
            });
        } else {
            await prisma.invoiceTemplate.create({
                data: {
                    ...data,
                    userId,
                    isActive: true
                }
            });
        }

        revalidatePath("/settings");
        revalidatePath("/invoices");
        return { success: true };
    } catch (e) {
        console.error("Failed to save template:", e);
        return { success: false, message: "Failed to save template settings" };
    }
}

export async function getActiveTemplate(userId?: string) {
    try {
        let finalUserId = userId;

        if (!finalUserId) {
            const session = await auth();
            if (!session?.user?.id) {
                return {
                    name: "Default",
                    color: "#0f172a",
                    font: "inter",
                    layout: "modern",
                    logoUrl: null,
                    isActive: true
                };
            }
            finalUserId = session.user.id;
        }

        const template = await prisma.invoiceTemplate.findUnique({
            where: { userId: finalUserId }
        });

        if (!template) {
            return {
                name: "Default",
                color: "#0f172a", // slate-900
                font: "inter",
                layout: "modern",
                logoUrl: null,
                isActive: true
            };
        }

        return template;
    } catch (e) {
        console.error("Failed to get active template:", e);
        return null;
    }
}

