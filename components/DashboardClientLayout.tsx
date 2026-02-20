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

export function DashboardClientLayout({
    children,
    header
}: {
    children: React.ReactNode;
    header: React.ReactNode;
}) {
    const links = [
        {
            label: "Dashboard",
            href: "/",
            icon: (
                <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Pipeline",
            href: "/pipeline",
            icon: (
                <Kanban className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Invoices",
            href: "/invoices",
            icon: (
                <FileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Clients",
            href: "/clients",
            icon: (
                <UserCircle className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Quotes",
            href: "/quotes",
            icon: (
                <Receipt className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Recurring",
            href: "/recurring",
            icon: (
                <History className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Calendar",
            href: "/calendar",
            icon: (
                <Calendar className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Reports",
            href: "/reports",
            icon: (
                <ChartBar className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Expenses",
            href: "/expenses",
            icon: (
                <Wallet className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Budget",
            href: "/budget",
            icon: (
                <PieChart className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Settings",
            href: "/settings",
            icon: (
                <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
    ];
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
                        <div className="mt-8 flex flex-col gap-2">
                            {links.map((link, idx) => (
                                <SidebarLink key={idx} link={link} />
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
