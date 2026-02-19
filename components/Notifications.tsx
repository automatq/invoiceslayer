"use client";

import { useEffect, useState } from "react";
import { NotificationList } from "./NotificationList";
import { getNotifications, getUnreadCount } from "@/app/actions/notifications";
import { Bell } from "lucide-react";
import { InteractiveButton } from "./ui/interactive-button";

export function Notifications() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadNotifications() {
            try {
                const [notifs, count] = await Promise.all([
                    getNotifications(),
                    getUnreadCount()
                ]);
                setNotifications(notifs);
                setUnreadCount(count);
            } catch (error) {
                // Silently fail during static generation
                setNotifications([]);
                setUnreadCount(0);
            } finally {
                setIsLoading(false);
            }
        }
        loadNotifications();
    }, []);

    if (isLoading) {
        return (
            <InteractiveButton variant="ghost" size="icon" className="relative" disabled>
                <Bell className="h-5 w-5" />
            </InteractiveButton>
        );
    }

    return (
        <NotificationList 
            initialNotifications={notifications} 
            initialUnreadCount={unreadCount} 
        />
    );
}
