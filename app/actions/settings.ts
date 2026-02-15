"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type SettingsFormValues = {
    companyName: string;
    companyEmail: string;
    companyAddress?: string;
    companyPhone?: string;
    companyLogo?: string;
    currency: string;
    defaultTaxRate: number;
    invoiceTemplate: string;
    quoteTemplate: string;
};

export async function createSettings(data: SettingsFormValues) {
    try {
        // Check if settings already exist, if so update, else create
        const existing = await prisma.setting.findFirst();

        if (existing) {
            await prisma.setting.update({
                where: { id: existing.id },
                data,
            });
        } else {
            await prisma.setting.create({
                data,
            });
        }

        revalidatePath("/");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to save settings" };
    }
}

export async function getSettings() {
    try {
        const settings = await prisma.setting.findFirst();
        return settings;
    } catch (e) {
        console.error(e);
        return null;
    }
}
