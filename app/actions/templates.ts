"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type InvoiceTemplateInput = {
    name: string;
    color: string;
    font: string; // "inter", "montserrat", "roboto", "mono"
    layout: string; // "modern", "classic", "minimal"
    logoUrl?: string;
};

export async function saveTemplateSettings(data: InvoiceTemplateInput) {
    try {
        // For now, we'll treat this as a singleton "active" template update
        // In the future, we can change this to create new records

        // Check if an active template exists
        const existing = await prisma.invoiceTemplate.findFirst({
            where: { isActive: true }
        });

        if (existing) {
            await prisma.invoiceTemplate.update({
                where: { id: existing.id },
                data: {
                    ...data,
                    // If name changes, we update it, otherwise keep existing or default
                }
            });
        } else {
            await prisma.invoiceTemplate.create({
                data: {
                    ...data,
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

export async function getActiveTemplate() {
    try {
        const template = await prisma.invoiceTemplate.findFirst({
            where: { isActive: true }
        });

        // Return default if no template found
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
