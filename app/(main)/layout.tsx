import React from "react";
import { DashboardClientLayout } from "@/components/DashboardClientLayout";
import { Header } from "@/components/Header";
import { CommandPalette } from "@/components/CommandPalette";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <DashboardClientLayout header={<Header />}>
                {children}
            </DashboardClientLayout>
            <CommandPalette />
        </>
    );
}
