"use client";

import { Notifications } from "@/components/Notifications";
import { UserButton } from "@/components/UserButton"; // Assuming we might want this later, but for now just Notifications 

export function Header() {
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 lg:h-[60px]">
            <div className="flex-1">
                {/* Page title logic could go here, or handled by page itself */}
            </div>
            <div className="flex items-center gap-4">
                <Notifications />
            </div>
        </header>
    );
}
