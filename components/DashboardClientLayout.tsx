"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
    IconArrowLeft,
    IconBrandTabler,
    IconSettings,
    IconUserBolt,
} from "@tabler/icons-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SidebarAvatar } from "@/components/SidebarAvatar";
import { FileText, LayoutDashboard, Settings, UserCircle, Receipt, History, ChartBar, Calendar, Wallet, Kanban, PieChart } from "lucide-react";
import { useTranslations } from "next-intl";

export function DashboardClientLayout({
    children,
    header
}: {
    children: React.ReactNode;
    header: React.ReactNode;
}) {
    const t = useTranslations("navigation");

    const groups = [
        {
            title: "System",
            links: [
                {
                    label: t("dashboard"),
                    href: "/",
                    icon: <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                },
            ]
        },
        {
            title: "Growth",
            links: [
                {
                    label: t("pipeline"),
                    href: "/pipeline",
                    icon: <Kanban className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                },
                {
                    label: t("clients"),
                    href: "/clients",
                    icon: <UserCircle className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                },
            ]
        },
        {
            title: "Operations",
            links: [
                {
                    label: t("invoices"),
                    href: "/invoices",
                    icon: <FileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                },
                {
                    label: t("quotes"),
                    href: "/quotes",
                    icon: <Receipt className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                },
                {
                    label: t("recurring"),
                    href: "/recurring",
                    icon: <History className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                },
                {
                    label: t("calendar"),
                    href: "/calendar",
                    icon: <Calendar className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                },
            ]
        },
        {
            title: "Accounting",
            links: [
                {
                    label: t("reports"),
                    href: "/reports",
                    icon: <ChartBar className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                },
                {
                    label: t("expenses"),
                    href: "/expenses",
                    icon: <Wallet className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                },
                {
                    label: t("budget"), // Not in navigation translation yet
                    href: "/budget",
                    icon: <PieChart className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                },
            ]
        },
        {
            title: "System",
            links: [
                {
                    label: t("settings"),
                    href: "/settings",
                    icon: <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                },
            ]
        }
    ];

    // Deduplicate System group if needed, but for now we'll just flatten or render with headers
    const allLinks = groups.flatMap(g => g.links);
    const [open, setOpen] = useState(false);
    return (
        <div
            className={cn(
                "flex flex-col md:flex-row bg-muted w-full flex-1 overflow-hidden",
                "h-screen"
            )}
        >
            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody className="justify-between gap-10">
                    <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                        <div className="mt-8 flex flex-col gap-8">
                            {groups.map((group, gIdx) => (
                                <div key={gIdx} className="flex flex-col gap-2">
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2">
                                        {group.title}
                                    </h3>
                                    <div className="flex flex-col gap-1">
                                        {group.links.map((link, lIdx) => (
                                            <SidebarLink key={lIdx} link={link} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <SidebarAvatar />
                    </div>
                </SidebarBody>
            </Sidebar>
            <main className="flex flex-col flex-1 h-screen overflow-hidden">
                {header}
                <div className="flex-1 overflow-y-auto p-2 md:p-10 rounded-tl-2xl border border-border bg-background flex flex-col gap-2">
                    {children}
                </div>
            </main>
        </div>
    );
}
