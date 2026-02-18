"use server";

import { prisma as db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";

async function getSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session;
}

export async function generateApiKey() {
    const session = await getSession();
    try {
        const apiKey = "ag_" + randomBytes(24).toString("hex");

        await db.setting.upsert({
            where: { userId: session.user.id },
            update: { agentApiKey: apiKey },
            create: {
                userId: session.user.id,
                companyName: session.user.name || "My Company",
                companyEmail: session.user.email || "",
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
    const session = await getSession();
    try {
        await db.setting.update({
            where: { userId: session.user.id },
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
