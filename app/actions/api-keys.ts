"use server";

import { prisma as db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

export async function generateApiKey() {
    try {
        const apiKey = "ag_" + randomBytes(24).toString("hex");

        // Update the first settings record (assuming single tenant/user for now)
        // or create if it doesn't exist
        const firstSetting = await db.setting.findFirst();

        if (firstSetting) {
            await db.setting.update({
                where: { id: firstSetting.id },
                data: { agentApiKey: apiKey } as any,
            });
        } else {
            await db.setting.create({
                data: {
                    companyName: "My Company",
                    companyEmail: "admin@example.com",
                    agentApiKey: apiKey,
                } as any,
            });
        }

        try {
            revalidatePath("/settings");
        } catch (e) {
            // Ignore revalidate error in non-request context
        }
        return { success: true, apiKey };
    } catch (error) {
        console.error("Failed to generate API key:", error);
        return { success: false, message: "Failed to generate API key" };
    }
}

export async function revokeApiKey() {
    try {
        const firstSetting = await db.setting.findFirst();

        if (firstSetting) {
            await db.setting.update({
                where: { id: firstSetting.id },
                data: { agentApiKey: null } as any,
            });
        }

        revalidatePath("/settings");
        return { success: true };
    } catch (error) {
        console.error("Failed to revoke API key:", error);
        return { success: false, message: "Failed to revoke API key" };
    }
}

export async function getApiKey() {
    try {
        const setting = await db.setting.findFirst();
        return (setting as any)?.agentApiKey || null;
    } catch (error) {
        console.error("Failed to get API key:", error);
        return null;
    }
}
