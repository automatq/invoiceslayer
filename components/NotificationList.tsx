"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { Check, Info, AlertTriangle, CheckCircle, XCircle, Bell } from "lucide-react";
import { markAsRead, markAllAsRead, NotificationType } from "@/app/actions/notifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string | null;
    read: boolean;
    date: Date;
    link: string | null;
}

export function NotificationList({ initialNotifications, initialUnreadCount }: { initialNotifications: Notification[], initialUnreadCount: number }) {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
    const [isOpen, setIsOpen] = useState(false);

    const handleMarkAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        await markAsRead(id);
    };

    const handleMarkAllAsRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        await markAllAsRead();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "INFO": return <Info className="h-4 w-4 text-blue-500" />;
            case "WARNING": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case "SUCCESS": return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "ERROR": return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <InteractiveButton variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                    )}
                </InteractiveButton>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <InteractiveButton variant="ghost" size="sm" className="text-xs h-auto py-1 px-2" onClick={handleMarkAllAsRead}>
                            Mark all as read
                        </InteractiveButton>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 hover:bg-muted/50 transition-colors relative group",
                                        !notification.read && "bg-muted/30"
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1 flex-shrink-0">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn("text-sm font-medium leading-none", !notification.read && "font-semibold")}>
                                                    {notification.title}
                                                </p>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
                                                </span>
                                            </div>
                                            {notification.message && (
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {notification.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {!notification.read && (
                                        <InteractiveButton
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMarkAsRead(notification.id);
                                            }}
                                            title="Mark as read"
                                        >
                                            <Check className="h-3 w-3" />
                                        </InteractiveButton>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
