

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, NotificationType } from "@/app/actions/notifications";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { NotificationList } from "./NotificationList";

export async function Notifications() {
    const notifications = await getNotifications();
    const unreadCount = await getUnreadCount();

    return (
        <NotificationList initialNotifications={notifications} initialUnreadCount={unreadCount} />
    );
}
