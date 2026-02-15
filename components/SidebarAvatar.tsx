"use client";

import { useEffect, useState } from "react";
import { getSettings } from "@/app/actions/settings";
import { SidebarLink } from "@/components/ui/sidebar";
import { UserCircle } from "lucide-react";

export function SidebarAvatar() {
    const [name, setName] = useState("My Company");
    const [logo, setLogo] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            const settings = await getSettings();
            if (settings) {
                setName(settings.companyName);
                if (settings.companyLogo) {
                    setLogo(settings.companyLogo);
                }
            }
        }
        load();
    }, []);

    return (
        <SidebarLink
            link={{
                label: name,
                href: "/settings",
                icon: logo ? (
                    <img
                        src={logo}
                        className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
                        alt="Company"
                    />
                ) : (
                    <UserCircle className="text-neutral-700 dark:text-neutral-200 h-7 w-7 flex-shrink-0" />
                ),
            }}
        />
    );
}
