"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type NotificationType = "INFO" | "WARNING" | "SUCCESS" | "ERROR";

export async function getNotifications() {
    try {
        const notifications = await prisma.notification.findMany({
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
        const count = await prisma.notification.count({
            where: {
                read: false,
            },
        });
        return count;
    } catch (error) {
        return 0;
    }
}

export async function markAsRead(id: string) {
    try {
        await prisma.notification.update({
            where: { id },
            data: { read: true },
        });
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to mark as read" };
    }
}

export async function markAllAsRead() {
    try {
        await prisma.notification.updateMany({
            where: { read: false },
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
    userId?: string;
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
