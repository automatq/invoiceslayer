"use server";

import { prisma as db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";

async function getRequiredSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return { userId: session.user.id, session };
}

export async function generateApiKey() {
    const { userId, session } = await getRequiredSession();
    try {
        const apiKey = "ag_" + randomBytes(24).toString("hex");

        await db.setting.upsert({
            where: { userId },
            update: { agentApiKey: apiKey },
            create: {
                userId,
                companyName: session.user?.name || "My Company",
                companyEmail: session.user?.email || "",
                agentApiKey: apiKey,
            }
        });

        revalidatePath("/settings");
        return { success: true, apiKey };
    } catch (error) {
        console.error("Failed to generate API key:", error);
        return { success: false, message: "Failed to generate API key" };
    }
}

export async function revokeApiKey() {
    const { userId } = await getRequiredSession();
    try {
        await db.setting.update({
            where: { userId },
            data: { agentApiKey: null },
        });

        revalidatePath("/settings");
        return { success: true };
    } catch (error) {
        console.error("Failed to revoke API key:", error);
        return { success: false, message: "Failed to revoke API key" };
    }
}

export async function getApiKey() {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        const setting = await db.setting.findUnique({
            where: { userId: session.user.id },
            select: { agentApiKey: true }
        });
        return setting?.agentApiKey || null;
    } catch (error) {
        console.error("Failed to get API key:", error);
        return null;
    }
}
