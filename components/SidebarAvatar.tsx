"use client";

import { useEffect, useState } from "react";
import { getSettings } from "@/app/actions/settings";
import { SidebarLink } from "@/components/ui/sidebar";
import { UserCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export function SidebarAvatar() {
    const { data: session } = useSession();
    const [name, setName] = useState("Loading...");
    const [logo, setLogo] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            const settings = await getSettings();
            if (settings) {
                setName(settings.companyName || session?.user?.name || session?.user?.email || "My Company");
                if (settings.companyLogo) {
                    setLogo(settings.companyLogo);
                }
            } else if (session?.user) {
                setName(session.user.name || session.user.email || "My Account");
            }
        }
        load();
    }, [session]);

    return (
        <SidebarLink
            link={{
                label: name,
                href: "/settings",
                icon: logo ? (
                    <img
                        src={logo}
                        className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
                        alt="User"
                    />
                ) : (
                    <UserCircle className="text-neutral-700 dark:text-neutral-200 h-7 w-7 flex-shrink-0" />
                ),
            }}
        />
    );
}
