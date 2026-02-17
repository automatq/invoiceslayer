"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";

function NotificationsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (searchParams.get("success") === "true") {
            toast.success("Payment successful! Thank you.");
            // Remove params to prevent double toast on refresh
            router.replace(window.location.pathname);
        } else if (searchParams.get("canceled") === "true") {
            toast.info("Payment canceled.");
            router.replace(window.location.pathname);
        }
    }, [searchParams, router]);

    return null;
}

export function PortalNotifications() {
    return (
        <Suspense fallback={null}>
            <NotificationsContent />
        </Suspense>
    );
}
