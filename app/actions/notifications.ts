"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

async function getRequiredSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return { userId: session.user.id, session };
}

export type NotificationType = "INFO" | "WARNING" | "SUCCESS" | "ERROR";

export async function getNotifications() {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: {
                createdAt: "desc",
            },
            take: 20,
        });
        return notifications;
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return [];
    }
}

export async function getUnreadCount() {
    try {
        const session = await auth();
        if (!session?.user?.id) return 0;

        const count = await prisma.notification.count({
            where: {
                userId: session.user.id,
                read: false,
            },
        });
        return count;
    } catch (error) {
        return 0;
    }
}

export async function markAsRead(id: string) {
    const { userId } = await getRequiredSession();
    try {
        await prisma.notification.update({
            where: { id, userId },
            data: { read: true },
        });
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to mark as read" };
    }
}

export async function markAllAsRead() {
    const { userId } = await getRequiredSession();
    try {
        await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to mark all as read" };
    }
}

export async function createNotification(data: {
    type: NotificationType;
    title: string;
    message?: string;
    link?: string;
    userId: string; // userId is required in the schema now
}) {
    try {
        const notification = await prisma.notification.create({
            data: {
                type: data.type,
                title: data.title,
                message: data.message,
                link: data.link,
                userId: data.userId,
            },
        });
        revalidatePath("/");
        return { success: true, notification };
    } catch (error) {
        console.error("Failed to create notification:", error);
        return { success: false, error: "Failed to create notification" };
    }
}
